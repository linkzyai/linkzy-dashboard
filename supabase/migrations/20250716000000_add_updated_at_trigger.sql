/*
  # Add automatic updated_at trigger for users table
  
  1. Function to update the updated_at column
  2. Trigger to call this function on every UPDATE
  3. This ensures updated_at is always current without manual intervention
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also ensure backlinks table has the same trigger
DROP TRIGGER IF EXISTS update_backlinks_updated_at ON public.backlinks;
CREATE TRIGGER update_backlinks_updated_at
  BEFORE UPDATE ON public.backlinks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 