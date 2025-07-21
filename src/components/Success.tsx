import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const Success = () => {
  const [creditsUpdated, setCreditsUpdated] = useState(false);

  useEffect(() => {
    // Simple credit update for testing - in production this would be handled by webhook
    const updateCredits = () => {
      try {
        // Get current credits from localStorage or default to 3
        const currentCredits = parseInt(localStorage.getItem('userCredits') || '3');
        
        // Determine credits to add based on URL parameters (Stripe passes session info)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        let creditsToAdd = 3; // Default for Starter Pack
        
        // In a real app, you'd look up the session to get exact credits
        // For now, we'll assume Starter Pack (3 credits) for testing
        
        const newCredits = currentCredits + creditsToAdd;
        localStorage.setItem('userCredits', newCredits.toString());
        
        console.log(`Credits updated: ${currentCredits} → ${newCredits} (+${creditsToAdd})`);
        setCreditsUpdated(true);
        
        // Trigger a custom event to update the header credits display
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { newCredits } }));
        
      } catch (error) {
        console.error('Error updating credits:', error);
      }
    };

    // Only update credits once when component mounts
    if (!creditsUpdated) {
      updateCredits();
    }
  }, [creditsUpdated]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful! 🎉</h1>
          
          <p className="text-gray-300 mb-6">
            Thank you for your purchase! Your backlink credits have been added to your account.
          </p>

          {creditsUpdated && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-6">
              <p className="text-green-300 font-semibold mb-2">✅ Credits Added!</p>
              <p className="text-green-400 text-sm">
                3 credits have been added to your account. Check your dashboard to see the updated balance.
              </p>
            </div>
          )}
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">What's Next?</p>
            <ul className="text-gray-300 text-sm space-y-1 text-left">
              <li>• Check your email for onboarding instructions</li>
              <li>• Access your dashboard with your new credits</li>
              <li>• Start submitting backlink requests</li>
              <li>• Track your results in real-time</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600 mt-3"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;