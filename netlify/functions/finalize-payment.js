const { json, corsHeaders, checkOrigin } = require('./_utils');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fetchApi = global.fetch;

const H = (k,j=true)=>({...(j?{'Content-Type':'application/json'}:{}),apikey:k,Authorization:`Bearer ${k}`});

function decodeJwtSub(token) {
  try {
    const parts = String(token||'').split('.');
    if (parts.length < 2) return '';
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
    return payload.sub || '';
  } catch {
    return '';
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  if (!checkOrigin(event)) return json(403,{ error: 'Origin not allowed' });
  if (event.httpMethod !== 'POST') return json(405,{ error: 'Method not allowed' });

  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const callerId = decodeJwtSub(token);
    if (!token || !callerId) return json(401,{ error: 'Auth required' });

    const { payment_intent_id } = JSON.parse(event.body||'{}');
    if (!payment_intent_id) return json(400,{ error: 'payment_intent_id required' });

    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (!pi || pi.status !== 'succeeded') return json(400,{ error: 'Payment not succeeded yet' });

    const meta = pi.metadata || {};
    const userId = meta.user_id;
    const credits = parseInt(meta.credits || '0',10) || 0;
    const amount = (pi.amount_received || pi.amount || 0) / 100;
    const desc = meta.plan_name || meta.description || 'Credit purchase';

    if (!userId || callerId !== userId) return json(401,{ error: 'User mismatch' });

    // Idempotency: check if already recorded
    const existingRes = await fetchApi(`${SUPABASE_URL}/rest/v1/billing_history?stripe_session_id=eq.${pi.id}&select=id`, { headers: { ...H(SERVICE_KEY,false) } });
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return json(200,{ ok:true, already:true });
    }

    // Increment credits
    const userRes = await fetchApi(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=credits`, { headers: { ...H(SERVICE_KEY,false) } });
    const users = await userRes.json();
    const current = (Array.isArray(users) && users[0]?.credits) || 0;
    await fetchApi(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...H(SERVICE_KEY) },
      body: JSON.stringify({ credits: current + credits })
    });

    // Insert billing history
    await fetchApi(`${SUPABASE_URL}/rest/v1/billing_history`, {
      method: 'POST',
      headers: { ...H(SERVICE_KEY) },
      body: JSON.stringify([{ user_id: userId, type:'credit_purchase', amount, credits_added: credits, description: desc, stripe_session_id: pi.id, status:'completed' }])
    });

    return json(200,{ ok:true });
  } catch (e) {
    return json(500,{ error: String(e?.message||e) });
  }
}; 