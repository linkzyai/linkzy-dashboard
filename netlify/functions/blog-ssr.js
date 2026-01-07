// netlify/functions/blog-ssr.js

exports.handler = async (event) => {
  try {
    const path = event?.path || "";
    const headers = event?.headers || {};
    const host =
      headers["x-forwarded-host"] ||
      headers["host"] ||
      "linkzy.ai";
    const proto = headers["x-forwarded-proto"] || "https";
    const origin = `${proto}://${host}`;

    // 1) Get slug safely (works whether called as:
    //    "/.netlify/functions/blog-ssr/<slug>"
    //    OR "/blog/<slug>" (edge cases))
    let slug = getSlugFromPath(path);

    // 2) Always fetch SPA shell first (so we can return it on any error)
    const baseHtml = await fetchBaseHtml(origin, headers);

    // If no slug, return SPA shell (NO redirects -> prevents loops)
    if (!slug) {
      return htmlResponse(baseHtml, 60);
    }

    // 3) Supabase env vars
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    // If missing env vars, fail gracefully with SPA shell (still 200)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return htmlResponse(baseHtml, 60);
    }

    // 4) Fetch article SEO
    const article = await fetchArticleSEO(SUPABASE_URL, SUPABASE_KEY, slug);

    // If article not found or incomplete, return SPA shell
    if (!article || !article.headline) {
      return htmlResponse(baseHtml, 60);
    }

    // 5) Inject SEO tags into the base HTML
    const title = `${article.headline} - Linkzy Blog`;
    const desc = (article.meta_description || "").trim();
    const canonical = `${origin}/blog/${article.slug || slug}`;

    let html = baseHtml;

    html = replaceTitle(html, title);
    html = upsertMetaDescription(html, desc);
    html = upsertCanonical(html, canonical);

    html = upsertMeta(html, { property: "og:title", content: title });
    html = upsertMeta(html, { property: "og:description", content: desc });
    html = upsertMeta(html, { property: "og:url", content: canonical });

    html = upsertMeta(html, { name: "twitter:title", content: title });
    html = upsertMeta(html, { name: "twitter:description", content: desc });

    // You can add og:image/twitter:image later if you store an image URL.

    return htmlResponse(html, 300);
  } catch (err) {
    // Hard fail (unexpected) - return 500 text so you can see it in logs
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: `blog-ssr error: ${err?.message || String(err)}`,
    };
  }
};

/* -------------------- helpers -------------------- */

function getSlugFromPath(path) {
  // Strip Netlify function prefix if present
  // "/.netlify/functions/blog-ssr/<slug>"
  let slug = path
    .replace(/^\/\.netlify\/functions\/blog-ssr\/?/, "")
    .replace(/^\/+|\/+$/g, "");

  // If still looks like the original route, support "/blog/<slug>"
  if (!slug || slug.startsWith("blog/")) {
    slug = path
      .replace(/^\/blog\/?/, "")
      .replace(/^\/+|\/+$/g, "");
  }

  // If someone hit "/blog" with no slug
  if (slug === "blog") return "";

  return slug;
}

async function fetchBaseHtml(origin, reqHeaders) {
  // IMPORTANT: fetch /index.html so we do not recurse into redirects
  const res = await fetch(`${origin}/index.html`, {
    headers: {
      "User-Agent": reqHeaders?.["user-agent"] || "Mozilla/5.0",
    },
  });

  // If this fails, throw (so we get a visible 500 in logs)
  if (!res.ok) {
    throw new Error(`Failed to fetch base HTML: ${res.status}`);
  }

  return await res.text();
}

async function fetchArticleSEO(SUPABASE_URL, SUPABASE_KEY, slug) {
  const apiUrl =
    `${SUPABASE_URL}/rest/v1/articles` +
    `?slug=eq.${encodeURIComponent(slug)}` +
    `&select=slug,headline,meta_description` +
    `&limit=1`;

  const res = await fetch(apiUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) return null;

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return rows[0];
}

function htmlResponse(html, maxAgeSeconds) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAgeSeconds}`,
    },
    body: html,
  };
}

function replaceTitle(html, title) {
  const safe = escapeHtml(title);
  if (/<title>.*?<\/title>/i.test(html)) {
    return html.replace(/<title>.*?<\/title>/i, `<title>${safe}</title>`);
  }
  return html.replace(/<\/head>/i, `  <title>${safe}</title>\n</head>`);
}

function upsertMetaDescription(html, desc) {
  const safe = escapeHtml(desc);
  if (!safe) return html;

  // Replace if exists
  if (/<meta\s+name=["']description["']/i.test(html)) {
    return html.replace(
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="description" content="${safe}" />`
    );
  }

  // Insert if missing
  return html.replace(
    /<\/head>/i,
    `  <meta name="description" content="${safe}" />\n</head>`
  );
}

function upsertCanonical(html, url) {
  const safe = escapeHtml(url);

  if (/<link\s+rel=["']canonical["']/i.test(html)) {
    return html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
      `<link rel="canonical" href="${safe}" />`
    );
  }

  return html.replace(
    /<\/head>/i,
    `  <link rel="canonical" href="${safe}" />\n</head>`
  );
}

function upsertMeta(html, attrs) {
  // attrs: { name?: "...", property?: "...", content: "..." }
  const content = escapeHtml(attrs.content || "");
  if (!content) return html;

  if (attrs.property) {
    const prop = attrs.property;
    const exists = new RegExp(`property=["']${escapeRegExp(prop)}["']`, "i");
    if (exists.test(html)) return html;

    return html.replace(
      /<\/head>/i,
      `  <meta property="${escapeHtml(prop)}" content="${content}" />\n</head>`
    );
  }

  if (attrs.name) {
    const name = attrs.name;
    const exists = new RegExp(`name=["']${escapeRegExp(name)}["']`, "i");
    if (exists.test(html)) return html;

    return html.replace(
      /<\/head>/i,
      `  <meta name="${escapeHtml(name)}" content="${content}" />\n</head>`
    );
  }

  return html;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

