/*
  # LINKZY CLEAN REBUILD - ESSENTIAL TABLES ONLY
  
  Core Features:
  1. User Authentication (Google/Email)
  2. Content Tracking (JS snippet, track-content API)  
  3. Ecosystem Matching (find backlink opportunities)
  4. Automatic Placement (WordPress API + JS injection)
  5. Credits System (payment/usage tracking)
  6. Billing/Stripe integration
  7. Analytics charts (backlink performance)
  8. Onboarding modal (website + niche)
*/

-- =============================================
-- TABLE 1: USERS (Core user accounts)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  website TEXT DEFAULT 'yourdomain.com',
  niche TEXT DEFAULT 'technology',
  api_key TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 3,
  plan TEXT DEFAULT 'free',
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 2: TRACKED_CONTENT (Content tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tracked_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  keyword_density JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 3: PLACEMENT_OPPORTUNITIES (Ecosystem matching)
-- =============================================
CREATE TABLE IF NOT EXISTS public.placement_opportunities (
  id uuid not null default gen_random_uuid (),
  source_user_id uuid null,
  source_content_id uuid null,
  target_user_id uuid null,
  target_content_url text not null,
  anchor_text text not null default ''::text,
  match_score numeric(3, 2) null default 0.0,
  status text null default 'pending'::text,
  placement_method text null,
  placement_success boolean null default false,
  placement_url text null,
  estimated_value integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  auto_approved boolean null,
  placement_attempted_at timestamp without time zone null default now(),
  placement_error_message text null,
  niche_proximity_score numeric(4, 3) null,
  domain_authority_score numeric(4, 3) null,
  geographic_relevance_score numeric(4, 3) null,
  partner_quality_score numeric(4, 3) null,
  overall_match_score numeric(4, 3) null,
  suggested_anchor_text text null,
  suggested_target_url text null,
  suggested_placement_context text null,
  target_content_title text null,
  keyword_overlap_score numeric(4, 3) null,
  constraint placement_opportunities_pkey primary key (id),
  constraint placement_opportunities_source_content_id_fkey foreign KEY (source_content_id) references tracked_content (id) on delete CASCADE,
  constraint placement_opportunities_source_user_id_fkey foreign KEY (source_user_id) references users (id) on delete CASCADE,
  constraint placement_opportunities_target_user_id_fkey foreign KEY (target_user_id) references users (id) on delete CASCADE
);

-- =============================================
-- TABLE 4: PLACEMENT_INSTRUCTIONS (JS injection)
-- =============================================
CREATE TABLE IF NOT EXISTS public.placement_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.placement_opportunities(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  instruction_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 5: CREDIT_TRANSACTIONS (Credits tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  opportunity_id UUID REFERENCES public.placement_opportunities(id),
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 6: NICHE_PROXIMITY (Ecosystem matching data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.niche_proximity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_a TEXT NOT NULL,
  niche_b TEXT NOT NULL,
  proximity_score DECIMAL(3,2) NOT NULL,
  UNIQUE(niche_a, niche_b)
);

-- =========================
-- domain_metrics
-- =========================
create table if not exists public.domain_metrics (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,

  -- Core identifiers
  website                 text not null,      -- e.g. https://example.com
  hostname                text generated always as (
                           lower(
                             split_part(regexp_replace(website, '^https?://', ''), '/', 1)
                           )
                         ) stored,

  -- Platform detection
  platform                text,               -- 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'webflow' | 'unknown'
  is_wordpress            boolean default false,
  rest_api_detected       boolean default false,
  js_injection_possible   boolean default true,

  -- WordPress API config/credentials (used by placement function)
  wordpress_api_enabled   boolean default false,
  wordpress_api_url       text,               -- e.g. https://example.com/wp-json
  wordpress_username      text,
  wordpress_app_password  text,

  -- Optional quality metrics (fill later if desired)
  domain_authority        numeric(5,2),
  domain_rating           numeric(5,2),
  organic_traffic         integer,
  spam_score              numeric(5,2),

  -- Optional geography
  country_code            text,               -- ISO-3166-1 alpha-2
  region                  text,
  latitude                double precision,
  longitude               double precision,

  -- Bookkeeping
  last_scanned_at         timestamptz,
  verified_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- One row per user (change to (user_id, website) if you support multiple sites)
  constraint domain_metrics_user_unique unique (user_id)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_proximity ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Simple and Clean)
-- =============================================

-- Users can manage their own data
CREATE POLICY "users_own_data" ON public.users FOR ALL USING (auth.uid() = id);

-- Users can access their own tracked content
CREATE POLICY "tracked_content_own_data" ON public.tracked_content FOR ALL USING (auth.uid() = user_id);

-- Users can access opportunities they're involved in
CREATE POLICY "opportunities_involved" ON public.placement_opportunities FOR ALL 
USING (auth.uid() = source_user_id OR auth.uid() = target_user_id);

-- Users can access their placement instructions
CREATE POLICY "instructions_own_data" ON public.placement_instructions FOR ALL 
USING (auth.uid() = target_user_id);

-- Users can access their credit transactions
CREATE POLICY "credits_own_data" ON public.credit_transactions FOR ALL 
USING (auth.uid() = user_id);

-- Everyone can read niche proximity data
CREATE POLICY "niche_proximity_read" ON public.niche_proximity FOR SELECT 
USING (true);

-- Service role can access everything (for Edge Functions)
CREATE POLICY "service_role_all_users" ON public.users FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_content" ON public.tracked_content FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_opportunities" ON public.placement_opportunities FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_instructions" ON public.placement_instructions FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_credits" ON public.credit_transactions FOR ALL 
USING (auth.role() = 'service_role');

-- =========================
-- OPTIONAL: RLS (if you use it)
-- =========================
alter table public.domain_metrics enable row level security;
create policy "select_own_domain_metrics"
  on public.domain_metrics for select to authenticated
  using (auth.uid() = user_id);
create policy "insert_own_domain_metrics"
  on public.domain_metrics for insert to authenticated
  with check (auth.uid() = user_id);
create policy "update_own_domain_metrics"
  on public.domain_metrics for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tracked_content_user_id ON public.tracked_content(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_content_created_at ON public.tracked_content(created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_source_user ON public.placement_opportunities(source_user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_target_user ON public.placement_opportunities(target_user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.placement_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_instructions_target_user ON public.placement_instructions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_instructions_status ON public.placement_instructions(status);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credit_transactions(user_id);
create index if not exists domain_metrics_user_id_idx  on public.domain_metrics (user_id);
create index if not exists domain_metrics_hostname_idx on public.domain_metrics (hostname);
create index if not exists domain_metrics_platform_idx on public.domain_metrics (platform);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.placement_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_domain_metrics_updated_at on public.domain_metrics;
create trigger trg_domain_metrics_updated_at
before update on public.domain_metrics
for each row execute function public.set_updated_at();

-- =============================================
-- ESSENTIAL NICHE PROXIMITY DATA
-- =============================================
INSERT INTO public.niche_proximity (niche_a, niche_b, proximity_score) VALUES
-- Creative Services Ecosystem
('creative-services', 'marketing', 0.85),
('creative-services', 'web-design', 0.90),
('creative-services', 'photography', 0.80),
('creative-services', 'content-writing', 0.85),

-- Technology Ecosystem  
('technology', 'software-development', 0.95),
('technology', 'cybersecurity', 0.80),
('technology', 'data-science', 0.85),
('technology', 'web-design', 0.75),

-- Home Services Ecosystem
('plumbing', 'electrical', 0.85),
('plumbing', 'hvac', 0.80),
('electrical', 'hvac', 0.75),
('home-services', 'plumbing', 0.90),
('home-services', 'electrical', 0.90),
('home-services', 'hvac', 0.90),

-- Business Services
('marketing', 'consulting', 0.80),
('marketing', 'content-writing', 0.85),
('consulting', 'legal', 0.70),

-- Health & Wellness
('health', 'fitness', 0.85),
('health', 'nutrition', 0.80),
('fitness', 'nutrition', 0.75)

ON CONFLICT (niche_a, niche_b) DO NOTHING;

-- Add reverse relationships for symmetric matching
INSERT INTO public.niche_proximity (niche_a, niche_b, proximity_score)
SELECT niche_b, niche_a, proximity_score 
FROM public.niche_proximity 
WHERE niche_a != niche_b
ON CONFLICT (niche_a, niche_b) DO NOTHING;

SELECT 'Clean Linkzy database rebuilt successfully! ✅' as status;


-- =============================================
-- TABLE: PLACEMENT_ATTEMPTS (Placement attempt logging)
-- =============================================
CREATE TABLE IF NOT EXISTS public.placement_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.placement_opportunities(id) ON DELETE CASCADE,
  target_domain TEXT NOT NULL,
  placement_method TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER,
  verification_attempted BOOLEAN DEFAULT false,
  verification_success BOOLEAN DEFAULT false,
  link_still_live BOOLEAN DEFAULT false,
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES FOR placement_attempts
-- =============================================
CREATE INDEX IF NOT EXISTS idx_placement_attempts_opportunity_id ON public.placement_attempts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_placement_attempts_target_domain ON public.placement_attempts(target_domain);
CREATE INDEX IF NOT EXISTS idx_placement_attempts_attempted_at ON public.placement_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_placement_attempts_success ON public.placement_attempts(success);

-- =============================================
-- RLS POLICIES FOR placement_attempts
-- =============================================
ALTER TABLE public.placement_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view attempts for opportunities they're involved in
CREATE POLICY "placement_attempts_involved" ON public.placement_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.placement_opportunities po
    WHERE po.id = placement_attempts.opportunity_id
    AND (po.source_user_id = auth.uid() OR po.target_user_id = auth.uid())
  )
);

-- Service role can access everything (for Edge Functions)
CREATE POLICY "service_role_all_placement_attempts" ON public.placement_attempts FOR ALL 
USING (auth.role() = 'service_role');