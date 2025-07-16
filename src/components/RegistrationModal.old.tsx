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
    
    // Clear error if validation passes
    setError('');
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
    
    // Validate form
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
        // Business profile data is already stored in the service
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
      console.log('🚀 Starting improved registration...');
      
      setLoadingMessage('Setting up your account...');
      
      // @ts-expect-error: registerUser is dynamic property on supabaseService
      const result = await supabaseService.registerUser(email, password, website, niche);
      
      console.log('✅ Registration successful! Response:', result);
      
      if (result.success) {
        setLoadingMessage('Logging you in...');
        
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
        setError('An account with this email already exists. Please sign in instead.');
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
    
    // Ensure we have the latest values from any autofill
    const emailInput = document.getElementById('registration-email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    if (emailInput && emailInput.value !== email) {
      setEmail(emailInput.value);
    }
    
    if (passwordInput && passwordInput.value !== password) {
      setPassword(passwordInput.value);
    }
    
    if (activeTab === 'signup') {
      handleSignUp();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'signup' ? 'Create Your Account' : 'Google Sign Up'}
            </h2>
            <p className="text-gray-400 text-sm">
              {activeTab === 'signup' 
                ? 'Get started with 3 free backlink credits' 
                : 'Complete your business profile to get started'
              }
            </p>
          </div>
        </div>

        {/* Enhanced Tab System */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-8">
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
                
                {specificErrorType === 'network' && (
                  <p className="text-xs text-red-300 mt-1">
                    Check your internet connection and try again
                  </p>
                )}
                
                {specificErrorType === 'credentials' && (
                  <div className="text-xs text-red-300 mt-1">
                    <p>• Check for typos in your email</p>
                    <p>• Make sure your password is correct</p>
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
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Enhanced Google Tab Content */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            {/* Required Fields Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-semibold text-sm">Website and niche are required to create your account</p>
                  <p className="text-gray-300 text-xs mt-1">
                    We need this information to provide personalized link building recommendations for your business.
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-lg transition-all duration-200 border border-gray-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-lg">Continue with Google</span>
            </button>

            {/* Enhanced Website URL */}
            <div>
              <label htmlFor="google-website" className="block text-sm font-semibold text-gray-300 mb-3">
                Business Website URL
                <span className="text-red-400 ml-1 text-base">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  id="google-website"
                  name="website"
                  autoComplete="url"
                  aria-required="true"
                  aria-invalid={fieldsValidated && !website ? "true" : "false"}
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    if (fieldsValidated && !e.target.value) {
                      setError('Website URL is required');
                    }
                  }}
                  onFocus={() => setFormFocused('website')}
                  onBlur={() => setFormFocused(null)}
                  className={`w-full bg-gray-800 border ${
                    fieldsValidated && !website ? 'border-red-500 focus:border-red-500' : 
                    formFocused === 'website' ? 'border-orange-500' : 'border-gray-600'
                  } rounded-lg pl-11 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors text-sm`}
                  placeholder="https://yourbusiness.com"
                  required
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Enter your main business website URL for targeted link building
              </p>
            </div>

            {/* Enhanced Niche Selection */}
            <div>
              <label htmlFor="google-niche" className="block text-sm font-semibold text-gray-300 mb-3">
                Business Niche
                <span className="text-red-400 ml-1 text-base">*</span>
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select 
                  value={niche} 
                  onChange={(e) => {
                    setNiche(e.target.value);
                    if (fieldsValidated && !e.target.value) {
                      setError('Please select your niche');
                    }
                  }}
                  name="niche"
                  id="google-niche"
                  aria-required="true"
                  aria-invalid={fieldsValidated && !niche ? "true" : "false"}
                  onFocus={() => setFormFocused('niche')}
                  onBlur={() => setFormFocused(null)}
                  className={`w-full pl-11 pr-4 py-4 bg-gray-800 border ${
                    fieldsValidated && !niche ? 'border-red-500 focus:border-red-500' : 
                    formFocused === 'niche' ? 'border-orange-500' : 'border-gray-600'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none text-sm`}
                  required
                >
                  <option value="">Choose your industry category...</option>
                  <option value="technology">🖥️ Technology & Software</option>
                  <option value="home-services">🏠 Home Services & Contractors</option>
                  <option value="creative-arts">🎨 Creative Services & Arts</option>
                  <option value="food-restaurants">🍕 Food, Restaurants & Recipes</option>
                  <option value="health-wellness">💊 Health & Wellness</option>
                  <option value="finance-business">💰 Finance & Business</option>
                  <option value="travel-lifestyle">✈️ Travel & Lifestyle</option>
                  <option value="education">📚 Education & Learning</option>
                  <option value="ecommerce">🛒 E-commerce & Retail</option>
                  <option value="automotive">🚗 Automotive & Transportation</option>
                  <option value="real-estate">🏡 Real Estate & Property</option>
                  <option value="sports-outdoors">⚽ Sports & Outdoors</option>
                  <option value="beauty-fashion">💄 Beauty & Fashion</option>
                  <option value="pets-animals">🐕 Pets & Animals</option>
                  <option value="gaming-entertainment">🎮 Gaming & Entertainment</option>
                  <option value="parenting-family">👶 Parenting & Family</option>
                  <option value="diy-crafts">🔨 DIY & Crafts</option>
                  <option value="legal-professional">⚖️ Legal & Professional Services</option>
                  <option value="marketing-advertising">📈 Marketing & Advertising</option>
                  <option value="news-media">📰 News & Media</option>
                  <option value="spirituality-religion">🙏 Spirituality & Religion</option>
                  <option value="green-sustainability">🌱 Green Living & Sustainability</option>
                  <option value="self-improvement">🚀 Self-Improvement & Productivity</option>
                  <option value="politics-advocacy">🗳️ Politics & Advocacy</option>
                  <option value="local-community">🏘️ Local & Community</option>
                </select>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Helps us find the most relevant link building opportunities
              </p>
            </div>

            {/* Enhanced Create Account with Google Button */}
            {isLoading ? (
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white font-medium">{loadingMessage}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={!website || !niche}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none text-lg"
              >
                {(!website || !niche) ? 'Complete Required Fields' : 'Create Account with Google'}
              </button>
            )}
          </div>
        )}

        {/* Email/Password Forms for Sign Up */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
                {activeTab === 'signup' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="registration-email"
                  name="email"
                  autoComplete={activeTab === 'signup' ? "username" : "email"}
                  aria-required="true"
                  aria-invalid={fieldsValidated && !email ? "true" : "false"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldsValidated && !e.target.value) {
                      setError('Email is required');
                    }
                  }}
                  onFocus={() => setFormFocused('email')}
                  onBlur={() => setFormFocused(null)}
                  className={`w-full bg-gray-800 border ${
                    fieldsValidated && !email ? 'border-red-500 focus:border-red-500' : 
                    formFocused === 'email' ? 'border-orange-500' : 'border-gray-600'
                  } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
                {activeTab === 'signup' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete={activeTab === 'signup' ? "new-password" : "current-password"}
                  aria-required="true"
                  aria-invalid={fieldsValidated && !password ? "true" : "false"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter your password"
                  required
                  minLength={activeTab === 'signup' ? 6 : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 focus:outline-none"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {activeTab === 'signup' && (
                <p className="text-gray-500 text-xs mt-1">Minimum 6 characters required</p>
              )}
            </div>

            {/* Sign Up Fields */}
            {activeTab === 'signup' && (
              <>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                    Website URL
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      id="website"
                      name="website"
                      autoComplete="url"
                      aria-required="true"
                      aria-invalid={fieldsValidated && !website ? "true" : "false"}
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        if (fieldsValidated && !e.target.value) {
                          setError('Website URL is required');
                        }
                      }}
                      onFocus={() => setFormFocused('website')}
                      onBlur={() => setFormFocused(null)}
                      className={`w-full bg-gray-800 border ${
                        fieldsValidated && !website ? 'border-red-500 focus:border-red-500' : 
                        formFocused === 'website' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                      placeholder="https://yourwebsite.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="niche" className="block text-sm font-medium text-gray-300 mb-2">
                    Your Niche
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      value={niche} 
                      onChange={(e) => {
                        setNiche(e.target.value);
                        if (fieldsValidated && !e.target.value) {
                          setError('Please select your niche');
                        }
                      }}
                      name="niche"
                      id="niche"
                      aria-required="true"
                      aria-invalid={fieldsValidated && !niche ? "true" : "false"}
                      onFocus={() => setFormFocused('niche')}
                      onBlur={() => setFormFocused(null)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800 border ${
                        fieldsValidated && !niche ? 'border-red-500 focus:border-red-500' : 
                        formFocused === 'niche' ? 'border-orange-500' : 'border-gray-600'
                      } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none`}
                      required
                    >
                      <option value="">Select your niche...</option>
                    <option value="technology">🖥️ Technology & Software</option>
                    <option value="home-services">🏠 Home Services & Contractors</option>
                    <option value="creative-arts">🎨 Creative Services & Arts</option>
                    <option value="food-restaurants">🍕 Food, Restaurants & Recipes</option>
                    <option value="health-wellness">💊 Health & Wellness</option>
                    <option value="finance-business">💰 Finance & Business</option>
                    <option value="travel-lifestyle">✈️ Travel & Lifestyle</option>
                    <option value="education">📚 Education & Learning</option>
                    <option value="ecommerce">🛒 E-commerce & Retail</option>
                    <option value="automotive">🚗 Automotive & Transportation</option>
                    <option value="real-estate">🏡 Real Estate & Property</option>
                    <option value="sports-outdoors">⚽ Sports & Outdoors</option>
                    <option value="beauty-fashion">💄 Beauty & Fashion</option>
                    <option value="pets-animals">🐕 Pets & Animals</option>
                    <option value="gaming-entertainment">🎮 Gaming & Entertainment</option>
                    <option value="parenting-family">👶 Parenting & Family</option>
                    <option value="diy-crafts">🔨 DIY & Crafts</option>
                    <option value="legal-professional">⚖️ Legal & Professional Services</option>
                    <option value="marketing-advertising">📈 Marketing & Advertising</option>
                    <option value="news-media">📰 News & Media</option>
                    <option value="spirituality-religion">🙏 Spirituality & Religion</option>
                    <option value="green-sustainability">🌱 Green Living & Sustainability</option>
                    <option value="self-improvement">🚀 Self-Improvement & Productivity</option>
                    <option value="politics-advocacy">🗳️ Politics & Advocacy</option>
                    <option value="local-community">🏘️ Local & Community</option>
                  </select>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            {isLoading ? (
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white font-medium">{loadingMessage}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {activeTab === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            )}
          </form>
        )}


      </div>
    </div>
  );
};

export default RegistrationModal;