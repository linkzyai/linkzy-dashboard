const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST' ) {
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
      promotion_code_id // ← NEW: accept promotion code from frontend
    } = JSON.parse(event.body);

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
      },
    };

    // Apply discount if promotion code was provided
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
