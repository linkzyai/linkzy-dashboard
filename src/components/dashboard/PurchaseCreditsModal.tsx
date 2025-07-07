import React, { useState } from 'react';
import { X, CreditCard, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  currentPlan: string;
}

const PurchaseCreditsModal: React.FC<PurchaseCreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  currentPlan
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 3,
      price: 10,
      priceId: 'price_1RcXO4KwiECS8C7ZdhFvMNJi',
      isSubscription: false,
      description: 'Perfect for testing – includes 3 high-quality backlinks',
      features: ['3 high-quality backlinks', 'One-time payment', 'No commitment'],
      popular: false
    },
    {
      id: 'growth',
      name: 'Growth Pack',
      credits: 10,
      price: 25,
      priceId: 'price_1RcXOuKwiECS8C7Zw0caNseC',
      isSubscription: false,
      description: 'Great value – includes 10 backlinks with bulk savings',
      features: ['10 high-quality backlinks', 'Bulk discount', 'One-time payment'],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro Monthly',
      credits: 30,
      price: 49,
      priceId: 'price_1RcXPpKwiECS8C7ZsBwHqilS',
      isSubscription: true,
      description: 'For SEO professionals and agencies – 30 backlinks every month',
      features: ['30 backlinks monthly', 'Priority support', 'Advanced analytics', 'Cancel anytime'],
      popular: false
    }
  ];

  const handleStripeCheckout = async (priceId: string, isSubscription: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting checkout process...', { priceId, isSubscription });
      
      // Check if Stripe is loaded
      if (typeof window === 'undefined' || !(window as unknown as { Stripe?: any }).Stripe) {
        console.error('Stripe is not loaded');
        setError('Payment system is loading, please try again in a moment.');
        return;
      }

      // Initialize Stripe
      const publishableKey = 'pk_live_51RcWy5KwiECS8C7ZKhnyKm4byhjfpqGXLqhJLFG2lw758joDSmE54Q3jChyWDZhCEHoXz4JRrV2Yt3TVF8xPVcmD00uZyIFyrH';
      const stripe = (window as unknown as { Stripe: (key: string) => any }).Stripe(publishableKey);
      
      if (!stripe) {
        console.error('Failed to initialize Stripe');
        setError('Payment system error, please try again.');
        return;
      }

      console.log('Stripe initialized successfully, redirecting to checkout...');

      // Redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        mode: isSubscription ? 'subscription' : 'payment',
        lineItems: [{ price: priceId, quantity: 1 }],
        successUrl: window.location.origin + '/dashboard/account?success=true',
        cancelUrl: window.location.origin + '/dashboard/account?canceled=true'
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        setError('Payment error: ' + error.message);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
  };

  const handlePurchase = () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue.');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (plan) {
      handleStripeCheckout(plan.priceId, plan.isSubscription);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Purchase Credits</h2>
            <p className="text-gray-400 mt-1">Choose a plan that fits your needs</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Status */}
        <div className="p-6 border-b border-gray-700">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">Current Credits</p>
                <p className="text-2xl font-bold text-orange-400">{currentCredits}</p>
              </div>
              <div>
                <p className="text-gray-300">Current Plan</p>
                <p className="text-lg font-semibold text-white">{currentPlan}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      🔥 Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {plan.id === 'starter' && '🚀'}
                    {plan.id === 'growth' && '📈'}
                    {plan.id === 'pro' && '🔥'}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-white mb-1">
                    ${plan.price}
                    {plan.isSubscription && <span className="text-lg text-gray-400">/mo</span>}
                  </div>
                  <p className="text-orange-400 font-semibold mb-4">{plan.credits} Credits</p>
                  <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                  
                  <ul className="text-left space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={!selectedPlan || isLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Purchase Credits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCreditsModal; 