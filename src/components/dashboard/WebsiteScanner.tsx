import React, { useState, useEffect } from 'react';
import { Search, Globe, Zap, CheckCircle, AlertCircle, Clock, BarChart3, Target, ExternalLink, Settings } from 'lucide-react';

interface WebsiteScannerProps {
  onScanComplete?: (result: any) => void;
}

interface ScanProgress {
  status: 'idle' | 'scanning' | 'completed' | 'failed';
  progress: number;
  message: string;
  analysisId?: string;
}

interface AnalysisResult {
  id: string;
  website_url: string;
  scan_status: string;
  pages_analyzed?: number;
  linkable_pages?: number;
  top_keywords?: string[];
  content_summary?: string;
  analyzed_at: string;
}

interface LinkableContent {
  id: string;
  page_url: string;
  page_title: string;
  linkable_score: number;
  keywords: string[];
  anchor_opportunities: string[];
  niche: string;
}

const WebsiteScanner: React.FC<WebsiteScannerProps> = ({ onScanComplete }) => {
  const [userWebsite, setUserWebsite] = useState('');
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [linkableContent, setLinkableContent] = useState<LinkableContent[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [hasWebsite, setHasWebsite] = useState(false);

  useEffect(() => {
    loadUserWebsite();
    loadPreviousAnalyses();
  }, []);

  const loadUserWebsite = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('linkzy_user') || '{}');
      if (!user.id) return;

      const { default: supabaseService } = await import('../../services/supabaseService');
      const userProfile = await supabaseService.getUserProfile(user.id);
      
      if (userProfile?.website) {
        setUserWebsite(userProfile.website);
        setHasWebsite(true);
      } else {
        setHasWebsite(false);
      }
    } catch (error) {
      console.error('Failed to load user website:', error);
      setHasWebsite(false);
    }
  };

  const loadPreviousAnalyses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('linkzy_user') || '{}');
      if (!user.id) return;

      const { default: supabaseService } = await import('../../services/supabaseService');
      const analyses = await supabaseService.getWebsiteAnalysis(user.id);
      setAnalysisResults(analyses);
    } catch (error) {
      console.error('Failed to load previous analyses:', error);
    }
  };

  const startScan = async () => {
    if (!userWebsite.trim()) return;

    try {
      const user = JSON.parse(localStorage.getItem('linkzy_user') || '{}');
      if (!user.id) {
        throw new Error('User not authenticated');
      }

      setScanProgress({
        status: 'scanning',
        progress: 0,
        message: 'Initializing website scan...'
      });

      const { default: supabaseService } = await import('../../services/supabaseService');
      
      // Start the scan with user's website
      const result = await supabaseService.scanWebsite(userWebsite, user.id, user.niche || '');
      
      setScanProgress({
        status: 'completed',
        progress: 100,
        message: `Scan completed! Analyzed ${result.pages_analyzed} pages.`,
        analysisId: result.analysis_id
      });

      // Reload analyses
      await loadPreviousAnalyses();
      
      if (onScanComplete) {
        onScanComplete(result);
      }

    } catch (error: any) {
      console.error('Scan failed:', error);
      setScanProgress({
        status: 'failed',
        progress: 0,
        message: error.message || 'Scan failed. Please try again.'
      });
    }
  };

  const loadLinkableContent = async (analysisId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('linkzy_user') || '{}');
      const { default: supabaseService } = await import('../../services/supabaseService');
      
      const content = await supabaseService.getLinkableContent(user.id, analysisId);
      setLinkableContent(content);
      setSelectedAnalysis(analysisId);
    } catch (error) {
      console.error('Failed to load linkable content:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Website Scanner</h2>
        </div>
        
        <p className="text-gray-400 mb-6">
          Analyze your website to discover backlink opportunities and optimize content for the Linkzy ecosystem.
        </p>

        {hasWebsite ? (
          <div className="space-y-4">
            {/* Display user's website */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Your Website</p>
                  <p className="text-gray-400 text-sm">{userWebsite}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/dashboard/settings'}
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>

            {/* Scan button */}
            <button
              onClick={startScan}
              disabled={scanProgress.status === 'scanning'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <Search className="w-4 h-4" />
              <span>{scanProgress.status === 'scanning' ? 'Scanning...' : 'Scan Your Website'}</span>
            </button>
          </div>
        ) : (
          /* No website set - prompt to add one */
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No Website Set</h3>
            <p className="text-gray-400 mb-4">
              You need to set your website URL in your profile before you can scan it for backlink opportunities.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/settings'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Add Website in Settings</span>
            </button>
          </div>
        )}

        {/* Progress Indicator */}
        {scanProgress.status === 'scanning' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Scanning progress</span>
              <span className="text-sm text-orange-500">{scanProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">{scanProgress.message}</p>
          </div>
        )}

        {/* Status Messages */}
        {scanProgress.status === 'completed' && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400">{scanProgress.message}</span>
          </div>
        )}

        {scanProgress.status === 'failed' && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{scanProgress.message}</span>
          </div>
        )}
      </div>

      {/* Previous Analyses */}
      {analysisResults.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Website Analyses</h3>
          </div>

          <div className="space-y-3">
            {analysisResults.map((analysis) => (
              <div
                key={analysis.id}
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  selectedAnalysis === analysis.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => loadLinkableContent(analysis.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{analysis.website_url}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        analysis.scan_status === 'completed' 
                          ? 'bg-green-500/20 text-green-400'
                          : analysis.scan_status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {analysis.scan_status}
                      </span>
                    </div>
                    
                    {analysis.content_summary && (
                      <p className="text-gray-400 text-sm mt-1">{analysis.content_summary}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>📊 {analysis.pages_analyzed || 0} pages</span>
                      <span>🔗 {analysis.linkable_pages || 0} linkable</span>
                      <span>📅 {formatDate(analysis.analyzed_at)}</span>
                    </div>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linkable Content */}
      {linkableContent.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-bold text-white">Linkable Content</h3>
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
              {linkableContent.length} opportunities
            </span>
          </div>

          <div className="space-y-4">
            {linkableContent.map((content) => (
              <div key={content.id} className="p-4 border border-gray-600 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-white font-medium">{content.page_title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        content.linkable_score >= 70 
                          ? 'bg-green-500/20 text-green-400'
                          : content.linkable_score >= 40
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {content.linkable_score}% linkable
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{content.page_url}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs text-gray-500">Keywords:</span>
                      {content.keywords.slice(0, 5).map((keyword, idx) => (
                        <span key={idx} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    
                    {content.anchor_opportunities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Anchor opportunities:</span>
                        {content.anchor_opportunities.slice(0, 3).map((anchor, idx) => (
                          <span key={idx} className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
                            "{anchor}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{content.linkable_score}</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {analysisResults.length === 0 && scanProgress.status === 'idle' && (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center">
          <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">No Websites Analyzed Yet</h3>
          <p className="text-gray-400 mb-4">
            Start by scanning your website to discover backlink opportunities and optimize your content for link building.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebsiteScanner; 