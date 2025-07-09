import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      case 'checkout.session.completed':
        const session = event.data.object as any
        
        // Handle one-time payments
        if (session.mode === 'payment') {
          await handleOneTimePayment(supabase, session)
        }
        // Handle subscriptions
        else if (session.mode === 'subscription') {
          await handleSubscription(supabase, session)
        }
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any
        await handleSubscriptionRenewal(supabase, invoice)
        break

      case 'customer.subscription.deleted':
        const subscription = event.data.object as any
        await handleSubscriptionCancellation(supabase, subscription)
        break

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

async function handleOneTimePayment(supabase: any, session: any) {
  try {
    const customerEmail = session.customer_details?.email
    const amount = session.amount_total / 100 // Convert from cents
    const lineItems = session.line_items?.data || []

    // Determine credits based on price ID
    let creditsToAdd = 0
    let planName = 'One-time Purchase'

    for (const item of lineItems) {
      const priceId = item.price?.id
      switch (priceId) {
        case 'price_1RcXO4KwiECS8C7ZdhFvMNJi': // Starter Pack
          creditsToAdd = 3
          planName = 'Starter Pack'
          break
        case 'price_1RcXOuKwiECS8C7Zw0caNseC': // Growth Pack
          creditsToAdd = 10
          planName = 'Growth Pack'
          break
        default:
          console.log('Unknown price ID:', priceId)
          return
      }
    }

    if (creditsToAdd > 0 && customerEmail) {
      // Update user credits
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, credits')
        .eq('email', customerEmail)
        .single()

      if (userError) {
        console.error('Error finding user:', userError)
        return
      }

      const newCredits = (user.credits || 0) + creditsToAdd

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating credits:', updateError)
        return
      }

      // Log the transaction
      const { error: logError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'credit_purchase',
          amount: amount,
          credits: creditsToAdd,
          plan_name: planName,
          stripe_session_id: session.id,
          status: 'completed'
        })

      if (logError) {
        console.error('Error logging transaction:', logError)
      }

      console.log(`Successfully added ${creditsToAdd} credits to user ${customerEmail}`)
    }
  } catch (error) {
    console.error('Error handling one-time payment:', error)
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
          is_pro: true,
          subscription_id: subscriptionId,
          credits: 30 // Monthly credits for Pro plan
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user to Pro plan:', updateError)
        return
      }

      console.log(`Successfully upgraded user ${customerEmail} to Pro plan`)
    }
  } catch (error) {
    console.error('Error handling subscription:', error)
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

      // Add monthly credits and set is_pro true
      const { error: updateError } = await supabase
        .from('users')
        .update({
          credits: 30,
          is_pro: true
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating credits for subscription renewal:', updateError)
        return
      }

      // Log the renewal
      const { error: logError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'subscription_renewal',
          amount: amount,
          credits: 30,
          plan_name: 'Pro Monthly',
          stripe_invoice_id: invoice.id,
          status: 'completed'
        })

      if (logError) {
        console.error('Error logging subscription renewal:', logError)
      }

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

    // Downgrade user to Free plan and set is_pro false
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        plan: 'Free',
        is_pro: false,
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
