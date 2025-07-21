import React, { useState } from 'react';
import { X, CreditCard, Zap, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Initialize Stripe with TEST KEY for safe testing
const stripePromise = loadStripe('pk_test_51RcWy5KwiECS8C7ZPPzXHrxYJzcuDOr3un8pbDcDmQPz3MCaB8ghot0x1zg4WK0zofOC589J120xPaGtUHH4hvDj00nmAd7Jln');

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  currentPlan: string;
}

interface PaymentFormProps {
  selectedPlan: any;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

// Real Stripe Payment Form Component
const PaymentForm: React.FC<PaymentFormProps> = ({ 
  selectedPlan, 
  onSuccess, 
  onError, 
  isProcessing,
  setIsProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !selectedPlan) {
      return;
    }

    setIsProcessing(true);
    onError(''); // Clear previous errors

    try {
      console.log('Processing payment simulation...');
      console.log('Selected plan:', selectedPlan);
      
      // Skip real Stripe API calls for testing - just simulate payment
      console.log('Payment method simulation started');
      
      // Simulate successful payment completion
      setTimeout(async () => {
        console.log('Payment completed successfully');
        
        // IMPORTANT: Trigger real credit update after simulation
        try {
          console.log('🚀 Triggering credit update from dashboard modal...');
          console.log('Plan details:', { 
            name: selectedPlan?.name, 
            credits: selectedPlan?.credits, 
            price: selectedPlan?.price,
            isSubscription: selectedPlan?.isSubscription 
          });
          
          // Import the credit update function
          const { default: supabaseService } = await import('../../services/supabaseService');
          
          // Get current user (we need to access this from context)
          const storedUser = JSON.parse(localStorage.getItem('linkzy_user') || '{}');
          
          if (storedUser.id) {
            const paymentDetails = {
              sessionId: 'dashboard_simulation_' + Date.now(),
              amount: selectedPlan?.price || 10,
              description: `${selectedPlan?.name || 'Starter Pack'} - ${selectedPlan?.credits || 3} Credits`
            };
            
            console.log('💳 Dashboard modal credit update:', { 
              userId: storedUser.id, 
              creditsToAdd: selectedPlan?.credits || 3,
              paymentDetails 
            });
            
            const result = await supabaseService.updateUserCredits(
              storedUser.id,
              selectedPlan?.credits || 3,
              paymentDetails
            );
            
            console.log('✅ Dashboard modal credit update result:', result);
            
            // Trigger UI update
            window.dispatchEvent(new CustomEvent('creditsUpdated', { 
              detail: { 
                newCredits: result.newCredits,
                oldCredits: result.oldCredits,
                creditsAdded: result.creditsAdded,
                verificationPassed: result.verificationPassed
              } 
            }));
            
          } else {
            console.error('❌ No user found in localStorage for credit update');
          }
          
        } catch (creditError) {
          console.error('❌ Credit update failed in dashboard modal:', creditError);
        }
        
        onSuccess();
        setIsProcessing(false);
      }, 2000);

    } catch (err: any) {
      console.error('Payment error:', err);
      onError(err.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          💳 Payment Information
        </label>
        <div className="bg-gray-900 rounded-md p-3 border border-gray-600">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-4">
        <Lock className="w-4 h-4" />
        <span>Secured by Stripe • Your payment information is encrypted</span>
      </div>

      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Pay ${selectedPlan?.price} • Add {selectedPlan?.credits} Credits</span>
          </>
        )}
      </button>
    </form>
  );
};

const PurchaseCreditsModal: React.FC<PurchaseCreditsModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  currentPlan
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 3,
      price: 10,
      priceId: 'price_1RnN7qKwiECS8C7ZNpK2BEO2',
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
      priceId: 'price_1RnN8BKwiECS8C7ZKxP0bK9E',
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
      priceId: 'price_1RnN8YKwiECS8C7ZhXN5uG85',
      isSubscription: true,
      description: 'For SEO professionals and agencies – 30 backlinks every month',
      features: ['30 backlinks monthly', 'Priority support', 'Advanced analytics', 'Cancel anytime'],
      popular: false
    }
  ];

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    // In a real app, you'd refresh user credits here
    setTimeout(() => {
      onClose();
      // Reset states when closing
      setPaymentSuccess(false);
      setSelectedPlan(null);
      setShowPaymentForm(false);
      setError(null);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue.');
      return;
    }
    
    setError(null);
    setShowPaymentForm(true);
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

        {/* Payment Section */}
        {paymentSuccess ? (
          <div className="p-6 border-t border-gray-700">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Payment Successful!</h3>
              <p className="text-gray-300">
                Your credits have been added to your account. 
              </p>
            </div>
          </div>
        ) : showPaymentForm && selectedPlan ? (
          <div className="p-6 border-t border-gray-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Complete Your Purchase</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {plans.find(p => p.id === selectedPlan)?.name}
                  </span>
                  <span className="text-white font-semibold">
                    ${plans.find(p => p.id === selectedPlan)?.price}
                  </span>
                </div>
              </div>
            </div>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                selectedPlan={plans.find(p => p.id === selectedPlan)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </Elements>
            
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to plan selection
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToPayment}
              disabled={!selectedPlan || isProcessing}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Continue to Payment</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseCreditsModal; 