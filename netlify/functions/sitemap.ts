import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  // DEBUG: Check if keys exist
  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 200,
      body: `<?xml version="1.0" encoding="UTF-8"?><error>Missing Keys: URL=${!!supabaseUrl}, Key=${!!supabaseKey}</error>`
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: posts, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('published', true);

  // DEBUG: Check for Supabase error
  if (error) {
    return {
      statusCode: 200,
      body: `<?xml version="1.0" encoding="UTF-8"?><error>Supabase Error: ${error.message}</error>`
    };
  }

  const baseUrl = 'https://linkzy.ai';
  const staticPages = ['', '/blog', '/features', '/pricing', '/how-it-works', '/about', '/terms', '/privacy'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  staticPages.forEach(page => {
    xml += `\n  <url><loc>${baseUrl}${page}</loc><priority>0.8</priority></url>`;
  } );

  if (posts) {
    posts.forEach(post => {
      xml += `\n  <url><loc>${baseUrl}/blog/${post.slug}</loc><priority>0.7</priority></url>`;
    });
  }

  xml += `\n</urlset>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: xml
  };
};

