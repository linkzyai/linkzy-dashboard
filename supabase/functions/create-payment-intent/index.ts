// functions/create-payment-intent/index.ts
// Supabase Edge Function: create-payment-intent
// POST { amount, currency, description, user_id, user_email, credits, plan_name, coupon_code? }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const json = (status, body)=>new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
// Optional: origin allowlist via env (comma-separated)
function originAllowed(req) {
  const allow = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((s)=>s.trim()).filter(Boolean);
  if (!allow.length) return true;
  const origin = req.headers.get("Origin") || "";
  return allow.includes(origin);
}
Deno.serve(async (req)=>{
  console.log("Start")
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  if (req.method !== "POST") return json(405, {
    error: "Method not allowed"
  });
  // if (!originAllowed(req)) return json(403, { error: "Origin not allowed" });
  try {
    const { amount, currency = "usd", description = "", user_id, user_email, credits, plan_name, coupon_code } = await req.json();
    console.log(amount);
    // Basic validation
    if (!Number.isInteger(amount) || amount <= 0) return json(400, {
      error: "amount (cents) must be a positive integer"
    });
    if (typeof currency !== "string" || currency.length < 3) return json(400, {
      error: "currency is required"
    });
    if (!user_id) return json(400, {
      error: "user_id is required"
    });
    if (credits === undefined || credits === null) return json(400, {
      error: "credits is required"
    });
    if (!plan_name) return json(400, {
      error: "plan_name is required"
    });
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!STRIPE_SECRET_KEY) return json(500, {
      error: "Stripe secret key not configured"
    });
    // ---------- Preferred: Stripe SDK on Edge (denonext) ----------
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16"
      });
      const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          user_id: String(user_id),
          user_email: user_email ?? "",
          credits: String(credits),
          plan_name: String(plan_name),
          ...coupon_code ? {
            coupon_code: String(coupon_code)
          } : {}
        }
      }, {
        idempotencyKey: crypto.randomUUID()
      });
      console.log(intent.status)
      return json(200, {
        client_secret: intent.client_secret,
        status: intent.status
      });
    } catch (sdkErr) {
      // If your environment/bundler still refuses the SDK, uncomment REST fallback below
      console.error("Stripe SDK path failed, will try REST fallback:", {
        type: sdkErr?.type,
        code: sdkErr?.code,
        message: sdkErr?.message
      });
    // ------------- REST fallback (uncomment to enable) -------------
    // const body = new URLSearchParams({
    //   amount: String(amount),
    //   currency,
    //   "automatic_payment_methods[enabled]": "true",
    //   description,
    //   "metadata[user_id]": String(user_id),
    //   "metadata[user_email]": user_email ?? "",
    //   "metadata[credits]": String(credits),
    //   "metadata[plan_name]": String(plan_name),
    //   ...(coupon_code ? { "metadata[coupon_code]": String(coupon_code) } : {}),
    // });
    // const resp = await fetch("https://api.stripe.com/v1/payment_intents", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    //     "Content-Type": "application/x-www-form-urlencoded",
    //   },
    //   body,
    //   // basic idempotency
    //   // @ts-ignore deno types allow extra headers
    //   idempotencyKey: crypto.randomUUID(),
    // });
    // const data = await resp.json();
    // if (!resp.ok) {
    //   console.error("Stripe REST error:", data);
    //   return json(resp.status, { error: data.error?.message || "Stripe error" });
    // }
    // return json(200, { client_secret: data.client_secret, status: data.status });
    }
  } catch (err) {
    const { type, code, message } = err || {};
    console.error("create-payment-intent error:", {
      type,
      code,
      message
    });
    if (type === "StripeInvalidRequestError") return json(400, {
      error: message || "Invalid Stripe request"
    });
    return json(500, {
      error: message || "Internal server error"
    });
  }
});
