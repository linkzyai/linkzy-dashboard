import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        // @ts-expect-error: verifyEmail is a dynamic property on supabaseService
        await supabase.auth.verifyOtp({
          token,
          type,
        });
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now access all features.');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        
      } catch (error) {
        console.error('Email verification failed:', error);
        setStatus('error');
        setMessage('Email verification failed. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Verifying Your Email</h1>
              <p className="text-gray-300">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Email Verified! ✅</h1>
              <p className="text-gray-300 mb-6">{message}</p>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-green-400 font-medium mb-2">What's Next?</h3>
                <ul className="text-green-300 text-sm space-y-1 text-left">
                  <li>• Access your full dashboard</li>
                  <li>• Submit backlink requests</li>
                  <li>• Track your SEO performance</li>
                  <li>• Use all premium features</li>
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
              <p className="text-gray-300 mb-6">{message}</p>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-red-400 font-medium mb-2">Need Help?</h3>
                <ul className="text-red-300 text-sm space-y-1 text-left">
                  <li>• Check your email for a new verification link</li>
                  <li>• Make sure you clicked the correct link</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
                
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;