const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  try {
    console.log('=== Sitemap Generation Started ===');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY exists:', !!supabaseKey);
    console.log('- SUPABASE_URL value:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
      console.error('ERROR: Missing Supabase credentials!');
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');

    console.log('Querying articles table...');
    const { data: posts, error } = await supabase
      .from('articles')
      .select('slug, published_at')
      .eq('published', true);

    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Query successful!');
      console.log('Number of posts found:', posts?.length || 0);
      if (posts && posts.length > 0) {
        console.log('First 3 post slugs:', posts.slice(0, 3).map(p => p.slug));
      }
    }

    const baseUrl = 'https://linkzy.ai';
    const staticPages = [
      '',
      '/blog',
      '/features',
      '/pricing',
      '/how-it-works',
      '/about',
      '/terms',
      '/privacy',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${
        page === '' ? '1.0' : '0.8'
      }</priority>\n  </url>`;
    });

    // Add blog posts
    if (posts && posts.length > 0) {
      console.log('Adding blog posts to sitemap...');
      posts.forEach((post) => {
        if (post.slug) {
          const date = post.published_at || new Date().toISOString();
          const lastMod = new Date(date).toISOString().split('T')[0];
          xml += `\n  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
        }
      });
      console.log('Blog posts added successfully');
    } else {
      console.warn('WARNING: No blog posts found or error occurred');
    }

    xml += `\n</urlset>`;

    console.log('Sitemap generated successfully');
    console.log('Total URLs in sitemap:', (xml.match(/<loc>/g) || []).length);
    console.log('=== Sitemap Generation Complete ===');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
      body: xml,
    };
  } catch (err) {
    console.error('=== FATAL ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('===================');

    // Return a basic sitemap even if there's an error
    const baseUrl = 'https://linkzy.ai';
    const staticPages = [
      '',
      '/blog',
      '/features',
      '/pricing',
      '/how-it-works',
      '/about',
      '/terms',
      '/privacy',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    staticPages.forEach((page) => {
      xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${
        page === '' ? '1.0' : '0.8'
      }</priority>\n  </url>`;
    });
    xml += `\n</urlset>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
      body: xml,
    };
  }
};
