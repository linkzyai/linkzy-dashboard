const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { amount, currency, payment_method_id, description, user_id, user_email, credits, plan_name, coupon_code } = JSON.parse(event.body);

    // Create payment intent configuration
    const paymentIntentConfig = {
      amount: amount, // Already in cents
      currency: currency,
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      description: description,
      metadata: {
        user_id: user_id,
        credits: credits.toString(),
        plan_name: plan_name,
        user_email: user_email,
      },
      return_url: `${process.env.VITE_SITE_URL || 'https://linkzy.ai'}/dashboard`,
    };

    // Add coupon if provided
    if (coupon_code) {
      paymentIntentConfig.metadata.coupon_code = coupon_code;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status 
      }),
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 