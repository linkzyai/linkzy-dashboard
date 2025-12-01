// functions/create-payment-intent/index.ts
// Supabase Edge Function: create-payment-intent
// POST { currency, description, user_id, user_email, credits, plan_name, coupon_code? }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'https://esm.sh/stripe@14?target=denonext';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });

// Hardcoded prices to prevent client-side manipulation
// keys match the 'plan_name' sent from client
const PRICES: Record<string, number> = {
  "Starter Pack": 1000, // $10.00
  "Growth Pack": 2500,  // $25.00
  "Pro Monthly": 4900,  // $49.00
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    // IGNORE 'amount' from client to prevent manipulation
    const { currency = "usd", description = "", user_id, user_email, credits, plan_name, coupon_code } = await req.json();

    // Basic validation
    if (typeof currency !== "string" || currency.length < 3) return json(400, { error: "currency is required" });
    if (!user_id) return json(400, { error: "user_id is required" });
    if (credits === undefined || credits === null) return json(400, { error: "credits is required" });
    if (!plan_name) return json(400, { error: "plan_name is required" });

    // 1. Determine Base Price
    let amount = PRICES[plan_name];
    if (!amount) {
      console.error(`Invalid plan name received: ${plan_name}`);
      return json(400, { error: "Invalid plan selected" });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16"
    });

    // 2. Apply Coupon (if provided)
    if (coupon_code) {
      try {
        const coupon = await stripe.coupons.retrieve(coupon_code);
        if (coupon && coupon.valid) {
          if (coupon.percent_off) {
            amount = Math.round(amount * (1 - coupon.percent_off / 100));
          } else if (coupon.amount_off) {
            amount = Math.max(0, amount - coupon.amount_off);
          }
        }
      } catch (e) {
        console.warn("Invalid or expired coupon provided:", coupon_code, e);
        // Optionally return error, or just ignore invalid coupon and charge full price
        // For better UX, let's return an error so they know the code didn't work
        return json(400, { error: "Invalid discount code" });
      }
    }

    console.log(`Creating PaymentIntent: ${plan_name} ($${amount/100}) for user ${user_id}`);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || `${plan_name} - ${credits} Credits`,
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        user_id: String(user_id),
        user_email: user_email ?? "",
        credits: String(credits),
        plan_name: String(plan_name),
        ...(coupon_code ? { coupon_code: String(coupon_code) } : {})
      }
    }, {
      idempotencyKey: crypto.randomUUID()
    });

    return json(200, {
      client_secret: intent.client_secret,
      status: intent.status
    });

  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    if (err?.type === "StripeInvalidRequestError") {
      return json(400, { error: err.message || "Invalid Stripe request" });
    }
    return json(500, { error: err.message || "Internal server error" });
  }
});
