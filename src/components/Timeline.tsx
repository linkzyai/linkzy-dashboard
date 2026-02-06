import React from 'react';
import { Clock } from 'lucide-react';

const Timeline = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">How Long Until </span>
            <span className="text-orange-500">Results?</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Here's what to expect in your first 90 days
          </p>
        </div>

        {/* Horizontal Timeline Roadmap */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
            
            {/* Step 1 */}
            <div className="flex-1 text-center min-w-[140px]">
              <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                1
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Day 1</h4>
              <p className="text-xs text-gray-400">Sign up in 30 seconds</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-orange-500 text-2xl">→</div>

            {/* Step 2 */}
            <div className="flex-1 text-center min-w-[140px]">
              <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                2
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Day 2-3</h4>
              <p className="text-xs text-gray-400">Matched with 5-10 sites</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-orange-500 text-2xl">→</div>

            {/* Step 3 */}
            <div className="flex-1 text-center min-w-[140px]">
              <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                3
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Week 1</h4>
              <p className="text-xs text-gray-400">First 3-5 backlinks live</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-orange-500 text-2xl">→</div>

            {/* Step 4 */}
            <div className="flex-1 text-center min-w-[140px]">
              <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                4
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Week 4</h4>
              <p className="text-xs text-gray-400">10-15 backlinks live</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-orange-500 text-2xl">→</div>

            {/* Step 5 - Final Result */}
            <div className="flex-1 text-center min-w-[140px]">
              <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                ✓
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Day 60-90</h4>
              <p className="text-xs text-gray-400">+24% avg traffic</p>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center bg-gray-900/50 border border-gray-700 rounded-2xl p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            <p className="text-white font-bold">
              Average time to see results: 60-90 days
            </p>
          </div>
          <p className="text-gray-400 text-sm">
            Most members see traffic increase within 2-3 months as Google indexes backlinks. 
            <span className="text-orange-400 font-semibold"> SEO is a marathon, not a sprint.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
