import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl || '', supabaseKey || '');

  // 1. Try to fetch from 'articles' table (common for SEObot)
  let { data: posts, error } = await supabase
    .from('articles')
    .select('*');

  // 2. If that fails or is empty, try 'posts' table
  if (!posts || posts.length === 0) {
    const { data: altPosts } = await supabase.from('posts').select('*');
    posts = altPosts;
  }

  const baseUrl = 'https://linkzy.ai';
  const staticPages = ['', '/blog', '/features', '/pricing', '/how-it-works', '/about', '/terms', '/privacy'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>`;
  } );

  // Add dynamic blog posts
  if (posts && posts.length > 0) {
    posts.forEach(post => {
      // Handle different possible column names for slug and date
      const slug = post.slug || post.id;
      const date = post.updated_at || post.created_at || new Date().toISOString();
      const lastMod = new Date(date).toISOString().split('T')[0];
      
      // Only add if it's published (check different possible status columns)
      const isPublished = post.status === 'published' || post.published === true || !post.status;
      
      if (isPublished && slug) {
        xml += `\n  <url>\n    <loc>${baseUrl}/blog/${slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    });
  }

  xml += `\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-cache'
    },
    body: xml
  };
};


