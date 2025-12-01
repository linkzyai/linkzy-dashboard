-- Add subscription tracking columns to users table
-- Migration: Add Stripe subscription support

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN public.users.subscription_status IS 'Subscription status: none, active, canceled, past_due, unpaid';
COMMENT ON COLUMN public.users.subscription_current_period_end IS 'End date of current subscription billing period';
COMMENT ON COLUMN public.users.subscription_cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
