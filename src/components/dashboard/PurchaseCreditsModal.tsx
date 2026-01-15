import React, { useState } from "react";
import { X, CreditCard, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

// Stripe publishable key from environment
import { ENV } from "../../config/env";

const stripePromise = loadStripe(ENV.STRIPE_PUBLISHABLE_KEY);

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  currentPlan: string;
}

interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceId: string;
  isSubscription: boolean;
  description: string;
  features: string[];
  popular: boolean;
}

interface PaymentFormProps {
  selectedPlan: Plan;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

// Shared plans (no need to recreate on every render)
const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Plan",
    credits: 3,
    price: 0,
    priceId: "",
    isSubscription: false,
    description: "Get started with 3 free credits on signup",
    features: [
      "3 credits on signup",
      "No payment required",
      "Perfect for testing"
    ],
    popular: false,
  },
  {
    id: "starter",
    name: "Starter Plan",
    credits: 5,
    price: 19,
    priceId: ENV.STRIPE_PRICE_STARTER,
    isSubscription: true,
    description: "Perfect for small businesses – 5 credits every month",
    features: [
      "5 credits monthly",
      "Automatic renewal",
      "Cancel anytime"
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro Plan",
    credits: 15,
    price: 29,
    priceId: ENV.STRIPE_PRICE_PRO,
    isSubscription: true,
    description: "For growing businesses – 15 credits every month",
    features: [
      "15 credits monthly",
      "Priority support",
      "Automatic renewal",
      "Cancel anytime"
    ],
    popular: true,
  },
];

