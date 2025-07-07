import React from 'react';
import { Link as LinkIcon, ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';

const Blog = () => {
  // Placeholder blog posts
  const blogPosts = [
    {
      title: "The Ultimate Guide to High-Quality Backlinks in 2024",
      excerpt: "Learn how to identify and acquire backlinks that actually move the needle for your SEO rankings.",
      date: "December 20, 2024",
      readTime: "8 min read",
      category: "SEO Strategy"
    },
    {
      title: "Why Most Link Building Strategies Fail (And How to Fix Yours)",
      excerpt: "Discover the common mistakes that sabotage link building campaigns and how to avoid them.",
      date: "December 15, 2024", 
      readTime: "6 min read",
      category: "Link Building"
    },
    {
      title: "Domain Authority vs. Page Authority: What Really Matters?",
      excerpt: "Understanding the difference between DA and PA and which metrics you should prioritize.",
      date: "December 10, 2024",
      readTime: "5 min read", 
      category: "SEO Metrics"
    }
  ];

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
            Linkzy <span className="text-orange-500">Blog</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Expert insights, strategies, and tips to help you master SEO and build high-quality backlinks.
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Blog Coming Soon! 🚀</h2>
          <p className="text-gray-300 mb-6">
            We're working on creating valuable content to help you succeed with SEO and link building. 
            Check back soon for expert guides, case studies, and industry insights.
          </p>
          <a 
            href="mailto:hello@linkzy.ai?subject=Blog Notification Request"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            <span>Notify Me When Posts Are Live</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Preview Posts */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-white text-center mb-8">What's Coming</h3>
          
          {blogPosts.map((post, index) => (
            <div key={index} className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors opacity-75">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{post.excerpt}</p>
                </div>
                
                <div className="ml-6 text-gray-500">
                  <span className="text-sm">Coming Soon</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-gray-300 mb-6">
            Be the first to know when we publish new content about SEO, link building, and digital marketing.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex space-x-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;