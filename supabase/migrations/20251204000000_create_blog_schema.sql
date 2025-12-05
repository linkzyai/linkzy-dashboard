-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  headline TEXT NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  reading_time INTEGER DEFAULT 0,
  html TEXT,
  markdown TEXT,
  outline TEXT,
  image TEXT,
  deleted BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Article related posts junction table (many-to-many)
CREATE TABLE IF NOT EXISTS article_related_posts (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_article_id),
  -- Prevent self-referencing
  CHECK (article_id != related_article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published) WHERE published = TRUE AND deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_related_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
-- Public can read published, non-deleted articles
CREATE POLICY "Public can view published articles"
  ON articles FOR SELECT
  USING (published = TRUE AND deleted = FALSE);

-- Authenticated users can manage all articles
CREATE POLICY "Authenticated users can manage articles"
  ON articles FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for tags
-- Everyone can read tags
CREATE POLICY "Public can view tags"
  ON tags FOR SELECT
  USING (true);

-- Only authenticated users can manage tags
CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for categories
-- Everyone can read categories
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

-- Only authenticated users can manage categories
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for article_tags
-- Everyone can read article tags
CREATE POLICY "Public can view article tags"
  ON article_tags FOR SELECT
  USING (true);

-- Only authenticated users can manage article tags
CREATE POLICY "Authenticated users can manage article tags"
  ON article_tags FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for article_related_posts
-- Everyone can read related posts
CREATE POLICY "Public can view related posts"
  ON article_related_posts FOR SELECT
  USING (true);

-- Only authenticated users can manage related posts
CREATE POLICY "Authenticated users can manage related posts"
  ON article_related_posts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on articles, tags, and categories
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set published_at when published becomes true
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published = TRUE AND OLD.published = FALSE THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set published_at
CREATE TRIGGER set_article_published_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();
