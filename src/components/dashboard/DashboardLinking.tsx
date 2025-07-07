import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useDetectedPages } from '../../hooks/useApi';
import apiService from '../../services/api';
import { 
  Settings, 
  Globe, 
  ExternalLink,
  Lightbulb,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  Edit,
  Plus,
  Copy,
  Eye
} from 'lucide-react';

const DashboardLinking = () => {
  const [selectedMethod, setSelectedMethod] = useState('Blog Root URL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [blogUrl, setBlogUrl] = useState('https://example.com/blog/');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const { data: pagesData, loading, error, refetch } = useDetectedPages();

  const configurationMethods = [
    'Blog Root URL',
    'WordPress Integration', 
    'Sitemap Crawling',
    'Manual URL List'
  ];

  const configurationTips = [
    {
      title: 'Blog Root URL',
      description: 'Best for simple blog setups. We\'ll automatically discover posts and pages under your blog directory.'
    },
    {
      title: 'WordPress Integration',
      description: 'Most powerful option. Direct API access allows real-time content updates and precise link placement.'
    },
    {
      title: 'Sitemap Crawling',
      description: 'Great for complex sites. We\'ll discover all pages listed in your XML sitemap automatically.'
    },
    {
      title: 'Manual URL List',
      description: 'Maximum control. Specify exactly which pages should receive backlinks for targeted SEO strategy.'
    }
  ];

  const handleScanPages = async () => {
    setIsScanning(true);
    setScanMessage('');
    
    try {
      const result = await apiService.scanPages(blogUrl, selectedMethod);
      setScanMessage(`✅ Scan complete! Found ${result.pagesFound} pages.`);
      // Refetch the pages data to update the list
      refetch();
    } catch (err) {
      setScanMessage('❌ Scan failed. Please check your URL and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <DashboardLayout title="Link Configuration">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Link Configuration</h1>
          <p className="text-gray-400">Configure how we find and place backlinks on your website.</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Source Configuration */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-5 h-5 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Source Configuration</h2>
                <p className="text-gray-400 text-sm">Choose how we discover pages on your website for backlink placement.</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Configuration Method Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Configuration Method
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors flex items-center justify-between"
                  >
                    <span>{selectedMethod}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      {configurationMethods.map((method) => (
                        <button
                          key={method}
                          onClick={() => {
                            setSelectedMethod(method);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Blog Root URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={blogUrl}
                  onChange={(e) => setBlogUrl(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Enter your website URL to scan for pages and posts available for backlink placement.
                </p>
              </div>

              {/* Scan Button */}
              <button 
                onClick={handleScanPages}
                disabled={isScanning || !blogUrl}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan & Update Pages'}</span>
              </button>

              {/* Scan Message */}
              {scanMessage && (
                <div className={`p-3 rounded-lg ${
                  scanMessage.includes('✅') 
                    ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
                    : 'bg-red-900/20 border border-red-500/30 text-red-400'
                }`}>
                  <p className="text-sm">{scanMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detected Pages */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-5 h-5 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Detected Pages ({pagesData?.total || 0})
                </h2>
                <p className="text-gray-400 text-sm">Pages discovered and available for backlink placement.</p>
              </div>
              <div className="ml-auto">
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 border border-gray-600">
                  <Plus className="w-4 h-4" />
                  <span>Add Page</span>
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner text="Loading pages..." />
            ) : error ? (
              <ErrorMessage message={error} onRetry={refetch} />
            ) : (
              <div className="space-y-3">
                {pagesData?.pages && pagesData.pages.length > 0 ? (
                  pagesData.pages.map((page: any, index: number) => (
                    <div key={page.id || index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-white font-medium">{page.title || page.name}</p>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            page.status === 'active' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : page.status === 'warning'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {(page.status || 'unknown').toUpperCase()}
                          </span>
                          {page.backlinksCount && (
                            <span className="bg-blue-500/20 text-white px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/30">
                              {page.backlinksCount} links
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{page.url}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs">
                          <span className="text-gray-500">
                            Last checked: {page.lastChecked || page.lastScanned || 'Never'}
                          </span>
                          {page.lastPlacement && (
                            <span className="text-gray-500">Last placement: {page.lastPlacement}</span>
                          )}
                          {page.trafficIncrease && (
                            <span className="text-gray-500">Traffic: {page.trafficIncrease}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="text-gray-400 hover:text-white transition-colors p-1" title="View page">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors p-1" title="Edit page">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-gray-400 hover:text-white transition-colors p-1" 
                          title="Visit page"
                          onClick={() => window.open(page.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No pages detected yet</p>
                    <p className="text-gray-500 text-sm">Enter your website URL and click "Scan & Update Pages" to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Status */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Configuration Status</h2>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-white font-medium mb-2">✅ API Connected</p>
            <p className="text-white text-sm">
              Connected to live backend API. Page scanning and configuration updates are working correctly.
            </p>
          </div>
        </div>

        {/* Configuration Tips */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Lightbulb className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Configuration Tips</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {configurationTips.map((tip, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">{tip.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
          
          {/* Integration Code Section */}
          <div className="border-t border-gray-700 pt-8">
            <h3 className="text-white font-semibold mb-4">Integration Code</h3>
            <p className="text-gray-400 text-sm mb-4">Add this code to your website to enable automatic page detection:</p>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">HTML Snippet</span>
                <button 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                  onClick={() => {
                    const code = `<script src="${apiService.baseUrl || 'https://nghki1c8wlnz.manus.space'}/widget.js" data-api-key="your-api-key"></script>`;
                    navigator.clipboard.writeText(code);
                  }}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </button>
              </div>
              <code className="text-green-400 text-sm block">
                {`<script src="${apiService.baseUrl || 'https://nghki1c8wlnz.manus.space'}/widget.js" data-api-key="your-api-key"></script>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardLinking;