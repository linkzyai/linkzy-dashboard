// Supabase Edge Function: stripe-webhook
// Handles Stripe webhooks and updates credits in `users` table
// Triggered on `payment_intent.succeeded`
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ---- Env config ----
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_TEST") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY / STRIPE_SECRET_KEY_TEST");
}
if (!STRIPE_WEBHOOK_SECRET) {
  console.error("Missing STRIPE_WEBHOOK_SECRET");
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});
// Service-role client so webhook can update tables regardless of RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
serve(async (req)=>{
  // Stripe sends POST requests with a signed body
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", {
      status: 400
    });
  }
  const rawBody = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    return new Response(`Webhook Error: ${err?.message}`, {
      status: 400
    });
  }
  console.log("✅ Stripe webhook received:", event.type);
  try {
    switch(event.type){
      case "payment_intent.succeeded":
        {
          const paymentIntent = event.data.object;
          
          // Skip if this payment intent is part of a subscription
          // Subscription payments are handled by invoice.payment_succeeded
          if (paymentIntent.invoice) {
            console.log("Payment intent is part of a subscription invoice, skipping (will be handled by invoice.payment_succeeded)");
            break;
          }
          
          const metadata = paymentIntent.metadata || {};
          const userId = metadata.user_id;
          const creditsStr = metadata.credits;
          const planName = metadata.plan_name;
          const couponCode = metadata.coupon_code;
          const amount = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
          const currency = paymentIntent.currency;
          console.log("PI metadata:", metadata);
          if (!userId || !creditsStr) {
            console.warn("Missing user_id or credits in PaymentIntent metadata, skipping credit update");
            break;
          }
          const creditsToAdd = parseInt(creditsStr, 10) || 0;
          if (creditsToAdd <= 0) {
            console.warn("credits metadata is not a positive integer, skipping");
            break;
          }
          // 1) Fetch current user credits
          const { data: userRow, error: userErr } = await supabase.from("users").select("credits").eq("id", userId) // 👈 adjust to your schema if needed
          .single();
          if (userErr) {
            console.error("Error fetching user in webhook:", userErr);
            break; // Still return 200 below so Stripe doesn't retry forever
          }
          const currentCredits = userRow?.credits || 0;
          const newCredits = currentCredits + creditsToAdd;
          // 2) Update user credits
          const { error: updateErr } = await supabase.from("users").update({
            credits: newCredits
          }).eq("id", userId);
          if (updateErr) {
            console.error("Error updating user credits in webhook:", updateErr);
            break;
          }
          console.log(`✅ Updated credits for user ${userId}: ${currentCredits} → ${newCredits}`);
          // 3) (Optional) Log to billing_history
          // Remove or adjust if your table/columns differ
          const { error: historyErr } = await supabase.from("billing_history").insert({
            user_id: userId,
            // plan_name: planName ?? null,
            credits_added: creditsToAdd,
            amount
          });
          if (historyErr) {
            console.error("Error inserting billing_history:", historyErr);
          }
          break;
        }
      
      // NEW: Subscription created (initial setup)
      case "customer.subscription.created":
        {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;
          
          if (!userId) {
            console.warn("Missing user_id in subscription metadata");
            break;
          }
          
          // Determine plan based on price ID
          const priceId = subscription.items.data[0]?.price?.id;
          let plan = 'free';
          if (priceId === 'price_1SXl6mQSsW1OegvZouag6JqJ') plan = 'starter';
          if (priceId === 'price_1SXl77QSsW1OegvZFGKS5Nmk') plan = 'pro';
          
          const { error: subErr } = await supabase.from("users").update({
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan: plan
          }).eq("id", userId);
          
          if (subErr) {
            console.error("Error updating subscription info:", subErr);
          } else {
            console.log(`✅ Subscription created for user ${userId}: ${subscription.id}`);
          }
          break;
        }
      
      // NEW: Invoice payment succeeded (monthly renewal)
      case "invoice.payment_succeeded":
        {
          const invoice = event.data.object;
          
          console.log("📧 Invoice payment succeeded event received");
          console.log("Invoice ID:", invoice.id);
          console.log("Subscription ID:", invoice.subscription);
          console.log("Amount paid:", invoice.amount_paid);
          console.log("Billing reason:", invoice.billing_reason);
          console.log("Invoice object keys:", Object.keys(invoice));
          
          // Debug: Log the full invoice to see what we're getting
          console.log("Full invoice object:", JSON.stringify(invoice, null, 2));
          
          // Only process subscription invoices (not one-time payments)
          if (!invoice.subscription) {
            console.log("⚠️ Invoice is not for a subscription, skipping");
            console.log("This might be a one-time payment or the subscription field is missing");
            break;
          }
          
          // Retrieve subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;
          
          console.log("Subscription metadata:", subscription.metadata);
          console.log("User ID from metadata:", userId);
          
          if (!userId) {
            console.warn("Missing user_id in subscription metadata");
            break;
          }
          
          // Determine credits based on price ID
          const priceId = subscription.items.data[0]?.price?.id;
          console.log("🔍 Price ID from subscription:", priceId);
          
          let creditsToAdd = 0;
          if (priceId === 'price_1SXl6mQSsW1OegvZouag6JqJ') {
            creditsToAdd = 5;  // Starter
            console.log("✅ Matched Starter plan");
          }
          if (priceId === 'price_1SXl77QSsW1OegvZFGKS5Nmk') {
            creditsToAdd = 15; // Pro
            console.log("✅ Matched Pro plan");
          }
          
          if (creditsToAdd === 0) {
            console.warn("⚠️ Unknown price ID, skipping credit addition");
            console.warn("Expected price IDs:");
            console.warn("  Starter: price_1SXl6mQSsW1OegvZouag6JqJ");
            console.warn("  Pro: price_1SXl77QSsW1OegvZFGKS5Nmk");
            console.warn("Received price ID:", priceId);
            break;
          }
          
          // Fetch current credits
          const { data: user, error: userErr } = await supabase
            .from("users")
            .select("credits")
            .eq("id", userId)
            .single();
          
          if (userErr) {
            console.error("Error fetching user:", userErr);
            break;
          }
          
          const currentCredits = user?.credits || 0;
          const newCredits = currentCredits + creditsToAdd;
          
          console.log(`💳 Adding ${creditsToAdd} credits: ${currentCredits} → ${newCredits}`);
          
          // Update credits and subscription status
          const { error: updateErr } = await supabase.from("users").update({
            credits: newCredits,
            subscription_status: 'active',
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }).eq("id", userId);
          
          if (updateErr) {
            console.error("Error updating credits:", updateErr);
            break;
          }
          
          console.log(`✅ Monthly renewal: Added ${creditsToAdd} credits for user ${userId}: ${currentCredits} → ${newCredits}`);
          
          // Log to billing history
          const { error: historyErr } = await supabase.from("billing_history").insert({
            user_id: userId,
            credits_added: creditsToAdd,
            amount: invoice.amount_paid
          });
          
          if (historyErr) {
            console.error("Error inserting billing_history:", historyErr);
          }
          break;
        }
      
      // NEW: Subscription deleted/canceled
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;
          const userId = subscription.metadata?.user_id;
          
          if (!userId) {
            console.warn("Missing user_id in subscription metadata");
            break;
          }
          
          const { error: cancelErr } = await supabase.from("users").update({
            subscription_status: 'none',
            subscription_id: null,
            subscription_cancel_at_period_end: false,
            plan: 'free'
          }).eq("id", userId);
          
          if (cancelErr) {
            console.error("Error canceling subscription:", cancelErr);
          } else {
            console.log(`✅ Subscription canceled for user ${userId}`);
          }
          break;
        }
      
      // NEW: Payment failed
      case "invoice.payment_failed":
        {
          const invoice = event.data.object;
          
          if (!invoice.subscription) {
            break;
          }
          
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;
          
          if (!userId) {
            console.warn("Missing user_id in subscription metadata");
            break;
          }
          
          const { error: failErr } = await supabase.from("users").update({
            subscription_status: 'past_due'
          }).eq("id", userId);
          
          if (failErr) {
            console.error("Error updating failed payment status:", failErr);
          } else {
            console.log(`⚠️ Payment failed for user ${userId}`);
          }
          break;
        }
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Error handling Stripe webhook:", err);
  // In production you might return 500 to make Stripe retry.
  // For now we still ack to avoid infinite retries.
  }
  return new Response(JSON.stringify({
    received: true
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
});
