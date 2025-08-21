const fetch = global.fetch;

const json = (s, b) => ({ statusCode: s, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(b) });
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
const h = (key, jsonH = true) => ({ ...(jsonH ? { 'Content-Type': 'application/json' } : {}), apikey: key, Authorization: `Bearer ${key}` });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY || SERVICE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Missing env vars' });

  const body = safe(event.body) || {};
  const opportunityId = body.opportunityId || null;
  const primaryUserId = body.primaryUserId || null;

  try {
    let opp = null;
    if (opportunityId) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?id=eq.${opportunityId}&select=id,status,source_user_id`, { headers: { ...h(SERVICE_KEY, false) } });
      const a = await r.json();
      opp = a?.[0] || null;
    } else {
      // Pick latest pending for user (if provided) else any pending
      const qUser = primaryUserId ? `&source_user_id=eq.${primaryUserId}` : '';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?status=eq.pending${qUser}&select=id,status,source_user_id&order=created_at.desc&limit=1`, { headers: { ...h(SERVICE_KEY, false) } });
      const a = await r.json();
      opp = a?.[0] || null;
    }
    if (!opp) return json(200, { ok: true, message: 'No pending opportunities found to approve.' });

    // Approve
    await fetch(`${SUPABASE_URL}/rest/v1/placement_opportunities?id=eq.${opp.id}`, {
      method: 'PATCH',
      headers: { ...h(SERVICE_KEY) },
      body: JSON.stringify({ status: 'approved' })
    });

    // Trigger placement
    const placeRes = await fetch(`${SUPABASE_URL}/functions/v1/automatic-placement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ opportunityId: opp.id, manualOverride: true, userId: opp.source_user_id })
    });
    const placeJson = await placeRes.json().catch(() => ({}));

    return json(200, { ok: true, opportunityId: opp.id, placement: placeJson });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
};

function safe(s) { try { return s ? JSON.parse(s) : {}; } catch { return {}; } } 