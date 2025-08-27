const { json, corsHeaders, isAdmin, checkOrigin } = require('./_utils');
const fetch = global.fetch;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const H = (k,j=true)=>({...(j?{'Content-Type':'application/json'}:{}),apikey:k,Authorization:`Bearer ${k}`});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  if (!checkOrigin(event)) return json(403,{error:'Origin not allowed'});
  if (!isAdmin(event)) return json(401,{error:'Admin key required'});
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});

  try {
    const { userId, days = 90 } = JSON.parse(event.body||'{}');
    if (!userId) return json(400,{error:'userId required'});

    const since = Math.floor(Date.now()/1000) - (days*24*60*60);
    // List recent payment intents
    const pis = await stripe.paymentIntents.list({ limit: 100, created: { gte: since } });

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let inserted = 0;
    for (const pi of pis.data) {
      const meta = pi.metadata || {};
      if (pi.status !== 'succeeded') continue;
      if (!meta.user_id || meta.user_id !== userId) continue;

      // Check if exists
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/billing_history?stripe_session_id=eq.${pi.id}&select=id`, { headers: { ...H(SERVICE_KEY,false) } });
      const existing = await existingRes.json();
      if (Array.isArray(existing) && existing.length > 0) continue;

      const amount = (pi.amount_received || pi.amount || 0) / 100;
      const credits = parseInt(meta.credits || '0', 10) || 0;
      const desc = meta.plan_name || meta.description || 'Credit purchase';

      await fetch(`${SUPABASE_URL}/rest/v1/billing_history`, {
        method: 'POST',
        headers: { ...H(SERVICE_KEY) },
        body: JSON.stringify([{ user_id: userId, type:'credit_purchase', amount, credits_added: credits, description: desc, stripe_session_id: pi.id, status:'completed' }])
      });
      inserted++;
    }

    return json(200,{ ok:true, inserted });
  } catch (e) {
    return json(500,{ ok:false, error: String(e?.message||e) });
  }
}; 