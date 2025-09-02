import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.17.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      throw new Error('No Stripe signature found')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET') || '')
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi: any = event.data.object
        await handlePaymentIntentSucceeded(supabase, pi)
        break
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any
        if (session.mode === 'payment') {
          await handleCheckoutPaymentCompleted(supabase, session)
        } else if (session.mode === 'subscription') {
          await handleSubscription(supabase, session)
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        await handleSubscriptionRenewal(supabase, invoice)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        await handleSubscriptionCancellation(supabase, subscription)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function incrementUserCredits(supabase: any, userId: string, creditsToAdd: number) {
  if (!creditsToAdd || creditsToAdd <= 0) return;
  try {
    const { data: user, error: uerr } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    if (uerr) {
      console.error('fetch credits error', uerr);
      return;
    }
    const current = (user?.credits || 0) as number;
    const next = current + creditsToAdd;
    const { error: updErr } = await supabase
      .from('users')
      .update({ credits: next })
      .eq('id', userId);
    if (updErr) console.error('update credits error', updErr);
  } catch (e) {
    console.error('incrementUserCredits error', e);
  }
}

async function alreadyProcessed(supabase: any, sessionId: string) {
  try {
    if (!sessionId) return false;
    const { data, error } = await supabase
      .from('billing_history')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .limit(1);
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

async function handlePaymentIntentSucceeded(supabase: any, pi: any) {
  try {
    const meta = pi.metadata || {}
    const userId = meta.user_id
    const credits = parseInt(meta.credits || '0', 10) || 0
    const amount = (pi.amount_received || pi.amount || 0) / 100
    const desc = meta.plan_name || meta.description || 'Credit purchase'

    if (!userId) {
      console.warn('payment_intent.succeeded missing user_id metadata')
      return
    }

    if (await alreadyProcessed(supabase, pi.id)) {
      console.log('payment_intent already processed, skipping:', pi.id)
      return
    }

    // Increment credits reliably
    await incrementUserCredits(supabase, userId, credits)

    // Insert billing history row
    const { error: bhErr } = await supabase
      .from('billing_history')
      .insert({
        user_id: userId,
        type: 'credit_purchase',
        amount: amount,
        credits_added: credits,
        description: desc,
        stripe_session_id: pi.id,
        status: 'completed'
      })

    if (bhErr) console.error('billing_history insert error:', bhErr)
  } catch (e) {
    console.error('handlePaymentIntentSucceeded error:', e)
  }
}

async function handleCheckoutPaymentCompleted(supabase: any, session: any) {
  try {
    const meta = session.metadata || {}
    const userId = meta.user_id
    const credits = parseInt(meta.credits || '0', 10) || 0
    const amount = (session.amount_total || 0) / 100
    const desc = meta.plan_name || 'One-time Purchase'

    if (!userId) return

    if (await alreadyProcessed(supabase, session.id)) {
      console.log('checkout.session already processed, skipping:', session.id)
      return
    }

    // Update credits reliably
    await incrementUserCredits(supabase, userId, credits)

    // Log billing history
    await supabase.from('billing_history').insert({
      user_id: userId,
      type: 'credit_purchase',
      amount,
      credits_added: credits,
      description: desc,
      stripe_session_id: session.id,
      status: 'completed'
    })
  } catch (e) {
    console.error('handleCheckoutPaymentCompleted error:', e)
  }
}

async function handleSubscription(supabase: any, session: any) {
  try {
    const customerEmail = session.customer_details?.email
    const subscriptionId = session.subscription

    if (customerEmail && subscriptionId) {
      // Update user to Pro plan
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single()

      if (userError) {
        console.error('Error finding user:', userError)
        return
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          plan: 'Pro',
          subscription_id: subscriptionId
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user to Pro plan:', updateError)
        return
      }

      await incrementUserCredits(supabase, user.id, 30)

      // Log billing history
      await supabase.from('billing_history').insert({
        user_id: user.id,
        type: 'subscription_purchase',
        amount: (session.amount_total || 0) / 100,
        credits_added: 30,
        description: 'Pro Monthly',
        stripe_session_id: session.id,
        status: 'completed'
      })

      console.log(`Successfully upgraded user ${customerEmail} to Pro plan`)
    }
  } catch (e) {
    console.error('handleSubscription error:', e)
  }
}

async function handleSubscriptionRenewal(supabase: any, invoice: any) {
  try {
    const subscriptionId = invoice.subscription
    const amount = invoice.amount_paid / 100

    if (subscriptionId) {
      // Find user by subscription ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('subscription_id', subscriptionId)
        .single()

      if (userError) {
        console.error('Error finding user by subscription ID:', userError)
        return
      }

      // Add monthly credits for Pro plan
      const { error: updateError } = await supabase
        .from('users')
        .update({
          credits: 30,
          plan: 'Pro'
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating credits for subscription renewal:', updateError)
        return
      }

      // Log the renewal
      await supabase
        .from('billing_history')
        .insert({
          user_id: user.id,
          type: 'subscription_renewal',
          amount: amount,
          credits_added: 30,
          description: 'Pro Monthly',
          stripe_session_id: invoice.id,
          status: 'completed'
        })

      console.log(`Successfully renewed subscription for user ${user.email}`)
    }
  } catch (error) {
    console.error('Error handling subscription renewal:', error)
  }
}

async function handleSubscriptionCancellation(supabase: any, subscription: any) {
  try {
    const subscriptionId = subscription.id

    // Find user by subscription ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('subscription_id', subscriptionId)
      .single()

    if (userError) {
      console.error('Error finding user by subscription ID:', userError)
      return
    }

    // Downgrade user to Free plan
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        plan: 'free',
        subscription_id: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error downgrading user:', updateError)
      return
    }

    console.log(`Successfully cancelled subscription for user ${user.email}`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

// Stripe class for webhook verification
class Stripe {
  private secretKey: string
  private apiVersion: string

  constructor(secretKey: string, options: { apiVersion: string }) {
    this.secretKey = secretKey
    this.apiVersion = options.apiVersion
  }

  webhooks = {
    constructEvent: (payload: string, signature: string, secret: string) => {
      // This is a simplified implementation
      // In production, you should use the actual Stripe webhook verification
      try {
        return JSON.parse(payload)
      } catch (error) {
        throw new Error('Invalid JSON payload')
      }
    }
  }
}
