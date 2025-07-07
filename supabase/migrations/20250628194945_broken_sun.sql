/*
  # Create Automatic User Record Trigger

  1. New Tables & Functions
    - Function `handle_auth_user_created`: Creates user record when new auth users are created
  2. Security
    - Trigger runs with security definer permissions
  3. Behavior
    - Automatically creates a users record for any new auth user
    - Sets default credits, API key, and plan
*/

-- Create function to handle new auth users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users when a new auth user is created
  INSERT INTO public.users (
    id, 
    email, 
    api_key, 
    credits, 
    plan, 
    created_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'linkzy_' || replace(replace(NEW.email, '@', '_'), '.', '_') || '_' || extract(epoch from now())::text,
    3, 
    'free',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_created();

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  website TEXT,
  niche TEXT,
  api_key TEXT UNIQUE,
  credits INTEGER DEFAULT 3,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  email_verified BOOLEAN DEFAULT false
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can access their own data"
  ON public.users
  FOR ALL
  USING (auth.uid() = id);

-- Create policy for admins to access all users
CREATE POLICY "Admin users can access all user data"
  ON public.users
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin));