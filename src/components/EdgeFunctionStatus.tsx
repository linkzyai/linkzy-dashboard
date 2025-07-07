import React, { useState } from 'react';
import { 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Copy,
  Terminal,
  Code,
} from 'lucide-react';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase';

const EdgeFunctionStatus = () => {
  const [checking, setChecking] = useState(false);
  const [functions, setFunctions] = useState<Array<{
    name: string;
    status: 'deployed' | 'not-deployed' | 'error';
    message: string;
    details?: string;
  }>>([]);

  const checkEdgeFunctions = async () => {
    setChecking(true);
    
    const functionsToCheck = [
      'send-welcome-email',
      'send-verification-email'
    ];
    
    const results = [];
    
    for (const functionName of functionsToCheck) {
      try {
        console.log(`🔍 Checking edge function: ${functionName}`);
        
        // Try to invoke the function with a test payload
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { test: true }
        });
        
        if (error) {
          if (error instanceof Error && error.message.includes('Function not found') || error.message.includes('404')) {
            results.push({
              name: functionName,
              status: 'not-deployed' as 'not-deployed',
              message: '❌ Function not deployed',
              details: 'Function exists in code but not deployed to Supabase'
            });
          } else {
            results.push({
              name: functionName,
              status: 'deployed' as 'deployed',
              message: '✅ Function deployed (with errors)',
              details: `Function responds but has issues: ${error instanceof Error ? error.message : error}`
            });
          }
        } else {
          results.push({
            name: functionName,
            status: 'deployed' as 'deployed',
            message: '✅ Function deployed and working',
            details: 'Function responds correctly to test calls'
          });
        }
        
      } catch (error) {
        results.push({
          name: functionName,
          status: 'error' as 'error',
          message: '❌ Check failed',
          details: `Error checking function: ${error instanceof Error ? error.message : error}`
        });
      }
    }
    
    setFunctions(results);
    setChecking(false);
  };

  const copyDeployCommand = (functionName: string) => {
    const command = `supabase functions deploy ${functionName} --project-ref sljlwvrtwqmhmjunyplr`;
    navigator.clipboard.writeText(command);
    alert('Deploy command copied to clipboard!');
  };

  const copyDeployAllCommand = () => {
    const commands = `# Deploy all edge functions
supabase functions deploy send-welcome-email --project-ref sljlwvrtwqmhmjunyplr
supabase functions deploy send-verification-email --project-ref sljlwvrtwqmhmjunyplr`;
    navigator.clipboard.writeText(commands);
    alert('All deploy commands copied to clipboard!');
  };

  const projectInfo = {
    projectRef: 'sljlwvrtwqmhmjunyplr',
    supabaseUrl: 'https://sljlwvrtwqmhmjunyplr.supabase.co'
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Cloud className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Edge Function Deployment Status</h2>
            <p className="text-gray-400 text-sm">Check if your Supabase Edge Functions are deployed</p>
          </div>
        </div>
        
        <button
          onClick={checkEdgeFunctions}
          disabled={checking}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </button>
      </div>

      {/* Project Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-3">Supabase Project Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Project Reference:</span>
            <div className="text-green-400 font-mono">{projectInfo.projectRef}</div>
          </div>
          <div>
            <span className="text-gray-400">Project URL:</span>
            <div className="text-blue-400 font-mono break-all">{projectInfo.supabaseUrl}</div>
          </div>
        </div>
      </div>

      {/* Edge Function Status */}
      {functions.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-white font-semibold">Function Status</h3>
          {functions.map((func, index) => (
            <div key={index} className={`border rounded-lg p-4 ${
              func.status === 'deployed' ? 'bg-green-900/20 border-green-500/30' :
              func.status === 'not-deployed' ? 'bg-red-900/20 border-red-500/30' :
              'bg-orange-900/20 border-orange-500/30'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {func.status === 'deployed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {func.status === 'not-deployed' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {func.status === 'error' && <AlertCircle className="w-5 h-5 text-orange-400" />}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{func.name}</h4>
                    <p className="text-gray-300 text-sm">{func.message}</p>
                    {func.details && (
                      <p className="text-gray-400 text-xs mt-1">{func.details}</p>
                    )}
                  </div>
                </div>
                
                {func.status === 'not-deployed' && (
                  <button
                    onClick={() => copyDeployCommand(func.name)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Deploy</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deployment Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-blue-400 font-medium mb-3">📚 How to Deploy Edge Functions</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Step 1: Install Supabase CLI</h4>
            <div className="bg-gray-800 rounded p-3 font-mono text-sm">
              <div className="text-gray-400 mb-1"># Install via npm</div>
              <div className="text-green-400">npm install -g supabase</div>
              <div className="text-gray-400 mt-2 mb-1"># Or via brew (macOS)</div>
              <div className="text-green-400">brew install supabase/tap/supabase</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Step 2: Login to Supabase</h4>
            <div className="bg-gray-800 rounded p-3 font-mono text-sm">
              <div className="text-green-400">supabase login</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Step 3: Deploy Functions</h4>
            <div className="bg-gray-800 rounded p-3 font-mono text-sm">
              <div className="text-green-400">supabase functions deploy send-welcome-email --project-ref {projectInfo.projectRef}</div>
              <div className="text-green-400 mt-1">supabase functions deploy send-verification-email --project-ref {projectInfo.projectRef}</div>
            </div>
            <button
              onClick={copyDeployAllCommand}
              className="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy all deploy commands</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alternative: Deploy via Supabase Dashboard */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-purple-400 font-medium mb-3">🌐 Alternative: Deploy via Dashboard</h3>
        <p className="text-purple-300 text-sm mb-3">
          You can also deploy edge functions through the Supabase web dashboard:
        </p>
        <ol className="text-purple-300 text-sm space-y-2 list-decimal list-inside">
          <li>Go to your Supabase project dashboard</li>
          <li>Navigate to Edge Functions section</li>
          <li>Create new function or upload your function code</li>
          <li>Deploy directly from the web interface</li>
        </ol>
        <button
          onClick={() => window.open(`https://supabase.com/dashboard/project/${projectInfo.projectRef}/functions`, '_blank')}
          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Edge Functions Dashboard</span>
        </button>
      </div>

      {/* Local Development */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-green-400 font-medium mb-3">🔧 Local Development & Testing</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-white font-medium mb-1">Start local development server:</h4>
            <div className="bg-gray-800 rounded p-3 font-mono text-sm">
              <div className="text-green-400">supabase start</div>
              <div className="text-green-400">supabase functions serve</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-1">Test functions locally:</h4>
            <div className="bg-gray-800 rounded p-3 font-mono text-sm">
              <div className="text-green-400">curl -X POST 'http://localhost:54321/functions/v1/send-welcome-email' \</div>
              <div className="text-green-400">  -H 'Content-Type: application/json' \</div>
              <div className="text-green-400">  -d '{"{"}\"test\": true{"}"}'</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Function Files */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">📁 Current Function Files</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">supabase/functions/send-welcome-email/index.ts</span>
            <span className="text-green-400">✅ Ready</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">supabase/functions/send-verification-email/index.ts</span>
            <span className="text-green-400">✅ Ready</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-orange-900/20 rounded border border-orange-500/30">
          <p className="text-orange-300 text-sm">
            <strong>Note:</strong> Your function files exist in the codebase, but they need to be deployed to Supabase 
            before they can be used by your application. Use the commands above to deploy them.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => window.open(`https://supabase.com/dashboard/project/${projectInfo.projectRef}/functions`, '_blank')}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <Cloud className="w-4 h-4" />
          <span>Functions Dashboard</span>
        </button>
        
        <button
          onClick={() => window.open('https://supabase.com/docs/guides/functions', '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <Code className="w-4 h-4" />
          <span>Functions Docs</span>
        </button>
        
        <button
          onClick={() => navigator.clipboard.writeText('supabase --help')}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <Terminal className="w-4 h-4" />
          <span>CLI Help</span>
        </button>
      </div>
    </div>
  );
};

export default EdgeFunctionStatus;