import React from 'react';
import { Link as LinkIcon, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy <span className="text-orange-500">Policy</span>
          </h1>
          <p className="text-gray-400">Last updated: December 24, 2024</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="space-y-2 ml-6">
                <li>• Email address and contact information</li>
                <li>• Website URLs and target pages</li>
                <li>• Preferred anchor text and niche information</li>
                <li>• Payment information (processed securely through Stripe)</li>
                <li>• API usage data and backlink performance metrics</li>
              </ul>
              <p>
                We also automatically collect certain information when you use our services, including IP address, browser type, device information, and usage patterns.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="space-y-2 ml-6">
                <li>• Provide and maintain our backlink placement services</li>
                <li>• Process payments and manage your account</li>
                <li>• Communicate with you about your requests and our services</li>
                <li>• Analyze and improve our platform performance</li>
                <li>• Detect and prevent fraudulent activity</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
              </p>
              <ul className="space-y-2 ml-6">
                <li>• Service providers who assist us in operating our platform (e.g., payment processing)</li>
                <li>• Website owners where we place your backlinks (limited to necessary placement information)</li>
                <li>• When required by law or to protect our rights and safety</li>
                <li>• In connection with a business transfer or acquisition</li>
              </ul>
              <p>
                All third-party service providers are bound by confidentiality agreements and are prohibited from using your information for any other purpose.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="space-y-2 ml-6">
                <li>• SSL encryption for all data transmission</li>
                <li>• Secure API authentication and rate limiting</li>
                <li>• Regular security audits and monitoring</li>
                <li>• Limited access to personal information on a need-to-know basis</li>
                <li>• Secure payment processing through Stripe</li>
              </ul>
              <p>
                However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Account information is retained for the duration of your account plus 3 years for legal and business purposes. Backlink performance data may be retained longer for analytics and service improvement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>You have the right to:</p>
              <ul className="space-y-2 ml-6">
                <li>• Access and review your personal information</li>
                <li>• Correct inaccurate or incomplete information</li>
                <li>• Delete your account and associated data</li>
                <li>• Export your data in a portable format</li>
                <li>• Opt out of marketing communications</li>
                <li>• Restrict processing of your information</li>
              </ul>
              <p>
                To exercise these rights, please contact us at hello@linkzy.ai.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-300 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our platform. These help us understand usage patterns, remember your preferences, and provide personalized content. You can control cookie settings through your browser, though some features may not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and that appropriate safeguards are in place to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our services are not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our platform. Your continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at{' '}
              <a href="mailto:hello@linkzy.ai" className="text-orange-400 hover:text-orange-300 transition-colors">
                hello@linkzy.ai
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;