// Helper: after payment, wait for webhook to update credits, then dispatch event
async function syncCreditsAfterPayment(creditsToAdd: number) {
  const { default: supabaseService } = await import(
    "../../services/supabaseService"
  );

  const preStatus = await supabaseService.getAuthStatus();
  if (!preStatus.user) {
    throw new Error("User not found during credit polling");
  }

  const originalCredits = preStatus.user.credits || 0;
  const expectedCredits = originalCredits + creditsToAdd;

  let freshCredits = originalCredits;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts && freshCredits < expectedCredits) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const freshStatus = await supabaseService.getAuthStatus();
      freshCredits = freshStatus.user?.credits || 0;
      if (freshCredits >= expectedCredits) break;
    } catch {
      // ignore polling error & retry
    }
    attempts++;
  }

  const finalStatus = await supabaseService.getAuthStatus();
  const finalCredits = finalStatus.user?.credits ?? originalCredits;

  window.dispatchEvent(
    new CustomEvent("creditsUpdated", {
      detail: {
        newCredits: finalCredits,
        oldCredits: originalCredits,
        creditsAdded: creditsToAdd,
        verificationPassed: true,
      },
    })
  );
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedPlan,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user: authUser } = useAuth();

  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{
    code: string;
    amount_off?: number;
    percent_off?: number;
    promotion_code_id?: string;
    valid: boolean;
  } | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  // Validate discount via Supabase Edge Function
  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setDiscountApplied(null);
      return;
    }

    setCheckingDiscount(true);
    try {
      const { data: couponData, error } = await supabase.functions.invoke(
        "validate-coupon",
        {
          body: { coupon_code: code },
        }
      );

      if (!error && couponData) {
        setDiscountApplied({
          code,
          amount_off: couponData.amount_off,
          percent_off: couponData.percent_off,
          promotion_code_id: couponData.promotion_code_id,
          valid: true,
        });
      } else {
        setDiscountApplied({ code, valid: false });
      }
    } catch (err) {
      console.error("Error validating discount code:", err);
      setDiscountApplied({ code, valid: false });
    } finally {
      setCheckingDiscount(false);
    }
  };

  const getDiscountedPrice = () => {
    if (!discountApplied?.valid || !selectedPlan) {
      return selectedPlan?.price || 0;
    }

    if (discountApplied.percent_off) {
      return selectedPlan.price * (1 - discountApplied.percent_off / 100);
    }

    if (discountApplied.amount_off) {
      // Stripe amount_off is in cents
      return Math.max(0, selectedPlan.price - discountApplied.amount_off / 100);
    }

    return selectedPlan.price;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !selectedPlan) return;

    if (!authUser?.id) {
      onError("User not authenticated. Please log in and try again.");
      return;
    }

    setIsProcessing(true);
    onError("");

    try {
      // Prefer auth user; fall back to local storage if needed
      const localUser = JSON.parse(localStorage.getItem("linkzy_user") || "{}");
      const userId = authUser.id || localUser.id;
      const userEmail = authUser.email || localUser.email;

      if (!userId || !userEmail) {
        throw new Error("Missing user information for payment.");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found.");
      }

      // Check if this is a subscription or one-time payment
      if (selectedPlan.isSubscription) {
        // SUBSCRIPTION FLOW: Call create-subscription endpoint
        const { data: subData, error: subErr } = await supabase.functions.invoke(
          "create-subscription",
          {
            body: {
              price_id: selectedPlan.priceId,
              user_id: userId,
              user_email: userEmail,
              promotion_code_id: discountApplied?.valid ? discountApplied.promotion_code_id : undefined,
            },
          }
        );

        if (subErr || !subData?.client_secret) {
          throw new Error(
            subErr?.message || "Failed to create subscription."
          );
        }

        const clientSecret = subData.client_secret as string;

        // Confirm the subscription payment
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                email: userEmail,
              },
            },
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        // For subscriptions, credits are added by webhook
        console.log("✅ Subscription created successfully");
        
      } else {
        // ONE-TIME PAYMENT FLOW: Call create-payment-intent endpoint
        const { data: intent, error: intentErr } =
          await supabase.functions.invoke("create-payment-intent", {
            body: {
              amount: Math.round(getDiscountedPrice() * 100),
              currency: "usd",
              description: `${selectedPlan.name} - ${
                selectedPlan.credits
              } Credits${
                discountApplied?.valid ? ` (${discountApplied.code} applied)` : ""
              }`,
              user_id: userId,
              user_email: userEmail,
              credits: selectedPlan.credits,
              plan_name: selectedPlan.name,
              coupon_code: discountApplied?.valid
                ? discountApplied.code
                : undefined,
            },
          });

        if (intentErr || !intent?.client_secret) {
          throw new Error(
            intentErr?.message || "Failed to create payment intent."
          );
        }

        const clientSecret = intent.client_secret as string;

        // Confirm card payment with Stripe
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                email: userEmail,
              },
            },
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        // Let webhook update credits, then sync them into UI
        try {
          await syncCreditsAfterPayment(selectedPlan.credits);
        } catch (syncErr) {
          console.error("Credit sync error:", syncErr);
          // Not fatal: payment succeeded, UI just won't auto-refresh credits nicely
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error("Payment error:", err);
      onError(err?.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
      sessionStorage.removeItem("linkzy_payment_processing");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          💳 Payment Information
        </label>
        <div className="bg-gray-900 rounded-md p-3 border border-gray-600">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#ffffff",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Discount */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🎟️ Discount Code (Optional)
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="Enter discount code"
            className="flex-1 bg-gray-900 rounded-md p-3 border border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => validateDiscountCode(discountCode)}
            disabled={checkingDiscount || !discountCode.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-md transition-colors"
          >
            {checkingDiscount ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              "Apply"
            )}
          </button>
        </div>

        {discountApplied && (
          <div
            className={`mt-2 text-sm ${
              discountApplied.valid ? "text-green-400" : "text-red-400"
            }`}
          >
            {discountApplied.valid ? (
              <div className="flex items-center space-x-2">
                <span>✅ Code "{discountApplied.code}" applied!</span>
                {discountApplied.percent_off && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                    {discountApplied.percent_off}% OFF
                  </span>
                )}
                {discountApplied.amount_off && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                    ${(discountApplied.amount_off / 100).toFixed(2)} OFF
                  </span>
                )}
              </div>
            ) : (
              <span>❌ Invalid discount code</span>
            )}
          </div>
        )}
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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {discountApplied?.valid ? (
              <span>
                Pay ${getDiscountedPrice().toFixed(2)}
                <span className="line-through text-gray-400 ml-2">
                  ${selectedPlan.price}
                </span>
                • Add {selectedPlan.credits} Credits
              </span>
            ) : (
              <span>
                Pay ${selectedPlan.price} • Add {selectedPlan.credits} Credits
              </span>
            )}
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
  currentPlan,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const selectedPlan = selectedPlanId
    ? PLANS.find((p) => p.id === selectedPlanId) || null
    : null;

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    setTimeout(() => {
      onClose();
      setPaymentSuccess(false);
      setSelectedPlanId(null);
      setShowPaymentForm(false);
      setError(null);
    }, 2000);
  };

  const handlePaymentError = (msg: string) => {
    setError(msg);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setError(null);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlanId) {
      setError("Please select a plan to continue.");
      return;
    }
    
    // Prevent proceeding with Free plan
    if (selectedPlanId === 'free') {
      setError("The Free plan is already active. Please select a paid plan to upgrade.");
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
            <p className="text-gray-400 mt-1">
              Choose a plan that fits your needs
            </p>
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
                <p className="text-2xl font-bold text-orange-400">
                  {currentCredits}
                </p>
              </div>
              <div>
                <p className="text-gray-300">Current Plan</p>
                <p className="text-lg font-semibold text-white">
                  {currentPlan}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Grid or Payment Form */}
        {!showPaymentForm ? (
          <>
            {/* Plan Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                  const isCurrentPlan = currentPlan.toLowerCase().includes(plan.id) || 
                                       (currentPlan.toLowerCase() === 'free' && plan.id === 'free');
                  const isFree = plan.id === 'free';
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-xl p-6 transition-all duration-200 ${
                        isCurrentPlan
                          ? "border-green-500 bg-green-500/10"
                          : selectedPlanId === plan.id
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      } ${isFree ? "cursor-default" : "cursor-pointer"}`}
                      onClick={() => !isFree && handlePlanSelect(plan.id)}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ Current Plan
                          </span>
                        </div>
                      )}
                      
                      {!isCurrentPlan && plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            🔥 Popular
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {plan.id === "free" && "🎁"}
                          {plan.id === "starter" && "🚀"}
                          {plan.id === "pro" && "⭐"}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {plan.name}
                        </h3>
                        <div className="text-3xl font-bold text-white mb-1">
                          {plan.price === 0 ? "Free" : `$${plan.price}`}
                          {plan.isSubscription && plan.price > 0 && (
                            <span className="text-lg text-gray-400">/mo</span>
                          )}
                        </div>
                        <p className="text-orange-400 font-semibold mb-4">
                          {plan.credits} Credit{plan.credits !== 1 ? 's' : ''}
                          {plan.isSubscription && plan.price > 0 && " monthly"}
                        </p>
                        <p className="text-gray-300 text-sm mb-4">
                          {plan.description}
                        </p>

                        <ul className="text-left space-y-2 mb-4">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center text-sm text-gray-300"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {selectedPlanId === plan.id && !isFree && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 pb-4">
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="p-6 border-t border-gray-700">
              <button
                onClick={handleProceedToPayment}
                disabled={!selectedPlanId || selectedPlanId === 'free'}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Proceed to Payment
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Payment Form */}
            <div className="p-6">
              {selectedPlan && (
                <div className="mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 text-sm">Selected Plan</p>
                        <p className="text-xl font-bold text-white">
                          {selectedPlan.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300 text-sm">Price</p>
                        <p className="text-xl font-bold text-orange-400">
                          ${selectedPlan.price}
                          {selectedPlan.isSubscription && "/mo"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Elements stripe={stripePromise}>
                <PaymentForm
                  selectedPlan={selectedPlan!}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </Elements>

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setError(null);
                }}
                className="w-full mt-4 text-gray-400 hover:text-white transition-colors"
                disabled={isProcessing}
              >
                ← Back to Plans
              </button>
            </div>
          </>
        )}

        {/* Success Message */}
        {paymentSuccess && (
          <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-300">
                Your credits will be added shortly...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseCreditsModal;
