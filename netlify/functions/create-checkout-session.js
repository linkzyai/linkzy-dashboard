const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { 
      plan_name, 
      credits, 
      price, 
      user_id, 
      user_email, 
      success_url, 
      cancel_url,
      promotion_code_id,
      coupon_code
    } = JSON.parse(event.body);

    // 🔴 CRITICAL: Check if user has already used this coupon
    if (coupon_code) {
      const { data: previousUsage, error: usageError } = await supabase
        .from('billing_history')
        .select('id')
        .eq('user_id', user_id)
        .ilike('description', `%${coupon_code}%`)
        .limit(1);

      if (usageError) {
        console.error('Error checking coupon usage:', usageError);
      }

      if (previousUsage && previousUsage.length > 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
          body: JSON.stringify({ 
            error: 'You have already used this coupon code.' 
          }),
        };
      }
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan_name,
              description: `${credits} Credits for Linkzy AI`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user_email,
      metadata: {
        user_id: user_id,
        credits: credits.toString(),
        plan_name: plan_name,
        coupon_code: coupon_code || '',
      },
    };

    if (promotion_code_id) {
      sessionConfig.discounts = [{ promotion_code: promotion_code_id }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
