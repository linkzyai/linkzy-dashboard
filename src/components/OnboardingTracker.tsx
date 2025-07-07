import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface OnboardingTrackerProps {
  steps: {
    label: string;
    completed: boolean;
    description?: string;
  }[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

const OnboardingTracker: React.FC<OnboardingTrackerProps> = ({ 
  steps, 
  currentStepIndex,
  onStepClick 
}) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-xl font-bold text-white">Getting Started</h3>
        <span className="text-gray-400 text-sm">{completedSteps}/{totalSteps} completed</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4 md:mb-6">
        <div 
          className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            onClick={() => onStepClick && onStepClick(index)}
            className={`flex items-center space-x-3 p-3 rounded-lg touch-manipulation ${
              index === currentStepIndex ? 'bg-gray-800' : ''
            } ${onStepClick ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              step.completed ? 'bg-green-500' : 
              index === currentStepIndex ? 'bg-orange-500' : 
              'bg-gray-700'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <Circle className="w-3 h-3 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <p className={`font-medium ${
                step.completed ? 'text-green-400' : 
                index === currentStepIndex ? 'text-white' : 
                'text-gray-400'
              }`}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-gray-500 text-xs">{step.description}</p>
              )}
            </div>
            
            {index === currentStepIndex && !step.completed && (
              <ArrowRight className="w-4 h-4 text-orange-500" />
            )}
          </div>
        ))}
      </div>
      
      {completedSteps === totalSteps && window.innerWidth >= 768 && (
        <div className="mt-4 md:mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-3 md:p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">All steps completed!</span>
          </div>
          <p className="text-green-300 text-sm mt-1">
            Congratulations! You've completed the onboarding process and are ready to get the full benefit of Linkzy.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingTracker;