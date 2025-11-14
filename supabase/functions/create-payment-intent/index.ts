// Supabase Edge Function: create-payment-intent
// POST { amount, currency, description, user_id, user_email, credits, plan_name, coupon_code? }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14";

const cors = {
  "Access-Control-Allow-Origin": "*", // optionally restricted below
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Optional: limit requests to specific origins (comma-separated)
function originAllowed(req: Request): boolean {
  const allow = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!allow.length) return true; // not enforced
  const origin = req.headers.get("Origin") || "";
  return allow.includes(origin);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  // if (!originAllowed(req)) return json(403, { error: "Origin not allowed" });

  // Optional: admin gate (matches your Netlify pattern)
  // const requireAdmin = (Deno.env.get("REQUIRE_ADMIN_FOR_PAYMENTS") || "false").toLowerCase() === "true";
  // if (requireAdmin) {
  //   const headerKey = req.headers.get("X-Admin-Key") || "";
  //   const adminKey = Deno.env.get("ADMIN_API_KEY") || "";
  //   if (!adminKey || headerKey !== adminKey) return json(401, { error: "Admin key required" });
  // }

  try {
    const {
      amount,
      currency = "usd",
      description = "",
      user_id,
      user_email,
      credits,
      plan_name,
      coupon_code, // optional, stored in metadata for reconciliation
    } = await req.json();

    // Basic validation
    if (!Number.isInteger(amount) || amount <= 0) return json(400, { error: "amount (cents) must be a positive integer" });
    if (typeof currency !== "string" || currency.length < 3) return json(400, { error: "currency is required" });
    if (!user_id) return json(400, { error: "user_id is required" });
    if (!credits && credits !== 0) return json(400, { error: "credits is required" });
    if (!plan_name) return json(400, { error: "plan_name is required" });

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const metadata: Record<string, string> = {
      user_id: String(user_id),
      user_email: user_email ?? "",
      credits: String(credits),
      plan_name: String(plan_name),
    };
    if (coupon_code) metadata.coupon_code = String(coupon_code);

    const intent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        description,
        automatic_payment_methods: { enabled: true },
        metadata,
        // (Optional) capture method, statement_descriptor, etc. could be added here
      },
      // Idempotency guards duplicate client retries
      { idempotencyKey: crypto.randomUUID() }
    );

    return json(200, {
      client_secret: intent.client_secret,
      status: intent.status,
    });
  } catch (err: any) {
    // Map common Stripe errors
    const { type, code, message } = err || {};
    console.error("create-payment-intent error:", { type, code, message });
    if (type === "StripeInvalidRequestError") return json(400, { error: message || "Invalid Stripe request" });
    return json(500, { error: message || "Internal server error" });
  }
});
