import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import ContextualHelp from '../ContextualHelp';
import CelebrationModal from '../CelebrationModal';
import PurchaseCreditsModal from './PurchaseCreditsModal';
import { 
  AlertCircle,
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  File,
  FileText,
  Flag,
  HelpCircle,
  Key,
  Link as LinkIcon,
  Lock,
  LogOut,
  Settings,
  Plus,
  Download,
  RefreshCw,
  Shield,
  Mail,
  Monitor,
  Package,
  Globe,
  Copy,
  Eye,
  EyeOff,
  Save,
  Send,
  ArrowRight,
  CheckCircle,
  Tag,
  Target,
  Trash2,
  Clock,
  Zap,
  Code,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Confetti from 'react-confetti';
import supabaseService from '../../services/supabaseService';
import axios from 'axios';
import JSZip from 'jszip';
// @ts-ignore
import { supabase } from '../../lib/supabase';

const DashboardAccount = () => {
  const { user, logout, isAuthenticated, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  
  // Handle Stripe cancellation
  const [showCancellationMessage, setShowCancellationMessage] = useState(false);
  const [cancellationHandled, setCancellationHandled] = useState(false);
  const [activeTab, setActiveTab] = useState('profile-billing');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState(user?.email || 'user@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(user?.website || '');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [contentNiche, setContentNiche] = useState(user?.niche || 'technology');
  const [anchorTextStyle, setAnchorTextStyle] = useState('exact-match');
  const [requestNotes, setRequestNotes] = useState('');
  const [isDetectingNiche, setIsDetectingNiche] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [keywordsCount, setKeywordsCount] = useState(0);
  const [notifications, setNotifications] = useState<{ type: string; message: string }[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [credits, setCredits] = useState(user?.credits || 3);
  const [requests, setRequests] = useState([
    // Example mock requests
    { id: 1, url: 'https://example.com/page1', keywords: 'seo, marketing', status: 'completed', date: '2025-07-01', details: 'Placed on high DA site.' },
    { id: 2, url: 'https://example.com/page2', keywords: 'automation', status: 'in progress', date: '2025-07-02', details: 'Finding placement.' },
    { id: 3, url: 'https://example.com/page3', keywords: 'growth', status: 'pending', date: '2025-07-03', details: 'Awaiting review.' },
  ]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestUrl, setRequestUrl] = useState('');
  const [requestKeywords, setRequestKeywords] = useState('');
  const [requestNiche, setRequestNiche] = useState(contentNiche);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapPages, setSitemapPages] = useState<SitemapPage[]>([]);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapError, setSitemapError] = useState('');
  const [wpUrl, setWpUrl] = useState('');
  const [wpApiKey, setWpApiKey] = useState('');
  const [wpLoading, setWpLoading] = useState(false);
  const [wpError, setWpError] = useState('');
  const [wpPages, setWpPages] = useState<{ id: number; title: string; url: string; type: string; date: string; author?: string; featuredImage?: string }[]>([]);
  const [wpSearch, setWpSearch] = useState('');
  const [wpTypeFilter, setWpTypeFilter] = useState<'all' | 'post' | 'page'>('all');
  const [wpPolling, setWpPolling] = useState(false);
  
  // Mock data - replace with real data from context/API
  const userData = {
    email: user?.email || 'user@example.com',
    website: user?.website || 'https://example.com',
    niche: user?.niche || 'Technology',
    apiKey: user?.api_key || 'demo_api_key_123',
    credits: user?.credits || 3,
    isPro: user?.is_pro || false,
    joinDate: 'December 2024'
  };
  
  // Assume userData.apiKey or user?.api_key is available for snippet personalization
  const userApiKey = user?.api_key || userData.apiKey || 'demo_api_key_123';
  const apiSnippet = `<script>
(function(){
  var lz = window.linkzy = window.linkzy || {};
  lz.apiKey = '${userApiKey}';
  lz.track = function(){
    fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/track-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: lz.apiKey,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        content: document.body ? document.body.innerText.slice(0, 1000) : ''
      })
    });
  };
  lz.track();
})();
</script>`;
  const [snippetCopied, setSnippetCopied] = useState(false);
  const handleCopySnippet = () => {
    navigator.clipboard.writeText(apiSnippet);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };



  // Mock active requests
  const activeRequests = [
    { 
      id: '1', 
      targetUrl: 'https://example.com/blog/post-1', 
      anchorText: 'business automation tools', 
      status: 'in-progress', 
      createdAt: '2 days ago',
      eta: '1-2 days'
    },
  ];

  // Mock request history
  const requestHistory = [
    { 
      id: '2', 
      targetUrl: 'https://example.com/services', 
      anchorText: 'top marketing services', 
      status: 'completed', 
      createdAt: '5 days ago',
      completedAt: '3 days ago',
      placementUrl: 'https://exampleblog.com/marketing-tools-2025'
    },
    { 
      id: '3', 
      targetUrl: 'https://example.com/about', 
      anchorText: 'professional marketing team', 
      status: 'completed', 
      createdAt: '10 days ago',
      completedAt: '8 days ago',
      placementUrl: 'https://industrynews.com/top-agencies-2025'
    },
  ];

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(userData.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Add password change logic here
    alert('Password change functionality would go here');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Function to check if this is the user's first submission
  const isFirstRequest = () => {
    return requests.length === 0 || requests.every(r => r.status !== 'pending');
  };

  const handleOpenRequestModal = () => {
    setShowRequestModal(true);
    setRequestSuccess(false);
    setRequestUrl('');
    setRequestKeywords('');
    setRequestNiche(contentNiche);
    setRequestNotes('');
  };

  const handleRequestModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (credits <= 0) {
      notify('error', 'Not enough credits to submit a request.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newRequest = await supabaseService.createBacklinkRequest({
        targetUrl: requestUrl,
        anchorText: requestKeywords,
        niche: requestNiche,
        notes: requestNotes,
      });
      setCredits((c: number) => c - 1);
      setRequests((prev) => [
        {
          id: newRequest.id,
          url: requestUrl,
          keywords: requestKeywords,
          status: 'pending',
          date: new Date().toISOString().slice(0, 10),
          details: requestNotes,
          eta: '7-14 days',
        },
        ...prev,
      ]);
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
      }, 1500);
    } catch (error: any) {
      notify('error', error.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-detect niche from website URL
  const detectNiche = () => {
    if (!websiteUrl) return;
    setIsDetectingNiche(true);
    
    // Simulate API call to detect niche
    setTimeout(() => {
      // Mock detection logic based on URL
      const url = websiteUrl.toLowerCase();
      let detected = contentNiche;
      
      if (url.includes('health') || url.includes('wellness') || url.includes('fitness')) {
        detected = 'health-wellness';
      } else if (url.includes('finance') || url.includes('money') || url.includes('invest')) {
        detected = 'finance-business';
      } else if (url.includes('travel') || url.includes('tour') || url.includes('vacation')) {
        detected = 'travel-lifestyle';
      } else if (url.includes('food') || url.includes('recipe') || url.includes('cook')) {
        detected = 'food-restaurants';
      }
      
      setContentNiche(detected);
      setIsDetectingNiche(false);
      
      // Also suggest keywords
      suggestKeywords(url);
    }, 800);
  };
  
  // Suggest keywords based on website content
  const suggestKeywords = (url: string) => {
    // Mock keyword suggestion based on URL
    const suggestions: string[] = [];
    
    if (url.includes('tech') || url.includes('software')) {
      suggestions.push('software solutions', 'tech services', 'digital transformation');
    } else if (url.includes('health')) {
      suggestions.push('health services', 'wellness solutions', 'fitness programs');
    } else if (url.includes('finance')) {
      suggestions.push('financial advice', 'investment strategy', 'wealth management');
    } else if (url.includes('travel')) {
      suggestions.push('travel destinations', 'vacation planning', 'tourism guide');
    } else {
      suggestions.push('business solutions', 'professional services', 'industry expert');
    }
    
    setSuggestedKeywords(suggestions);
  };

  // Validate URL
  const validateUrl = (url: string) => {
    if (!url) {
      setIsValidUrl(true);
      return;
    }
    
    try {
      new URL(url);
      setIsValidUrl(true);
    } catch (e) {
      setIsValidUrl(false);
    }
  };

  // Handle keyword input changes and count
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTargetKeywords(value);
    
    // Count keywords (comma-separated)
    const words = value.split(',').filter(word => word.trim().length > 0);
    setKeywordsCount(words.length);
  };

  // Apply suggested keyword
  const applySuggestion = (keyword: string) => {
    if (targetKeywords) {
      setTargetKeywords(prevKeywords => 
        prevKeywords + (prevKeywords.endsWith(',') || prevKeywords === '' ? ' ' : ', ') + keyword
      );
    } else {
      setTargetKeywords(keyword);
    }
    
    // Update count
    const words = (targetKeywords + (targetKeywords ? ', ' : '') + keyword)
      .split(',')
      .filter(word => word.trim().length > 0);
    setKeywordsCount(words.length);
  };

  const tabs = [
    { id: 'profile-billing', name: 'Profile & Billing', icon: User },
    { id: 'links', name: 'Links', icon: Send },
    { id: 'integrations', name: 'Integrations', icon: Settings },
  ];

  const handleDeleteAccount = () => {
    // Add confirmation logic
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Add account deletion logic
      alert('Account deletion functionality would go here');
      logout();
    }
  };

  // Notification helper
  const notify = (type: string, message: string) => {
    setNotifications((prev) => [...prev, { type, message }]);
    setTimeout(() => setNotifications((prev) => prev.slice(1)), 4000);
  };

  // Handle purchase credits (mock)
  const handlePurchaseCredits = (amount: number) => {
    setCredits((c: number) => c + amount);
    setShowPurchaseModal(false);
    notify('success', `Purchased ${amount} credits!`);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  type SitemapPage = {
    url: string;
    lastmod?: string;
    priority?: string;
    changefreq?: string;
  };

  // Enhanced utility to fetch and parse sitemap.xml, .gz, and sitemap index
  const fetchAndParseSitemap = async (url: string, seen: Set<string> = new Set(), depth = 0): Promise<SitemapPage[]> => {
    if (seen.has(url) || depth > 5) return [];
    seen.add(url);
    try {
      let xmlString = '';
      if (url.endsWith('.gz')) {
        // Fetch and decompress gzipped sitemap
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const zip = await JSZip.loadAsync(res.data);
        // Find the first file in the zip (should be the sitemap)
        const file = Object.values(zip.files)[0] as JSZip.JSZipObject;
        xmlString = await file.async('text');
      } else {
        const res = await axios.get(url, { headers: { 'Accept': 'application/xml' } });
        xmlString = res.data;
      }
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlString, 'application/xml');
      // Check if this is a sitemap index
      const sitemapTags = Array.from(xml.getElementsByTagName('sitemap'));
      if (sitemapTags.length > 0) {
        // Recursively fetch all referenced sitemaps
        let allPages: SitemapPage[] = [];
        for (const sitemap of sitemapTags) {
          const loc = sitemap.getElementsByTagName('loc')[0]?.textContent;
          if (loc) {
            const pages = await fetchAndParseSitemap(loc, seen, depth + 1);
            allPages = allPages.concat(pages);
          }
        }
        return allPages;
      }
      // Otherwise, parse urlset
      const urlTags = Array.from(xml.getElementsByTagName('url'));
      return urlTags.map((urlTag) => ({
        url: urlTag.getElementsByTagName('loc')[0]?.textContent || '',
        lastmod: urlTag.getElementsByTagName('lastmod')[0]?.textContent || undefined,
        priority: urlTag.getElementsByTagName('priority')[0]?.textContent || undefined,
        changefreq: urlTag.getElementsByTagName('changefreq')[0]?.textContent || undefined,
      })).filter(page => page.url);
    } catch (err) {
      return [];
    }
  };

  const fetchSitemap = async (url: string) => {
    setSitemapLoading(true);
    setSitemapError('');
    setSitemapPages([]);
    try {
      const pages = await fetchAndParseSitemap(url);
      if (pages.length === 0) throw new Error('No pages found or failed to parse sitemap.');
      setSitemapPages(pages);
    } catch (err: any) {
      setSitemapError('Failed to fetch or parse sitemap. Please check the URL.');
    } finally {
      setSitemapLoading(false);
    }
  };

  // Fetch authors and featured images for posts
  const fetchWordPressContent = async () => {
    setWpLoading(true);
    setWpError('');
    setWpPages([]);
    setWpPolling(false);
    try {
      const base = wpUrl.replace(/\/$/, '');
      const headers = wpApiKey ? { Authorization: `Bearer ${wpApiKey}` } : {};
      // Fetch posts
      const postsRes = await axios.get(`${base}/wp-json/wp/v2/posts?per_page=50&_embed`, { headers });
      // Fetch pages
      const pagesRes = await axios.get(`${base}/wp-json/wp/v2/pages?per_page=50&_embed`, { headers });
      const posts = (postsRes.data || []).map((p: any) => ({
        id: p.id,
        title: p.title.rendered,
        url: p.link,
        type: 'post',
        date: p.date,
        author: p._embedded?.author?.[0]?.name || '',
        featuredImage: p._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
      }));
      const pages = (pagesRes.data || []).map((p: any) => ({
        id: p.id,
        title: p.title.rendered,
        url: p.link,
        type: 'page',
        date: p.date,
        author: p._embedded?.author?.[0]?.name || '',
        featuredImage: ''
      }));
      setWpPages([...posts, ...pages]);
      setWpPolling(true);
    } catch (err: any) {
      setWpError('Failed to connect to WordPress site. Please check the URL and API key.');
    } finally {
      setWpLoading(false);
    }
  };

  // Handle ALL navigation back to account page - PRESERVE AUTHENTICATION
  useEffect(() => {
    // ALWAYS check authentication when component mounts or URL changes
    // This handles cases where user navigates back from Stripe without URL parameters
    console.log('🔄 DashboardAccount loaded - checking authentication state');
    
    const existingUser = localStorage.getItem('linkzy_user');
    const existingApiKey = localStorage.getItem('linkzy_api_key');
    
    // If we have stored auth but user appears unauthenticated, restore it
    if (existingUser && existingApiKey && (!user || !isAuthenticated)) {
      console.log('🔧 Restoring authentication - user returned to dashboard');
      try {
        const userData = JSON.parse(existingUser);
        login(existingApiKey, userData);
      } catch (e) {
        console.error('Failed to restore auth on dashboard return:', e);
      }
    }
    
    // Handle URL parameters (canceled/success)
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');
    
    // Handle payment cancellation
    if (canceled === 'true' && !cancellationHandled) {
      console.log('🔄 Stripe payment cancellation detected via URL parameter');
      setCancellationHandled(true);
      setShowCancellationMessage(true);
      
      // Clear the canceled parameter from URL
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('canceled');
        setSearchParams(newParams, { replace: true });
      }, 1000);
      
      // Auto-hide cancellation message after 10 seconds
      setTimeout(() => {
        setShowCancellationMessage(false);
      }, 10000);
    }
    
    // Handle payment success
    if (success === 'true') {
      console.log('✅ Stripe payment success detected via URL parameter');
      
      // Clear the success parameter from URL
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('success');
        setSearchParams(newParams, { replace: true });
      }, 1000);
    }
  }, [searchParams, cancellationHandled, setSearchParams, user, isAuthenticated, login]);

  // Handle page visibility changes (user returning from external sites like Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible - user returned, checking authentication');
        
        // When user returns to the page, check if authentication needs restoration
        const existingUser = localStorage.getItem('linkzy_user');
        const existingApiKey = localStorage.getItem('linkzy_api_key');
        
        if (existingUser && existingApiKey && (!user || !isAuthenticated)) {
          console.log('🔧 Restoring authentication after page return');
          try {
            const userData = JSON.parse(existingUser);
            login(existingApiKey, userData);
          } catch (e) {
            console.error('Failed to restore auth after page return:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle window focus for additional coverage
    const handleFocus = () => {
      console.log('🔄 Window focused - checking authentication');
      const existingUser = localStorage.getItem('linkzy_user');
      const existingApiKey = localStorage.getItem('linkzy_api_key');
      
      if (existingUser && existingApiKey && (!user || !isAuthenticated)) {
        console.log('🔧 Restoring authentication on window focus');
        try {
          const userData = JSON.parse(existingUser);
          login(existingApiKey, userData);
        } catch (e) {
          console.error('Failed to restore auth on focus:', e);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isAuthenticated, login]);

  // Poll for new content every 60s when connected
  useEffect(() => {
    if (!wpPolling) return;
    const interval = setInterval(() => {
      fetchWordPressContent();
    }, 60000);
    return () => clearInterval(interval);
  }, [wpPolling, wpUrl, wpApiKey]);

  // Filtered and searched pages
  const filteredWpPages = wpPages.filter(page => {
    const matchesType = wpTypeFilter === 'all' || page.type === wpTypeFilter;
    const matchesSearch =
      wpSearch.trim() === '' ||
      page.title.toLowerCase().includes(wpSearch.toLowerCase()) ||
      page.date.includes(wpSearch) ||
      (page.author && page.author.toLowerCase().includes(wpSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const [trackedContent, setTrackedContent] = useState<any[]>([]);
  const [trackedLoading, setTrackedLoading] = useState(false);
  const [trackedError, setTrackedError] = useState('');

  useEffect(() => {
    const fetchTrackedContent = async () => {
      setTrackedLoading(true);
      setTrackedError('');
      try {
        const { data, error } = await supabase
          .from('tracked_content')
          .select('*')
          .eq('api_key', userApiKey)
          .order('timestamp', { ascending: false });
        if (error) throw error;
        setTrackedContent(data || []);
      } catch (err) {
        setTrackedError('Failed to load tracked content.');
      } finally {
        setTrackedLoading(false);
      }
    };
    if (userApiKey) fetchTrackedContent();
  }, [userApiKey]);

  const renderProfileAndBillingTab = () => (
    <>
    <div className="space-y-6 md:space-y-8">
      {/* Profile Section with avatar */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-orange-500 flex items-center justify-center text-4xl text-orange-400 font-bold mb-2">
            <User className="w-12 h-12" />
          </div>
          <button className="mt-2 text-xs text-gray-400 hover:text-orange-400 transition-colors">Change Photo</button>
        </div>
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={userData.email}
                disabled
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <input type="text" value={userData.isPro ? 'Pro' : 'Free'} disabled className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
              <input type="text" value={userData.joinDate} disabled className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={userData.website}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </div>

      {/* Billing & Credits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Credits Card */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6 flex flex-col items-center justify-between">
          <h3 className="text-xl font-bold text-white mb-2">Credits Remaining</h3>
          <div className="text-5xl font-bold text-orange-400 mb-2">{credits}</div>
          {credits <= 1 && <div className="text-red-400 font-semibold mb-2">Low credits! Purchase more.</div>}
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-lg mt-2" onClick={() => setShowPurchaseModal(true)}>Purchase More Credits</button>
          {/* Credit Usage Table */}
          <div className="w-full mt-6">
            <h4 className="text-lg font-semibold text-white mb-2">Credit Usage History</h4>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Credits Used</th>
                    <th className="py-2 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => req.status !== 'pending' && (
                    <tr key={req.id}>
                      <td className="py-2">{req.date}</td>
                      <td className="py-2">1</td>
                      <td className="py-2">Backlink Request</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Fade/gradient for scroll cue */}
              <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-black/80 to-transparent hidden sm:block" />
            </div>
          </div>
        </div>
        {/* Billing History Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4">Billing History</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 text-left">Date</th>
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-left">Amount</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Example row, replace with real data */}
                <tr>
                  <td className="py-2">Jul 1, 2025</td>
                  <td className="py-2">Credit Purchase</td>
                  <td className="py-2">$25</td>
                  <td className="py-2"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Account Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Change Password */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
          <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors" required />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors" required />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors" required />
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-lg font-semibold transition-colors w-full min-h-[44px] text-base md:text-lg">Update Password</button>
          </form>
        </div>
        {/* Email Notifications & Preferences */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Preferences</h3>
          <div className="mb-4">
            <h4 className="text-white font-medium mb-2">Email Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-orange-500" defaultChecked />
                <span className="text-gray-300">New backlink notifications</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-orange-500" defaultChecked />
                <span className="text-gray-300">Weekly performance reports</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-orange-500" />
                <span className="text-gray-300">Billing updates</span>
              </label>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Account Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors">
                  <option>UTC</option>
                  <option>PST</option>
                  <option>EST</option>
                  <option>CET</option>
                  <option>IST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Niche Preferences Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Niche Preferences</h3>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Your Niche</label>
            <select value={contentNiche} onChange={e => setContentNiche(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors">
              {/* 25+ options, example only */}
              <option value="technology">Technology & Software</option>
              <option value="health-wellness">Health & Wellness</option>
              <option value="finance-business">Finance & Business</option>
              <option value="travel-lifestyle">Travel & Lifestyle</option>
              <option value="food-restaurants">Food & Restaurants</option>
              <option value="education">Education & Learning</option>
              <option value="creative-arts">Creative Arts & Design</option>
              <option value="home-services">Home Services & DIY</option>
              <option value="legal">Legal & Law</option>
              <option value="marketing">Marketing & Advertising</option>
              <option value="real-estate">Real Estate</option>
              <option value="automotive">Automotive</option>
              <option value="sports">Sports & Fitness</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="beauty">Beauty & Personal Care</option>
              <option value="pets">Pets & Animals</option>
              <option value="parenting">Parenting & Family</option>
              <option value="gaming">Gaming & Esports</option>
              <option value="music">Music & Audio</option>
              <option value="photography">Photography</option>
              <option value="environment">Environment & Green Living</option>
              <option value="science">Science & Research</option>
              <option value="nonprofit">Nonprofit & Charity</option>
              <option value="government">Government & Public Sector</option>
              <option value="news">News & Media</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold">Update Niche</button>
          </div>
        </div>
        <div className="mt-2 text-gray-400 text-sm">Current selection: <span className="text-orange-400 font-semibold">{contentNiche.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></div>
      </div>

      {/* Account Actions Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex space-x-4">
          <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 border border-gray-600">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
        <button onClick={logout} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-semibold">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
    
    {/* Celebration Modal for First Request */}
    <CelebrationModal
      isOpen={showCelebrationModal}
      onClose={() => setShowCelebrationModal(false)}
      achievementType="first-request"
    />
    </>
  );

  const renderLinksTab = () => (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-orange-500 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white">Your Backlinks</h3>
            <p className="text-gray-400 text-sm">Links Linkzy has automatically placed or is working on for you</p>
          </div>
        </div>
        {/* Placeholder: Replace with real data from your backend */}
        <div className="text-center py-8 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 mb-2">No backlinks yet</p>
          <p className="text-gray-500 text-sm">Once Linkzy places or finds backlinks for you, they will appear here.</p>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-8">
      {/* Sitemap Integration Card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Sitemap Integration</h3>
        <form className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourdomain.com/sitemap.xml"
            value={sitemapUrl}
            onChange={e => setSitemapUrl(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors flex-1 mb-2 md:mb-0"
          />
          <button
            type="button"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-md font-semibold transition-colors min-w-[160px] max-w-fit min-h-[44px] text-base"
            onClick={() => fetchSitemap(sitemapUrl)}
            disabled={sitemapLoading || !sitemapUrl}
          >
            {sitemapLoading ? 'Connecting...' : 'Connect Sitemap'}
          </button>
        </form>
        {sitemapError && <div className="text-red-400 text-sm mb-2">{sitemapError}</div>}
        {sitemapPages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white font-semibold mb-2">Discovered Pages ({sitemapPages.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {sitemapPages.map((page, idx) => (
                <button
                  key={page.url + idx}
                  type="button"
                  className="block w-full text-left bg-gray-800 hover:bg-orange-900/30 text-orange-400 px-4 py-2 rounded-lg text-xs font-mono truncate"
                  onClick={() => setRequestUrl(page.url)}
                >
                  <div className="flex flex-col items-start">
                    <span className="truncate w-full">{page.url}</span>
                    <span className="text-gray-400 text-[10px] mt-1">
                      {page.lastmod && <span>Last Modified: {page.lastmod} </span>}
                      {page.priority && <span>• Priority: {page.priority} </span>}
                      {page.changefreq && <span>• Changefreq: {page.changefreq}</span>}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-gray-400 text-xs mt-2">Tap a page to auto-fill the request form. Metadata shown if available.</div>
          </div>
        )}
      </div>
      {/* Blog Integration Card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:space-x-8 mb-4">
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mb-4 md:mb-0">
          <FileText className="w-8 h-8 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">Blog Integration</h3>
          <p className="text-gray-400 mb-4">Scan your blog root URL to automatically suggest backlink opportunities from recent posts.</p>
          <form className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <input type="url" placeholder="https://yourdomain.com/blog/" className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors" />
            <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-md font-semibold transition-colors min-w-[160px] max-w-fit min-h-[44px] text-base">Scan Blog</button>
          </form>
        </div>
      </div>
      {/* WordPress Integration Card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:space-x-8 mb-4">
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mb-4 md:mb-0">
          <Monitor className="w-8 h-8 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">WordPress Integration</h3>
          <p className="text-gray-400 mb-4">Connect your WordPress site for automatic content sync and backlink suggestions.</p>
          <form className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://yourwpsite.com"
              value={wpUrl}
              onChange={e => setWpUrl(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors flex-1 mb-2 md:mb-0"
            />
            <input
              type="text"
              placeholder="API Key (optional)"
              value={wpApiKey}
              onChange={e => setWpApiKey(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors flex-1 mb-2 md:mb-0"
            />
            <button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-md font-semibold transition-colors min-w-[160px] max-w-fit min-h-[44px] text-base"
              onClick={fetchWordPressContent}
              disabled={wpLoading || !wpUrl}
            >
              {wpLoading ? 'Connecting...' : 'Connect WordPress'}
            </button>
          </form>
          {wpPages.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
              <input
                type="text"
                placeholder="Search by title, date, or author..."
                value={wpSearch}
                onChange={e => setWpSearch(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors flex-1 mb-2 md:mb-0"
              />
              <select
                value={wpTypeFilter}
                onChange={e => setWpTypeFilter(e.target.value as 'all' | 'post' | 'page')}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors w-40"
              >
                <option value="all">All Types</option>
                <option value="post">Posts</option>
                <option value="page">Pages</option>
              </select>
            </div>
          )}
          {wpError && <div className="text-red-400 text-sm mb-2">{wpError}</div>}
          {wpPages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Discovered Content ({filteredWpPages.length})</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredWpPages.length === 0 ? (
                  <div className="text-gray-400 text-xs">No results found.</div>
                ) : (
                  filteredWpPages.map((page) => (
                    <button
                      key={page.type + '-' + page.id}
                      type="button"
                      className="block w-full text-left bg-gray-800 hover:bg-orange-900/30 text-orange-400 px-4 py-2 rounded-lg text-xs font-mono truncate"
                      onClick={() => setRequestUrl(page.url)}
                    >
                      <div className="flex items-center space-x-3">
                        {page.featuredImage && (
                          <img src={page.featuredImage} alt="Featured" className="w-10 h-10 object-cover rounded-lg border border-gray-700 flex-shrink-0" />
                        )}
                        <div className="flex flex-col items-start min-w-0">
                          <span className="truncate w-full font-semibold text-white text-xs md:text-sm">{page.title || page.url}</span>
                          <span className="text-gray-400 text-[10px] mt-1">
                            {page.type === 'post' ? 'Post' : 'Page'} • {page.date && new Date(page.date).toLocaleDateString()}<br />
                            {page.author && <span>By {page.author} • </span>}{page.url}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="text-gray-400 text-xs mt-2">Tap a post/page to auto-fill the request form URL. Content is refreshed automatically every 60 seconds.</div>
            </div>
          )}
        </div>
      </div>
      {/* API Integration Card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:space-x-8">
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mb-4 md:mb-0">
          <Code className="w-8 h-8 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">API Integration</h3>
          <p className="text-gray-400 mb-4">
            <strong>One-time setup:</strong> Add this JavaScript snippet <strong>ONCE</strong> to your site's main template or header, just like you would with Google Analytics. This will automatically track <strong>ALL</strong> pages on your site.
          </p>
          <ul className="text-gray-400 text-sm mb-4 list-disc pl-5">
            <li><strong>For most sites:</strong> Add to your main HTML template or header file (e.g., <code>header.html</code> or <code>_app.js</code> in Next.js).</li>
            <li><strong>For WordPress:</strong> Add to <code>header.php</code> in your theme, or use a plugin like "Insert Headers and Footers".</li>
            <li><strong>For other platforms:</strong> Add to your main layout or template file.</li>
          </ul>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-2 overflow-x-auto">
            <code className="text-green-400 text-xs select-all whitespace-pre">{apiSnippet}</code>
          </div>
          <button
            type="button"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-md font-semibold transition-colors min-w-[160px] max-w-fit min-h-[44px] text-base mb-2"
            onClick={handleCopySnippet}
          >
            {snippetCopied ? 'Copied!' : 'Copy Snippet'}
          </button>
          <div className="text-gray-400 text-xs">
            <strong>Note:</strong> This is a <strong>one-time setup</strong>. You do <strong>not</strong> need to add the snippet to every page—just your site's main template or header, and it will track all pages automatically.
          </div>
        </div>
      </div>
    </div>
  );

  // Purchase Credits Modal
  if (showPurchaseModal) {
    return (
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        currentCredits={credits}
        currentPlan={userData.isPro ? 'Pro' : 'Free'}
      />
    );
  }

  // Notification Toasts
  if (notifications.length > 0) {
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((n, i) => (
          <div key={i} className={`px-4 py-3 rounded-lg shadow-lg text-white font-semibold ${
            n.type === 'success' ? 'bg-green-600' : n.type === 'warning' ? 'bg-orange-600' : 'bg-red-600'
          }`}>
            {n.message}
          </div>
        ))}
      </div>
    );
  }

  // Show confetti animation when showConfetti is true
  if (showConfetti) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-gray-900 border border-orange-500 rounded-xl p-8 flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-orange-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <span className="text-white font-semibold">Submitting...</span>
        </div>
      </div>
    );
  }

  // Request Modal
  if (showRequestModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
        <div className="bg-gray-900 border border-orange-500 shadow-xl p-0 w-full h-full max-w-none max-h-none rounded-none md:rounded-2xl md:p-8 md:w-full md:max-w-lg md:h-auto md:max-h-[90vh] relative overflow-y-auto">
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors w-12 h-12 flex items-center justify-center text-3xl md:top-4 md:right-4 md:w-10 md:h-10 md:text-2xl"
            onClick={() => setShowRequestModal(false)}
            aria-label="Close modal"
          >
            <span>&times;</span>
          </button>
          <div className="p-6 md:p-0">
            <h2 className="text-2xl font-bold text-white mb-6">Submit New Backlink Request</h2>
            {requestSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <span className="text-4xl mb-4">🎉</span>
                <p className="text-lg text-orange-400 font-semibold mb-2">Request submitted successfully!</p>
                <p className="text-gray-300">We'll review your request and update you soon.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleRequestModalSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target URL</label>
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="https://yourwebsite.com/page"
                    value={requestUrl}
                    onChange={e => setRequestUrl(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Keywords</label>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="e.g. business automation, SEO tools"
                    value={requestKeywords}
                    onChange={e => setRequestKeywords(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Niche</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
                    value={requestNiche}
                    onChange={e => setRequestNiche(e.target.value)}
                    required
                  >
                    <option value="technology">Technology</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                    <option value="finance">Finance</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="travel">Travel</option>
                    <option value="food">Food</option>
                    <option value="fashion">Fashion</option>
                    <option value="sports">Sports</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="environment">Environment & Green Living</option>
                    <option value="science">Science & Research</option>
                    <option value="nonprofit">Nonprofit & Charity</option>
                    <option value="government">Government & Public Sector</option>
                    <option value="news">News & Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Request Details</label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-white text-base md:text-lg focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Describe your goals, preferred anchor text, or any special instructions."
                    value={requestNotes}
                    onChange={e => setRequestNotes(e.target.value)}
                    rows={4}
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-lg font-semibold transition-colors w-full min-h-[44px] text-base md:text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Account"> 
      <div className="p-4 md:p-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
          <p className="text-gray-400">Manage your profile, request backlinks, and update your settings</p>
        </div>

        {/* Stripe Cancellation Message */}
        {showCancellationMessage && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-yellow-400 font-medium mb-2">Payment Canceled</h4>
                <p className="text-yellow-300 text-sm mb-4">
                  Your payment was canceled and no charges were made. You can try purchasing credits again anytime.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                  <button 
                    onClick={() => setShowCancellationMessage(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 md:mb-8">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-6 md:space-x-8 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
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
        {activeTab === 'profile-billing' && renderProfileAndBillingTab()}
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'integrations' && renderIntegrationsTab()}
      </div>
    </DashboardLayout>
  );
};

export default DashboardAccount;