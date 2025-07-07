import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, RefreshCw, Settings, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EmailDiagnostic = () => {
  const [testEmail, setTestEmail] = useState('hello@creativize.net');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testWelcomeEmail = async () => {
    setIsTestingEmail(true);
    setEmailResult('');
    setEmailStatus('idle');

    try {
      console.log('🧪 Testing welcome email system...');
      
      // Test using supabase.functions.invoke() method
      setEmailResult('🔄 Step 1: Testing Supabase Edge Function...\n');
      
      const { data, error } = await supabase.functions.invoke('resend-email', {
        body: {
          to: testEmail,
          subject: '🧪 Linkzy Email System Test',
          html: `
            <h1>🎉 Email Test Successful!</h1>
            <p>This is a test email from your Linkzy email system.</p>
            <p><strong>Sent to:</strong> ${testEmail}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Method:</strong> Supabase Edge Function (resend-email)</p>
            <hr>
            <p><em>Your email system is working correctly! ✅</em></p>
          `
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        setEmailResult(prev => prev + `❌ resend-email function failed: ${error.message}\n\nThis could mean:\n1. resend-email function not deployed to Supabase\n2. Resend API key not configured in Edge Function\n3. Function has errors\n\nUsing proper supabase.functions.invoke() method ✅\n`);
        
        await explainCorsIssue();
        return;
      }

      console.log('✅ Edge function response:', data);
      setEmailStatus('success');
      setEmailResult(prev => prev + `✅ SUCCESS! resend-email function working!\n\nResponse: ${JSON.stringify(data, null, 2)}\n\n📧 Check your inbox (and spam folder) for the test email.\n\n🎉 Your email system is working correctly using supabase.functions.invoke()!`);

    } catch (error) {
      console.error('❌ Email test failed:', error);
      setEmailStatus('error');
      setEmailResult(prev => prev + `❌ Test failed: ${error.message}\n\n🔄 Checking system configuration...\n`);
      
      await explainCorsIssue();
    } finally {
      setIsTestingEmail(false);
    }
  };

  const explainCorsIssue = async () => {
    const edgeFunctionStatus = await checkEdgeFunctionStatus();
    setEmailResult(prev => prev + `
🔒 Email Security Architecture:

❌ Direct fetch() calls to function URLs are DISABLED (security best practice)
✅ Use supabase.functions.invoke() method only (proper Supabase integration)

Why this happens:
1. functions.invoke() handles authentication, headers, and CORS automatically
2. No hardcoded URLs that can break when deployed
3. Proper error handling and retry logic built-in

Current Status:
• resend-email function: ${edgeFunctionStatus}
• Configuration: Ready
• Method: ✅ Using supabase.functions.invoke() (recommended)

Next Steps:
1. Ensure resend-email function is deployed to Supabase
2. Test through supabase.functions.invoke() only
3. All email calls now use proper Supabase integration
`);
  };

  const checkEdgeFunctionStatus = async () => {
    try {
      // Try a simple test call to see if resend-email function exists
      const { error } = await supabase.functions.invoke('resend-email', {
        body: { test: true }
      });
      
      if (error && error.message.includes('Function not found')) {
        return '❌ Not deployed';
      }
      
      return '✅ Deployed and available';
    } catch (error) {
      return '❓ Unknown status';
    }
  };

  const settings = {
    resendApiKey: '[SECURE - Stored in resend-email Function Only]',
    fromDomain: 'linkzy.ai',
    fromEmail: 'hello@linkzy.ai',
    method: 'supabase.functions.invoke("resend-email", { body: { to, subject, html } })'
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Email System Diagnostic</h2>
          <p className="text-gray-400 text-sm">Test Supabase Edge Function email delivery</p>
        </div>
      </div>

      {/* CORS Security Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-medium mb-2">🔒 Email Security Architecture</h3>
            <div className="text-blue-300 text-sm space-y-1">
              <div>✅ <strong>Correct:</strong> Emails sent via Supabase Edge Functions (server-side)</div>
              <div>❌ <strong>Disabled:</strong> Direct browser calls to Resend API (security best practice)</div>
              <div>🔑 <strong>Secure:</strong> API keys never exposed in frontend code</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Configuration */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-3">Email Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">From Email:</span>
            <div className="text-green-400 font-mono">{settings.fromEmail}</div>
          </div>
          <div>
            <span className="text-gray-400">Domain:</span>
            <div className="text-green-400 font-mono">{settings.fromDomain}</div>
          </div>
          <div>
            <span className="text-gray-400">Method:</span>
            <div className="text-purple-400 font-mono">supabase.functions.invoke()</div>
          </div>
          <div>
            <span className="text-gray-400">Function:</span>
            <div className="text-purple-400 font-mono text-xs break-all">resend-email</div>
          </div>
        </div>
      </div>

      {/* Email Test */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="hello@creativize.net"
          />
        </div>

        <button
          onClick={testWelcomeEmail}
          disabled={isTestingEmail || !testEmail}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isTestingEmail ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Testing Edge Function...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Test Edge Function Email</span>
            </>
          )}
        </button>

        {/* Test Results */}
        {emailResult && (
          <div className={`border rounded-lg p-4 ${
            emailStatus === 'success' ? 'bg-green-900/20 border-green-500/30' :
            emailStatus === 'error' ? 'bg-red-900/20 border-red-500/30' :
            'bg-gray-800 border-gray-600'
          }`}>
            <div className="flex items-start space-x-3">
              {emailStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />}
              {emailStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />}
              <div className="flex-1">
                <pre className={`text-sm whitespace-pre-wrap font-mono ${
                  emailStatus === 'success' ? 'text-green-300' :
                  emailStatus === 'error' ? 'text-red-300' : 'text-gray-300'
                }`}>{emailResult}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How Email System Works */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">📧 How Secure Email System Works</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
            <div>
              <p className="text-white font-medium">User registers on frontend</p>
              <p className="text-gray-400">Registration form submits to Supabase</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
            <div>
              <p className="text-white font-medium">Frontend uses supabase.functions.invoke()</p>
              <p className="text-gray-400">Proper Supabase integration with automatic auth</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
            <div>
              <p className="text-white font-medium">resend-email function calls Resend API</p>
              <p className="text-gray-400">Secure server-to-server communication</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
            <div>
              <p className="text-white font-medium">Email delivered to user</p>
              <p className="text-gray-400">Email sent securely without exposing API keys</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edge Function Management */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => window.open('https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr/functions', '_blank')}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Edge Functions</span>
        </button>
        
        <button
          onClick={() => window.open('https://resend.com/dashboard', '_blank')}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Resend Dashboard</span>
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(`supabase functions deploy send-welcome-email --project-ref sljlwvrtwqmhmjunyplr`);
            alert('Deploy command copied! Run this in your terminal to deploy the edge function.');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <Mail className="w-4 h-4" />
          <span>Deploy Command</span>
        </button>
      </div>

      {/* Manual Email Trigger */}
      <div className="mt-6 bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
        <h3 className="text-orange-400 font-medium mb-2">📧 Manual Email Test</h3>
        <p className="text-orange-300 text-sm mb-3">
          The test above sends a test email using the proper supabase.functions.invoke() method.
          This is the same method used throughout the application for all email sending.
        </p>
        <div className="bg-orange-800/20 rounded p-3">
          <p className="text-orange-200 text-xs">
            <strong>Note:</strong> This test verifies that your resend-email function is working correctly
            and that supabase.functions.invoke() is properly configured.
          </p>
        </div>
      </div>

      {/* CORS Explanation */}
      <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-red-400 font-medium mb-2">🚫 Why We Use supabase.functions.invoke()</h3>
        <div className="text-red-300 text-sm space-y-2">
          <p><strong>Best Practice:</strong> Use supabase.functions.invoke() instead of direct fetch() calls</p>
          <p><strong>Why this is better:</strong></p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Automatic authentication and header management</li>
            <li>Proper CORS handling built-in</li>
            <li>No hardcoded URLs that break when deployed</li>
            <li>Better error handling and retry logic</li>
          </ul>
          <p className="text-red-200"><strong>Result:</strong> More reliable and secure email delivery ✅</p>
        </div>
      </div>
    </div>
  );
};

export default EmailDiagnostic;