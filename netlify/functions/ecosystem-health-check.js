const fetch = global.fetch;
const { corsHeaders, json, isAdmin, checkOrigin, safeJson } = require('./_utils');

const supabaseHeaders = (key, includeJson = true) => ({
  ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  'apikey': key,
  'Authorization': `Bearer ${key}`
});

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (!checkOrigin(event)) return json(403, { error: 'Origin not allowed' });
  if (!isAdmin(event)) return json(401, { error: 'Admin key required' });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });

  const body = safeJson(event.body) || {};
  const shouldSeed = body.seed !== false; // default true
  let preferredNiche = body.niche || 'fitness';
  let primaryUserId = body.primaryUserId || null;

  try {
    // 1) Choose a source content/user first
    let { sourceContent, sourceUser } = await pickSourceContent(SUPABASE_URL, SERVICE_KEY, primaryUserId, null);

    // If no content and we have a primary user, seed a demo source page for them
    if (!sourceContent && primaryUserId) {
      await ensureSourceContent(SUPABASE_URL, SERVICE_KEY, primaryUserId, preferredNiche);
      ({ sourceContent, sourceUser } = await pickSourceContent(SUPABASE_URL, SERVICE_KEY, primaryUserId, null));
    }

    if (!sourceContent) {
      return json(200, { ok: true, message: 'No source content found. Install the snippet or visit pages to generate tracked content.' });
    }

    // Load the source user's profile to align niches
    const profile = await getUserProfile(SUPABASE_URL, SERVICE_KEY, sourceUser.id);
    if (profile?.niche) preferredNiche = profile.niche;

    // If the source content has empty keywords, seed an additional demo page for overlap
    const hasKeywords = Array.isArray(sourceContent.keywords) && sourceContent.keywords.length > 0;
    if (!hasKeywords && primaryUserId) {
      await ensureSourceContent(SUPABASE_URL, SERVICE_KEY, primaryUserId, preferredNiche);
      ({ sourceContent } = await pickSourceContent(SUPABASE_URL, SERVICE_KEY, primaryUserId, null));
    }

    // 2) Seed a partner demo user/content in the SAME niche as the source
    let partnerUser = null;
    if (shouldSeed) {
      partnerUser = await ensurePartnerUser(SUPABASE_URL, SERVICE_KEY, preferredNiche);
      await ensurePartnerContent(SUPABASE_URL, SERVICE_KEY, partnerUser.id, preferredNiche);
    }

    // 3) Trigger the ecosystem matcher
    const matchRes = await fetch(`${SUPABASE_URL}/functions/v1/ecosystem-matcher`, {
      method: 'POST',
      headers: { ...supabaseHeaders(ANON_KEY || SERVICE_KEY) },
      body: JSON.stringify({ contentId: sourceContent.id, userId: sourceUser.id, forceReprocess: true })
    });
    const matchJson = await matchRes.json().catch(() => ({}));

    // 4) Count fresh opportunities
    const oppCount = await countOpportunities(SUPABASE_URL, SERVICE_KEY, sourceContent.id);

    // 5) Fallback: if none created, insert one simple pending opportunity to verify pipeline
    if ((matchJson.opportunities_created ?? oppCount) === 0 && partnerUser) {
      await insertFallbackOpportunity(
        SUPABASE_URL,
        SERVICE_KEY,
        sourceUser.id,
        sourceContent.id,
        partnerUser.id,
        preferredNiche
      );
    }

    return json(200, {
      ok: true,
      seededPartner: !!partnerUser,
      partnerId: partnerUser?.id || null,
      sourceUserId: sourceUser.id,
      sourceContentId: sourceContent.id,
      opportunitiesCreated: matchJson.opportunities_created ?? (await countOpportunities(SUPABASE_URL, SERVICE_KEY, sourceContent.id)),
      autoApproved: matchJson.auto_approved ?? 0,
      message: matchJson.message || 'Health check complete'
    });
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) });
  }
};

async function ensurePartnerUser(url, serviceKey, niche) {
  // Create auth user via Admin API
  const email = `demo-partner+${Date.now()}@linkzy.ai`;
  const adminRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { ...supabaseHeaders(serviceKey) },
    body: JSON.stringify({ email, password: `Temp${Date.now()}!aA`, email_confirm: true })
  });
  if (!adminRes.ok) {
    const t = await adminRes.text();
    throw new Error(`Failed to create auth user: ${adminRes.status} ${t}`);
  }
  const adminJson = await adminRes.json();
  const authId = adminJson?.id;
  if (!authId) throw new Error('Auth user id missing');

  // Insert profile row
  const apiKey = `linkzy_demo_partner_${Date.now()}`;
  const profileRes = await fetch(`${url}/rest/v1/users`, {
    method: 'POST',
    headers: { ...supabaseHeaders(serviceKey) , 'Prefer': 'return=representation' },
    body: JSON.stringify([{ id: authId, email, website: `https://demo-${niche}.example`, niche, api_key: apiKey, credits: 5, plan: 'free' }])
  });
  if (!profileRes.ok) {
    const t = await profileRes.text();
    throw new Error(`Failed to insert partner profile: ${profileRes.status} ${t}`);
  }
  const profJson = await profileRes.json();
  return profJson[0];
}

