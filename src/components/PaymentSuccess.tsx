import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const credits = params.get('credits') || '0';
  const amount = params.get('amount') || '0';

  const handleContinue = () => {
    try {
      // Clear any cached auth/session to force a fresh load
      localStorage.removeItem('linkzy_user');
      localStorage.removeItem('linkzy_api_key');
      sessionStorage.clear();
    } catch {}
    // Navigate to dashboard to let ProtectedRoute/AuthContext reload fresh state
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">You purchased <span className="text-orange-400 font-semibold">{credits}</span> credits for <span className="text-orange-400 font-semibold">${amount}</span>.</p>
        <button onClick={handleContinue} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors">Continue to Dashboard</button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 