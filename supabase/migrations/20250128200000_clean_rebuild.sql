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
  keywords TEXT[] DEFAULT '{}',
  keyword_density JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 3: PLACEMENT_OPPORTUNITIES (Ecosystem matching)
-- =============================================
CREATE TABLE IF NOT EXISTS public.placement_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  source_content_id UUID REFERENCES public.tracked_content(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  match_score DECIMAL(3,2) DEFAULT 0.0,
  keyword_overlap TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  placement_method TEXT,
  placement_success BOOLEAN DEFAULT false,
  placement_url TEXT,
  estimated_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
