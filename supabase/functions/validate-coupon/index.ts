// Supabase Edge Function: validate-coupon
// POST { coupon_code }
// Returns coupon validity and discount info

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, prefer",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function originAllowed(req: Request): boolean {
  const allow = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!allow.length) return true;
  const origin = req.headers.get("Origin") || "";
  return allow.includes(origin);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  // if (!originAllowed(req)) return json(403, { error: "Origin not allowed" });

  try {
    const { coupon_code } = await req.json();
    if (!coupon_code || typeof coupon_code !== "string") {
      return json(400, { error: "Coupon code is required" });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    // NOTE:
    // - If you use Promotion Codes (recommended), you'd query `promotionCodes.list({ code: coupon_code, active: true })`
    //   and read `promotionCode.coupon`.
    // - Your Netlify code used `coupons.retrieve(coupon_code)`, so we keep parity here.
    const promoCodes = await stripe.promotionCodes.list({
      code: coupon_code,
      active: true,
      limit: 1,
      expand: ["data.coupon"],
    });

    if (!promoCodes.data.length) {
      return json(200, { valid: false, error: "Invalid discount code" });
    }

    const promo = promoCodes.data[0];
    const coupon = promo.coupon;


    if (coupon.valid) {
      return json(200, {
        valid: true,
        promotion_code_id: promo.id,
        id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency, // only present for amount_off coupons
        duration: coupon.duration,
        name: coupon.name,
      });
    } else {
      return json(200, { valid: false, error: "Coupon is not valid" });
    }
  } catch (err: any) {
    console.error("validate-coupon error:", err);
    // Match your Netlify behavior
    if (err?.type === "StripeInvalidRequestError") {
      return json(400, { error: "Invalid coupon code" });
    }
    return json(500, { error: "Internal server error" });
  }
});
