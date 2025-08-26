import React from 'react';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useAnalytics, useKeywordAnalytics, useHasTrackedContent } from '../../hooks/useApi'; 
import { 
  Gauge, BarChart, Users, Calendar, Download, Filter, ArrowUp, ArrowDown, Shield, Plus, Trash2, CheckCircle, DollarSign, TrendingUp, ArrowRight, ChevronUp, Award 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LockedFeature from '../LockedFeature';

const DashboardAnalytics = () => {
  const { data: analyticsData, loading, error, refetch } = useAnalytics();
  const { data: keywordData, loading: keywordLoading, error: keywordError, refetch: refetchKeywords } = useKeywordAnalytics();
  const [timeframe, setTimeframe] = React.useState('30d');
  const [keywordFilter, setKeywordFilter] = React.useState('');
  // Competitor management state
  const [competitors, setCompetitors] = React.useState<string[]>(() => {
    // Try to load from localStorage for now
    try {
      return JSON.parse(localStorage.getItem('linkzy_competitors') || '[]');
    } catch {
      return [];
    }
  });
  const [newCompetitor, setNewCompetitor] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('Overview');

  const { user } = useAuth();
  const userDomain = user?.website || 'yourdomain.com';
  const userApiKey = user?.api_key || '';
  const { data: hasTracked, loading: trackedLoading } = useHasTrackedContent(user?.id);
  const [gateOpen, setGateOpen] = React.useState(true);
  React.useEffect(() => {
    if (!trackedLoading) {
      setGateOpen(!hasTracked);
    }
  }, [trackedLoading, hasTracked]);
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU';
  const apiSnippet = `<script>(function(){ var lz = window.linkzy = window.linkzy || []; lz.apiKey = '${userApiKey || 'YOUR_API_KEY'}'; lz.track = function(){ fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/track-content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ${anonKey}' }, body: JSON.stringify({ apiKey: lz.apiKey, url: window.location.href, title: document.title, referrer: document.referrer, timestamp: new Date().toISOString(), content: document.body ? document.body.innerText.slice(0, 1000) : '' }) }); }; lz.track(); })();</script>`;
  const hasTrackedContent = !!hasTracked;
  const [copied, setCopied] = React.useState(false);
  const copySnippet = async () => { try { await navigator.clipboard.writeText(apiSnippet); setCopied(true); setTimeout(()=>setCopied(false),2000);} catch {}
  };
  
  // Check if user has Pro access (either pro plan OR has 30+ credits from Pro Monthly purchase)
  const hasProAccess = (user?.plan && user.plan !== 'free') || (user?.credits && user.credits >= 30);

  const addCompetitor = () => {
    if (!newCompetitor.trim() || competitors.includes(newCompetitor.trim())) return;
    const updated = [...competitors, newCompetitor.trim()];
    setCompetitors(updated);
    localStorage.setItem('linkzy_competitors', JSON.stringify(updated));
    setNewCompetitor('');
  };
  const removeCompetitor = (domain: string) => {
    const updated = competitors.filter((c: string) => c !== domain);
    setCompetitors(updated);
    localStorage.setItem('linkzy_competitors', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="p-6">
          <LoadingSpinner text="Loading analytics data..." />
        </div>
      </DashboardLayout>
    );
  }

  // Integration gate: show setup state until first tracked page exists
  if (gateOpen) {
    return (
      <DashboardLayout title="Analytics">
        <div className="p-6 max-w-4xl">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Connect your website to see Analytics</h2>
            <p className="text-gray-300 mb-4">Install the universal tracking script on your site. As soon as it fires once, your analytics will appear here automatically.</p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Universal Tracking Script</span>
                <button onClick={copySnippet} className="text-orange-400 hover:text-orange-300 text-xs">{copied ? 'Copied' : 'Copy'}</button>
              </div>
              <code className="text-green-400 text-xs block bg-gray-900 p-3 rounded border overflow-x-auto">{apiSnippet}</code>
            </div>
            <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
              <li>Paste into your global &lt;head&gt; (theme or layout template)</li>
              <li>Publish your site, then browse a couple of pages</li>
              <li>Return here and refresh — your analytics will load automatically</li>
            </ul>
          </div>
          <div className="text-gray-400 text-sm">Tip: You can also find this script any time under Account → Integrations.</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analyticsData) {
    return (
      <DashboardLayout title="Analytics">
        <div className="p-6">
          <ErrorMessage 
            message={error || "We couldn't load your analytics data. Please check your account permissions or try again later."} 
            onRetry={refetch} 
          />
        </div>
      </DashboardLayout>
    );
  }

  // Use real data or fallback to defaults
  type Metric = { name: string; value: string; change: string; trend: 'up' | 'down' };
  type AnalyticsData = {
    metrics?: Metric[];
    topSites?: any[];
    recentActivity?: any[];
    seoScore?: number;
    recommendations?: any[];
  };
  const metrics = (analyticsData as AnalyticsData)?.metrics || [
    { name: 'Total Clicks', value: '0', change: '+0%', trend: 'up' },
    { name: 'Unique Visitors', value: '0', change: '+0%', trend: 'up' },
    { name: 'Conversion Rate', value: '0%', change: '+0%', trend: 'up' },
    { name: 'Avg. Time on Site', value: '0s', change: '+0%', trend: 'up' },
  ];

  const topPerformingSites = (analyticsData as AnalyticsData)?.topSites || [];
  const recentActivity = (analyticsData as AnalyticsData)?.recentActivity || [];
  const seoHealthScore = (analyticsData as AnalyticsData)?.seoScore || 0;
  const recommendations = (analyticsData as AnalyticsData)?.recommendations || [];

  // Keyword Opportunity Suggestions (simple example)
  const keywordOpportunities = ((keywordData as any)?.topKeywords || [])
    .filter((k: any) => k.count < 3 && k.avgDensity < 1.5)
    .map((k: any) => k.word);

  // Filtered tracked content by keyword
  const filteredTrackedContent = keywordFilter
    ? ((keywordData as any)?.trackedContent || []).filter((row: any) => (row.keywords || []).includes(keywordFilter))
    : ((keywordData as any)?.trackedContent || []);

  const analyticsTabs = [
    { id: 'Overview', name: 'Overview', icon: Gauge },
  ];

  return (
    <DashboardLayout title="Analytics">
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        <div className="mb-6 md:mb-8">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-6 md:space-x-8 overflow-x-auto hide-scrollbar">
              {analyticsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-gray-400">Track your backlink performance and SEO impact.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 md:space-x-3">
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 border border-gray-600 min-h-[48px]">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button> 
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 border border-gray-600 min-h-[48px]">
                  <Calendar className="w-4 h-4" />
                  <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent text-white focus:outline-none"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 min-h-[48px]">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {metrics.map((metric: any) => (
                <div key={metric.name} className="bg-gray-900 border border-gray-700 rounded-xl p-4 md:p-6 hover:border-orange-500/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">{metric.name}</h3>
                    {metric.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{metric.value}</p>
                  <p className={`text-sm ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {metric.change}
                  </p>
                </div>
              ))}
            </div>

            {/* SEO Health Score & Traffic Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
              {/* SEO Health Score */}
              <div className="col-span-1 bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">SEO Health Score</h3>
                    <p className="text-gray-400 text-sm">Overall backlink profile health</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${seoHealthScore * 2.513} ${(100 - seoHealthScore) * 2.513}`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-white">{seoHealthScore}</span>
                        <p className="text-gray-400 text-xs">/ 100</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <p className={`font-semibold text-lg ${
                    seoHealthScore >= 80 ? 'text-green-400' : 
                    seoHealthScore >= 60 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {seoHealthScore >= 80 ? 'Excellent' : seoHealthScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                  <p className="text-gray-400 text-sm">Based on current backlink profile</p>
                </div>
                
                <div className={`border rounded-lg p-4 ${
                  seoHealthScore >= 80 ? 'bg-green-900/20 border-green-500/30' :
                  seoHealthScore >= 60 ? 'bg-orange-900/20 border-orange-500/30' :
                  'bg-red-900/20 border-red-500/30'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${
                      seoHealthScore >= 80 ? 'text-green-400' :
                      seoHealthScore >= 60 ? 'text-orange-400' : 'text-red-400'
                    }`} />
                    <span className={`font-medium ${
                      seoHealthScore >= 80 ? 'text-green-400' :
                      seoHealthScore >= 60 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {seoHealthScore >= 80 ? 'Above Industry Average' :
                       seoHealthScore >= 60 ? 'Meeting Standards' : 'Below Standards'}
                    </span>
                  </div>
                  <p className="text-white text-sm">
                    {seoHealthScore >= 80 
                      ? `Your SEO health is ${seoHealthScore - 70}% better than competitors`
                      : `Focus on improving link quality and diversity`
                    }
                  </p>
                </div>
              </div>

              {/* Traffic Impact */}
              <div className="col-span-2 bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div> 
                  <div>
                    <h3 className="text-xl font-bold text-white">Traffic Impact & Growth</h3>
                    <p className="text-gray-400 text-sm">Visitors from backlinks</p>
                  </div>
                </div>
                
                {/* Traffic Before/After Chart */}
                <div className="flex space-x-8 mb-6">
                  {/* Traffic Stats */}
                  <div className="w-1/3 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">This Month</span>
                        <div className="flex items-center space-x-1">
                          <ArrowUp className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">
                            {((analyticsData as any)?.trafficGrowth || '+24%')}
                          </span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {((analyticsData as any)?.monthlyVisitors || '1,247')}
                      </p>
                      <p className="text-gray-400 text-sm">visitors from backlinks</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Estimated Value</span>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">+$457</span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">$1,870</p>
                      <p className="text-gray-400 text-sm">traffic value</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Organic Growth</span>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">+32%</span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">42%</p>
                      <p className="text-gray-400 text-sm">of total traffic</p>
                    </div>
                  </div>
                  
                  {/* Traffic Before/After Chart */}
                  <div className="w-2/3 bg-gray-800 rounded-lg p-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Chart placeholder with mockup data */}
                      <div className="w-full h-full flex items-end px-6 py-4">
                        {/* Before section */}
                        <div className="w-3/12 flex flex-col items-center">
                          <div className="w-full bg-blue-500/20 rounded-t-lg" style={{height: '90px'}}></div>
                          <span className="text-gray-400 text-xs mt-2">Before</span>
                        </div>
                        
                        {/* Divider */}
                        <div className="w-1/12 flex justify-center items-center h-full">
                          <div className="h-full w-px bg-gray-700 relative">
                            <ArrowRight className="w-4 h-4 text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-full p-0.5" />
                          </div>
                        </div>
                        
                        {/* After section - Significantly taller */}
                        <div className="w-8/12 flex flex-col items-center">
                          <div className="w-full bg-gradient-to-t from-orange-500/40 to-orange-500/20 rounded-t-lg relative" style={{height: '150px'}}>
                            <div className="absolute top-0 left-0 right-0 flex justify-center">
                              <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">+67% Growth</div>
                            </div>
                          </div>
                          <span className="text-gray-400 text-xs mt-2">After Linkzy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Traffic Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">Avg. Time on Site</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">+18%</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-white">2:47</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">Pages/Session</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">+12%</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-white">3.2</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">Bounce Rate</span>
                      <div className="flex items-center space-x-1">
                        <ArrowDown className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">-14%</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-white">41%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* New Row - SEO Progress Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
              {/* Domain Authority Progression */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Domain Authority Progression</h3>
                    <p className="text-gray-400 text-sm">Track your website's authority growth</p>
                  </div>
                </div>
                
                {/* DA Chart */}
                <div className="bg-gray-800 rounded-lg p-4 h-40 md:h-52 mb-4 relative overflow-hidden">
                  {/* Chart placeholder - Simple Line Chart visualization */}
                  <div className="absolute inset-0 flex p-6">
                    {/* Y-axis labels */}
                    <div className="w-8 h-full flex flex-col justify-between text-xs text-gray-500">
                      <span>50</span>
                      <span>40</span>
                      <span>30</span>
                      <span>20</span>
                      <span>10</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="flex-1 h-full relative">
                      {/* Horizontal grid lines */}
                      {[0, 20, 40, 60, 80, 100].map((_, i) => (
                        <div key={i} className="absolute w-full h-px bg-gray-700" style={{ top: `${20 * i}%` }}></div>
                      ))}
                      
                      {/* Line Chart - using a simple SVG for the line */}
                      <svg className="absolute inset-0 w-full h-full">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(249, 115, 22, 0.5)" />
                            <stop offset="100%" stopColor="rgba(249, 115, 22, 0.1)" />
                          </linearGradient>
                        </defs>
                        
                        {/* Gradient area under the line */}
                        <path 
                          d="M0,120 L40,115 L80,100 L120,85 L160,70 L200,58 L240,45 L280,40 L320,30 L360,20 L400,15 L400,140 L0,140 Z" 
                          fill="url(#lineGradient)" 
                        />
                        
                        {/* Actual line */}
                        <path 
                          d="M0,120 L40,115 L80,100 L120,85 L160,70 L200,58 L240,45 L280,40 L320,30 L360,20 L400,15" 
                          stroke="#f97316" 
                          strokeWidth="2" 
                          fill="none"
                        />
                        
                        {/* Data points */}
                        {[
                          { x: 0, y: 120 }, { x: 40, y: 115 }, { x: 80, y: 100 }, 
                          { x: 120, y: 85 }, { x: 160, y: 70 }, { x: 200, y: 58 },
                          { x: 240, y: 45 }, { x: 280, y: 40 }, { x: 320, y: 30 },
                          { x: 360, y: 20 }, { x: 400, y: 15 }
                        ].map((point, i) => (
                          <circle key={i} cx={point.x} cy={point.y} r="3" fill="#f97316" />
                        ))}
                        
                        {/* Current data point highlighted */}
                        <circle cx="400" cy="15" r="5" fill="#f97316" stroke="#fff" strokeWidth="2" />
                      </svg>
                      
                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] md:text-xs text-gray-500 -mb-6 px-2">
                        <span>6 Months<br/>Ago</span>
                        <span>5 Months<br/>Ago</span>
                        <span>4 Months<br/>Ago</span>
                        <span>3 Months<br/>Ago</span>
                        <span>2 Months<br/>Ago</span>
                        <span>1 Month<br/>Ago</span>
                        <span>Now</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Domain Authority Metrics */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-500">42</div>
                    <div className="text-gray-400 text-xs">Current DA</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">+12</div>
                    <div className="text-gray-400 text-xs">DA Growth</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">63%</div>
                    <div className="text-gray-400 text-xs">Percentile</div>
                  </div>
                </div>
              </div>

              {/* Keyword Ranking Improvements */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <ArrowUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Keyword Ranking Improvements</h3>
                    <p className="text-gray-400 text-sm">Positive ranking changes since backlinks</p>
                  </div>
                </div>

                {/* Keyword Rankings Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden mb-4 mobile-scroll">
                  <div className="grid grid-cols-5 min-w-[500px] gap-2 p-3 border-b border-gray-700 text-xs font-medium text-gray-400">
                    <div className="col-span-2">Keyword</div>
                    <div>Previous</div>
                    <div>Current</div>
                    <div>Change</div>
                  </div>
                  
                  {/* Keyword Rows */}
                  {[
                    { keyword: "business automation", prev: 28, current: 4, change: 24 },
                    { keyword: "SEO tools 2025", prev: 15, current: 2, change: 13 },
                    { keyword: "marketing software", prev: 42, current: 11, change: 31 },
                    { keyword: "AI content marketing", prev: 22, current: 7, change: 15 },
                    { keyword: "best business tools", prev: 9, current: 3, change: 6 }
                  ].map((keyword, i) => (
                    <div key={i} className="grid grid-cols-5 min-w-[500px] gap-2 p-3 text-sm border-b border-gray-700 last:border-b-0 hover:bg-gray-750">
                      <div className="col-span-2 text-white font-medium">{keyword.keyword}</div>
                      <div className="text-gray-400">{keyword.prev}</div>
                      <div className="text-white">{keyword.current}</div>
                      <div className="flex items-center text-green-400">
                        <ChevronUp className="w-3 h-3 mr-1" />
                        {keyword.change}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-400">92%</div>
                    <div className="text-green-400 text-xs">Keywords Improved</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">14.8</div>
                    <div className="text-gray-400 text-xs">Avg. Position Gain</div>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-500">3</div>
                    <div className="text-orange-400 text-xs">New Page 1 Rankings</div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Row - ROI Calculator & Backlink Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
              {/* ROI Calculator */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">ROI Calculator</h3>
                    <p className="text-gray-400 text-sm">Track your backlink investment returns</p>
                  </div>
                </div>
                
                {/* ROI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Total Investment</div>
                    <div className="text-2xl font-bold text-white">$125</div>
                    <div className="text-xs text-gray-500 mt-1">5 Backlinks @ $25 each</div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Traffic Value</div>
                    <div className="text-2xl font-bold text-green-400">$1,870</div>
                    <div className="text-xs text-gray-500 mt-1">Based on 1,247 visitors</div>
                  </div>
                  
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 text-center">
                    <div className="text-sm text-green-400 mb-1">ROI</div>
                    <div className="text-2xl font-bold text-green-400">1,496%</div>
                    <div className="text-xs text-green-400 mt-1">15x Return</div>
                  </div>
                </div>
                
                {/* Payback Period and Value Visualization */}
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Payback Period</span>
                      <span className="text-green-400 font-semibold">7 days</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Investment recovered</div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Monthly ROI Breakdown</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">+24%</span>
                      </div>
                    </div>
                    <div className="flex h-10 w-full overflow-hidden rounded-lg">
                      <div className="bg-blue-500 w-1/5 flex items-center justify-center text-xs text-white">Cost</div>
                      <div className="bg-green-500 w-4/5 flex items-center justify-center text-xs text-white">Value</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex justify-between">
                      <span>$125 Investment</span>
                      <span>$1,870 Value Generated</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Backlink Quality Score */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Backlink Quality Score</h3>
                    <p className="text-gray-400 text-sm">Measure the quality of your backlink profile</p>
                  </div>
                </div>
                
                {/* Quality Score Meter */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Overall Quality Score</span>
                    <span className="text-green-400 text-sm font-medium">87/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-500 to-green-500 h-3 rounded-full" style={{width: '87%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
                
                {/* Quality Breakdown */}
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">Authority Distribution</span>
                      <span className="text-green-400 text-sm">92/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Excellent variety of high DA sites</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">Relevance Score</span>
                      <span className="text-green-400 text-sm">89/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '89%'}}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Links from highly relevant niche sites</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">Anchor Text Optimization</span>
                      <span className="text-orange-400 text-sm">76/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '76%'}}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Good variety, could use more brand anchors</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm">Link Placement Quality</span>
                      <span className="text-green-400 text-sm">94/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Excellent content placement with context</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardAnalytics;