const https = require('https' );

function httpsGet(url, headers ) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res ) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

exports.handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  let posts = [];
  
  try {
    const apiUrl = `${supabaseUrl}/rest/v1/articles?published=eq.true&select=slug,published_at`;
    posts = await httpsGet(apiUrl, {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    } );
  } catch (err) {
    console.error('Error fetching posts:', err.message);
  }

  const baseUrl = 'https://linkzy.ai';
  const staticPages = ['', '/blog', '/features', '/pricing', '/how-it-works', '/about', '/terms', '/privacy'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  staticPages.forEach(page => {
    xml += `\n  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>`;
  } );

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
      'Cache-Control': 'public, max-age=0, must-revalidate'
    },
    body: xml
  };
};

