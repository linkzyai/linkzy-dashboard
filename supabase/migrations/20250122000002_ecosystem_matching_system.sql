/*
  # Enhanced Ecosystem Matching System
  
  1. New Tables:
    - placement_opportunities: Tracks matching opportunities between content
    - partner_relationships: Manages partner network and quality scores
    - domain_metrics: Stores DA, geographic, and technical data for domains
    - placement_attempts: Tracks automatic placement attempts and results
    - credit_transactions: Manages credit deductions and refunds
    - niche_proximity: Defines cross-niche compatibility scores
  
  2. Enhanced matching logic with:
    - Niche proximity scoring
    - Domain Authority weighting  
    - Geographic relevance
    - Credit balance verification
    - Automatic placement capabilities
*/

-- Domain metrics for enhanced matching
CREATE TABLE IF NOT EXISTS public.domain_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_authority INTEGER DEFAULT 0,
  page_authority INTEGER DEFAULT 0,
  trust_flow INTEGER DEFAULT 0,
  citation_flow INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  backlinks INTEGER DEFAULT 0,
  organic_traffic INTEGER DEFAULT 0,
  geographic_location TEXT, -- City, State/Country
  latitude DECIMAL,
  longitude DECIMAL,
  wordpress_api_url TEXT, -- For automatic placement
  wordpress_username TEXT,
  wordpress_app_password TEXT, -- Encrypted
  html_access_method TEXT, -- 'wordpress_api', 'ftp', 'webhook', etc.
  api_credentials JSONB DEFAULT '{}', -- Flexible credential storage
  placement_success_rate DECIMAL DEFAULT 0.0,
  average_response_time INTEGER DEFAULT 0, -- milliseconds
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Niche proximity scoring matrix
CREATE TABLE IF NOT EXISTS public.niche_proximity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_a TEXT NOT NULL,
  niche_b TEXT NOT NULL,
  proximity_score DECIMAL NOT NULL, -- 0.0 to 1.0, higher = more compatible
  bidirectional BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(niche_a, niche_b)
);

-- Partner relationship tracking
CREATE TABLE IF NOT EXISTS public.partner_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'exchange', -- 'exchange', 'one_way', 'premium'
  quality_score DECIMAL DEFAULT 5.0, -- 1.0 to 10.0
  successful_placements INTEGER DEFAULT 0,
  failed_placements INTEGER DEFAULT 0,
  total_credits_exchanged INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  auto_approve_threshold DECIMAL DEFAULT 7.0, -- Auto-approve above this quality score
  blocked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a_id, user_b_id)
);

