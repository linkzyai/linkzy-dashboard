// Blog Article Types
export interface IArticle {
  id: string;
  slug: string;
  headline: string;
  metaDescription: string;
  metaKeywords: string;
  tags: ITag[];
  category: ICategory;
  readingTime: number;
  html: string;
  markdown: string;
  outline: string;
  deleted: boolean;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  relatedPosts: IRelatedPost[];
  image: string;
}

export interface ITag {
  id: string;
  title: string;
  slug: string;
}

export interface ICategory {
  id: string;
  title: string;
  slug: string;
}

export interface IRelatedPost {
  id: string;
  headline: string;
  slug: string;
}

// Database response types (snake_case from Supabase)
export interface ArticleDB {
  id: string;
  slug: string;
  headline: string;
  meta_description: string | null;
  meta_keywords: string | null;
  category_id: string | null;
  reading_time: number;
  html: string | null;
  markdown: string | null;
  outline: string | null;
  image: string | null;
  deleted: boolean;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagDB {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryDB {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
}
