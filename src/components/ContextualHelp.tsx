import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ContextualHelpProps {
  title: string;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: 'narrow' | 'medium' | 'wide';
  icon?: React.ReactNode;
  highlight?: boolean;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ 
  title, 
  content, 
  position = 'top',
  width = 'medium',
  icon = <HelpCircle className="w-4 h-4" />,
  highlight = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const widthClasses = {
    narrow: 'w-60',
    medium: 'w-72',
    wide: 'w-80',
  };
  
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-gray-400 hover:text-white transition-colors flex items-center justify-center ${
          highlight ? 'animate-pulse text-orange-400' : ''
        }`}
        title={title}
      >
        {icon}
      </button>
      
      {/* For mobile, use a full-screen overlay */}
      {isOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-lg p-5 max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-lg">{title}</h3>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-gray-400 hover:text-white transition-colors bg-gray-700 rounded-lg p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-gray-300 text-sm">
                {content}
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* For desktop, use a popover */}
      {isOpen && window.innerWidth >= 768 && (
        <div className={`absolute z-10 ${positionClasses[position]} ${widthClasses[width]}`}>
          <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium">{title}</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-gray-300 text-sm">
              {content}
            </div>
          </div>
          
          {/* Arrow pointing to trigger element */}
          <div className={`absolute ${
            position === 'top' ? 'bottom-0 left-1/2 -mb-2 -ml-2' :
            position === 'bottom' ? 'top-0 left-1/2 -mt-2 -ml-2' :
            position === 'left' ? 'right-0 top-1/2 -mr-2 -mt-2' :
            'left-0 top-1/2 -ml-2 -mt-2'
          } w-4 h-4 transform rotate-45 bg-gray-800 border ${
            position === 'top' ? 'border-b border-r' :
            position === 'bottom' ? 'border-t border-l' :
            position === 'left' ? 'border-t border-r' :
            'border-b border-l'
          } border-gray-600`}></div>
        </div>
      )}
    </div>
  );
};

export default ContextualHelp;