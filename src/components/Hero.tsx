import React from 'react';
import { useState } from 'react';
import { Play, ArrowRight, TrendingUp, Link as LinkIcon, Users, Eye, ExternalLink } from 'lucide-react';
import RegistrationModal from './RegistrationModal';

const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Backlinks that
            <br />
            <span className="text-orange-500">actually work</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Stop wasting money on expensive link building. Get high-quality backlinks 
            from real niche blogs for 90% less than competitors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setIsModalOpen(true)}
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
                    src="/demo-video.mp4" 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    disablePictureInPicture
                    controls={false}
                    poster="/chainlink.PNG"
                  />
                  {/* Autoplay nudge for Safari/iOS */}
                  <script dangerouslySetInnerHTML={{__html: `
                    (function(){
                      var v=document.querySelector('video[src="/demo-video.mp4"]');
                      if(v){ var play=()=>v.play().catch(()=>{}); document.addEventListener('visibilitychange',play,{once:true}); setTimeout(play, 100); }
                    })();
                  `}} />
                </div>
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => { setShowDemo(false); setIsModalOpen(true); }}
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
      
      <RegistrationModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </>
  );
};

// Live Interactive Dashboard Demo Component
const LiveDashboardDemo = ({ 
  onClose, 
  onGetStarted 
}: { 
  onClose: () => void;
  onGetStarted: () => void;
}) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [backlinks, setBacklinks] = useState(2847);
  const [successRate, setSuccessRate] = useState(94);
  const [newLinkAdded, setNewLinkAdded] = useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 8);
      
      // Simulate new backlink every 4 seconds
      if (animationStep % 4 === 0) {
        setBacklinks(prev => prev + 1);
        setNewLinkAdded(true);
        setTimeout(() => setNewLinkAdded(false), 1000);
      }
      
      // Occasionally update success rate
      if (Math.random() > 0.8) {
        setSuccessRate(prev => Math.min(98, prev + (Math.random() > 0.5 ? 1 : 0)));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [animationStep]);

  const recentBacklinks = [
    { 
      id: 1, 
      url: 'TechCrunch.com', 
      status: 'success', 
      anchor: 'AI automation tools',
      da: 95,
      clicks: 47,
      isNew: newLinkAdded && animationStep % 4 === 0
    },
    { 
      id: 2, 
      url: 'Forbes.com', 
      status: 'success', 
      anchor: 'business efficiency',
      da: 92,
      clicks: 23
    },
    { 
      id: 3, 
      url: 'Entrepreneur.com', 
      status: animationStep > 4 ? 'success' : 'pending', 
      anchor: 'startup growth',
      da: 88,
      clicks: animationStep > 4 ? 12 : 0
    },
    { 
      id: 4, 
      url: 'Inc.com', 
      status: 'processing', 
      anchor: 'digital marketing',
      da: 85,
      clicks: 0
    },
  ];

  return (
    <div className="relative">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
      >
        <span className="text-sm">✕</span>
      </button>

      {/* Live Demo Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Live Dashboard Demo</h3>
            <p className="text-gray-400">Real-time backlink creation simulation</p>
          </div>
          <div className="flex items-center space-x-2 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Live Updates</span>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`bg-gray-800 rounded-lg p-4 transition-all duration-500 ${
          animationStep === 0 ? 'scale-105 border border-orange-500' : ''
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <LinkIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Total Backlinks</span>
          </div>
          <p className="text-2xl font-bold text-white">{backlinks.toLocaleString()}</p>
          <div className="flex items-center space-x-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs">+12.5%</span>
          </div>
        </div>

        <div className={`bg-gray-800 rounded-lg p-4 transition-all duration-500 ${
          animationStep === 1 ? 'scale-105 border border-orange-500' : ''
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{successRate}%</p>
          <div className="flex items-center space-x-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs">+2.1%</span>
          </div>
        </div>

        <div className={`bg-gray-800 rounded-lg p-4 transition-all duration-500 ${
          animationStep === 2 ? 'scale-105 border border-orange-500' : ''
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Traffic</span>
          </div>
          <p className="text-2xl font-bold text-white">1,247</p>
          <div className="flex items-center space-x-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs">+24%</span>
          </div>
        </div>

        <div className={`bg-gray-800 rounded-lg p-4 transition-all duration-500 ${
          animationStep === 3 ? 'scale-105 border border-orange-500' : ''
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Clicks</span>
          </div>
          <p className="text-2xl font-bold text-white">3,429</p>
          <div className="flex items-center space-x-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs">+18%</span>
          </div>
        </div>
      </div>

      {/* Live Backlinks Feed */}
      <div className="space-y-3">
        <h4 className="text-white font-semibold mb-3">Recent Backlink Placements</h4>
        {recentBacklinks.map((link) => (
          <div 
            key={link.id} 
            className={`flex items-center justify-between p-3 bg-gray-800 rounded-lg transition-all duration-500 ${
              link.isNew ? 'animate-pulse bg-green-900/20 border border-green-500/30' : ''
            } ${
              link.status === 'processing' && animationStep % 4 === 0 ? 'bg-orange-900/20 border border-orange-500/30' : ''
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <p className="text-white font-medium text-sm">{link.url}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  link.status === 'success' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : link.status === 'pending'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {link.status.toUpperCase()}
                </span>
                <span className="bg-purple-500/20 text-white px-2 py-1 rounded-full text-xs border border-purple-500/30">
                  DA {link.da}
                </span>
              </div>
              <p className="text-gray-400 text-xs">"{link.anchor}"</p>
              {link.clicks > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <Eye className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-500 text-xs">{link.clicks} clicks</span>
                </div>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>

      {/* Processing Indicator */}
      <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-blue-400 text-sm font-medium">Processing {3 + (animationStep % 2)} new requests...</p>
        </div>
      </div>

      {/* CTA at bottom */}
      <div className="mt-6 text-center">
        <button 
          onClick={onGetStarted}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
        >
          <span>Start Building Backlinks</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Hero;