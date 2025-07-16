import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, setIsModalOpen }) => {
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setResetEmail('');
      setError('');
      setResetSuccess('');
      setShowForgotPassword(false);
      setShowResendConfirmation(false);
      setFieldsValidated(false);
      setSpecificErrorType(null);
    }
  }, [isOpen]);

  // Set focus to the email field when modal opens
  useEffect(() => {
    if (isOpen && !showForgotPassword && !showResendConfirmation) {
      setTimeout(() => {
        const emailInput = document.getElementById('signin-email');
        if (emailInput) {
          emailInput.focus();
        }
      }, 100);
    }
  }, [isOpen, showForgotPassword, showResendConfirmation]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔄 Initiating Google Sign In...');
      
      const result = await supabaseService.signInWithGoogle();
      
      if (result.success) {
        console.log('✅ Google OAuth initiated, redirecting...');
        // Modal will close automatically on redirect
        // The auth callback will handle the rest
      }
    } catch (error) {
      console.error('❌ Google Sign In failed:', error);
      
      let errorMessage = 'Google sign in failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = document.getElementById('signin-email') as HTMLInputElement;
    const passwordInput = document.getElementById('signin-password') as HTMLInputElement;
    const finalEmail = emailInput?.value || email;
    const finalPassword = passwordInput?.value || password;
    
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
        setIsModalOpen(false);
        navigate('/dashboard', { replace: true });
      }
    } catch (loginError: unknown) {
      console.error('❌ Sign in failed:', loginError);
      
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          {!showForgotPassword && !showResendConfirmation ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400">Sign in to access your dashboard</p>
            </>
          ) : showForgotPassword ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-gray-400">Enter your email to receive reset instructions</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Resend Confirmation</h1>
              <p className="text-gray-400">Enter your email to resend confirmation</p>
            </>
          )}
        </div>

        {/* Google Sign In - Only show in main sign in view */}
        {!showForgotPassword && !showResendConfirmation && (
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3 border border-gray-300 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 rounded text-white text-xs font-bold flex items-center justify-center shadow-lg">
                  G
                </div>
              )}
              <span className="text-lg">Continue with Google</span>
            </button>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-400 font-medium">OR</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
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

        {/* Success Message */}
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

        {/* Form Content */}
        {!showForgotPassword && !showResendConfirmation ? (
          /* Sign In Form */
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  autoComplete="username"
                  aria-label="Email Address"
                  aria-required="true"
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

            {/* Password */}
            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="signin-password"
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Links */}
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
              <label htmlFor="resetEmailInput" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="resetEmailInput"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  name="resetEmail"
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
      </div>
    </div>
  );
};

export default SignInModal; 