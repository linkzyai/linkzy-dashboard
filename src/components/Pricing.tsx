import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RegistrationModal from './RegistrationModal';
import SignInModal from './SignInModal';

const Pricing = () => {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = () => {
    if (isAuthenticated) {
      // User is logged in, take them to dashboard account page to purchase
      navigate('/dashboard/account');
    } else {
      // User is not logged in, show registration modal
      setShowRegistrationModal(true);
    }
  };

  const switchToSignIn = () => {
    setShowRegistrationModal(false);
    setShowSignInModal(true);
  };

  const switchToRegistration = () => {
    setShowSignInModal(false);
    setShowRegistrationModal(true);
  };

  return (
    <>
      <section id="pricing" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              💸 <span className="text-white">Simple, Scalable,</span> <span className="text-orange-500">Fast</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Start free, scale as you grow. Perfect for everyone from solopreneurs to agencies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-black border border-gray-700 rounded-2xl p-6 text-center flex flex-col h-full">
              <div className="text-2xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-3 text-white">Free Plan</h3>
              <div className="text-3xl font-bold mb-4 text-green-400">$0</div>
              <p className="text-gray-300 mb-6 flex-grow">Get 3 free backlinks on signup. Perfect for testing our service.</p>
              <ul className="text-left text-gray-400 text-sm mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  3 backlinks on signup
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  No credit card required
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  High-quality backlinks
                </li>
              </ul>
              <button
                onClick={handlePlanClick}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mt-auto"
              >
                Start Free
              </button>
            </div>

            {/* Starter Plan */}
            <div className="bg-black border border-gray-700 rounded-2xl p-6 text-center flex flex-col h-full">
              <div className="text-2xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-white">Starter Plan</h3>
              <div className="text-3xl font-bold mb-4 text-white">
                $19<span className="text-lg text-gray-400">/mo</span>
              </div>
              <p className="text-gray-300 mb-6 flex-grow">Perfect for small businesses – 5 backlinks every month</p>
              <ul className="text-left text-gray-400 text-sm mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  5 backlinks monthly
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Automatic renewal
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={handlePlanClick}
                className="w-full py-3 orange-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-auto"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-black border-2 border-orange-500 rounded-2xl p-6 text-center relative flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  🔥 Popular
                </span>
              </div>
              <div className="text-2xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-3 text-white">Pro Plan</h3>
              <div className="text-3xl font-bold mb-4 text-white">
                $29<span className="text-lg text-gray-400">/mo</span>
              </div>
              <p className="text-gray-300 mb-6 flex-grow">For growing businesses – 15 backlinks every month</p>
              <ul className="text-left text-gray-400 text-sm mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  15 backlinks monthly
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Priority support
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Automatic renewal
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Cancel anytime
                </li>
              </ul>
              <button
                onClick={handlePlanClick}
                className="w-full py-3 orange-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity mt-auto"
              >
                Go Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      <RegistrationModal
        isOpen={showRegistrationModal}
        setIsModalOpen={setShowRegistrationModal}
        onSwitchToSignIn={switchToSignIn}
      />
      <SignInModal
        isOpen={showSignInModal}
        setIsModalOpen={setShowSignInModal}
        onSwitchToRegistration={switchToRegistration}
      />
    </>
  );
};

export default Pricing;
