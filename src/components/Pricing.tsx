import React from 'react';
import { useState } from 'react';
import RegistrationModal from './RegistrationModal';

const Pricing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStripeCheckout = async (priceId: string, isSubscription: boolean = false) => {
    // TEMPORARY: Disable Stripe for testing - show modal instead
    console.log('🧪 SIMULATION: Would start checkout for', priceId);
    alert('💻 SIMULATION MODE\n\nIn production, this would redirect to Stripe checkout.\n\nPrice ID: ' + priceId + '\nType: ' + (isSubscription ? 'subscription' : 'one-time'));
    return;

    /* ORIGINAL STRIPE CODE - TEMPORARILY DISABLED
    try {
      console.log('Starting checkout process...', { priceId });
      
      // Check if Stripe is loaded
      if (typeof window === 'undefined' || !(window as unknown as { Stripe?: any }).Stripe) {
        console.error('Stripe is not loaded');
        alert('Payment system is loading, please try again in a moment.');
        return;
      }

      // Initialize Stripe
      const publishableKey = 'pk_live_51RcWy5KwiECS8C7ZKhnyKm4byhjfpqGXLqhJLFG2lw758joDSmE54Q3jChyWDZhCEHoXz4JRrV2Yt3TVF8xPVcmD00uZyIFyrH';
      const stripe = (window as unknown as { Stripe: (key: string) => any }).Stripe(publishableKey);
      
      if (!stripe) {
        console.error('Failed to initialize Stripe');
        alert('Payment system error, please try again.');
        return;
      }

      console.log('Stripe initialized successfully, redirecting to checkout...');

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        mode: isSubscription ? 'subscription' : 'payment',
        lineItems: [{ price: priceId, quantity: 1 }],
        successUrl: window.location.origin + '/success',
        cancelUrl: window.location.origin + '/cancel'
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        alert('Payment error: ' + error.message + '\n\nPlease check the browser console for more details.');
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.\n\nError details: ' + (err instanceof Error ? err.message : String(err)) + '\n\nCheck browser console for more info.');
    }
    */
  };

  return (
    <>
    <section id="pricing" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            💸 <span className="text-white">Simple, Scalable,</span> <span className="text-orange-500">Fast</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start free, scale as you grow. Perfect for everyone from solopreneurs to agencies.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Try It Free */}
          <div className="bg-black border border-gray-700 rounded-2xl p-6 text-center flex flex-col h-full">
            <div className="text-2xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-3 text-white">Try It Free</h3>
            <div className="text-3xl font-bold mb-4 text-green-400">$0</div>
            <p className="text-gray-300 mb-6 flex-grow">Get 3 backlinks in your niche, no credit card required.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mt-auto"
            >
              Start Free
            </button>
          </div>
          
          {/* Starter */}
          <div className="bg-black border border-gray-700 rounded-2xl p-6 text-center flex flex-col h-full">
            <div className="text-2xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-3 text-white">Starter Pack</h3>
            <div className="text-3xl font-bold mb-4 text-white">$10</div>
            <p className="text-gray-300 mb-6 flex-grow">Perfect for testing – includes 3 high-quality backlinks to get you started</p>
            <button 
              onClick={() => handleStripeCheckout('price_1RcXO4KwiECS8C7ZdhFvMNJi', false)}
              className="w-full py-3 orange-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-auto"
            >
              Buy Now
            </button>
          </div>
          
          {/* Growth */}
          <div className="bg-black border border-gray-700 rounded-2xl p-6 text-center flex flex-col h-full">
            <div className="text-2xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-3 text-white">Growth Pack</h3>
            <div className="text-3xl font-bold mb-4 text-white">$25</div>
            <p className="text-gray-300 mb-6 flex-grow">Great value – includes 10 backlinks with bulk savings</p>
            <button 
              onClick={() => handleStripeCheckout('price_1RcXOuKwiECS8C7Zw0caNseC', false)}
              className="w-full py-3 orange-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-auto"
            >
              Buy Now
            </button>
          </div>
          
          {/* Pro */}
          <div className="bg-black border-2 border-orange-500 rounded-2xl p-6 text-center relative flex flex-col h-full">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                🔥 Popular
              </span>
            </div>
            <div className="text-2xl mb-4">🔥</div>
            <h3 className="text-xl font-bold mb-3 text-white">Pro Monthly</h3>
            <div className="text-3xl font-bold mb-4 text-white">
              $49<span className="text-lg text-gray-400">/mo</span>
            </div>
            <p className="text-gray-300 mb-6 flex-grow">For SEO professionals and agencies – 30 backlinks every month</p>
            <button 
              onClick={() => handleStripeCheckout('price_1RcXPpKwiECS8C7ZsBwHqilS', true)}
              className="w-full py-3 orange-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-auto"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </section>
    
    <RegistrationModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </>
  );
};

export default Pricing;