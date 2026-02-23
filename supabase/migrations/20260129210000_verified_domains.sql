-- Domain verification for track-content: only allow tracking from verified domains
-- Supports meta tag and file-based verification

CREATE TABLE IF NOT EXISTS public.verified_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,                    -- e.g. example.com (lowercase, no protocol)
  verification_token TEXT NOT NULL,        -- unique token user must add to their site
  verification_method TEXT,                -- 'meta' | 'file' | null until verified
  verified_at TIMESTAMPTZ,                 -- set when verification succeeds
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_verified_domains_user_id ON public.verified_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON public.verified_domains(domain);
CREATE INDEX IF NOT EXISTS idx_verified_domains_verified ON public.verified_domains(user_id, domain) WHERE verified_at IS NOT NULL;

ALTER TABLE public.verified_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verified_domains_select_own"
  ON public.verified_domains FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "verified_domains_insert_own"
  ON public.verified_domains FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "verified_domains_update_own"
  ON public.verified_domains FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "verified_domains_delete_own"
  ON public.verified_domains FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role for Edge Functions
CREATE POLICY "verified_domains_service_role"
  ON public.verified_domains FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER trg_verified_domains_updated_at
  BEFORE UPDATE ON public.verified_domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
