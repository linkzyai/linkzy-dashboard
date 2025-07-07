import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Target, Check, ArrowRight, FileText, BarChart3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  creditsRemaining: number;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onAction, creditsRemaining }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      // Add entrance animation
      setAnimation('animate-in');
      
      // Remove animation after a moment
      const timer = setTimeout(() => {
        setAnimation('');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onAction();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
      <div className={`bg-gray-900 border border-orange-500 rounded-2xl max-w-md w-full p-5 md:p-8 relative ${animation} overflow-y-auto max-h-[90vh]`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header with Linkzy logo */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to Linkzy!</h2>
            <p className="text-gray-300">Let's get started with your backlinks</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex space-x-2">
            <div className={`w-12 h-1 rounded-full ${currentStep >= 1 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
            <div className={`w-12 h-1 rounded-full ${currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
            <div className={`w-12 h-1 rounded-full ${currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
          </div>
          <span className="text-gray-400 text-sm">Step {currentStep} of 3</span>
        </div>
        
        {/* Step Content */}
        <div className="min-h-[220px] md:min-h-[240px]">
          {currentStep === 1 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl font-bold text-white">Your Free Credits</h3>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4 text-center">
                <div className="text-5xl font-bold text-orange-400 mb-2">{creditsRemaining}</div>
                <p className="text-gray-300">Free backlink credits</p>
              </div>
              <p className="text-gray-300">
                You have <span className="text-orange-400 font-bold">{creditsRemaining} free credits</span> to get started. The platform will automatically find and place backlinks for you in your niche.
              </p>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl font-bold text-white">How It Works</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 min-w-[24px]">1</div>
                  <div>
                    <p className="text-white font-medium">Choose Your Niche</p>
                    <p className="text-gray-400 text-sm">You already selected your niche during signup</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-white font-medium">Connect Your Website</p>
                    <p className="text-gray-400 text-sm">Set up an integration (Sitemap, Blog, WordPress, or API)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-white font-medium">Automatic Backlink Matching</p>
                    <p className="text-gray-400 text-sm">The platform will automatically find and place backlinks with other users in your niche—no manual requests needed!</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <p className="text-white font-medium">Track Your Results</p>
                    <p className="text-gray-400 text-sm">See integration status, found opportunities, and active exchanges in your dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl font-bold text-white">Connect Your Website</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-gray-800 hover:bg-orange-900/30 border border-gray-700 rounded-lg p-4 flex flex-col items-center transition-colors">
                    <FileText className="w-7 h-7 text-orange-400 mb-2" />
                    <span className="text-white font-semibold">Sitemap</span>
                    <span className="text-gray-400 text-xs mt-1 text-center">Connect your XML sitemap for automatic content discovery</span>
                  </button>
                  <button className="bg-gray-800 hover:bg-orange-900/30 border border-gray-700 rounded-lg p-4 flex flex-col items-center transition-colors">
                    <BarChart3 className="w-7 h-7 text-orange-400 mb-2" />
                    <span className="text-white font-semibold">Blog RSS</span>
                    <span className="text-gray-400 text-xs mt-1 text-center">Connect your blog's RSS feed for content updates</span>
                  </button>
                  <button className="bg-gray-800 hover:bg-orange-900/30 border border-gray-700 rounded-lg p-4 flex flex-col items-center transition-colors">
                    <Zap className="w-7 h-7 text-orange-400 mb-2" />
                    <span className="text-white font-semibold">WordPress</span>
                    <span className="text-gray-400 text-xs mt-1 text-center">Connect your WordPress site for seamless integration</span>
                  </button>
                  <button className="bg-orange-900/30 hover:bg-orange-500/20 border-2 border-orange-500 rounded-lg p-4 flex flex-col items-center transition-colors shadow-lg">
                    <Target className="w-7 h-7 text-orange-400 mb-2" />
                    <span className="text-white font-semibold">API (Recommended)</span>
                    <span className="text-orange-400 text-xs mt-1 text-center font-bold">Best experience: unlocks all features, real-time updates, and the most backlink opportunities!</span>
                  </button>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mt-4 text-center">
                  <p className="text-green-300 font-medium">Once your integration is set up, Linkzy will automatically match you with other users in your niche and place backlinks for you. No manual requests needed!</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 md:mt-8 flex space-x-3 md:space-x-4">
          {currentStep < 3 ? (
            <>
              <button
                onClick={onClose}
                className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white py-3 md:py-4 rounded-lg transition-colors border border-gray-600 min-h-[48px]"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep}
                className="w-2/3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 md:py-4 rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[48px]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[56px]"
            >
              <span>Finish</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;