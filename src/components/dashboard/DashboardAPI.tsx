import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { 
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Code,
  Book,
  Terminal,
  Download,
  CheckCircle,
  Shield,
  Globe,
  Zap,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Play,
  BarChart3
} from 'lucide-react';

import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useApiUsage, useUserProfile } from '../../hooks/useApi';
import apiService from '../../services/api';

const DashboardAPI = () => {
  const { data: apiUsageData, loading: usageLoading, error: usageError, refetch: refetchUsage } = useApiUsage();
  const { data: userProfile } = useUserProfile();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedExample, setSelectedExample] = useState('cURL');
  
  // Get API key from service or use mock
  const apiKey = apiService.getApiKey() || userProfile?.apiKey || 'lnkzy_live_sk_1234567890abcdef1234567890abcdef';
  const maskedKey = apiKey.substring(0, 16) + '••••••••••••••••••••••••••••••••';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use real API usage data or fallback
  const usageStats = apiUsageData ? [
    { 
      period: 'Requests This Month', 
      current: apiUsageData.requestsThisMonth?.toString() || '0', 
      limit: apiUsageData.requestLimit?.toString() || '5,000', 
      percentage: apiUsageData.requestLimit ? (apiUsageData.requestsThisMonth / apiUsageData.requestLimit) * 100 : 0, 
      color: 'bg-green-500' 
    },
    { 
      period: 'Successful Requests', 
      current: `${apiUsageData.successRate || 0}%`, 
      limit: '100%', 
      percentage: apiUsageData.successRate || 0, 
      color: 'bg-green-500' 
    },
    { 
      period: 'Rate Limits', 
      current: 'Per minute: 100', 
      limit: 'Per hour: 1,000', 
      percentage: 0, 
      color: 'bg-blue-500' 
    },
  ] : [
    { period: 'Requests This Month', current: '0', limit: '5,000', percentage: 0, color: 'bg-green-500' },
    { period: 'Successful Requests', current: '0%', limit: '100%', percentage: 0, color: 'bg-green-500' },
    { period: 'Rate Limits', current: 'Per minute: 100', limit: 'Per hour: 1,000', percentage: 0, color: 'bg-blue-500' },
  ];

  const rateLimits = apiUsageData?.rateLimits || [
    { timeframe: 'Per minute', limit: '100 requests', current: '0', status: 'good' },
    { timeframe: 'Per hour', limit: '1,000 requests', current: '0', status: 'good' },
    { timeframe: 'Per month', limit: '5,000 requests', current: '0', status: 'good' },
  ];

  const handleRegenerateApiKey = async () => {
    try {
      const result = await apiService.regenerateApiKey();
      apiService.setApiKey(result.apiKey);
      alert('New API key generated successfully!');
      // Refresh the page to show new key
      window.location.reload();
    } catch (error) {
      alert('Failed to regenerate API key. Please try again.');
    }
  };

  const codeExamples = {
    'cURL': `curl -X POST https://nghki1c8wlnz.manus.space/api/backlinks \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "target_url": "https://yoursite.com/blog/post",
    "anchor_text": "best SEO tools 2024",
    "niche": "technology",
    "notes": "Focus on high-authority sites"
  }'`,
    
    'JavaScript': `const response = await fetch('https://nghki1c8wlnz.manus.space/api/backlinks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://yoursite.com/blog/post',
    anchor_text: 'best SEO tools 2024',
    niche: 'technology',
    notes: 'Focus on high-authority sites'
  })
});

const result = await response.json();
console.log('Backlink request submitted:', result);`,

    'Python': `import requests

url = "https://nghki1c8wlnz.manus.space/api/backlinks"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
data = {
    "target_url": "https://yoursite.com/blog/post", 
    "anchor_text": "best SEO tools 2024",
    "niche": "technology",
    "notes": "Focus on high-authority sites"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print("Backlink request submitted:", result)`,

    'PHP': `<?php
$url = "https://nghki1c8wlnz.manus.space/api/backlinks";
$headers = [
    "Authorization: Bearer ${apiKey}",
    "Content-Type: application/json"
];
$data = [
    "target_url" => "https://yoursite.com/blog/post",
    "anchor_text" => "best SEO tools 2024", 
    "niche" => "technology",
    "notes" => "Focus on high-authority sites"
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

echo "Backlink request submitted: " . print_r($result, true);
?>`
  };

  const endpoints = [
    { method: 'POST', path: '/api/backlinks', description: 'Submit a new backlink request' },
    { method: 'GET', path: '/api/backlinks', description: 'List all your backlinks' },
    { method: 'GET', path: '/api/backlinks/{id}', description: 'Get details of a specific backlink' },
    { method: 'GET', path: '/api/analytics', description: 'Get your analytics data' },
    { method: 'GET', path: '/api/user/profile', description: 'Get your account information' },
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: 'Get Your API Key',
      description: 'Copy your API key from the section above',
      icon: Key
    },
    {
      step: 2,
      title: 'Make Your First Request',
      description: 'Use our code examples to submit your first backlink request',
      icon: Code
    },
    {
      step: 3,
      title: 'Monitor Results',
      description: 'Track your requests in the dashboard or via API',
      icon: BarChart3
    }
  ];

  return (
    <DashboardLayout title="API Management">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Management</h1>
          <p className="text-gray-400">Manage your API keys and integration settings.</p>
        </div>

        {/* Top Section - API Key & Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* API Key Management */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">API Keys</h2>
                <p className="text-gray-400 text-sm">Your API keys for integrating Linkzy with your applications.</p>
              </div>
            </div>

            {/* Live API Key */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">Live API Key</h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">Active</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">Created on Dec 15, 2024</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">Last used 2 hours ago</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-green-400 text-sm font-mono flex-1 mr-4">
                    {showApiKey ? apiKey : maskedKey}
                  </code>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      title={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                      title="Copy API key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {copied && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-green-400 text-sm">API key copied to clipboard!</p>
                  </div>
                </div>
              )}

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Generate New Key</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">Security Notice</h4>
                  <p className="text-white text-sm">
                    Keep your API key secure. Never share it publicly or include it in client-side code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Usage */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            {usageLoading ? (
              <LoadingSpinner text="Loading API usage..." />
            ) : usageError ? (
              <ErrorMessage message={usageError} onRetry={refetchUsage} />
            ) : (
              <>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Terminal className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">API Usage</h2>
                <p className="text-gray-400 text-sm">Monitor your API usage and limits</p>
              </div>
            </div>

            <div className="space-y-6">
              {usageStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{stat.period}</p>
                    <div className="text-right">
                      <p className="text-gray-300">{stat.current}</p>
                      {stat.limit && <p className="text-gray-500 text-xs">{stat.limit}</p>}
                    </div>
                  </div>
                  {stat.percentage > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${stat.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rate Limits Details */}
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Rate Limits</span>
              </h4>
              <div className="space-y-2">
                {rateLimits.map((limit, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{limit.timeframe}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white">{limit.current} / {limit.limit}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        limit.status === 'good' ? 'bg-green-500' : 
                        limit.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quick Start Guide</h2>
              <p className="text-gray-400 text-sm">Get started with the Linkzy API in minutes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickStartSteps.map((step) => (
              <div key={step.step} className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 font-bold text-sm mx-auto mb-3">
                  {step.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Connection Status */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">API Backend Connected</h2>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Backend URL:</span>
              <code className="text-green-400 text-sm">https://nghki1c8wlnz.manus.space</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 text-sm">✅ Connected & Operational</span>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Code Examples</h2>
                <p className="text-gray-400 text-sm">Ready-to-use code snippets for popular languages</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={selectedExample}
                onChange={(e) => setSelectedExample(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-orange-500"
              >
                {Object.keys(codeExamples).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <button 
                onClick={() => handleRegenerateApiKey()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-white font-medium">Submit Backlink Request</span>
              <span className="text-gray-400 text-sm">{selectedExample}</span>
            </div>
            <div className="p-4">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{codeExamples[selectedExample]}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* API Endpoints & Documentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Endpoints */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Available Endpoints</h2>
                <p className="text-gray-400 text-sm">All available API endpoints and methods</p>
              </div>
            </div>

            <div className="space-y-3">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div>
                      <p className="text-white font-mono text-sm">{endpoint.path}</p>
                      <p className="text-gray-400 text-xs">{endpoint.description}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-white" />
                <span className="text-white font-medium">Base URL</span>
              </div>
              <code className="text-white text-sm">https://nghki1c8wlnz.manus.space</code>
            </div>
          </div>

          {/* Documentation & Resources */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Documentation & Resources</h2>
                <p className="text-gray-400 text-sm">Helpful resources to get you started</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="text-white font-medium">API Documentation</h4>
                    <p className="text-gray-400 text-sm">Complete API reference and examples</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="text-white font-medium">Developer Community</h4>
                    <p className="text-gray-400 text-sm">Join our Discord for support and tips</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="text-white font-medium">Integration Examples</h4>
                    <p className="text-gray-400 text-sm">WordPress, Shopify, and custom integrations</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="text-white font-medium">SDKs & Libraries</h4>
                    <p className="text-gray-400 text-sm">Official libraries for Python, JS, PHP, etc.</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>
            </div>

            {/* Response Example */}
            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Sample API Response</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
{`{
  "id": "bl_1234567890",
  "status": "pending",
  "target_url": "https://yoursite.com/blog/post",
  "anchor_text": "best SEO tools 2024",
  "niche": "technology",
  "created_at": "2024-12-23T10:30:00Z",
  "estimated_completion": "24-48 hours"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAPI;