const { corsHeaders, json, isAdmin, checkOrigin } = require('./_utils');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  if (!checkOrigin(event)) return json(403,{error:'Origin not allowed'});
  // Optional: require admin for now to avoid abuse in test mode
  if (process.env.REQUIRE_ADMIN_FOR_PAYMENTS === 'true' && !isAdmin(event)) return json(401,{error:'Admin key required'});

  try {
    const { amount, currency, description, user_id, user_email, credits, plan_name, coupon_code } = JSON.parse(event.body);

    const paymentIntentConfig = {
      amount: amount,
      currency: currency,
      automatic_payment_methods: { enabled: true },
      description: description,
      metadata: {
        user_id: user_id,
        credits: credits?.toString?.() || String(credits || ''),
        plan_name: plan_name,
        user_email: user_email,
      },
      return_url: `${process.env.VITE_SITE_URL || 'https://linkzy.ai'}/dashboard`,
    };

    if (coupon_code) paymentIntentConfig.metadata.coupon_code = coupon_code;

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return json(200,{ client_secret: paymentIntent.client_secret, status: paymentIntent.status });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json(500,{ error: error.message });
  }
}; 