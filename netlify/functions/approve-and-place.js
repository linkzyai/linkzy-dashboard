const fetch = global.fetch;
const { corsHeaders, json, isAdmin, checkOrigin, isUUID, safeJson } = require('./_utils');
const h = (key,j=true)=>({...(j?{'Content-Type':'application/json'}:{}),apikey:key,Authorization:`Bearer ${key}`});
const ADMIN_KEY = process.env.ADMIN_API_KEY || '';

exports.handler = async (event) => {
  if (event.httpMethod==='OPTIONS') return {statusCode:200,headers:corsHeaders()};
  if (!checkOrigin(event)) return json(403,{error:'Origin not allowed'});
  if (!isAdmin(event)) return json(401,{error:'Admin key required'});
  if (event.httpMethod!=='POST') return json(405,{error:'Method not allowed'});

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY || SERVICE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500,{error:'Missing env vars'});

  const body = safeJson(event.body)||{};
  const opportunityId = body.opportunityId || null;
  const primaryUserId = body.primaryUserId || null;

  try {
    if (opportunityId && !isUUID(opportunityId)) return json(400,{error:'Invalid opportunityId'});

    let opp = null;
    if (opportunityId) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?id=eq.${opportunityId}&select=id,status,source_user_id`, { headers: { ...h(SERVICE_KEY, false) } });
      const a = await r.json();
      opp = a?.[0] || null;
    } else {
      const qUser = primaryUserId ? `&source_user_id=eq.${primaryUserId}` : '';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?status=eq.pending${qUser}&select=id,status,source_user_id&order=created_at.desc&limit=1`, { headers: { ...h(SERVICE_KEY, false) } });
      const a = await r.json();
      opp = a?.[0] || null;
    }
    if (!opp) return json(200, { ok: true, message: 'No pending opportunities found to approve.' });

    await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?id=eq.${opp.id}`, {
      method: 'PATCH',
      headers: { ...h(SERVICE_KEY) },
      body: JSON.stringify({ status: 'approved' })
    });

    const placeRes = await fetch(`${SUPABASE_URL}/functions/v1/automatic-placement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}`, 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ opportunityId: opp.id, manualOverride: true, userId: opp.source_user_id })
    });
    const placeJson = await placeRes.json().catch(() => ({}));

    return json(200, { ok: true, opportunityId: opp.id, placement: placeJson });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}; 