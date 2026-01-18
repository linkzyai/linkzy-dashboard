import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  // We use the safe Anon Key already in your Netlify settings
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl || '', supabaseKey || '');

  // We match your RLS policy EXACTLY: published = true
  const { data: posts, error } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('published', true); // This matches your "Public can view published articles" policy

  if (error) {
    console.error("Supabase error:", error);
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
      if (post.slug) {
        const date = post.published_at || new Date().toISOString();
        const lastMod = new Date(date).toISOString().split('T')[0];
        xml += `\n  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    });
  }

  xml += `\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    },
    body: xml
  };
};