-- Placement opportunities queue
CREATE TABLE IF NOT EXISTS public.placement_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID NOT NULL REFERENCES public.tracked_content(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Matching scores
  keyword_overlap_score DECIMAL DEFAULT 0.0,
  niche_proximity_score DECIMAL DEFAULT 0.0,
  domain_authority_score DECIMAL DEFAULT 0.0,
  geographic_relevance_score DECIMAL DEFAULT 0.0,
  partner_quality_score DECIMAL DEFAULT 0.0,
  overall_match_score DECIMAL DEFAULT 0.0,
  
  -- Proposed placement details
  suggested_anchor_text TEXT,
  suggested_target_url TEXT,
  suggested_placement_context TEXT,
  estimated_value INTEGER DEFAULT 1, -- Credits
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'placed', 'failed'
  auto_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  
  -- Placement attempt tracking
  placement_attempted_at TIMESTAMPTZ,
  placement_method TEXT, -- 'wordpress_api', 'html_injection', 'manual'
  placement_success BOOLEAN DEFAULT false,
  placement_url TEXT, -- Final URL where link was placed
  placement_error_message TEXT,
  
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Placement attempts log
CREATE TABLE IF NOT EXISTS public.placement_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.placement_opportunities(id) ON DELETE CASCADE,
  target_domain TEXT NOT NULL,
  placement_method TEXT NOT NULL,
  
  -- Technical details
  target_post_id TEXT, -- WordPress post ID or HTML element ID
  insertion_point TEXT, -- Paragraph number, CSS selector, etc.
  anchor_text_used TEXT,
  link_url TEXT,
  
  -- Result tracking
  success BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  http_status_code INTEGER,
  error_message TEXT,
  api_response JSONB,
  
  -- Verification
  verification_attempted BOOLEAN DEFAULT false,
  verification_success BOOLEAN DEFAULT false,
  verification_error TEXT,
  link_still_live BOOLEAN DEFAULT false,
  
  attempted_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

-- Credit transactions for automatic placement
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.placement_opportunities(id),
  
  transaction_type TEXT NOT NULL, -- 'debit', 'credit', 'hold', 'release'
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Refund tracking
  refundable BOOLEAN DEFAULT true,
  refunded BOOLEAN DEFAULT false,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS domain_metrics_user_id_idx ON public.domain_metrics (user_id);
CREATE INDEX IF NOT EXISTS domain_metrics_domain_idx ON public.domain_metrics (domain);
CREATE INDEX IF NOT EXISTS domain_metrics_geographic_idx ON public.domain_metrics (geographic_location);
CREATE INDEX IF NOT EXISTS domain_metrics_da_idx ON public.domain_metrics (domain_authority);

CREATE INDEX IF NOT EXISTS niche_proximity_lookup_idx ON public.niche_proximity (niche_a, niche_b);

CREATE INDEX IF NOT EXISTS partner_relationships_users_idx ON public.partner_relationships (user_a_id, user_b_id);
CREATE INDEX IF NOT EXISTS partner_relationships_quality_idx ON public.partner_relationships (quality_score);

CREATE INDEX IF NOT EXISTS placement_opportunities_status_idx ON public.placement_opportunities (status);
CREATE INDEX IF NOT EXISTS placement_opportunities_score_idx ON public.placement_opportunities (overall_match_score);
CREATE INDEX IF NOT EXISTS placement_opportunities_target_user_idx ON public.placement_opportunities (target_user_id);
CREATE INDEX IF NOT EXISTS placement_opportunities_expires_idx ON public.placement_opportunities (expires_at);

CREATE INDEX IF NOT EXISTS placement_attempts_opportunity_idx ON public.placement_attempts (opportunity_id);
CREATE INDEX IF NOT EXISTS placement_attempts_success_idx ON public.placement_attempts (success);

CREATE INDEX IF NOT EXISTS credit_transactions_user_idx ON public.credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_type_idx ON public.credit_transactions (transaction_type);

-- RLS Policies
ALTER TABLE public.domain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_proximity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Domain metrics policies
CREATE POLICY "Users can manage their own domain metrics"
  ON public.domain_metrics FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all domain metrics"
  ON public.domain_metrics FOR ALL USING (auth.role() = 'service_role');

-- Niche proximity policies (read-only for users)
CREATE POLICY "Users can read niche proximity data"
  ON public.niche_proximity FOR SELECT USING (true);

CREATE POLICY "Service role can manage niche proximity"
  ON public.niche_proximity FOR ALL USING (auth.role() = 'service_role');

-- Partner relationships policies
CREATE POLICY "Users can access their partner relationships"
  ON public.partner_relationships FOR ALL 
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Service role can access all partner relationships"
  ON public.partner_relationships FOR ALL USING (auth.role() = 'service_role');

-- Placement opportunities policies
CREATE POLICY "Users can access relevant placement opportunities"
  ON public.placement_opportunities FOR ALL 
  USING (auth.uid() = target_user_id OR auth.uid() = source_user_id);

CREATE POLICY "Service role can access all placement opportunities"
  ON public.placement_opportunities FOR ALL USING (auth.role() = 'service_role');

-- Placement attempts policies
CREATE POLICY "Users can view attempts for their opportunities"
  ON public.placement_attempts FOR SELECT 
  USING (opportunity_id IN (
    SELECT id FROM public.placement_opportunities 
    WHERE target_user_id = auth.uid() OR source_user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all placement attempts"
  ON public.placement_attempts FOR ALL USING (auth.role() = 'service_role');

-- Credit transactions policies
CREATE POLICY "Users can access their own credit transactions"
  ON public.credit_transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can access all credit transactions"
  ON public.credit_transactions FOR ALL USING (auth.role() = 'service_role');

-- Insert default niche proximity data for home services cross-matching
INSERT INTO public.niche_proximity (niche_a, niche_b, proximity_score) VALUES
('home-services', 'home-services', 1.0),
('plumbing', 'electrical', 0.8),
('plumbing', 'hvac', 0.7),
('plumbing', 'roofing', 0.6),
('plumbing', 'flooring', 0.5),
('electrical', 'hvac', 0.8),
('electrical', 'security-systems', 0.7),
('electrical', 'solar', 0.9),
('hvac', 'insulation', 0.8),
('hvac', 'windows', 0.6),
('roofing', 'siding', 0.7),
('roofing', 'gutters', 0.8),
('landscaping', 'irrigation', 0.9),
('landscaping', 'fencing', 0.6),
('technology', 'software', 0.9),
('technology', 'web-development', 0.8),
('technology', 'cybersecurity', 0.7),
('health-wellness', 'fitness', 0.8),
('health-wellness', 'nutrition', 0.7),
('finance-business', 'accounting', 0.8),
('finance-business', 'insurance', 0.7),
('finance-business', 'real-estate', 0.6)
ON CONFLICT (niche_a, niche_b) DO NOTHING;

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_domain_metrics_updated_at 
  BEFORE UPDATE ON public.domain_metrics 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_partner_relationships_updated_at 
  BEFORE UPDATE ON public.partner_relationships 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_placement_opportunities_updated_at 
  BEFORE UPDATE ON public.placement_opportunities 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 