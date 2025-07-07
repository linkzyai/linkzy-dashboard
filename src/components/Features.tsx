import React from 'react';
import { Target, Zap, BarChart3, Globe } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Target,
      title: "Niche-Relevant Placement",
      description: "Your links are placed only in blogs that match your industry and target audience for maximum relevance and impact."
    },
    {
      icon: Zap,
      title: "Lightning Fast Setup",
      description: "Get started in under 30 seconds. No complex WordPress plugins or technical configuration required."
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track every click, monitor performance, and see exactly where your backlinks are placed with detailed reporting."
    },
    {
      icon: Globe,
      title: "Universal Compatibility",
      description: "Works with ANY website platform - WordPress, Shopify, Wix, custom sites, and everything in between."
    }
  ];

  return (
    <section id="features" className="bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose <span className="text-orange-500">Linkzy</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stop wasting time and money on expensive, complicated link building solutions. Get 
            better results for 90% less cost.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="bg-black border border-gray-600 rounded-2xl p-6 hover:border-orange-500 hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comparison Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-black border border-red-500/50 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-red-400 text-xl">✕</span>
              <h3 className="text-xl font-bold text-white">Traditional Agency Limitations</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li>• High monthly fees ($199–$899+ per month)</li>
              <li>• Complex onboarding and setup</li>
              <li>• Locked into their platform or process</li>
              <li>• Limited transparency and reporting</li>
              <li>• Little control or customization</li>
            </ul>
          </div>
          
          <div className="bg-black border border-orange-500/50 rounded-2xl p-6 hover:border-orange-500 hover:shadow-[0_0_80px_rgba(249,115,22,0.7)] hover:bg-gray-900/30 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-green-400 text-xl">✓</span>
              <h3 className="text-xl font-bold text-white">Linkzy Advantages</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li>• Works on ANY website</li>
              <li>• 30-second setup</li>
              <li>• $10-$49 one-time payment</li>
              <li>• Complete independence</li>
              <li>• Full control & customization</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;