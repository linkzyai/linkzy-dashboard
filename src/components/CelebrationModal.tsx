import React, { useState, useEffect } from 'react';
import { CheckCircle, X, BarChart3, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievementType: 'first-request' | 'first-backlink' | 'completed-onboarding';
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, achievementType }) => {
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState<{ x: number; y: number; size: number; color: string }[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      // Generate confetti
      const confettiCount = 50;
      const newConfetti = [];
      const colors = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899'];
      
      for (let i = 0; i < confettiCount; i++) {
        newConfetti.push({
          x: Math.random() * 100, // percentage across the screen
          y: Math.random() * 100, // percentage down the screen
          size: Math.random() * 8 + 4, // size between 4-12px
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      
      setConfetti(newConfetti);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  let title = '';
  let message = '';
  let icon = <CheckCircle className="w-10 h-10 text-white" />;
  
  switch (achievementType) {
    case 'first-request':
      title = 'First Request Submitted!';
      message = 'Great job! Your first backlink request has been submitted. We\'ll work on placing your backlink and notify you when it\'s live.';
      icon = <LinkIcon className="w-10 h-10 text-white" />;
      break;
    case 'first-backlink':
      title = 'First Backlink Placed!';
      message = 'Congratulations! Your first backlink has been successfully placed. This will start improving your SEO rankings soon.';
      icon = <LinkIcon className="w-10 h-10 text-white" />;
      break;
    case 'completed-onboarding':
      title = 'Onboarding Complete!';
      message = "You've completed all the onboarding steps! You're now ready to get the full benefit of Linkzy and boost your SEO.";
      icon = <CheckCircle className="w-10 h-10 text-white" />;
      break;
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Confetti - Only show on larger screens to avoid performance issues on mobile */}
      {window.innerWidth > 768 && confetti.map((particle, i) => (
        <div 
          key={i}
          className="absolute rounded-sm animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 1.5}px`,
            backgroundColor: particle.color,
            transform: `rotate(${Math.random() * 360}deg)`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        ></div>
      ))}
      
      {/* Modal */}
      <div className="bg-gray-900 border-2 border-orange-500 rounded-2xl max-w-md w-full p-5 md:p-8 relative animate-bounce-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">{title}</h2>
          <p className="text-gray-300 mb-6">
            {message}
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {achievementType === 'first-request' && (
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors min-h-[56px]"
              >
                View Request Status
              </button>
            )}
            
            {achievementType === 'first-backlink' && (
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard/analytics');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[56px]"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Analytics</span>
              </button>
            )}
            
            {achievementType === 'completed-onboarding' && (
              <button
                onClick={() => {
                  onClose();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-colors min-h-[56px]"
              >
                Continue to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;