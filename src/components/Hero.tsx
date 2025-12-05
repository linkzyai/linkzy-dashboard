import React from 'react';
import { useState } from 'react';
import { Play, ArrowRight, TrendingUp, Link as LinkIcon, Users, Eye, ExternalLink } from 'lucide-react';
import RegistrationModal from './RegistrationModal';
import SignInModal from './SignInModal';

const Hero = () => {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const switchToSignIn = () => {
    setShowRegistrationModal(false);
    setShowSignInModal(true);
  };

  const switchToRegistration = () => {
    setShowSignInModal(false);
    setShowRegistrationModal(true);
  };

  const handleGetStartedClick = () => {
    setShowRegistrationModal(true);
  };

  return (
    <>
      <section className="bg-black min-h-screen relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black"></div>

        {/* Large Animated 3D Chain Links Background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] opacity-60 animate-chainlink-rotate">
          <img
            src={
              '/ChatGPT Image Jun 19, 2025, 08_51_23 AM.png'.replace(/ /g, '%20')
            }
            alt="3D Chain Links"
            className="w-full h-full object-contain"
            onError={() => console.warn('Hero image not found in public folder!')}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 z-10">
          {/* Top Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-sm text-orange-400">
              🔥 Automated Curated Links • No Per-Link Fees
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight uppercase">
              Backlinks that
              <br />
              <span className="text-orange-500 uppercase">actually work</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Stop wasting money on expensive link building. Get high-quality backlinks
              from real niche blogs for 90% less than competitors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStartedClick}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started Free
              </button>
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>{showDemo ? 'Hide Demo' : 'View Live Demo'}</span>
              </button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              {!showDemo ? (
                /* Static Preview */
                <>
                  {/* Stats */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="bg-gray-800 rounded-lg px-4 py-2">
                      <div className="text-2xl font-bold text-white">2,847</div>
                      <div className="text-sm text-gray-400">Links Placed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-500">94%</div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                  </div>

                  {/* Demo Preview */}
                  <div className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center mb-6 relative overflow-hidden">
                    {/* Mini Dashboard Preview */}
                    <div className="w-full h-full relative">
                      {/* Background with subtle animation */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-gray-900/50 to-black/80"></div>

                      {/* Mini Stats */}
                      <div className="absolute top-4 left-4 right-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                            <div className="text-lg font-bold text-white">2,847</div>
                            <div className="text-xs text-gray-400">Links Placed</div>
                          </div>
                          <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                            <div className="text-lg font-bold text-orange-500">94%</div>
                            <div className="text-xs text-gray-400">Success Rate</div>
                          </div>
                          <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                            <div className="text-lg font-bold text-green-400">+24%</div>
                            <div className="text-xs text-gray-400">Growth</div>
                          </div>
                        </div>
                      </div>

                      {/* Center Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div
                            className="w-20 h-20 bg-orange-500/90 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-orange-500 transition-colors cursor-pointer transform hover:scale-110"
                            onClick={() => setShowDemo(true)}
                          >
                            <Play className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-white font-semibold mb-2">Interactive Dashboard Demo</h3>
                          <p className="text-gray-300 text-sm">Click to see live dashboard with real-time updates</p>
                        </div>
                      </div>

                      {/* Bottom Activity Feed */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-white text-sm font-medium">TechCrunch.com link placed</span>
                            </div>
                            <span className="text-green-400 text-xs">Live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Items */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">Link Placed</div>
                        <div className="text-gray-400 text-sm">TechBlog.com</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">Processing</div>
                        <div className="text-gray-400 text-sm">DesignHub.net</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">Verified</div>
                        <div className="text-gray-400 text-sm">StartupNews.io</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Looping promo video */
                <div className="relative">
                  <button
                    onClick={() => setShowDemo(false)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <video
                      src="/Linkzy_Dashboard.mp4"
                      className="w-full h-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                      disablePictureInPicture
                      controls={false}
                      poster="/chainlink.PNG"
                    />
                    {/* Autoplay nudge for Safari/iOS */}
                    <script dangerouslySetInnerHTML={{
                      __html: `
                    (function(){
                      var v=document.querySelector('video[src="/Linkzy_Dashboard.mp4"]');
                      if(v){ var play=()=>v.play().catch(()=>{}); document.addEventListener('visibilitychange',play,{once:true}); setTimeout(play, 100); }
                    })();
                  `}} />
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setShowDemo(false); handleGetStartedClick(); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
                    >
                      <span>Start Building Backlinks</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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

export default Hero;