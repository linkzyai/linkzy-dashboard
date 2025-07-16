import React, { useState } from 'react';
import { X, Globe, Target, CheckCircle, AlertCircle } from 'lucide-react';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user: any;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  user
}) => {
  const [website, setWebsite] = useState('');
  const [niche, setNiche] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!website || !niche) {
      setError('Please fill in both website and niche');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          website: website,
          niche: niche
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      onComplete();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-orange-500 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-400">
            Help us personalize your backlink experience
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="https://yourwebsite.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Niche <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={niche}
                onChange={(e ) => setNiche(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none"
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

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>Required for your 3 free credits:</strong> We need your website and niche to match you with relevant backlink opportunities.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal; 