import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  // Use the environment variables from Netlify
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl || '', supabaseKey || '');

  // Fetch all articles - we'll be less strict with the query to ensure we get results
  const { data: posts, error } = await supabase
    .from('articles')
    .select('slug, updated_at, status')
    .eq('status', 'published');

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
      const lastMod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `\n  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    });
  }

  xml += `\n</urlset>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, must-revalidate' // Disable cache for testing
    },
    body: xml
  };
};