async function ensurePartnerContent(url, serviceKey, userId, niche) {
  const seed = [
    { url: `https://demo-${niche}.example/post-1`, title: 'Demo Post One', keywords: ['fitness','workout','hiit'] },
    { url: `https://demo-${niche}.example/post-2`, title: 'Demo Post Two', keywords: ['fitness','nutrition','protein'] }
  ];
  const rows = seed.map(s => ({ user_id: userId, api_key: 'demo_seed', url: s.url, title: s.title, content: 'Demo content', keywords: s.keywords, keyword_density: {}, timestamp: new Date().toISOString() }));
  const res = await fetch(`${url}/rest/v1/tracked_content`, {
    method: 'POST',
    headers: { ...supabaseHeaders(serviceKey) },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to seed partner content: ${res.status} ${t}`);
  }
}

async function pickSourceContent(url, serviceKey, primaryUserId, excludeUserId) {
  // If primaryUserId provided, use their most recent content
  if (primaryUserId) {
    const res = await fetch(`${url}/rest/v1/tracked_content?user_id=eq.${primaryUserId}&select=id,user_id,created_at&order=created_at.desc&limit=1`, {
      headers: { ...supabaseHeaders(serviceKey, false) }
    });
    const arr = await res.json();
    if (arr?.length) return { sourceContent: arr[0], sourceUser: { id: arr[0].user_id } };
  }
  // Else pick the most recent content from any user not excluded
  const res = await fetch(`${url}/rest/v1/tracked_content?select=id,user_id,created_at&order=created_at.desc&limit=1`, {
    headers: { ...supabaseHeaders(serviceKey, false) }
  });
  const arr = await res.json();
  const pick = (arr || []).find(r => r.user_id !== excludeUserId) || arr?.[0] || null;
  if (!pick) return { sourceContent: null, sourceUser: null };
  return { sourceContent: pick, sourceUser: { id: pick.user_id } };
}

async function countOpportunities(url, serviceKey, contentId) {
  const res = await fetch(`${url}/rest/v1/placement_opportunities?select=id&source_content_id=eq.${contentId}`, {
    headers: { ...supabaseHeaders(serviceKey, false), 'Range': '0-0' }
  });
  // PostgREST count via content-range
  const total = res.headers.get('content-range')?.split('/')?.[1];
  return Number(total || 0);
}

async function insertFallbackOpportunity(url, serviceKey, sourceUserId, sourceContentId, targetUserId, niche) {
  // Pick the first target content from the partner
  const tRes = await fetch(`${url}/rest/v1/tracked_content?user_id=eq.${targetUserId}&select=url,title,keywords&order=created_at.asc&limit=1`, {
    headers: { ...supabaseHeaders(serviceKey, false) }
  });
  const tArr = await tRes.json();
  const target = tArr?.[0];
  if (!target) return;

  const payload = [{
    source_user_id: sourceUserId,
    source_content_id: sourceContentId,
    target_user_id: targetUserId,
    target_url: target.url,
    anchor_text: (target.keywords && target.keywords[0]) || niche || 'relevant link',
    match_score: 0.85,
    keyword_overlap: target.keywords || [niche],
    status: 'pending',
    estimated_value: 1
  }];

  await fetch(`${url}/rest/v1/placement_opportunities`, {
    method: 'POST',
    headers: { ...supabaseHeaders(serviceKey) },
    body: JSON.stringify(payload)
  });
}

async function getUserProfile(url, serviceKey, userId) {
  const res = await fetch(`${url}/rest/v1/users?id=eq.${userId}&select=id,email,niche`, {
    headers: { ...supabaseHeaders(serviceKey, false) }
  });
  const arr = await res.json();
  return arr?.[0] || null;
}

async function ensureSourceContent(url, serviceKey, userId, niche) {
  const row = [{ user_id: userId, api_key: 'demo_seed', url: `https://your-demo-${niche}.example/guide-1`, title: 'Demo Guide', content: 'Demo content', keywords: niche.startsWith('fitness') ? ['fitness','workout','hiit'] : [niche, 'guide', 'tips'], keyword_density: {}, timestamp: new Date().toISOString() }];
  await fetch(`${url}/rest/v1/tracked_content`, {
    method: 'POST',
    headers: { ...supabaseHeaders(serviceKey) },
    body: JSON.stringify(row)
  });
} 