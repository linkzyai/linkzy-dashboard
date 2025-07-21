import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabaseService from '../services/supabaseService';

const Success = () => {
  const [creditsUpdated, setCreditsUpdated] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const updateCreditsInDatabase = async () => {
      try {
        if (!user?.id) {
          console.error('No user found for credit update');
          setUpdateError('User not found');
          return;
        }

        // Get session ID from URL (Stripe passes this)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          console.error('No Stripe session ID found');
          setUpdateError('Payment session not found');
          return;
        }

        // Determine credits to add based on URL or default to Starter Pack
        let creditsToAdd = 3; // Default for Starter Pack
        let amount = 10; // Default amount
        let description = 'Starter Pack - 3 Credits';

        // In a real implementation, you'd look up the session from Stripe
        // For now, we'll use defaults but log the session ID
        console.log('Processing payment for session:', sessionId);

        const paymentDetails = {
          sessionId: sessionId,
          amount: amount,
          description: description
        };

        // Update credits in database
        const result = await supabaseService.updateUserCredits(
          user.id,
          creditsToAdd,
          paymentDetails
        );

        if (result.success) {
          setCreditsAdded(creditsToAdd);
          setCreditsUpdated(true);
          
          // Trigger a custom event to update the UI
          window.dispatchEvent(new CustomEvent('creditsUpdated', { 
            detail: { 
              newCredits: result.newCredits,
              oldCredits: result.oldCredits,
              creditsAdded: result.creditsAdded
            } 
          }));
          
          console.log('✅ Database credits updated successfully:', result);
        }

      } catch (error) {
        console.error('❌ Error updating credits in database:', error);
        setUpdateError('Failed to update credits. Please contact support.');
        
        // Fallback to localStorage for now
        const currentCredits = parseInt(localStorage.getItem('userCredits') || '3');
        const newCredits = currentCredits + 3;
        localStorage.setItem('userCredits', newCredits.toString());
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { newCredits } }));
      }
    };

    // Only update credits once when component mounts
    if (!creditsUpdated && user) {
      updateCreditsInDatabase();
    }
  }, [creditsUpdated, user]);

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

          {updateError && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-300 font-semibold mb-2">⚠️ Update Error</p>
              <p className="text-red-400 text-sm">{updateError}</p>
            </div>
          )}

          {creditsUpdated && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-6">
              <p className="text-green-300 font-semibold mb-2">✅ Credits Added to Database!</p>
              <p className="text-green-400 text-sm">
                {creditsAdded} credits have been added to your account and saved to the database. 
                Your updated balance will persist across sessions.
              </p>
            </div>
          )}
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">What's Next?</p>
            <ul className="text-gray-300 text-sm space-y-1 text-left">
              <li>• Your credits are now saved in your account</li>
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