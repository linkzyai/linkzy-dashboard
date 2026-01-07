// netlify/functions/blog-ssr.js

exports.handler = async (event) => {
  try {
    // Accept slug coming from:
    //  - /.netlify/functions/blog-ssr/<slug>   (via _redirects)
    //  - or (in some edge cases) /blog/<slug>
    const path = event.path || "";
    let slug = "";

    // Most common when proxied to function:
    // "/.netlify/functions/blog-ssr/small-business-seo-checklist-rank-higher"
    const m1 = path.match(/\/blog-ssr\/(.+)$/);
    if (m1 && m1[1]) slug = m1[1];

    // Fallback if needed:
    const m2 = !slug ? path.match(/\/blog\/(.+)$/) : null;
    if (m2 && m2[1]) slug = m2[1];

    slug = (slug || "").replace(/^\/+|\/+$/g, ""); // trim slashes

    // If we somehow got called without a slug, return SPA shell (NOT a redirect)
    // This prevents redirect loops.
    const host = event.headers?.host || "linkzy.ai";
    const origin = `https://${host}`;

    const htmlRes = await fetch(`${origin}/index.html`, {
      headers: {
        "User-Agent": event.headers?.["user-agent"] || "Mozilla/5.0",
      },
    });

    let html = await htmlRes.text();

    if (!slug) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
        body: html,
      };
    }

    // --- Supabase ---
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return {
        statusCode: 500,
        body:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY env vars",
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

    // If Supabase errors, return SPA shell (still 200) so the page doesn't die
    if (!articleRes.ok) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
        body: html,
      };
    }

    const rows = await articleRes.json();
    const article = Array.isArray(rows) ? rows[0] : null;

    if (!article || !article.headline) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
        body: html,
      };
    }

    // --- Inject SEO ---
    const title = `${article.headline} - Linkzy Blog`;
    const desc = (article.meta_description || "").trim();
    const canonical = `${origin}/blog/${article.slug}`;

    // Title
    html = html.replace(
      /<title>.*?<\/title>/i,
      `<title>${escapeHtml(title)}</title>`
    );

    // Meta description
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

    // Canonical
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

    // OG + Twitter
    html = injectOnce(
      html,
      /property=["']og:title["']/i,
      `  <meta property="og:title" content="${escapeHtml(title)}" />\n`
    );
    html = injectOnce(
      html,
      /property=["']og:description["']/i,
      `  <meta property="og:description" content="${escapeHtml(desc)}" />\n`
    );
    html = injectOnce(
      html,
      /property=["']og:url["']/i,
      `  <meta property="og:url" content="${escapeHtml(canonical)}" />\n`
    );
    html = injectOnce(
      html,
      /name=["']twitter:title["']/i,
      `  <meta name="twitter:title" content="${escapeHtml(title)}" />\n`
    );
    html = injectOnce(
      html,
      /name=["']twitter:description["']/i,
      `  <meta name="twitter:description" content="${escapeHtml(desc)}" />\n`
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
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

function injectOnce(html, testRegex, tagLine) {
  if (testRegex.test(html)) return html;
  return html.replace(/<\/head>/i, `${tagLine}</head>`);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
