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
const PRICE_ID_STARTER = Deno.env.get("STRIPE_PRICE_STARTER") || "";
const PRICE_ID_PRO = Deno.env.get("STRIPE_PRICE_PRO") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY / STRIPE_SECRET_KEY_TEST");
}
if (!STRIPE_WEBHOOK_SECRET) {
  console.error("Missing STRIPE_WEBHOOK_SECRET");
}
if (!PRICE_ID_STARTER) console.error("Missing STRIPE_PRICE_STARTER env var");
if (!PRICE_ID_PRO) console.error("Missing STRIPE_PRICE_PRO env var");
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
serve(async (req) => {
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
    switch (event.type) {
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
          // const amount = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
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
          const amountCents =
            paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
          const amount = amountCents / 100; // store in dollars; or keep cents if you prefer

          const { error: historyErr } = await supabase
            .from("billing_history")
            .insert({
              user_id: userId,
              type: "one_time", // 🔴 required
              amount,           // numeric
              credits_added: creditsToAdd,
              description: planName
                ? `${planName} - ${creditsToAdd} credits (one-time payment)`
                : `${creditsToAdd} credits (one-time payment)`,
              stripe_session_id: paymentIntent.id, // reuse this column for PI ID
              // status will default to 'completed'
            });

          if (historyErr) {
            console.error("Error inserting billing_history (one-time):", historyErr);
          }

          break;
        }
      // NEW: Subscription created (initial setup)
      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.warn("Missing user_id in subscription metadata");
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id;
        let plan = "free";
        if (priceId === PRICE_ID_STARTER) plan = "starter";
        if (priceId === PRICE_ID_PRO) plan = "pro";

        const periodEndIso = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const { error: subErr } = await supabase
          .from("users")
          .update({
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_current_period_end: periodEndIso,
            plan,
          })
          .eq("id", userId);

        if (subErr) {
          console.error("Error updating subscription info:", subErr);
        } else {
          console.log(`✅ Subscription created for user ${userId}: ${subscription.id}`);
        }
        break;
      }

      // NEW: Invoice payment succeeded (monthly renewal)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;

        console.log("📧 Invoice payment succeeded event received");
        console.log("Invoice ID:", invoice.id);
        console.log("Billing reason:", invoice.billing_reason);

        // Try to get subscription ID & metadata from different shapes
        let subscriptionId: string | undefined =
          (invoice.subscription as string | undefined) ?? undefined;

        let userId: string | undefined;
        let priceId: string | undefined;

        // 1) New shape: subscription details under invoice.parent.subscription_details
        if (!subscriptionId && invoice.parent?.subscription_details) {
          const details = invoice.parent.subscription_details;
          subscriptionId = details.subscription as string | undefined;
          userId = details.metadata?.user_id as string | undefined;
          priceId = details.metadata?.price_id as string | undefined;

          console.log("Using invoice.parent.subscription_details:", {
            subscriptionId,
            userId,
            priceIdFromMetadata: priceId,
          });

          // If price_id not in metadata, fall back to line item pricing
          if (!priceId && invoice.lines?.data?.length) {
            const line = invoice.lines.data[0];
            // For API 2023-10-16, price info may be nested under pricing.price_details.price
            priceId =
              line?.pricing?.price_details?.price ||
              line?.price?.id || // fallback if available
              undefined;
            console.log("Price ID from line item:", priceId);
          }
        }

        // 2) Old / classic shape: invoice.subscription is set, metadata lives on the Subscription
        if (subscriptionId && !userId) {
          console.log("Fetching subscription from Stripe:", subscriptionId);
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId as string
          );

          userId = subscription.metadata?.user_id as string | undefined;
          priceId = subscription.items.data[0]?.price?.id as string | undefined;

          console.log("Subscription metadata:", {
            userId,
            priceId,
            status: subscription.status,
          });
        }

        if (!subscriptionId) {
          console.log("⚠️ No subscription ID found on invoice, skipping.");
          break;
        }

        if (!userId) {
          console.warn(
            "⚠️ Missing user_id in subscription/invoice metadata, cannot credit user."
          );
          break;
        }

        if (!priceId) {
          console.warn("⚠️ Missing price_id, cannot determine credits to add.");
          break;
        }

        // Map priceId -> credits
        let creditsToAdd = 0;
        let plan = "free";
        if (priceId === PRICE_ID_STARTER) {
          creditsToAdd = 5; // Starter
          plan = "starter";
        } else if (priceId === PRICE_ID_PRO) {
          creditsToAdd = 15; // Pro
          plan = "pro";
        } else {
          console.warn("⚠️ Unknown price ID, skipping credit addition:", priceId);
          break;
        }

        // Fetch current credits
        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        if (userErr) {
          console.error("Error fetching user in invoice handler:", userErr);
          break;
        }

        const currentCredits = userRow?.credits || 0;
        const newCredits = currentCredits + creditsToAdd;

        console.log(
          `💳 Adding ${creditsToAdd} credits for user ${userId}: ${currentCredits} → ${newCredits}`
        );

        // Update credits + subscription status
        const { error: updateErr } = await supabase
          .from("users")
          .update({
            credits: newCredits,
            subscription_status: "active",
            // If you want, also update period end (guarded!)
            subscription_current_period_end:
              invoice.lines?.data?.[0]?.period?.end
                ? new Date(
                  invoice.lines.data[0].period.end * 1000
                ).toISOString()
                : null,
          })
          .eq("id", userId);

        if (updateErr) {
          console.error("Error updating credits:", updateErr);
          break;
        }

        // Log billing history
        const amount = (invoice.amount_paid ?? 0) / 100; // dollars

        // Decide whether this is first payment or renewal
        const billingReason = invoice.billing_reason; // 'subscription_create', 'subscription_cycle', etc.
        const isFirstPayment = billingReason === "subscription_create";

        const { error: historyErr } = await supabase
          .from("billing_history")
          .insert({
            user_id: userId,
            type: isFirstPayment ? "subscription_create" : "subscription_renewal", // 🔴 required
            amount,
            credits_added: creditsToAdd,  // 5 or 15 in your logs
            description: isFirstPayment
              ? `${creditsToAdd} credits - new ${plan} subscription`
              : `${creditsToAdd} credits - ${plan} renewal`,
            stripe_session_id: invoice.id, // store invoice id here
            // status uses default 'completed'
          });

        if (historyErr) {
          console.error("Error inserting billing_history (subscription):", historyErr);
        }

        console.log(
          `✅ Monthly renewal: Added ${creditsToAdd} credits for user ${userId}`
        );

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
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
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
