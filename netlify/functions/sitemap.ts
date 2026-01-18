import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  // 1. Initialize Supabase (Netlify will use your existing environment variables)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  // 2. Fetch all published blog posts
  const { data: posts } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const baseUrl = 'https://linkzy.ai';

  // 3. Define your static pages
  const staticPages = [
    '',
    '/blog',
    '/features',
    '/pricing',
    '/how-it-works',
    '/about',
    '/terms',
    '/privacy'
  ];

  // 4. Build the XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  } );

  // Add dynamic blog posts
  posts?.forEach(post => {
    xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  // 5. Return the XML with the correct content type
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    },
    body: xml
  };
};
