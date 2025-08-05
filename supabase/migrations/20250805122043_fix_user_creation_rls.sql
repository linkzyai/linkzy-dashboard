/*
  # Fix User Creation RLS Policy
  
  Allow users to INSERT their own record during signup process.
  The existing policy only works for SELECT/UPDATE/DELETE, but blocks INSERT.
*/

-- Add specific INSERT policy for user signup
CREATE POLICY "Users can create their own account"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

SELECT 'User creation RLS policy fixed! ✅' as status;
