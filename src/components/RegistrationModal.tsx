import React, { useState, useEffect } from 'react';
import { X, Link, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Globe, Target } from 'lucide-react';
import supabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RegistrationModalProps {
  isOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, setIsModalOpen }) => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [niche, setNiche] = useState('');
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
  }, [isOpen, isSignUp]);

  // Clear errors when inputs change after validation attempt
  useEffect(() => {
    if (fieldsValidated) {
      validateForm(false);
      setSpecificErrorType(null);
    }
  }, [email, password, website, niche, fieldsValidated, isSignUp]);

  // Validate form fields and optionally show errors
  const validateForm = (showErrors = true) => {
    if (isSignUp) {
      // Sign up validation
      if (!email || !password || !website || !niche) {
        if (showErrors) {
          setError('Please fill in all fields');
        }
        return false;
      }
      
      if (password.length < 6) {
        if (showErrors) {
          setError('Password must be at least 6 characters');
        }
        return false;
      }
    } else {
      // Sign in validation
      if (!email || !password) {
        if (showErrors) {
          setError('Please enter email and password');
        }
        return false;
      }
    }
    
    // Clear error if validation passes
    setError('');
    return true;
  };

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
        setLoadingMessage('Registration successful! Check your email...');
        setSuccess(result.message || '🎉 Registration successful! Please check your email and click the confirmation link to activate your account.');
        
        // Show email confirmation message
        setTimeout(() => {
          setIsModalOpen(false);
          
          // Show email confirmation modal/alert
          alert(`📧 Email Confirmation Required

✅ Account Created Successfully!
📧 Email: ${email}

🔔 IMPORTANT: Check your email inbox (and spam folder) for a confirmation link from Supabase.

📬 You must click the confirmation link to:
• Activate your account
• Access your dashboard
• Receive your 3 free backlink credits
• Start using Linkzy

⏰ The confirmation link will expire in 24 hours for security.

🔗 The confirmation link will redirect you to your dashboard automatically.

Having trouble? Contact hello@linkzy.ai for help.`);
          
        }, 1500);
      }
      
    } catch (error: any) {
      // Determine specific error type
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setSpecificErrorType('network');
        setError('Network error. Please check your connection and try again.');
      } 
      else if (errorMessage.includes('already') || errorMessage.includes('exists')) {
        setSpecificErrorType('user_exists');
        setError('An account with this email already exists. Try signing in instead.');
      }
      else if (errorMessage.includes('weak') || errorMessage.includes('password')) {
        setSpecificErrorType('weak_password');
        setError('Please use a stronger password (min. 6 characters).');
      }
      else {
        setSpecificErrorType('general');
        setError(error instanceof Error ? error.message : 'Registration failed');
      }
      
      console.error('❌ Registration failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }

  async function handleSignIn() {
    setFieldsValidated(true);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSpecificErrorType(null);
    setIsLoading(true);
    setError('');
    setLoadingMessage('Signing you in...');
    
    try {
      // @ts-expect-error: signIn is dynamic property on supabaseService
      const result = await supabaseService.signIn(email, password);
      
      if (result.success) {
        login(result.api_key, result.user);
        
        setSuccess('✅ Welcome back!');
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.href = '/dashboard';
        }, 1000);
      }
      
    } catch (error: any) {
      // Determine specific error type
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setSpecificErrorType('network');
        setError('Network error. Please check your connection and try again.');
      } 
      else if (errorMessage.includes('invalid') || errorMessage.includes('password') || errorMessage.includes('credentials')) {
        setSpecificErrorType('credentials');
        setError('Invalid email or password. Please check your credentials.');
      }
      else if (errorMessage.includes('not found') || errorMessage.includes('no user')) {
        setSpecificErrorType('credentials');
        setError('No account found with this email. Please check your spelling or sign up.');
      }
      else {
        setSpecificErrorType('general');
        setError(error instanceof Error ? error.message : 'Sign in failed');
      }
      
      console.error('❌ Sign in failed:', error);
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
    
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          onClick={() => setIsModalOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-2xl font-bold ml-2">Create Your Account</span>
          </div>
          <p className="text-gray-400 text-sm">Get started with 3 free backlink credits</p>
        </div>
        <div style={{color: 'red', fontWeight: 'bold', marginBottom: 8}}>DEBUG: This is the live RegistrationModal code! The Google button should be below.</div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 border border-gray-700 hover:bg-gray-700 transition-colors mt-4"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Sign up with Google</span>
        </button>

        {/* Toggle between Sign Up and Sign In */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              isSignUp
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isSignUp
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
                
                {specificErrorType === 'user_exists' && (
                  <button 
                    onClick={() => setIsSignUp(false)}
                    className="text-sm text-orange-400 hover:text-orange-300 mt-1"
                  >
                    Sign in instead →
                  </button>
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
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
              {isSignUp && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="registration-email"
                name="email"
                autoComplete={isSignUp ? "username" : "email"}
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
              {isSignUp && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                aria-required="true"
                aria-invalid={fieldsValidated && !password ? "true" : "false"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Enter your password"
                required
                minLength={isSignUp ? 6 : undefined}
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
            {isSignUp && (
              <p className="text-gray-500 text-xs mt-1">Minimum 6 characters required</p>
            )}
          </div>

          {/* Sign Up Fields */}
          {isSignUp && (
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
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          )}
        </form>

        {/* Forgot Password */}
        {!isSignUp && (
          <div className="mt-4 text-center">
            <button 
              className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
              onClick={() => {
                setIsModalOpen(false);
                window.location.href = '/sign-in';
              }}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {isSignUp ? (
          <>
            {/* ...existing sign up form... */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 border border-gray-700 hover:bg-gray-700 transition-colors mt-4"
              style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span>Sign up with Google</span>
            </button>
          </>
        ) : (
          <>
            {/* ...existing sign in form... */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 border border-gray-700 hover:bg-gray-700 transition-colors mt-4"
              style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RegistrationModal;