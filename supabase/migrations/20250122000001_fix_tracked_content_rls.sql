/*
  # Fix RLS for track-content Edge Function
  
  1. Add service role policy to users table
  2. Add service role policy to tracked_content table  
  3. Create function for API key validation
*/

-- Allow service role to bypass RLS for users table (for API key validation)
CREATE POLICY "Service role can access all users"
  ON public.users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow service role to bypass RLS for tracked_content table  
CREATE POLICY "Service role can access all tracked_content"
  ON public.tracked_content
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to validate API key and return user_id
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key_input TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid 
  FROM public.users 
  WHERE api_key = api_key_input;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 