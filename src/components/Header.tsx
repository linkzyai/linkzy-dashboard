
import { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RegistrationModal from './RegistrationModal';
import SignInModal from './SignInModal';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const switchToSignIn = () => {
    setIsRegistrationModalOpen(false);
    setIsSignInModalOpen(true);
  };

  const switchToRegistration = () => {
    setIsSignInModalOpen(false);
    setIsRegistrationModalOpen(true);
  };

  const handleSignInClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setIsSignInModalOpen(true);
    }
  };

  const handleGetStartedClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard/account');
    } else {
      setIsRegistrationModalOpen(true);
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-orange-500 text-white text-center py-2 px-4 fixed top-0 left-0 right-0 z-[60]">
        <p className="text-xs sm:text-sm font-semibold">
          🚀 Public Beta: First 100 members get LIFETIME Pro Access (100% FREE) with code "FOUNDERS250"
        </p>
      </div>
      
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-[40px] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">Linkzy</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              {/* <a href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</a> */}
              <a href="/dashboard" className="text-gray-300 hover:text-orange-500 transition-colors font-semibold">Dashboard</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignInClick}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
              <button
                onClick={handleGetStartedClick}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isAuthenticated ? 'Upgrade' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <RegistrationModal isOpen={isRegistrationModalOpen} setIsModalOpen={setIsRegistrationModalOpen} onSwitchToSignIn={switchToSignIn} />
      <SignInModal isOpen={isSignInModalOpen} setIsModalOpen={setIsSignInModalOpen} onSwitchToRegistration={switchToRegistration} />
    </>
  );
};

export default Header;