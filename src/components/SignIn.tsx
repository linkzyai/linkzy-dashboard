import React, { useState, useEffect } from 'react';
import { Link, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [formFocused, setFormFocused] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [specificErrorType, setSpecificErrorType] = useState<'wrong_password' | 'user_not_found' | 'too_many_attempts' | 'connection_error' | 'general' | null>(null);
  
  // Clear errors when inputs change if previously validated
  useEffect(() => {
    if (fieldsValidated && email && password) {
      setError('');
      setSpecificErrorType(null);
    }
  }, [fieldsValidated, email, password]);

  // Set focus to the email field on component mount
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput && !showForgotPassword && !showResendConfirmation) {
      emailInput.focus();
    }
  }, [showForgotPassword, showResendConfirmation]);

  // Password manager compatibility: sync autofilled values on mount
  useEffect(() => {
    setTimeout(() => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      if (emailInput && emailInput.value && email !== emailInput.value) {
        setEmail(emailInput.value);
      }
      if (passwordInput && passwordInput.value && password !== passwordInput.value) {
        setPassword(passwordInput.value);
      }
    }, 1000); // Increased delay for password manager autofill
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    // Always get latest values from DOM for autofill compatibility
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const finalEmail = emailInput?.value || email;
    const finalPassword = passwordInput?.value || password;
    console.log('Submitting login with:', finalEmail, finalPassword); // Debug log
    setFieldsValidated(true);
    if (!finalEmail || !finalPassword) {
      setError(`Please enter ${!finalEmail ? 'email' : ''}${!finalEmail && !finalPassword ? ' and ' : ''}${!finalPassword ? 'password' : ''}`);
      return;
    }
    setSpecificErrorType(null);
    setIsLoading(true);
    setError('');
    try {
      const result = await supabaseService.loginUser(finalEmail, finalPassword);
      if (result.success) {
        login(result.api_key, result.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (loginError: unknown) {
      console.error('❌ Sign in failed:', loginError);
      
      // Parse error message to determine specific error type
      const errorMessage = loginError instanceof Error ? loginError.message.toLowerCase() : '';
      
      if (errorMessage.includes('invalid login') || errorMessage.includes('incorrect password')) {
        setSpecificErrorType('wrong_password');
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('user not found') || errorMessage.includes('no account')) {
        setSpecificErrorType('user_not_found');
        setError('No account found with this email. Please check your spelling or sign up for a new account.');
      } else if (errorMessage.includes('too many') || errorMessage.includes('rate limit') || errorMessage.includes('attempts')) {
        setSpecificErrorType('too_many_attempts');
        setError('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        setSpecificErrorType('connection_error');
        setError('Connection error. Please check your internet connection and try again.');
      } else {
        setSpecificErrorType('general');
        setError(loginError instanceof Error ? loginError.message : 'Sign in failed. Please try again.');
      }
      
      throw loginError; // Re-throw to be caught by the outer catch
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFieldsValidated(true);
    
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetSuccess('');
    
    try {
      console.log('📧 Requesting password reset for:', resetEmail);
      await supabaseService.resetPassword(resetEmail);
      
      // If we get this far, it's a success (the function shows alerts internally)
      setResetSuccess(`✅ Password reset email sent! 
      
📧 Check your email (${resetEmail}) for a reset link from Supabase.
      
⚠️ Important: Check your SPAM/JUNK folder - reset emails often end up there.
      
🔒 The reset link will expire in 24 hours for security.`);
      
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFieldsValidated(true);
    
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError('');
    setResetSuccess('');
    
    try {
      console.log('📧 Resending confirmation email for:', resetEmail);
      await supabaseService.resendConfirmationEmail(resetEmail);
      
      setResetSuccess(`✅ Confirmation email resent! 
      
📧 Check your email (${resetEmail}) for a new confirmation link.
      
⚠️ Important: Check your SPAM/JUNK folder - confirmation emails often end up there.
      
🔒 The confirmation link will expire in 24 hours for security.`);
      
    } catch (error) {
      console.error('❌ Failed to resend confirmation:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend confirmation email');
    } finally {
      setResendLoading(false);
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
            
            <RouterLink 
              to="/" 
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </RouterLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
            <div style={{color: 'red', fontWeight: 'bold', marginBottom: 8}}>DEBUG: This is the live SignIn code! The Google button should be below.</div>
            {/* Google Sign-In Button */}
            {/* Removed Google Sign-In Button */}

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Link className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-2xl font-bold">Linkzy</span>
              </div>
              
              {!showForgotPassword ? (
                <>
                  <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                  <p className="text-gray-400">Sign in to access your dashboard</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                  <p className="text-gray-400">Enter your email to receive reset instructions</p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                    
                    {specificErrorType === 'wrong_password' && (
                      <div className="mt-2 text-xs text-red-300">
                        <p>• Check for caps lock or typos</p>
                        <p>• If you've forgotten your password, use the "Forgot password?" link below</p>
                      </div>
                    )}
                    
                    {specificErrorType === 'user_not_found' && (
                      <div className="mt-2 text-xs text-red-300">
                        <p>• Check for typos in your email address</p>
                        <p>• If you're new, please create an account</p>
                      </div>
                    )}
                    
                    {specificErrorType === 'too_many_attempts' && (
                      <div className="mt-2 text-xs text-red-300">
                        <p>• Please wait a few minutes before trying again</p>
                        <p>• Try resetting your password if you're having trouble</p>
                      </div>
                    )}
                    
                    {specificErrorType === 'connection_error' && (
                      <div className="mt-2 text-xs text-red-300">
                        <p>• Check your internet connection</p>
                        <p>• Try refreshing the page</p>
                        <p>• Our servers might be experiencing temporary issues</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {resetSuccess && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-6">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-green-400 text-sm">
                    <pre className="whitespace-pre-wrap font-sans">{resetSuccess}</pre>
                  </div>
                </div>
              </div>
            )}

            {!showForgotPassword && !showResendConfirmation ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="username"
                      aria-label="Email Address"
                      aria-required="true"
                      aria-invalid={fieldsValidated && !email ? "true" : "false"}
                      onFocus={() => setFormFocused('email')}
                      onBlur={() => setFormFocused(null)}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldsValidated && !e.target.value) {
                          setError('Email is required');
                        }
                      }}
                      className={`w-full bg-gray-800 border ${
                        fieldsValidated && !email 
                          ? 'border-red-500 focus:border-red-500' 
                          : formFocused === 'email' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password (hidden dummy for autofill compatibility) */}
                <input
                  type="password"
                  name="fake-password"
                  autoComplete="new-password"
                  tabIndex={-1}
                  style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                  aria-hidden="true"
                />
                {/* Real Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                   <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex flex-col items-center justify-center mt-2 mb-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <span className="text-gray-500 text-sm">|</span>
                    <button
                      type="button"
                      onClick={() => setShowResendConfirmation(true)}
                      className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
                    >
                      Resend confirmation email
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                 className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[46px]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : specificErrorType === 'connection_error' ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry Sign In</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : showResendConfirmation ? (
              /* Resend Confirmation Form */
              <form onSubmit={handleResendConfirmation} className="space-y-6">
                <div>
                  <label htmlFor="resendEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="resendEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      name="resendEmail"
                      autoComplete="email"
                      aria-label="Email Address"
                      aria-required="true"
                      onFocus={() => setFormFocused('resetEmail')}
                      onBlur={() => setFormFocused(null)}
                      className={`w-full bg-gray-800 border ${
                        fieldsValidated && !resetEmail 
                          ? 'border-red-500' 
                          : formFocused === 'resetEmail' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    We'll send you a new confirmation link
                  </p>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-4">
                    <h4 className="text-blue-400 font-medium mb-2">📧 Confirmation Email Tips</h4>
                    <ul className="text-blue-300 text-xs space-y-1">
                      <li>• Check your spam/junk folder carefully</li>
                      <li>• Add auth@supabase.co to your safe senders</li>
                      <li>• Gmail users: Check "Promotions" tab</li>
                      <li>• Wait 2-3 minutes for delivery</li>
                      <li>• Subject line: "Confirm Your Email"</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {resendLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Resend Confirmation</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResendConfirmation(false);
                      setError('');
                      setResetSuccess('');
                    }}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      name="resetEmail"
                      aria-label="Email Address"
                      aria-required="true"
                      autoComplete="email"
                      onFocus={() => setFormFocused('resetEmail')}
                      onBlur={() => setFormFocused(null)}
                      className={`w-full bg-gray-800 border ${
                        fieldsValidated && !resetEmail 
                          ? 'border-red-500' 
                          : formFocused === 'resetEmail' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    We'll send you a link to reset your password
                  </p>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-4">
                    <h4 className="text-blue-400 font-medium mb-2">📧 Email Delivery Tips</h4>
                    <ul className="text-blue-300 text-xs space-y-1">
                      <li>• Check your spam/junk folder carefully</li>
                      <li>• Add auth@supabase.co to your safe senders</li>
                      <li>• Gmail users: Check "Promotions" tab</li>
                      <li>• Wait 2-3 minutes for delivery</li>
                      <li>• Subject line: "Reset Your Password"</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending Reset Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setResetSuccess('');
                    }}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <RouterLink to="/" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                  Create one for free
                </RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;