-- Add tier column to users (bronze / silver / gold network tier)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT "bronze";

COMMENT ON COLUMN public.users.tier IS 'Network tier: bronze, silver, or gold';
