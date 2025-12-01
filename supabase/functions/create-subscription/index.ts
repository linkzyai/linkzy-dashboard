// Supabase Edge Function: create-subscription
// Creates a Stripe subscription for recurring monthly billing
// POST { price_id, user_id, user_email }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { price_id, user_id, user_email } = await req.json();

    // Validation
    if (!price_id) return json(400, { error: "price_id is required" });
    if (!user_id) return json(400, { error: "user_id is required" });
    if (!user_email) return json(400, { error: "user_email is required" });

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase configuration missing" });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16"
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // 1. Get or create Stripe customer
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user_id)
      .single();

    if (userErr) {
      console.error("Error fetching user:", userErr);
      return json(404, { error: "User not found" });
    }

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      console.log(`Creating new Stripe customer for user ${user_id}`);
      const customer = await stripe.customers.create({
        email: user_email,
        metadata: { user_id }
      });
      customerId = customer.id;

      // Save customer ID to database
      const { error: updateErr } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);

      if (updateErr) {
        console.error("Error saving customer ID:", updateErr);
      }
    }

    console.log(`Creating subscription for customer ${customerId} with price ${price_id}`);

    // 2. Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price_id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { 
        user_id,
        price_id 
      }
    });

    console.log(`Subscription created: ${subscription.id}`);

    // 3. Update user record with subscription info
    const { error: subUpdateErr } = await supabase
      .from('users')
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user_id);

    if (subUpdateErr) {
      console.error("Error updating subscription info:", subUpdateErr);
    }

    // Extract client secret from the payment intent
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    return json(200, {
      subscription_id: subscription.id,
      client_secret: paymentIntent.client_secret,
      status: subscription.status
    });

  } catch (err: any) {
    console.error("create-subscription error:", err);
    if (err?.type === "StripeInvalidRequestError") {
      return json(400, { error: err.message || "Invalid Stripe request" });
    }
    return json(500, { error: err.message || "Internal server error" });
  }
});
