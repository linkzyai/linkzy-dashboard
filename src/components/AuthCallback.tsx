import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import supabaseService from '../services/supabaseService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState('Processing authentication...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        setStatus('Processing Google authentication...');
        
        // Get the session from the URL hash/search params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
        }

        if (!session || !session.user) {
          throw new Error('No valid authentication session found');
        }

        const user = session.user;
        console.log('✅ User authenticated:', user.email);
        
        setStatus('Setting up your account...');

        // All Google authentication is now simplified - no pending signup data needed
        // Website and niche will be collected during dashboard onboarding

        // Generate API key
        const apiKey = supabaseService.generateApiKey(user.email);
        
        // Check if user already exists in our database
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = "not found" error, which is expected for new users
          console.error('❌ Database fetch error:', fetchError);
          throw new Error(`Database error: ${fetchError.message}`);
        }

        if (existingUser) {
          // Existing user - sign in
          console.log('✅ Existing user found, signing in...');
          setStatus('Welcome back! Signing you in...');
          
          // Update their session info
          supabaseService.setApiKey(existingUser.api_key);
          login(existingUser.api_key, existingUser);
          
          setSuccess(true);
          setStatus('Successfully signed in!');
        } else {
          // New user - create account
          console.log('🆕 Creating new user account...');
          setStatus('Creating your account...');
          
          const userData = {
            id: user.id,
            email: user.email,
            website: 'yourdomain.com',
            niche: 'technology',
            api_key: apiKey,
            credits: 3,
            plan: 'free',
            created_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([userData]);
          
          if (insertError) {
            console.error('❌ Database insert error:', insertError);
            throw new Error(`Failed to create account: ${insertError.message}`);
          }
          
          console.log('✅ User account created successfully');
          
          // Set up local storage and auth context
          supabaseService.setApiKey(apiKey);
          login(apiKey, userData);
          
          // Welcome email will be sent after onboarding completion
          
          setSuccess(true);
          setStatus('Account created successfully!');
        }

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('❌ Auth callback failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('Authentication failed');
        
        // Redirect to homepage after showing error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure URL params are properly loaded
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, searchParams, login]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Link className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">Linkzy</span>
          </div>

          {/* Status Icon */}
          <div className="mb-6">
            {isLoading ? (
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            ) : success ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            ) : error ? (
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            ) : null}
          </div>

          {/* Status Message */}
          <h2 className="text-2xl font-bold text-white mb-4">
            {isLoading ? 'Authenticating...' : success ? 'Success!' : 'Authentication Error'}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {status}
          </p>

          {/* Error Details */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-red-300 text-xs mt-2">
                Redirecting to homepage in a few seconds...
              </p>
            </div>
          )}

          {/* Success Details */}
          {success && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {/* Manual Navigation */}
          {!isLoading && (
            <div className="space-y-3">
              {success ? (
                <button
                  onClick={() => navigate('/dashboard', { replace: true })}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/', { replace: true })}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
                >
                  Back to Homepage
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}