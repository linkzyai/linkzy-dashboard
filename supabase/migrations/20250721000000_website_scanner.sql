/*
  # Website Scanner Database Schema
  
  1. New Tables
    - `website_analysis`: Stores overall website analysis results
    - `linkable_content`: Stores individual page analysis for backlink opportunities
  
  2. Security
    - Enable RLS for both tables
    - Users can only access their own data
  
  3. Indexes
    - Performance indexes for common queries
*/

-- Create website_analysis table
CREATE TABLE IF NOT EXISTS public.website_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  page_titles TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  content_summary TEXT,
  total_pages INTEGER DEFAULT 0,
  scan_status TEXT DEFAULT 'pending', -- pending, scanning, completed, failed
  scan_progress INTEGER DEFAULT 0,
  error_message TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create linkable_content table
CREATE TABLE IF NOT EXISTS public.linkable_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  website_analysis_id UUID REFERENCES public.website_analysis(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  meta_description TEXT,
  content_snippet TEXT,
  keywords TEXT[] DEFAULT '{}',
  niche TEXT,
  word_count INTEGER DEFAULT 0,
  linkable_score FLOAT DEFAULT 0, -- 0-100 score for backlink potential
  anchor_opportunities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkable_content ENABLE ROW LEVEL SECURITY;

-- Create policies for website_analysis
CREATE POLICY "Users can access their own website analysis"
  ON public.website_analysis
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for linkable_content
CREATE POLICY "Users can access their own linkable content"
  ON public.linkable_content
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS website_analysis_user_id_idx ON public.website_analysis (user_id);
CREATE INDEX IF NOT EXISTS website_analysis_url_idx ON public.website_analysis (website_url);
CREATE INDEX IF NOT EXISTS linkable_content_user_id_idx ON public.linkable_content (user_id);
CREATE INDEX IF NOT EXISTS linkable_content_analysis_id_idx ON public.linkable_content (website_analysis_id);
CREATE INDEX IF NOT EXISTS linkable_content_niche_idx ON public.linkable_content (niche);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_website_analysis_updated_at BEFORE UPDATE ON public.website_analysis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_linkable_content_updated_at BEFORE UPDATE ON public.linkable_content FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 