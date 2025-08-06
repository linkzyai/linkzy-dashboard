import React from 'react';
import { Link as LinkIcon, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">Linkzy</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Building high-quality backlinks that actually work. Get better SEO results for 90% less cost.
            </p>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>

              </li>
              <li>
                <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/demo" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-1">
                  <span>Live Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Get in touch with our team for support, partnerships, or any questions.
            </p>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-orange-500" />
              <a 
                href="mailto:hello@linkzy.ai" 
                className="text-orange-400 hover:text-orange-300 transition-colors text-sm"
              >
                hello@linkzy.ai
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Linkzy. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Built with ❤️ for better SEO
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;