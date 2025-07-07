import React, { useState, useEffect } from 'react';
import { Link, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase';
import supabaseService from '../services/supabaseService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [formFocused, setFormFocused] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'checking' | 'expired'>('checking');

  // Clear errors when inputs change after validation
  useEffect(() => {
    if (fieldsValidated && password && confirmPassword && password === confirmPassword) {
      setError('');
    }
  }, [password, confirmPassword, fieldsValidated]);

  // Set focus to password field once component is loaded
  useEffect(() => {
    if (!success) {
      setTimeout(() => {
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.focus();
      }, 500);
    }
  }, [success]);

  // Check if we have the required tokens
  useEffect(() => {
    setTokenStatus('checking');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const accessTokenFromType = type === 'recovery' && searchParams.get('access_token');
    
    // Check if this is a Supabase Auth reset
    if ((accessToken || accessTokenFromType) && type === 'recovery') {
      // Supabase Auth reset
      console.log('🔄 Detected Supabase Auth recovery request');
      const initializeSession = async () => {
        try {
          console.log('🔐 Initializing password reset session');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken || accessTokenFromType,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Session initialization failed:', error);
            setTokenStatus('invalid');
            setError('Failed to initialize password reset session. Please try again.');
          } else {
            console.log('✅ Password reset session initialized successfully');
            console.log('✅ Password reset session initialized', data);
            setTokenStatus('valid');
          }
        } catch (error) {
          console.error('Session setup error:', error);
          setTokenStatus('invalid');
          setError('Failed to setup password reset session. Please request a new password reset link.');
        }
      };      
      initializeSession();
    } else {
      // Check for custom token reset
      const customToken = searchParams.get('token');
      if (customToken) {
        // Validate custom token
        const tokenData = localStorage.getItem(`reset_${customToken}`);
        if (!tokenData) {
          setTokenStatus('invalid');
          setError('Invalid or expired reset token. Please request a new password reset.');
        } else {
          try {
            const tokenInfo = JSON.parse(tokenData);
            if (Date.now() > tokenInfo.expires) {
              setTokenStatus('expired');
              setError('Your password reset link has expired. Please request a new one.');
            } else if (tokenInfo.used === 'invalid') {
              setTokenStatus('invalid');
              setError('This reset link has already been used. Please request a new one if needed.');
            } else {
              setTokenStatus('valid');
            }
          } catch {
            setTokenStatus('invalid');
            setError('Invalid token data. Please request a new password reset.');
          }
        }
      } else {
        setTokenStatus('invalid');
        setError('Invalid or missing recovery tokens. Please request a new password reset from the sign-in page.');
      }
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have the latest values from any autofill
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    
    if (passwordInput && passwordInput.value !== password) {
      setPassword(passwordInput.value);
    }
    
    if (confirmPasswordInput && confirmPasswordInput.value !== confirmPassword) {
      setConfirmPassword(confirmPasswordInput.value);
    }
    
    setFieldsValidated(true);
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const customToken = searchParams.get('token');
      const email = searchParams.get('email');
      
      console.log('🔐 Updating password...', 
        customToken && email ? 'using custom token flow' : 'using Supabase Auth flow');
            
      if (customToken && email) {
        // Custom token reset
        console.log('🔄 Using custom token reset flow');
        // @ts-expect-error: updatePassword is a dynamic property on supabaseService
        await supabaseService.updatePassword(password, customToken, email);
      } else {
        // Supabase Auth reset
        console.log('🔄 Using Supabase Auth reset flow');
        const { data, error } = await supabase.auth.updateUser({
          password: password
        });
        
        if (error) {
          throw error;
        }
      }
      
      console.log('✅ Password updated successfully');
      
      setSuccess(true);

      // Show success message
      setTimeout(() => {
        alert('Password updated successfully! You will now be redirected to the sign-in page.');

        navigate('/sign-in');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Password update failed:', error);
      setError(error instanceof Error ? error.message : 'Password update failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <RouterLink to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">Linkzy</span>
            </RouterLink>
          </div>
        </div>
      </header>

      {/* Main Content with proper disabled state when token is invalid */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
              <p className="text-gray-400">Enter your new password below</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-red-400 text-sm">{error}</p>
                    
                    {(tokenStatus === 'invalid' || tokenStatus === 'expired') && (
                      <div className="mt-2">
                        <RouterLink 
                          to="/sign-in"
                          className="text-orange-400 hover:text-orange-300 text-sm transition-colors inline-flex items-center"
                        >
                          <span>Request a new reset link</span>
                        </RouterLink>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-4">Password Updated!</h2>
                <p className="text-gray-300 mb-6">
                  Your password has been successfully updated. You will be redirected to the sign-in page.
                </p>
                
                <RouterLink 
                  to="/sign-in"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-block"
                >
                  Go to Sign In
                </RouterLink>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span>New Password</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      aria-required="true"
                      aria-invalid={fieldsValidated && !password ? "true" : "false"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Enter new password"
                      disabled={tokenStatus !== 'valid'}
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Minimum 6 characters required</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <span>Confirm New Password</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      aria-required="true"
                      aria-invalid={fieldsValidated && (!confirmPassword || confirmPassword !== password) ? "true" : "false"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onFocus={() => setFormFocused('confirmPassword')}
                      onBlur={() => setFormFocused(null)}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldsValidated && !e.target.value) {
                          setError('Please confirm your password');
                        } else if (fieldsValidated && e.target.value !== password) {
                          setError('Passwords do not match');
                        }
                      }}
                      className={`w-full bg-gray-800 border ${
                        fieldsValidated && (!confirmPassword || confirmPassword !== password)
                          ? 'border-red-500 focus:border-red-500' 
                          : formFocused === 'confirmPassword' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                      onInput={(e) => {
                        // Handle programmatic input from password managers
                        if (e.currentTarget.value !== confirmPassword) {
                          // Use setTimeout to ensure we get the final value after autofill completes
                          setTimeout(() => {
                            setConfirmPassword(e.currentTarget.value);
                          }, 0);
                          
                          // Clear errors automatically when values match
                          if (e.currentTarget.value === password) {
                            setError('');
                          }
                        }
                      }}
                      data-testid="confirm-password-input"
                      placeholder="Confirm new password"
                      disabled={tokenStatus !== 'valid'}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password Strength</span>
                      <span className={`text-xs ${
                        password.length < 6 ? 'text-red-400' :
                        password.length < 10 ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        {password.length < 6 ? 'Weak' :
                         password.length < 10 ? 'Moderate' :
                         'Strong'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          password.length < 6 ? 'bg-red-500 w-1/4' :
                          password.length < 10 ? 'bg-orange-500 w-2/4' :
                          'bg-green-500 w-3/4'
                        }`}
                      ></div>
                    </div>
                    
                    <div className="flex items-center space-x-1 mt-2">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {password.length < 6 
                          ? 'At least 6 characters required' 
                          : 'Strong passwords have a mix of letters, numbers and symbols'}
                      </span>
                    </div>
                  </div>
                )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Set New Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Note */}
            <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">🔒 Security Notice</h4>
              <p className="text-blue-300 text-sm">
                For your security, this reset link can only be used once. If you encounter any issues, 
                please request a new password reset from the sign-in page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;