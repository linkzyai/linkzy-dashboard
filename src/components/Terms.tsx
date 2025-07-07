import React from 'react';
import { Link as LinkIcon, ArrowLeft } from 'lucide-react';

const Terms = () => {
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
            Terms of <span className="text-orange-500">Service</span>
          </h1>
          <p className="text-gray-400">Last updated: December 24, 2024</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using Linkzy's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Linkzy provides backlink placement services to help improve your website's search engine optimization (SEO). Our services include:
            </p>
            <ul className="text-gray-300 space-y-2 ml-6">
              <li>• Manual placement of backlinks on relevant, high-authority websites</li>
              <li>• Real-time analytics and performance tracking</li>
              <li>• API access for automated backlink requests</li>
              <li>• Customer support and consultation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Payment and Billing</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>
                Linkzy offers both one-time payment packages and monthly subscription plans. All payments are processed securely through Stripe.
              </p>
              <p>
                Credits are non-refundable once backlink placement has begun. If a backlink placement fails due to our inability to find suitable websites, credits will be refunded to your account.
              </p>
              <p>
                Monthly subscriptions can be cancelled at any time and will remain active until the end of the current billing period.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Service Level Agreement</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>
                We strive to place backlinks within 24-48 hours of request submission. However, this timeframe may vary based on niche availability and quality requirements.
              </p>
              <p>
                We guarantee that all backlinks will be placed on websites with a Domain Authority (DA) of at least 20, unless specifically requested otherwise.
              </p>
              <p>
                If we cannot fulfill a backlink request within 7 days, we will either provide alternative options or refund the credit to your account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use Policy</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>You agree not to use our services for:</p>
              <ul className="space-y-2 ml-6">
                <li>• Illegal, harmful, or offensive content</li>
                <li>• Spam or misleading information</li>
                <li>• Adult content or gambling websites</li>
                <li>• Websites that violate intellectual property rights</li>
                <li>• Any content that violates applicable laws or regulations</li>
              </ul>
              <p>
                We reserve the right to refuse service for any website that does not meet our quality and content standards.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. API Usage</h2>
            <p className="text-gray-300 leading-relaxed">
              API access is provided for automated integration with your systems. Rate limits apply to ensure fair usage. Excessive usage may result in temporary suspension of API access. All API requests must include proper authentication using your provided API key.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              Linkzy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Privacy and Data Protection</h2>
            <p className="text-gray-300 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our services, to understand our practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform. Continued use of our services after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
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

export default Terms;