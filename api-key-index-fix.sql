-- Fix for 401 API key lookup errors
-- Add missing index on users.api_key for faster lookups

CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users(api_key);

-- Verify the index was created
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_api_key'; 