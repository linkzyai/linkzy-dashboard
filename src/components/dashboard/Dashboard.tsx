import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useDashboardStats } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingTracker from '../OnboardingTracker';
import ProfileOnboardingModal from './OnboardingModal';
import OnboardingModal from '../OnboardingModal';
import CelebrationModal from '../CelebrationModal';
import ContextualHelp from '../ContextualHelp';
import ProfileCompletionModal from '../ProfileCompletionModal';
import { 
  Link as LinkIcon, 
  ArrowRight,
  Calendar,
  DollarSign,
  HelpCircle,
  ExternalLink,
  Plus,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Zap,
  CheckCheck
} from 'lucide-react';
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../../lib/supabase';

// Types for dashboard data
export type Backlink = {
  id?: string;
  domain?: string;
  url?: string;
  anchorText?: string;
  anchor?: string;
  status?: string;
  clicks?: number;
  trafficIncrease?: string;
  [key: string]: any;
};

export type PerformanceData = {
  successful: number;
  pending: number;
  failed: number;
};

export type DashboardDataType = {
  totalBacklinks: number;
  successRate: number;
  creditsRemaining: number;
  monthlySpend: number;
  recentBacklinks: Backlink[];
  performanceData: PerformanceData;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileOnboarding, setShowProfileOnboarding] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'first-request' | 'first-backlink' | 'completed-onboarding'>('completed-onboarding');
  const [currentStep, setCurrentStep] = useState(0);
  const { data: dashboardData, loading, error, refetch } = useDashboardStats();
  const [currentCredits, setCurrentCredits] = useState(user?.credits || 0);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  // Admin tools removed for launch

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { newCredits } = customEvent.detail;
      setCurrentCredits(newCredits);
      console.log('✅ Main dashboard credits updated:', newCredits);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    };
  }, []);

  // Update credits when user changes
  useEffect(() => {
    setCurrentCredits(user?.credits || 0);
  }, [user?.credits]);

  // Add timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setDashboardError('Dashboard is taking too long to load. Showing with default data.');
          console.warn('⚠️ Dashboard loading timeout - showing fallback');
        }
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const [onboardingProgress, setOnboardingProgress] = useState(() => {
    const stored = localStorage.getItem('linkzy_onboarding_progress');
    return stored ? JSON.parse(stored) : { request: false, track: false, analytics: false };
  });

  const updateOnboardingProgress = (step: string, value: boolean) => {
    const updated = { ...onboardingProgress, [step]: value };
    setOnboardingProgress(updated);
    localStorage.setItem('linkzy_onboarding_progress', JSON.stringify(updated));
  };

  // Enhanced dashboard loading with fallback logic
  useEffect(() => {
    const loadDashboard = async () => {
      // If we already have data or are still loading normally, don't interfere
      if (dashboardData || loading) return;
      
      // If there's an error loading dashboard data, check auth state
      if (error) {
        
                  try {
            // Try Supabase auth first
            const { data: session } = await supabase.auth.getSession();
            if (session?.user) return;
            
            // Fallback to localStorage
            const localUser = localStorage.getItem('linkzy_user');
            const localApiKey = localStorage.getItem('linkzy_api_key');
            
            if (localUser && localApiKey) {
              // We have auth data, the error might be temporary - let normal retry handle it
              return;
            }
            
            // If nothing works, redirect to login instead of showing error
            navigate('/');
            
          } catch (authError) {
            // Don't show timeout modal, just redirect to login
            navigate('/');
          }
      }
    };

    // Run the fallback check after a brief delay to let normal loading complete
    const fallbackTimer = setTimeout(loadDashboard, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [error, navigate]); // Removed dashboardData and loading to prevent infinite loops

  useEffect(() => {
    if (!onboardingProgress.track) {
      const timer = setTimeout(() => {
        updateOnboardingProgress('track', true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingProgress.track]);

  useEffect(() => {
    if (window.location.pathname.includes('/dashboard/analytics')) {
      updateOnboardingProgress('analytics', true);
    }
  }, []);

  useEffect(() => {
    // Check if user is new (has 0 backlinks) and show onboarding modal
    if (!loading && !error && dashboardData) {
      const hasNoBacklinks = ((dashboardData as DashboardDataType)?.totalBacklinks || 0) === 0;
      const initialFreeCredits = 3;
      const isFreePlan = !user?.plan || user?.plan === 'free';
      const hasOnlyFreeCredits = (user?.credits ?? 0) <= initialFreeCredits;
      const shouldShowOnboarding = hasNoBacklinks && isFreePlan && hasOnlyFreeCredits && !localStorage.getItem('linkzy_onboarding_shown');
      
      if (shouldShowOnboarding) {
        // Show onboarding modal after a short delay
        setTimeout(() => {
          setShowOnboardingModal(true);
          localStorage.setItem('linkzy_onboarding_shown', 'true');
        }, 1500);
      }
      
      // Check if user needs to complete their profile
      const needsProfileCompletion = user && (
        !user.website || 
        user.website === 'yourdomain.com' || 
        user.website === 'https://example.com' ||
        !user.niche || 
        user.niche === 'technology' ||
        user.niche === 'Technology'
      );
      
      const hasSeenProfileCompletion = localStorage.getItem('linkzy_profile_completion_seen');
      const hasSeenProfileOnboarding = localStorage.getItem('linkzy_profile_onboarding_seen');
      
      // Debug logging
      console.log('🔍 Profile completion check:', {
        needsProfileCompletion,
        hasSeenProfileCompletion,
        showOnboardingModal,
        showProfileCompletion,
        showProfileOnboarding,
        userWebsite: user?.website,
        userNiche: user?.niche
      });
      
      // Only show ONE profile completion modal - prioritize the newer ProfileCompletionModal
      if (needsProfileCompletion && !hasSeenProfileCompletion && !showOnboardingModal && !showProfileCompletion && !showProfileOnboarding) {
        console.log('🔄 Showing ProfileCompletionModal for user:', user);
        setTimeout(() => {
          setShowProfileCompletion(true);
          // Don't set completion flag here - wait for actual completion
        }, shouldShowOnboarding ? 3000 : 1000);
      }
      
      // Check if user just got their first backlink
      const justReceivedFirstBacklink = localStorage.getItem('linkzy_had_no_backlinks') === 'true' 
                                       && ((dashboardData as DashboardDataType)?.totalBacklinks || 0) > 0;
                                       
      if (justReceivedFirstBacklink) {
        // Show celebration modal
        localStorage.removeItem('linkzy_had_no_backlinks');
        setCelebrationType('first-backlink');
        setTimeout(() => setShowCelebrationModal(true), 1000);
      } else if (hasNoBacklinks) {
        localStorage.setItem('linkzy_had_no_backlinks', 'true');
      }
    }
  }, [dashboardData, user, showOnboardingModal, showProfileCompletion]); // Only depend on stable values



  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="p-6">
          <LoadingSpinner text="Loading dashboard data..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="p-6">
          <ErrorMessage message={error} onRetry={refetch} />
        </div>
      </DashboardLayout>
    );
  }

  // Use real data or fallback to defaults
  const hasBacklinks = ((dashboardData as DashboardDataType)?.totalBacklinks || 0) > 0;
  const effectiveCredits = (() => {
    const plan = user?.plan || 'free';
    const credits = currentCredits ?? 0;
    return (plan === 'free' && credits < 3) ? 3 : credits;
  })();
  
  // Define onboarding steps
  const onboardingSteps = [
    {
      label: 'Integrate your website',
      completed: onboardingProgress.request,
      description: 'Connect your site to enable automated backlink matching',
    },
    {
      label: 'Track progress',
      completed: onboardingProgress.track,
      description: 'Monitor your backlink status',
    },
    {
      label: 'View results',
      completed: onboardingProgress.analytics,
      description: 'Analyze your SEO improvements',
    },
  ];
  
  // Only show total backlinks and success rate if user has backlinks
  const stats = [
    ...(hasBacklinks ? [{ 
      name: 'Total Backlinks', 
      value: String((dashboardData as DashboardDataType)?.totalBacklinks ?? 0), 
      change: '+6% from last month', 
      changeType: 'increase', 
      icon: LinkIcon,
      color: 'text-white'
    }, { 
      name: 'Success Rate', 
      value: `${((dashboardData as DashboardDataType)?.successRate || 0).toString()}%`, 
      change: '+2% from last month', 
      changeType: 'increase', 
      icon: TrendingUp,
      color: 'text-white'
    }] : []),
    { 
      name: 'Credits Remaining', 
      value: effectiveCredits.toString() || '0', 
      change: 'Available for use', 
      changeType: 'neutral', 
      icon: Zap,
      color: 'text-white'
    },
    { 
      name: 'Monthly Spend', 
      value: `$${((dashboardData as DashboardDataType)?.monthlySpend || 0).toString()}`, 
      change: 'Current period', 
      changeType: 'neutral', 
      icon: DollarSign,
      color: 'text-white'
    },
  ];

  const recentBacklinks = ((dashboardData as DashboardDataType)?.recentBacklinks || []) as Backlink[];
  const performanceData = ((dashboardData as DashboardDataType)?.performanceData || {
    successful: 85,
    pending: 10,
    failed: 5
  }) as PerformanceData;
  
  // Create userData from user object
  const userData = {
    email: user?.email || 'user@example.com',
    website: user?.website || 'https://example.com',
    niche: user?.niche || 'Technology',
    apiKey: user?.api_key || 'linkzy_user_example_com_1234567890',
    credits: user?.credits || 3,
    isPro: user?.plan && user.plan !== 'free',
    joinDate: 'December 2024'
  };

  return (
    <>
      <DashboardLayout title="Overview">
        <div className="p-6">
          {/* Welcome Section with guidance for new users */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              {hasBacklinks ? "Welcome back!" : "Welcome to Linkzy"}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${userData.isPro ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-gray-800 text-gray-300 border-gray-600'}`}>
                {userData.isPro ? 'Pro plan • 30 credits/mo' : 'Free plan'}
              </span>
              {!hasBacklinks && (
                <ContextualHelp
                  title="Getting Started"
                  content={
                    <div className="space-y-2">
                      <p>Welcome to Linkzy! We're excited to help boost your website's SEO with quality backlinks.</p>
                      <p>You have 3 free credits to start with. Each credit gets you one high-quality backlink.</p>
                      <p>Follow the onboarding guide to get started quickly!</p>
                    </div>
                  }
                  highlight={true}
                  position="right"
                  icon={<HelpCircle className="w-5 h-5 ml-2 text-orange-400 animate-pulse" />}
                />
              )}
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {hasBacklinks 
                  ? "Here's what's happening with your backlinks today." 
                  : "Let's get your first backlinks. Click 'Integrate Website' to start."}
              </p>
            </div>
          </div>

          {/* Simplified Action Buttons: Larger and More Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative px-1">
            {!hasBacklinks && (
              <div className="absolute -top-6 left-1/4 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center animate-bounce">
                <ArrowRight className="w-4 h-4 rotate-90 mr-1" />
                Start here
              </div>
            )}
            {hasBacklinks && (
              <button className="bg-gray-800 hover:bg-gray-700 text-white p-6 md:p-5 rounded-xl transition-colors flex items-center justify-center space-x-3 border border-gray-600 min-h-[60px]">
                <ArrowRight className="w-6 h-6 text-gray-300" />
                <span className="text-base md:text-lg font-semibold">View Results</span>
              </button>
            )}
          </div>

          {/* Admin tools removed */}

          {/* Onboarding Progress Tracker - Show only for new users */}
          {!hasBacklinks && (
            <div className="mb-8">
              <OnboardingTracker 
                steps={onboardingSteps}
                currentStepIndex={currentStep}
                onStepClick={setCurrentStep}
              />
            </div>
          )}

          {/* Track Progress Section */}
          {!hasBacklinks && (
            <div className="mb-8">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-white">Track Progress</h3>
                </div>
                <div className="space-y-4">
                  {recentBacklinks.length > 0 ? (
                    recentBacklinks.map((link: any, index: number) => (
                      <div key={link.id || index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <p className="text-white font-medium truncate max-w-[150px] md:max-w-none">{link.domain || link.url}</p>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              link.status === 'success' || link.status === 'placed'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : link.status === 'pending'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {(link.status || 'pending').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">"{link.anchorText || link.anchor}"</p>
                          <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 text-xs">
                            <span className="text-gray-500">{link.clicks || 0} clicks</span>
                            <span className="text-gray-500">Traffic: {link.trafficIncrease || '+0%'}</span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-800/50 rounded-xl border border-gray-700">
                      <p className="text-gray-300">No integrations yet. Integrate your website to start tracking progress!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metrics with Conditional Display for New Users */}
          {!hasBacklinks && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h3 className="text-xl font-bold text-white">Performance Metrics</h3>
              </div>
              <div className="text-gray-300 flex items-center space-x-2 justify-center">
                <span>Integrate your website to see performance metrics</span>
                <ContextualHelp 
                  title="Performance Metrics"
                  content={
                    <div className="space-y-2">
                      <p>After your first integration, you'll see metrics including:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Success rate of your backlinks</li>
                        <li>Traffic generated from backlinks</li>
                        <li>SEO improvement metrics</li>
                        <li>ROI calculator</li>
                      </ul>
                    </div>
                  }
                />
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${stats.length} gap-6 mb-8`}>
            {stats.map((stat) => (
              <div key={stat.name} className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <stat.icon className="w-5 h-5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  </div>
                  {stat.changeType === 'increase' && (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <p className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Recent Backlinks */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Recent Backlinks</h2>
                  <p className="text-gray-400 text-sm">Your latest backlink placements</p>
                </div>
                <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-600">
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {hasBacklinks ? (
                  recentBacklinks.map((link: any, index: number) => (
                    <div key={link.id || index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-white font-medium truncate max-w-[150px] md:max-w-none">{link.domain || link.url}</p>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            link.status === 'success' || link.status === 'placed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : link.status === 'pending'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {(link.status || 'pending').toUpperCase()}
                          </span>
                          {link.domainAuthority && (
                            <span className="bg-blue-500/20 text-white px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/30">
                              DA {link.domainAuthority}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">"{link.anchorText || link.anchor}"</p>
                        <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 text-xs">
                          <span className="text-gray-500">{link.clicks || 0} clicks</span>
                          <span className="text-gray-500">Traffic: {link.trafficIncrease || '+0%'}</span>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-center mb-2">
                      <h3 className="text-lg md:text-xl font-bold text-white mr-2">Ready to boost your SEO?</h3>
                      <ContextualHelp
                        title="How Backlinks Work"
                        content={
                          <div className="space-y-2">
                            <p>Backlinks are links from other websites to yours. They're one of the most important factors for SEO rankings.</p>
                            <p>With Linkzy, we place your backlinks on high-quality, relevant websites in your niche. This helps search engines see your site as more authoritative.</p>
                          </div>
                        }
                      />
                    </div>
                    <p className="text-gray-300 mb-6">
                      Your first {user?.credits || 3} backlinks are free! Get high-quality backlinks from real niche blogs.
                    </p>
                    
                    <button 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto mb-6 shadow-lg shadow-orange-500/20 animate-pulse min-h-[56px] w-full md:w-auto"
                      onClick={() => navigate('/dashboard/account', { state: { tab: 'integrations' } })}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Integrate Website</span>
                    </button>
                    
                    <div className="flex flex-wrap justify-center space-x-2 md:space-x-6 text-gray-400 text-xs md:text-sm">
                      <div className="flex items-center space-x-1 my-1">
                        <CheckCheck className="w-4 h-4 text-green-400" />
                        <span>95% success rate</span>
                      </div>
                      <div className="flex items-center space-x-1 my-1">
                        <CheckCheck className="w-4 h-4 text-green-400" />
                        <span>Real websites in your niche</span>
                      </div>
                      <div className="flex items-center space-x-1 my-1">
                        <CheckCheck className="w-4 h-4 text-green-400" />
                        <span>Results in 7-14 days</span>
                      </div>
                    </div>
                 </div>
                )}
              </div>
              
              <div className="mt-6">
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 border border-gray-600">
                  <span>View All Backlinks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Performance Overview */}
            {hasBacklinks && <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Performance Overview</h2>
                <p className="text-gray-400 text-sm">Backlink success rate breakdown</p>
              </div>
              
              <div className="flex items-center justify-center mb-8">
                {/* Donut Chart */}
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="8"
                    />
                    
                    {/* Success segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray={`${performanceData.successful * 2.513} ${(100 - performanceData.successful) * 2.513}`}
                      strokeDashoffset="0"
                      className="transition-all duration-1000"
                    />
                    
                    {/* Pending segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeDasharray={`${performanceData.pending * 2.513} ${(100 - performanceData.pending) * 2.513}`}
                      strokeDashoffset={`-${performanceData.successful * 2.513}`}
                      className="transition-all duration-1000"
                    />
                    
                    {/* Failed segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeDasharray={`${performanceData.failed * 2.513} ${(100 - performanceData.failed) * 2.513}`}
                      strokeDashoffset={`-${(performanceData.successful + performanceData.pending) * 2.513}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{performanceData.successful}%</p>
                      <p className="text-gray-400 text-xs">Success Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-green-400">
                      Successful: {performanceData.successful}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-orange-400">
                      Pending: {performanceData.pending}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-red-400">
                      Failed: {performanceData.failed}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">Excellent Performance</span>
                </div>
                <p className="text-white text-sm">
                  Your success rate is {performanceData.successful >= 80 ? 'above' : 'at'} industry average. Keep up the great work!
                </p>
              </div>
            </div>
            }
          </div>

          {/* New User Getting Started Guide (only shown when no backlinks) */}
          {!hasBacklinks && (
            <div className="mt-6 md:mt-8 bg-gray-900 border border-gray-700 rounded-xl p-4 md:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Getting Started Guide</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative">
                <div className={`bg-gray-800 rounded-lg p-5 text-center ${currentStep === 0 ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : ''}`}>
                  <div className={`w-12 h-12 ${currentStep === 0 ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors`}>
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">1. Integrate Website</h3>
                  <p className="text-gray-400 text-sm">Connect your site to enable automated backlink matching</p>
                </div>
                
                <div className={`bg-gray-800 rounded-lg p-5 text-center ${currentStep === 1 ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : ''}`}>
                  <div className={`w-12 h-12 ${currentStep === 1 ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors`}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">2. Wait 7-14 Days</h3>
                  <p className="text-gray-400 text-sm">We'll place your links on relevant sites</p>
                  <div className="mt-3">
                    <ContextualHelp
                      title="What Happens During Processing"
                      content={
                        <div className="space-y-2">
                          <p>When your request is being processed, our team:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Finds relevant websites in your niche</li>
                            <li>Ensures they meet our quality standards (DA 20+)</li>
                            <li>Places your backlinks in contextually relevant content</li>
                            <li>Verifies the link is live and indexed</li>
                          </ul>
                        </div>
                      }
                      width="wide"
                    />
                  </div>
                </div>
                
                <div className={`bg-gray-800 rounded-lg p-5 text-center ${currentStep === 2 ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20' : ''}`}>
                  <div className={`w-12 h-12 ${currentStep === 2 ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors`}>
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">3. See Results</h3>
                  <p className="text-gray-400 text-sm">Watch your SEO improve in real-time</p>
                  <div className="mt-3">
                    <ContextualHelp
                      title="Expected Results"
                      content={
                        <div className="space-y-2">
                          <p>After your backlinks are placed, you can expect:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Increased domain authority (2-4 weeks)</li>
                            <li>Better keyword rankings (3-8 weeks)</li>
                            <li>More organic traffic (4-12 weeks)</li>
                            <li>Complete analytics in your dashboard</li>
                          </ul>
                          <p>Results vary based on competition and niche.</p>
                        </div>
                      }
                      width="wide"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-orange-400 font-medium">Need help getting started?</p>
                  <p className="text-gray-300 text-sm">We're here to help you succeed with Linkzy</p>
                </div>
                <div>
                  <button 
                    onClick={() => setShowOnboardingModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors min-h-[48px]"
                  >
                    View Tutorial
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Onboarding Modal */}
          <OnboardingModal 
            isOpen={showOnboardingModal}
            onClose={() => {
              setShowOnboardingModal(false);
              localStorage.setItem('linkzy_onboarding_shown', 'true');
            }}
            onAction={() => {
              setShowOnboardingModal(false);
              localStorage.setItem('linkzy_onboarding_shown', 'true');
              navigate('/dashboard/account');
            }}
            creditsRemaining={userData?.credits || 3}
          />
          
          {/* Profile Completion Modal - NEW */}
          <ProfileCompletionModal 
            isOpen={showProfileCompletion}
            onClose={() => {
              setShowProfileCompletion(false);
              localStorage.setItem('linkzy_profile_completion_seen', 'true');
            }}
            onComplete={() => {
              setShowProfileCompletion(false);
              localStorage.setItem('linkzy_profile_completion_seen', 'true');
              // Refresh dashboard data to show updated profile
              refetch();
            }}
            user={user}
          />
          
          {/* Celebration Modal */}
          <CelebrationModal 
            isOpen={showCelebrationModal}
            onClose={() => setShowCelebrationModal(false)}
            achievementType={celebrationType}
          />
          
          {/* Profile Onboarding Modal - EXISTING */}
          <ProfileOnboardingModal 
            isOpen={showProfileOnboarding}
            onComplete={(website, niche) => {
              setShowProfileOnboarding(false);
              localStorage.setItem('linkzy_profile_onboarding_seen', 'true');
              // Refresh dashboard data to show updated profile
              refetch();
            }}
            onSkip={() => {
              setShowProfileOnboarding(false);
              localStorage.setItem('linkzy_profile_onboarding_seen', 'true');
            }}
            userEmail={user?.email || ''}
          />
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;