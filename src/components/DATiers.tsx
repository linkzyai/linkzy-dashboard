import React from 'react';
import { Shield } from 'lucide-react';

const DATiers = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Smart DA Matching - </span>
            <span className="text-orange-500">No Junk Links</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Only exchange backlinks with sites at your level. As your DA grows, you unlock higher tiers.
          </p>
        </div>

        {/* Horizontal Tier Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* Starter Tier - Bronze */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🥉</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Starter Network</h3>
            <div className="text-orange-500 font-bold text-xl mb-6">DA 0-29</div>
            
            <ul className="text-left text-gray-300 space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Perfect for new sites</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Match with DA 0-29 sites</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Build your foundation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Grow to Standard tier</span>
              </li>
            </ul>
          </div>

          {/* Standard Tier - Silver */}
          <div className="bg-gray-900/50 border-2 border-orange-500 rounded-2xl p-8 text-center relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </span>
            </div>
            
            <div className="text-5xl mb-3">🥈</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Standard Network</h3>
            <div className="text-orange-500 font-bold text-xl mb-6">DA 30-59</div>
            
            <ul className="text-left text-gray-300 space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>For established sites</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Match with DA 30-59 sites</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Accelerate your growth</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Quality backlinks</span>
              </li>
            </ul>
          </div>

          {/* Premium Tier - Gold */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🥇</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Premium Network</h3>
            <div className="text-orange-500 font-bold text-xl mb-6">DA 60+</div>
            
            <ul className="text-left text-gray-300 space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Exclusive high-authority</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Match with DA 60+ only</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Maintain elite status</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Premium backlinks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Why This Matters Box - Below Tiers */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 max-w-5xl mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-orange-500 mt-1" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Why This Matters:</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                <strong className="text-white">No link farms.</strong> You'll never exchange links with low-quality sites. 
                Our tier system ensures you only match with sites at your Domain Authority level, protecting your SEO 
                and helping you grow safely. As your DA increases, you automatically unlock higher tiers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DATiers;
