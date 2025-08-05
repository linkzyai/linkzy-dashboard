/*
  # Tracked Content Table
  
  1. New Tables
    - `tracked_content`: Stores content tracking data from websites
  
  2. Security
    - Enable RLS on the table
    - Users can only access their own tracked content
  
  3. Indexes
    - Performance indexes for common queries
*/

-- Create tracked_content table
CREATE TABLE IF NOT EXISTS public.tracked_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL,
  content TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  keyword_density JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracked_content ENABLE ROW LEVEL SECURITY;

-- Create policy for tracked_content
CREATE POLICY "Users can access their own tracked content"
  ON public.tracked_content
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tracked_content_api_key_idx ON public.tracked_content (api_key);
CREATE INDEX IF NOT EXISTS tracked_content_url_idx ON public.tracked_content (url);
CREATE INDEX IF NOT EXISTS tracked_content_timestamp_idx ON public.tracked_content (timestamp);
CREATE INDEX IF NOT EXISTS tracked_content_user_id_idx ON public.tracked_content (user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_tracked_content_updated_at 
  BEFORE UPDATE ON public.tracked_content 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 