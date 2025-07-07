import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, RefreshCw, Copy } from 'lucide-react';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase';

const WelcomeEmailDemo = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendTestWelcomeEmail = async () => {
    setIsSending(true);
    setSendResult('');
    setSendStatus('idle');

    try {
      console.log('📧 Sending test welcome email...');
      
      // Use the working resend-email function instead of send-welcome-email
      const welcomeEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🎉 Welcome to Linkzy - Your Account is Ready!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .api-key { background: #1e293b; color: #22c55e; padding: 20px; border-radius: 10px; font-family: monospace; word-break: break-all; margin: 20px 0; font-size: 14px; border: 2px solid #22c55e; }
        .dashboard-button { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; background: #f1f5f9; }
        .feature-list { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 10px; padding: 25px; margin: 25px 0; border: 2px solid #22c55e; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-item { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-number { font-size: 24px; font-weight: 700; color: #f97316; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Linkzy!</h1>
            <p>Your premium backlink platform is ready!</p>
        </div>
        
        <div class="content">
            <h2>🎯 Your Account Details</h2>
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0;">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">3</div>
                        <div class="stat-label">Free Credits</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">24-48h</div>
                        <div class="stat-label">Placement Time</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">DA 20+</div>
                        <div class="stat-label">Min Authority</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">Manual Review</div>
                    </div>
                </div>
                
                <p><strong>📧 Email:</strong> hello@creativize.net</p>
                <p><strong>🌐 Website:</strong> https://creativize.net</p>
                <p><strong>🎯 Niche:</strong> 🎨 Creative Services & Arts</p>
            </div>
            
            <div class="api-key">
                <strong>🔑 Your API Key:</strong><br>
                linkzy_demo_test_api_key_12345
            </div>
            
            <div class="feature-list">
                <h3>🚀 What You Get:</h3>
                <ul>
                    <li>✅ <strong>3 high-quality backlinks</strong> on DA 20+ websites</li>
                    <li>✅ <strong>Real-time analytics dashboard</strong></li>
                    <li>✅ <strong>24-48 hour placement guarantee</strong></li>
                    <li>✅ <strong>Full API access</strong> for automation</li>
                    <li>✅ <strong>Performance tracking & reports</strong></li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="https://linkzy.ai/dashboard" class="dashboard-button">
                    🚀 Access Your Dashboard
                </a>
            </div>
            
            <h3>📈 Get Started in 3 Easy Steps:</h3>
            <ol>
                <li><strong>Access Dashboard:</strong> Click the button above to log in</li>
                <li><strong>Submit Request:</strong> Provide your target URL and anchor text</li>
                <li><strong>Track Results:</strong> Monitor your backlinks in real-time</li>
            </ol>
        </div>
        
        <div class="footer">
            <p><strong>Need help?</strong> Email us at hello@linkzy.ai</p>
            <p>Linkzy - Building better backlinks, one link at a time.</p>
        </div>
    </div>
</body>
</html>
      `;

      const { data, error } = await supabase.functions.invoke('resend-email', {
        body: {
          to: 'hello@creativize.net',
          subject: '🎉 Welcome to Linkzy - Your Account is Ready! (Demo)',
          html: welcomeEmailHtml,
          from: 'Linkzy Team <hello@linkzy.ai>',
          tags: [
            { name: 'category', value: 'welcome_demo' },
            { name: 'user_type', value: 'demo_user' },
            { name: 'niche', value: 'creative-arts' }
          ]
        }
      });

      if (error) {
        console.error('❌ Failed to send welcome email:', error);
        setSendStatus('error');
        setSendResult(`❌ Failed to send: ${error.message}`);
        return;
      }

      console.log('✅ Welcome email sent successfully:', data);
      setSendStatus('success');
      setSendResult('✅ Test welcome email sent to hello@creativize.net! Check your inbox (and spam folder).');

    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      setSendStatus('error');
      setSendResult(`❌ Error: ${error instanceof Error ? error.message : error}`);
    } finally {
      setIsSending(false);
    }
  };

  const welcomeEmailTemplate = `
🎉 Welcome to Linkzy!
Your premium backlink platform is ready to boost your SEO

🎯 Your Account Details
📧 Email: hello@creativize.net
🌐 Website: https://creativize.net  
🎯 Niche: 🎨 Creative Services & Arts
📊 Plan: Free Starter (can upgrade anytime)

🔑 Your API Key:
linkzy_demo_test_api_key_12345

🚀 What You Get With Your Free Account:
✅ 3 high-quality backlink placements on DA 20+ websites
✅ Real-time analytics dashboard with click tracking
✅ Niche-specific targeting in Creative Services & Arts
✅ 24-48 hour placement guarantee or money back
✅ Manual quality review of every placement
✅ Full API access for automation and integration
✅ Performance tracking & reports with ROI metrics
✅ Email notifications for new placements

📈 Get Started in 3 Easy Steps:

1️⃣ Access Your Dashboard
Your dashboard is ready! You have 3 free backlink credits to get started.

2️⃣ Submit Your First Backlink Request
In your dashboard, click "New Request" and provide:
🎯 Target URL: The exact page you want to rank higher
🔗 Anchor Text: Keywords you want to link with (e.g., "best creative services")
📝 Special Notes: Any specific requirements or preferences
🎪 Niche Targeting: We'll match Creative Services & Arts automatically

3️⃣ Track Your Results
Watch as your backlinks are placed within 24-48 hours. Monitor performance with our real-time analytics:
📊 Click tracking and traffic attribution
🔍 Domain authority and placement quality metrics
📈 SEO impact measurements and ranking improvements
📧 Email notifications for new placements and milestones

💡 Pro Tips for Maximum SEO Impact:
• Quality First: We only place links on sites with DA 20+ in your specific niche
• Natural Anchor Text: Use variations like "best creative services", "top designers", your brand name
• Target Specific Pages: Link to your best converting pages for maximum ROI
• Be Patient: SEO results typically show within 2-8 weeks of placement
• Scale Gradually: Start with 3-5 links, then increase based on results
• Track Everything: Use our analytics to measure traffic and conversion impact

🎯 What to Expect Next:
⏰ Within 24-48 hours: Your first backlinks will be placed on relevant, high-authority websites
📧 Within 1-2 hours: Email confirmation with placement details and live links
📈 Within 1-2 weeks: Links indexed by Google and other search engines
🚀 Within 2-8 weeks: Measurable improvements in search rankings and organic traffic
💰 ROI Impact: Most customers see 300-500% ROI within 90 days

💬 Need Help? We're Here!
Our team responds to all support requests within 2-4 hours:
📧 Email: hello@linkzy.ai
💬 Live Chat: Available in your dashboard
📚 Knowledge Base: linkzy.ai/docs
🎯 API Documentation: linkzy.ai/api

Thanks for choosing Linkzy! 🚀
Building better backlinks, one link at a time.
  `.trim();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Welcome Email Demo</h2>
          <p className="text-gray-400 text-sm">Preview and test the onboarding email new users receive</p>
        </div>
      </div>

      {/* Send Test Email */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-green-400 font-medium mb-3">📧 Send Test Welcome Email</h3>
        <p className="text-green-300 text-sm mb-4">
          Send yourself a copy of the exact welcome email that new users receive when they register.
        </p>
        
        <button
          onClick={sendTestWelcomeEmail}
          disabled={isSending}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
        >
          {isSending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sending Welcome Email...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Test to hello@creativize.net</span>
            </>
          )}
        </button>

        {sendResult && (
          <div className={`mt-4 p-3 rounded border ${
            sendStatus === 'success' 
              ? 'bg-green-900/20 border-green-500/30 text-green-400' 
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center space-x-2">
              {sendStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{sendResult}</span>
            </div>
          </div>
        )}
      </div>

      {/* Email Content Preview */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Welcome Email Content Preview</h3>
          <button 
            onClick={() => navigator.clipboard.writeText(welcomeEmailTemplate)}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Copy className="w-4 h-4" />
            <span className="text-sm">Copy</span>
          </button>
        </div>
        
        <div className="bg-gray-900 rounded p-4 border border-gray-600 max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
            {welcomeEmailTemplate}
          </pre>
        </div>
      </div>

      {/* Email Features */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-blue-400 font-medium mb-3">📧 Welcome Email Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2">📋 Content Includes:</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Personalized account details</li>
              <li>• Secure API key display</li>
              <li>• Complete feature overview</li>
              <li>• Step-by-step getting started guide</li>
              <li>• Pro tips for maximum SEO impact</li>
              <li>• Timeline expectations</li>
              <li>• Support contact information</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">✨ Design Features:</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Rich HTML styling with gradients</li>
              <li>• Mobile responsive design</li>
              <li>• Branded colors (orange theme)</li>
              <li>• Clear call-to-action buttons</li>
              <li>• Professional footer</li>
              <li>• Security warnings included</li>
              <li>• Niche-specific personalization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* When It's Triggered */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-purple-400 font-medium mb-3">🔄 When This Email Is Sent</h3>
        <div className="text-purple-300 text-sm space-y-2">
          <p><strong>Automatic Trigger:</strong> Sent immediately when a user completes registration</p>
          <p><strong>Personalization:</strong> Includes their actual email, website, niche, and API key</p>
          <p><strong>Delivery Method:</strong> Supabase Edge Function → Resend API → User's inbox</p>
          <p><strong>Fallback:</strong> If email fails, registration still succeeds (user can access dashboard)</p>
          <p><strong>Security:</strong> API keys and sensitive data handled server-side only</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEmailDemo;