import React from 'react';
import { ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It <span className="text-orange-500">Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get high-quality backlinks in three simple steps. No technical knowledge required.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Step 1 */}
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                01
              </div>
              <h3 className="text-2xl font-bold text-white">Choose Your Niche</h3>
            </div>
            <div className="flex items-center space-x-2 text-green-400 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm">Niche-specific targeting</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Select from Technology, Home Services, or Recipes to ensure your backlinks 
              are placed in relevant, high-quality blogs.
            </p>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
              onClick={() => {
                const getStartedBtn = document.getElementById('get-started-btn');
                if (getStartedBtn) {
                  getStartedBtn.click();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <span>Select Your Niche</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 hover:shadow-orange-500/20 hover:shadow-2xl hover:bg-gray-900/70 transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-white font-semibold mb-4">Select Your Niche:</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-white">🏠 Home Services</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400">💻 Technology</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400">🍳 Recipes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 order-2 lg:order-1 flex flex-col items-center justify-center hover:border-orange-500/50 hover:shadow-orange-500/20 hover:shadow-2xl hover:bg-gray-900/70 transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-white font-semibold mb-4">Easy Integration</h4>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                <span className="text-4xl mb-2">🔌</span>
                <span className="text-orange-400 font-semibold">API, WordPress, Sitemap, or Blog</span>
                <span className="text-gray-400 text-sm mt-2 text-center">Connect your site in seconds for full automation</span>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 mt-2 w-full text-xs text-green-400 font-mono select-all overflow-x-auto">
                {'<script src="https://linkzy.ai/integrate.js" data-api-key="YOUR_API_KEY"></script>'}
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                02
              </div>
              <h3 className="text-2xl font-bold text-white">Integrate Website</h3>
            </div>
            <div className="flex items-center space-x-2 text-green-400 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm">Connect via API, WordPress, Sitemap, or Blog</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Integrate your website in seconds using our API, WordPress plugin, Sitemap, or Blog connection. This unlocks full automation—no manual requests, no per-link fees. Just connect and let Linkzy do the rest!
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                03
              </div>
              <h3 className="text-2xl font-bold text-white">Get Quality Backlinks</h3>
            </div>
            <div className="flex items-center space-x-2 text-green-400 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm">Fast, reliable results</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Watch as your links are placed in 2-3 relevant blog posts within 24-48 hours. 
              Track performance in real-time.
            </p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 hover:shadow-orange-500/20 hover:shadow-2xl hover:bg-gray-900/70 transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="text-white font-semibold mb-4">Live Results:</h4>
            <div className="space-y-3">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white font-medium">Link Placed</span>
                </div>
                <div className="text-gray-400 text-sm">TechBlog.com • 47 clicks</div>
              </div>
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white font-medium">Link Placed</span>
                </div>
                <div className="text-gray-400 text-sm">DevNews.io • 23 clicks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;