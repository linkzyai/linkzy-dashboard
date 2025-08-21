import React, { useState } from 'react';
import { X, Globe, Target, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import supabaseService from '../../services/supabaseService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (website: string, niche: string) => void;
  onSkip: () => void;
  userEmail: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ 
  isOpen, 
  onComplete, 
  onSkip, 
  userEmail 
}) => {
  const [website, setWebsite] = useState('');
  const [niche, setNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldsValidated, setFieldsValidated] = useState(false);
  const [formFocused, setFormFocused] = useState<string | null>(null);

  const validateForm = () => {
    if (!website || !niche) {
      setError('Please enter your website URL and select your niche');
      return false;
    }
    
    // Basic URL validation
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      if (!url.hostname.includes('.')) {
        setError('Please enter a valid website URL');
        return false;
      }
    } catch {
      setError('Please enter a valid website URL');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldsValidated(true);
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update user profile in database
      const result = await supabaseService.updateUserProfile(website, niche);
      
      if (result.success) {
        // Proceed immediately
        onComplete(website, niche);
        
        // Fire-and-forget welcome email with a short timeout cap
        try {
          const emailPromise = supabaseService.sendWelcomeEmail(
            userEmail,
            supabaseService.getApiKey() || '',
            website,
            niche
          );
          // Cap the wait to 1500ms, ignore outcome
          Promise.race([
            emailPromise,
            new Promise((resolve) => setTimeout(resolve, 1500))
          ]).catch(() => {});
        } catch (emailError) {
          console.warn('⚠️ Welcome email skipped (non-critical):', emailError);
        }
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // User can complete this later
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-400 text-sm">
            Set up your business profile to get personalized link building recommendations
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-semibold text-sm mb-2">Why we need this information:</h3>
          <ul className="text-gray-300 text-xs space-y-1">
            <li>• Find relevant websites in your niche</li>
            <li>• Generate targeted backlink opportunities</li>
            <li>• Provide personalized link building strategies</li>
            <li>• Send you better recommendations</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Website URL */}
          <div>
            <label htmlFor="onboarding-website" className="block text-sm font-semibold text-gray-300 mb-3">
              Business Website URL
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                id="onboarding-website"
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
                  fieldsValidated && !website ? 'border-red-500' : 
                  formFocused === 'website' ? 'border-orange-500' : 'border-gray-600'
                } rounded-lg pl-11 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors`}
                placeholder="https://yourbusiness.com"
                required
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Your main business website for targeted link building
            </p>
          </div>

          {/* Niche Selection */}
          <div>
            <label htmlFor="onboarding-niche" className="block text-sm font-semibold text-gray-300 mb-3">
              Business Niche
              <span className="text-red-400 ml-1">*</span>
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
                id="onboarding-niche"
                onFocus={() => setFormFocused('niche')}
                onBlur={() => setFormFocused(null)}
                className={`w-full pl-11 pr-4 py-4 bg-gray-800 border ${
                  fieldsValidated && !niche ? 'border-red-500' : 
                  formFocused === 'niche' ? 'border-orange-500' : 'border-gray-600'
                } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none`}
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
                <option value="nonprofit-charity">❤️ Non-profit & Charity</option>
                <option value="legal-professional">⚖️ Legal & Professional Services</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Helps us find relevant link building opportunities
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Setting up your profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg transition-colors border border-gray-600"
            >
              Skip for now (complete later)
            </button>
          </div>
        </form>

        {/* Progress Note */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            You can update this information anytime in your account settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal; 