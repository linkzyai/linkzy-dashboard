import React from 'react';
import { Link as LinkIcon, Target, Users, Zap, ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">Linkzy</span>
            </div>
            
            <a 
              href="/" 
              className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About <span className="text-orange-500">Linkzy</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're on a mission to democratize high-quality SEO by making professional backlinks accessible and affordable for everyone.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Linkzy was born from a simple frustration: why should high-quality backlinks cost hundreds or thousands of dollars? We watched countless small businesses and entrepreneurs struggle with expensive SEO agencies and complicated link-building tools that promised the world but delivered mediocre results.
            </p>
            <p>
              Traditional solutions often charge anywhere from $199 to $899 per month—and usually lock you into long-term contracts or complex ecosystems. We thought there had to be a better way. So we built one.
            </p>
            <p>
              Today, Linkzy helps thousands of websites get the same quality backlinks that enterprise companies pay thousands for, but for 90% less cost and with zero technical complexity.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Quality First</h3>
            <p className="text-gray-300 text-sm">
              Every backlink is manually vetted and placed on real, high-authority websites in your niche.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Accessibility</h3>
            <p className="text-gray-300 text-sm">
              Professional SEO shouldn't be reserved for big corporations. We make it affordable for everyone.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Simplicity</h3>
            <p className="text-gray-300 text-sm">
              No complex setups, no monthly contracts. Just submit your request and watch your rankings improve.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            To level the playing field in SEO by providing access to high-quality, affordable backlinks that help small businesses compete with enterprise companies. We believe that with the right tools and fair pricing, any website can achieve great search rankings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">2,847</div>
            <div className="text-gray-400 text-sm">Backlinks Placed</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">94%</div>
            <div className="text-gray-400 text-sm">Success Rate</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">$49</div>
            <div className="text-gray-400 text-sm">Average Savings</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">30s</div>
            <div className="text-gray-400 text-sm">Setup Time</div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-gray-300 mb-6">
            Have questions about Linkzy or want to partner with us? We'd love to hear from you.
          </p>
          <a 
            href="mailto:hello@linkzy.ai"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <span>Contact Us</span>
          </a>
        </div>
      </main>
    </div>
  );
};

export default About;