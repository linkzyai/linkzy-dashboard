const { json, corsHeaders, isAdmin, checkOrigin } = require('./_utils');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fetchApi = global.fetch;

const H = (k,j=true)=>({
  ...(j?{'Content-Type':'application/json'}:{}),
  Accept: 'application/json',
  apikey: k,
  Authorization: `Bearer ${k}`
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  if (!checkOrigin(event)) return json(403,{ error: 'Origin not allowed' });
  if (event.httpMethod !== 'POST') return json(405,{ error: 'Method not allowed' });
  if (!isAdmin(event)) return json(401,{ error: 'Admin key required' });

  try {
    const { payment_intent_id } = JSON.parse(event.body||'{}');
    if (!payment_intent_id) return json(400,{ error: 'payment_intent_id required' });

    console.log('Manual finalize for PI:', payment_intent_id);

    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (!pi || pi.status !== 'succeeded') return json(400,{ error: 'Payment not succeeded yet', status: pi?.status });

    const meta = pi.metadata || {};
    const userId = meta.user_id;
    const credits = parseInt(meta.credits || '0',10) || 0;
    const amount = (pi.amount_received || pi.amount || 0) / 100;
    const desc = meta.plan_name || meta.description || 'Credit purchase';

    if (!userId) return json(400,{ error: 'No user_id in metadata' });

    console.log('Processing for user:', userId, 'credits:', credits);

    // Idempotency: check if already recorded
    const existingRes = await fetchApi(`${SUPABASE_URL}/rest/v1/billing_history?stripe_session_id=eq.${pi.id}&select=id`, { headers: { ...H(SERVICE_KEY,false) } });
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return json(200,{ ok:true, already:true, existing: existing.length });
    }

    // Get current credits
    const userRes = await fetchApi(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=credits`, { headers: { ...H(SERVICE_KEY,false) } });
    const users = await userRes.json();
    const current = (Array.isArray(users) && users[0]?.credits) || 0;
    
    console.log('Current credits:', current, 'Adding:', credits);

    // Update credits
    const updateRes = await fetchApi(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...H(SERVICE_KEY), Prefer: 'return=representation' },
      body: JSON.stringify({ credits: current + credits })
    });

    // Insert billing history
    const billingRes = await fetchApi(`${SUPABASE_URL}/rest/v1/billing_history`, {
      method: 'POST',
      headers: { ...H(SERVICE_KEY), Prefer: 'return=representation' },
      body: JSON.stringify([{ user_id: userId, type:'credit_purchase', amount, credits_added: credits, description: desc, stripe_session_id: pi.id, status:'completed' }])
    });

    return json(200,{ 
      ok:true, 
      oldCredits: current, 
      newCredits: current + credits,
      updateStatus: updateRes.status,
      billingStatus: billingRes.status 
    });
  } catch (e) {
    console.error('manual-finalize error:', e);
    return json(500,{ error: String(e?.message||e), stack: e?.stack });
  }
}; 