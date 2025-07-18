import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Link, Shield, AlertCircle, Mail, RefreshCw } from 'lucide-react';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase';
import RegistrationModal from './RegistrationModal'; 

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [checkingEmailVerification, setCheckingEmailVerification] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Debug logs for auth state
  console.log('ProtectedRoute:', { loading, isAuthenticated, checkingEmailVerification });

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (isAuthenticated) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email_confirmed_at) {
            setEmailVerified(true);
          } else {
            setEmailVerified(false);
          }
          setSessionError('');
        } catch (error) {
          console.error('Error checking email verification:', error);
          if (retryCount >= MAX_RETRIES) {
            setSessionError('Unable to verify email status. Please refresh the page or try signing in again.');
          } else {
            setEmailVerified(false);
          }
        }
      }
      setCheckingEmailVerification(false);
    };
    if (!loading && isAuthenticated) {
      checkEmailVerification();
    } else if (!isAuthenticated) {
      setCheckingEmailVerification(false); // Not authenticated, skip verification
    }
  }, [isAuthenticated, loading]);

  // Fallback: force loading and checkingEmailVerification to false after 10 seconds
  // DO NOT interfere with authentication during payment flows
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isCanceled = urlParams.get('canceled') === 'true';
    const isSuccess = urlParams.get('success') === 'true';
    
    // For payment flows, we want to be MORE patient, not less patient
    // because Stripe redirects can take time and we don't want to break auth
    const timeoutDuration = (isCanceled || isSuccess) ? 15000 : 10000;
    
    const timeout = setTimeout(() => {
      if (loading || checkingEmailVerification) {
        console.warn(`Authentication check timed out after ${timeoutDuration/1000} seconds - stopping infinite loop`);
        setCheckingEmailVerification(false);
        if (isCanceled || isSuccess) {
          // For payment flows, DO NOT set session error - preserve authentication
          console.log('Payment flow detected, preserving authentication state');
        } else {
          setSessionError('Authentication check timed out. Please refresh the page or try signing in again.');
        }
      }
    }, timeoutDuration);
    return () => clearTimeout(timeout);
  }, [loading, checkingEmailVerification, location.search]);

  // Retry authentication check if needed
  useEffect(() => {
    // If there's an error and we haven't exceeded retry attempts, try again
    if (sessionError && retryCount < MAX_RETRIES) {
      const retryTimer = setTimeout(() => {
        console.log(`🔄 Retrying authentication check (${retryCount + 1}/${MAX_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        setCheckingEmailVerification(true); // Reset to trigger the check again
      }, 1500 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(retryTimer);
    }
  }, [sessionError, retryCount]);

  // Retry handler for manual retry
  const handleRetryAuthentication = async () => {
    setSessionError('');
    setRetryCount(0);
    setCheckingEmailVerification(true);
    
    try {
      // Refresh session if possible
      await supabase.auth.refreshSession();
      window.location.reload(); // Reload page to refresh all auth state
    } catch (error) {
      console.error('Manual retry failed:', error);
      setSessionError('Authentication refresh failed. Please sign in again.');
    }
  };

  // Show loading spinner while checking authentication
  if (loading || checkingEmailVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">{loading ? 'Checking authentication...' : 'Verifying email status...'}</p>
        </div>
      </div>
    );
  }

  // If there's a persistent session error
  if (sessionError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Authentication Issue</h2>
          <p className="text-gray-300 mb-6">{sessionError}</p>
          <button onClick={handleRetryAuthentication} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  // Temporarily bypass email verification for development
  // TODO: Re-enable email verification when email system is properly configured
  /*
  // If authenticated but email not verified, show verification prompt
  if (isAuthenticated && !emailVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Email Verification Required</h1>
            <p className="text-gray-300 mb-6">
              Please check your email and click the confirmation link to activate your account and access the dashboard.
            </p>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="text-orange-400 font-medium mb-1">📧 Check Your Email:</h4>
                  <ul className="text-orange-300 text-sm space-y-1">
                    <li>• Look for an email from Supabase</li>
                    <li>• Check your spam/junk folder</li>
                    <li>• Click the confirmation link</li>
                    <li>• You'll be automatically redirected</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>I've Verified My Email</span>
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
              >
                Start Over
              </button>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-sm">
                Having trouble? Contact <a href="mailto:hello@linkzy.ai" className="text-orange-400 hover:text-orange-300">hello@linkzy.ai</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  */

  // If not authenticated, show login/registration prompt
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
              {/* Linkzy Logo */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-2xl font-bold">Linkzy</span>
              </div>
              {/* Access Denied Message */}
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Dashboard Access Required</h1>
              <p className="text-gray-300 mb-6">
                You need an account to access the Linkzy dashboard. Create your free account to get started with high-quality backlinks.
              </p>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-orange-400 font-medium mb-1">Why sign up?</h4>
                    <ul className="text-orange-300 text-sm space-y-1">
                      <li>• Access premium backlink tools</li>
                      <li>• Track your SEO performance</li>
                      <li>• Get free credits to start</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowRegistrationModal(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
        <RegistrationModal 
          isOpen={showRegistrationModal} 
          setIsModalOpen={setShowRegistrationModal} 
        />
      </>
    );
  }

  // If authenticated and (email verified or verification bypassed), render children
  return <>{children}</>;
};

export default ProtectedRoute;