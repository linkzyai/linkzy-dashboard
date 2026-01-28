// Using direct REST API calls instead of Supabase JS client to avoid fetch issues
exports.handler = async () => {
  try {
    console.log('=== Sitemap Generation Started ===');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('Environment check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY exists:', !!supabaseKey);

    let posts = [];

    if (supabaseUrl && supabaseKey) {
      try {
        // Use direct REST API call instead of Supabase client
        const apiUrl = `${supabaseUrl}/rest/v1/articles?published=eq.true&select=slug,published_at`;
        
        console.log('Fetching from:', apiUrl.substring(0, 50) + '...');
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
          posts = await response.json();
          console.log('Successfully fetched posts:', posts.length);
          if (posts.length > 0) {
            console.log('First 3 slugs:', posts.slice(0, 3).map(p => p.slug));
          }
        } else {
          const errorText = await response.text();
          console.error('API error response:', errorText);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError.message);
        console.error('Fetch error stack:', fetchError.stack);
      }
    } else {
      console.warn('Missing Supabase credentials');
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
    staticPages.forEach((page ) => {
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
      console.warn('No blog posts to add');
    }

    xml += `\n</urlset>`;

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
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    // Return basic sitemap on error
    const baseUrl = 'https://linkzy.ai';
    const staticPages = ['', '/blog', '/features', '/pricing', '/how-it-works', '/about', '/terms', '/privacy'];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    staticPages.forEach((page ) => {
      xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>`;
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

