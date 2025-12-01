import { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const Success = () => {
  useEffect(() => {
    // Get session ID from URL for display purposes only
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    console.log('✅ Payment successful! Session ID:', sessionId);
    console.log('ℹ️ Credits will be updated by the Stripe webhook automatically.');
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful! 🎉</h1>
          
          <p className="text-gray-300 mb-6">
            Thank you for your purchase! Your backlink credits are being added to your account.
          </p>

          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
            <p className="text-blue-300 font-semibold mb-2">✨ Processing Your Credits</p>
            <p className="text-blue-400 text-sm">
              Your credits are being securely processed and will appear in your account shortly.
              You can check your updated balance in the dashboard.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">What's Next?</p>
            <ul className="text-gray-300 text-sm space-y-1 text-left">
              <li>• Your credits will be available in moments</li>
              <li>• Access your dashboard to see your balance</li>
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