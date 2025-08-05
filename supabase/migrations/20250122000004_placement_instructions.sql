-- Create placement_instructions table for JavaScript injection system
CREATE TABLE IF NOT EXISTS public.placement_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.placement_opportunities(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instruction_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed'
  executed_at TIMESTAMPTZ,
  execution_result JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.placement_instructions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their own placement instructions"
  ON public.placement_instructions
  FOR ALL
  USING (auth.uid() = target_user_id);

CREATE POLICY "Service role can access all placement instructions"
  ON public.placement_instructions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_placement_instructions_target_user ON public.placement_instructions(target_user_id);
CREATE INDEX idx_placement_instructions_status ON public.placement_instructions(status);
CREATE INDEX idx_placement_instructions_created ON public.placement_instructions(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_placement_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_placement_instructions_updated_at
    BEFORE UPDATE ON public.placement_instructions
    FOR EACH ROW
    EXECUTE FUNCTION update_placement_instructions_updated_at();

SELECT 'Placement instructions table created successfully! ✅' as status; 