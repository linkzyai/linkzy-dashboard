// netlify/functions/blog-ssr.js

exports.handler = async (event) => {
  try {
    // 1) Get the slug from the function path
    // Example: /.netlify/functions/blog-ssr/small-business-seo-checklist-rank-higher
    const parts = (event.path || "").split("/blog-ssr/"); // ["...functions", "slug"]
    const slug = (parts[1] || "").replace(/^\/+|\/+$/g, ""); // trim slashes

    if (!slug) {
      return {
        statusCode: 302,
        headers: { Location: "/blog" },
        body: "",
      };
    }

    // 2) Pull article SEO from Supabase (REST)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return {
        statusCode: 500,
        body: "Missing SUPABASE_URL or SUPABASE_*_KEY env vars",
      };
    }

    const apiUrl =
      `${SUPABASE_URL}/rest/v1/articles` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&select=slug,headline,meta_description` +
      `&limit=1`;

    const articleRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const rows = await articleRes.json();
    const article = Array.isArray(rows) ? rows[0] : null;

    // 3) Fetch your base HTML (IMPORTANT: fetch /index.html so we don't recurse)
    const host = event.headers?.host || "linkzy.ai";
    const origin = `https://${host}`;

    const htmlRes = await fetch(`${origin}/index.html`, {
      headers: {
        // helpful for debugging; not required
        "User-Agent": event.headers?.["user-agent"] || "Mozilla/5.0",
      },
    });

    let html = await htmlRes.text();

    // If we didn't find the article, return your normal SPA shell (still 200)
    if (!article) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
        body: html,
      };
    }

    // 4) Inject SEO tags
    const title = `${article.headline} - Linkzy Blog`;
    const desc = (article.meta_description || "").trim();
    const canonical = `${origin}/blog/${article.slug}`;

    // Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

    // Meta description (replace if exists, otherwise insert)
    if (/<meta\s+name=["']description["']\s+content=/i.test(html)) {
      html = html.replace(
        /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta name="description" content="${escapeHtml(desc)}" />`
      );
    } else {
      html = html.replace(
        /<\/head>/i,
        `  <meta name="description" content="${escapeHtml(desc)}" />\n</head>`
      );
    }

    // Canonical (replace if exists, otherwise insert)
    if (/<link\s+rel=["']canonical["']/i.test(html)) {
      html = html.replace(
        /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
        `<link rel="canonical" href="${escapeHtml(canonical)}" />`
      );
    } else {
      html = html.replace(
        /<\/head>/i,
        `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`
      );
    }

    // OG + Twitter (simple add; duplicates are usually fine, but we’ll avoid if already present)
    if (!/property=["']og:title["']/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `  <meta property="og:title" content="${escapeHtml(title)}" />\n</head>`
      );
    }
    if (!/property=["']og:description["']/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `  <meta property="og:description" content="${escapeHtml(desc)}" />\n</head>`
      );
    }
    if (!/property=["']og:url["']/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `  <meta property="og:url" content="${escapeHtml(canonical)}" />\n</head>`
      );
    }
    if (!/name=["']twitter:title["']/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `  <meta name="twitter:title" content="${escapeHtml(title)}" />\n</head>`
      );
    }
    if (!/name=["']twitter:description["']/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `  <meta name="twitter:description" content="${escapeHtml(desc)}" />\n</head>`
      );
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // short cache while you test; you can bump later
        "Cache-Control": "public, max-age=300",
      },
      body: html,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `blog-ssr error: ${err?.message || String(err)}`,
    };
  }
};

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
