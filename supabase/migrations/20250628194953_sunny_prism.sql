/*
  # Create Backlinks Table and Security Policies

  1. New Tables
    - `backlinks`: Stores user backlink requests and their status
  2. Security
    - Enable RLS (Row Level Security) for backlinks table
    - Create policies for users to access only their own backlinks
    - Add policy for admin access
  3. Schema
    - Link backlinks to users via user_id
    - Store request details and track status
*/

-- Create backlinks table
CREATE TABLE IF NOT EXISTS public.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  niche TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  domain TEXT,
  placement_url TEXT,
  domain_authority INTEGER,
  clicks INTEGER DEFAULT 0,
  traffic_increase TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  placed_at TIMESTAMPTZ
);

-- Enable RLS on backlinks table
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own backlinks
CREATE POLICY "Users can access their own backlinks"
  ON public.backlinks
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policy for admins to access all backlinks
CREATE POLICY "Admin users can access all backlinks"
  ON public.backlinks
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin));

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS backlinks_user_id_idx ON public.backlinks (user_id);