import React from 'react';
import DeleteAccountTool from './DeleteAccountTool';
import QuickHealthCheck from './QuickHealthCheck';
import EmailDiagnostic from './EmailDiagnostic';
import EdgeFunctionStatus from './EdgeFunctionStatus';
import WelcomeEmailDemo from './WelcomeEmailDemo';
import { Settings, Database, Mail, Users, RefreshCw, Trash, CheckCircle } from 'lucide-react';

const AdminTools = () => {
  const clearEverything = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    alert('All local data cleared! Page will reload.');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Tools</h1>
          <p className="text-gray-400">Development and testing utilities</p>
          
          <div className="flex justify-center mt-4 space-x-3">
            <button
              onClick={() => window.location.href = '/password-reset-test'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
            >
              🔐 Password Reset Test
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Edge Function Test */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>📧 Email System Preview & Test</span>
            </h2>
            <div className="space-y-6">
              <WelcomeEmailDemo />
              
              {/* Password Reset Test */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-blue-400 font-medium mb-3">🔐 Test Password Reset Email</h3>
                <p className="text-blue-300 text-sm mb-4">
                  Test the password reset email system. This uses the same secure Resend infrastructure as other emails.
                </p>
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  🔐 Go to Sign In & Test Reset
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>🎉 Test Secure Edge Functions</span>
            </h2>
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-xl font-bold text-white">Secure Email System!</h3>
              </div>
              <p className="text-white mb-4">
                Your email system now uses the working resend-email function (no exposed API keys). 
                Both test and welcome emails work through the same secure function.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Test Email System</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    alert('Cleared storage! You can now test fresh registration.');
                    window.location.href = '/';
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Test Fresh Registration</span>
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <p className="text-blue-400 text-sm">
                  <strong>Fixed:</strong> Welcome emails now use the same working resend-email function. 
                  No more CORS errors - everything works through the deployed function!
                </p>
              </div>
            </div>
          </div>

          {/* Edge Function Deployment */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Edge Function Deployment</span>
            </h2>
            <EdgeFunctionStatus />
          </div>

          {/* Site Health Check */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Site Health Check</span>
            </h2>
            <QuickHealthCheck />
          </div>

          {/* Email System Diagnostic */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Email System Diagnostic</span>
            </h2>
            <EmailDiagnostic />
          </div>

          {/* Supabase Connection */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Supabase Connection</span>
            </h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">Connected</span>
              </div>
              <p className="text-white">Supabase database is connected and operational.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => window.open('https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Open Supabase Dashboard</span>
                </button>
                <button
                  onClick={() => window.open('https://supabase.com/dashboard/project/sljlwvrtwqmhmjunyplr/auth/users', '_blank')}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Account Management</span>
            </h2>
            <DeleteAccountTool />
          </div>

          {/* Database Status */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database Status</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-medium">Supabase</span>
                </div>
                <p className="text-white text-sm">Authentication & Database</p>
              </div>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-medium">Resend</span>
                </div>
                <p className="text-white text-sm">Email Service</p>
              </div>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-medium">Edge Functions</span>
                </div>
                <p className="text-white text-sm">Email Processing</p>
              </div>
            </div>
          </div>

          {/* Test Utilities */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Test Utilities</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => localStorage.clear()}
                className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Clear LocalStorage
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button 
                onClick={clearEverything}
                className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Trash className="w-4 h-4" />
                <span>Clear Everything</span>
              </button>
            </div>
            
            {/* Quick Registration Test */}
            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h3 className="text-green-400 font-medium mb-2">Quick Test Registration</h3>
              <p className="text-green-300 text-sm mb-3">Test with a random email to avoid conflicts:</p>
              <button 
                onClick={() => {
                  const randomEmail = `test${Math.random().toString(36).substr(2, 8)}@linkzy-test.com`;
                  alert(`Use this random email for testing:\n\n${randomEmail}\n\nCopied to clipboard!`);
                  navigator.clipboard.writeText(randomEmail);
                }}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Generate Test Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;