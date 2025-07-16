import React, { useState, useEffect } from 'react';
import { X, Link, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface RegistrationModalProps {
  isOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

type TabType = 'signup' | 'google';

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, setIsModalOpen }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formFocused, setFormFocused] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [specificErrorType, setSpecificErrorType] = useState<'network' | 'credentials' | 'user_exists' | 'weak_password' | 'general' | null>(null);

  // Set focus to email input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const emailInput = document.getElementById('registration-email');
        if (emailInput) emailInput.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Clear errors when inputs change after validation attempt
  useEffect(() => {
    if (fieldsValidated) {
      validateForm(false);
      setSpecificErrorType(null);
    }
  }, [email, password, fieldsValidated, activeTab]);

  // Validate form fields and optionally show errors
  const validateForm = (showErrors = true) => {
    if (activeTab === 'signup') {
      // Sign up validation
      if (!email || !password) {
        if (showErrors) {
          setError('Please enter email and password');
        }
        return false;
      }
      
      if (password.length < 6) {
        if (showErrors) {
          setError('Password must be at least 6 characters');
        }
        return false;
      }
    } else if (activeTab === 'google') {
      // Google signup validation - no fields required
      // Website and niche will be collected in dashboard onboarding
    }
    
    return true;
  };

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError('');
    setLoadingMessage('Connecting to Google...');

    try {
      const result = await supabaseService.signInWithGoogle();
      
      if (result.success) {
        console.log('✅ Google sign-in initiated, redirecting...');
        setSuccess('Redirecting to Google...');
        // OAuth redirect will handle the rest
      } else {
        throw new Error(result.error || 'Google sign-in failed');
      }
      
    } catch (error) {
      let errorMessage = 'Failed to connect with Google. Please try again.';
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
      console.error('❌ Google sign-in failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }

  async function handleGoogleSignUp() {
    setFieldsValidated(true);
    
    // Validate form (no fields required for Google signup)
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    setLoadingMessage('Creating account with Google...');

    try {
      // Use signInWithGoogle since we're not collecting business data upfront
      const result = await supabaseService.signInWithGoogle();
      
      if (result.success) {
        console.log('✅ Google sign-up initiated, redirecting...');
        setSuccess('Redirecting to Google...');
        // OAuth redirect will handle the rest
        // Business profile data will be collected in dashboard onboarding
      } else {
        throw new Error(result.error || 'Google sign-up failed');
      }
      
    } catch (error) {
      let errorMessage = 'Failed to create account with Google. Please try again.';
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
      console.error('❌ Google sign-up failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }

  async function handleSignUp() {
    setFieldsValidated(true);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSpecificErrorType(null);
    setIsLoading(true);
    setError('');
    setSuccess('');
    setLoadingMessage('Creating your account...');

    try {
      console.log('🔐 Starting registration...');
      
      // Create account with simplified data - website/niche will be collected later
      const result = await supabaseService.registerUser(email, password, 'yourdomain.com', 'technology');
      
      console.log('✅ Registration successful! Response:', result);
      
      if (result.success) {
        // Auto-login on successful registration
        if (result.userProfile) {
          login(result.userProfile.api_key, result.userProfile);
          setSuccess('Account created! Redirecting to dashboard...');
        } else {
          // Fallback: attempt manual login
          const loginResult = await supabaseService.loginUser(email, password);
          if (loginResult.success && loginResult.userProfile) {
            login(loginResult.userProfile.api_key, loginResult.userProfile);
            setSuccess('Account created! Redirecting to dashboard...');
          }
        }
        
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('user already exists') || errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
        setSpecificErrorType('user_exists');
        setError('An account with this email already exists. Please use the Sign In modal instead.');
      }
      else if (errorMessage.includes('weak password') || errorMessage.includes('password')) {
        setSpecificErrorType('weak_password');
        setError('Password must be at least 6 characters long and contain a mix of letters and numbers.');
      }
      else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
        setSpecificErrorType('network');
        setError('Network error. Please check your connection and try again.');
      }
      else {
        setSpecificErrorType('general');
        setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'signup') {
      handleSignUp();
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

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Link className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">Linkzy</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'signup' ? 'Create Your Account' : 'Google Sign Up'}
            </h2>
            <p className="text-gray-400 text-sm">
              {activeTab === 'signup' 
                ? 'Get started with 3 free backlink credits' 
                : 'Quick setup with your Google account'
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'signup'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          {/* Rainbow Google "G" Tab */}
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all duration-300 ${
              activeTab === 'google'
                ? 'bg-white text-transparent bg-clip-text shadow-lg transform scale-105'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            style={{
              background: activeTab === 'google' 
                ? 'linear-gradient(135deg, #4285f4 0%, #ea4335 25%, #fbbc05 50%, #34a853 75%, #4285f4 100%)'
                : undefined,
              WebkitBackgroundClip: activeTab === 'google' ? 'text' : undefined,
              WebkitTextFillColor: activeTab === 'google' ? 'transparent' : undefined,
              boxShadow: activeTab === 'google' ? '0 0 20px rgba(66, 133, 244, 0.3)' : undefined
            }}
          >
            G
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
                
                {specificErrorType === 'user_exists' && (
                  <p className="text-sm text-orange-400 mt-1">
                    Account already exists. Please use the Sign In modal instead.
                  </p>
                )}
                
                {specificErrorType === 'weak_password' && (
                  <div className="mt-2 text-xs text-red-300">
                    <p>• Use at least 6 characters</p>
                    <p>• Include both letters and numbers</p>
                    <p>• Avoid common passwords</p>
                  </div>
                )}
                
                {specificErrorType === 'network' && (
                  <div className="mt-2 text-xs text-red-300">
                    <p>• Check your internet connection</p>
                    <p>• Try refreshing the page</p>
                    <p>• Contact support if the issue persists</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Loading Message */}
        {loadingMessage && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-400 text-sm">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Simplified Google Tab Content */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            {/* Quick Setup Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-semibold text-sm">Quick setup with Google</p>
                  <p className="text-gray-300 text-xs mt-1">
                    Sign up instantly with your Google account. Complete your business profile after signup to get personalized recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none border border-gray-300 flex items-center justify-center space-x-3"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 rounded text-white text-sm font-bold flex items-center justify-center shadow-lg scale-110">
                  G
                </div>
              )}
              <span className="text-lg">Create Account with Google</span>
            </button>
          </div>
        )}

        {/* Email/Password Forms for Sign Up */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="registration-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="registration-email"
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

            {/* Password */}
            <div>
              <label htmlFor="registration-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="registration-password"
                  name="password"
                  autoComplete="new-password"
                  aria-label="Password"
                  aria-required="true"
                  onFocus={() => setFormFocused('password')}
                  onBlur={() => setFormFocused(null)}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-800 border ${
                    fieldsValidated && password.length < 6 
                      ? 'border-red-500 focus:border-red-500' 
                      : formFocused === 'password' ? 'border-orange-500' : 'border-gray-600'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                  placeholder="Choose a secure password"
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
              <p className="text-gray-500 text-xs mt-1">Must be at least 6 characters</p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistrationModal; 