import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { price_id, user_id, user_email, promotion_code_id } = await req.json();

    if (!price_id || !user_id || !user_email) {
      throw new Error('Missing required parameters');
    }

    // Check if customer exists
    const existingCustomers = await stripe.customers.list({
      email: user_email,
      limit: 1
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      // Customer exists, use existing customer ID
      customerId = existingCustomers.data[0].id;
      console.log(`Using existing customer: ${customerId}`);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          user_id
        }
      });
      customerId = customer.id;
      console.log(`Created new customer: ${customerId}`);
    }

    // Build subscription configuration
    const subscriptionConfig: any = {
      customer: customerId,
      items: [
        {
          price: price_id
        }
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: [
        'latest_invoice.payment_intent'
      ],
      metadata: {
        user_id,
        price_id
      }
    };

    // Apply discount if promotion code was provided
    if (promotion_code_id) {
      subscriptionConfig.discounts = [{ promotion_code: promotion_code_id }];
      console.log(`Applying promotion code: ${promotion_code_id}`);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionConfig);

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Handle $0 subscriptions (no payment intent when 100% off)
    // When a subscription is free, Stripe doesn't create a payment intent
    const clientSecret = paymentIntent?.client_secret || null;

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        customerId: customerId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});