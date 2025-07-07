import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Link as LinkIcon, 
  CheckCircle, 
  Clock,
  BarChart3,
  Zap,
  ArrowUp,
  ExternalLink,
  Activity,
  Target,
  Users,
  Eye
} from 'lucide-react';

const AnimatedDashboardDemo = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [backlinks, setBacklinks] = useState(847);
  const [successRate, setSuccessRate] = useState(89);
  const [credits, setCredits] = useState(23);
  const [visitors, setVisitors] = useState(1247);
  const [newBacklinkIndex, setNewBacklinkIndex] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 12);
      
      // Update stats occasionally
      if (Math.random() > 0.7) {
        setBacklinks(prev => prev + Math.floor(Math.random() * 3));
        setSuccessRate(prev => Math.min(98, prev + (Math.random() > 0.5 ? 1 : 0)));
        setVisitors(prev => prev + Math.floor(Math.random() * 15));
      }
      
      // Add new backlinks occasionally
      if (Math.random() > 0.8) {
        setNewBacklinkIndex(prev => prev + 1);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const recentBacklinks = [
    { 
      id: 1 + newBacklinkIndex, 
      url: 'TechCrunch.com', 
      status: 'success', 
      anchor: 'AI automation tools',
      da: 95,
      clicks: 47 + Math.floor(Math.random() * 10),
      isNew: newBacklinkIndex > 0
    },
    { 
      id: 2 + newBacklinkIndex, 
      url: 'Forbes.com', 
      status: 'success', 
      anchor: 'business efficiency',
      da: 92,
      clicks: 23 + Math.floor(Math.random() * 8),
      isNew: newBacklinkIndex > 1
    },
    { 
      id: 3 + newBacklinkIndex, 
      url: 'Entrepreneur.com', 
      status: animationStep > 6 ? 'success' : 'pending', 
      anchor: 'startup growth',
      da: 88,
      clicks: animationStep > 6 ? 12 + Math.floor(Math.random() * 5) : 0,
      isNew: newBacklinkIndex > 2
    },
    { 
      id: 4 + newBacklinkIndex, 
      url: 'Inc.com', 
      status: 'processing', 
      anchor: 'digital marketing',
      da: 85,
      clicks: 0,
      isNew: newBacklinkIndex > 3
    },
  ];

  const stats = [
    { 
      name: 'Total Backlinks', 
      value: backlinks.toString(), 
      change: '+12.5% this month', 
      changeType: 'increase', 
      icon: LinkIcon,
      color: 'text-white'
    },
    { 
      name: 'Success Rate', 
      value: `${successRate}%`, 
      change: '+3.2% this month', 
      changeType: 'increase', 
      icon: TrendingUp,
      color: 'text-white'
    },
    { 
      name: 'Credits Remaining', 
      value: credits.toString(), 
      change: 'Growth Plan', 
      changeType: 'neutral', 
      icon: Zap,
      color: 'text-white'
    },
    { 
      name: 'Monthly Visitors', 
      value: visitors.toString(), 
      change: '+24% from backlinks', 
      changeType: 'increase', 
      icon: Users,
      color: 'text-white'
    },
  ];

  return (
    <div className="bg-black min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-orange-500">Sarah!</span>
            </h1>
            <p className="text-gray-400 text-lg">Here's what's happening with your backlinks today.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.name} 
            className={`bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-500 transform ${
              animationStep === index ? 'scale-105 border-orange-500 shadow-lg shadow-orange-500/20' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <stat.icon className="w-5 h-5 text-gray-400" />
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
              </div>
              {stat.changeType === 'increase' && (
                <ArrowUp className="w-4 h-4 text-green-400" />
              )}
            </div>
            <p className={`text-3xl font-bold mb-2 ${stat.color} transition-all duration-300`}>
              {stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Backlinks with Live Updates */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Live Backlink Placements</h2>
              <p className="text-gray-400">Real-time backlink creation and monitoring</p>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
              <span className="text-orange-500 text-sm font-medium">Active</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentBacklinks.map((link, index) => (
              <div 
                key={link.id} 
                className={`flex items-center justify-between p-4 bg-gray-800 rounded-lg transition-all duration-500 transform ${
                  link.isNew && newBacklinkIndex > index ? 'animate-pulse bg-green-900/20 border border-green-500/30' : ''
                } ${
                  link.status === 'processing' && animationStep % 4 === 0 ? 'bg-orange-900/20 border border-orange-500/30' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <p className="text-white font-medium">{link.url}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      link.status === 'success' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : link.status === 'pending'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {link.status.toUpperCase()}
                    </span>
                    <span className="bg-purple-500/20 text-white px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">
                      DA {link.da}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">"{link.anchor}"</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500">{link.clicks} clicks</span>
                    </div>
                    {link.status === 'success' && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">+{Math.floor(Math.random() * 20) + 5}% traffic</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Processing Indicator */}
          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-blue-400 font-medium">Processing 3 new requests...</p>
            </div>
          </div>
        </div>

        {/* Performance Analytics with Charts */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Performance Analytics</h2>
            <p className="text-gray-400">Real-time success rate and traffic impact</p>
          </div>
          
          {/* Success Rate Donut */}
          <div className="flex items-center justify-center mb-8">
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
                
                {/* Success segment with animation */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${successRate * 2.513} ${(100 - successRate) * 2.513}`}
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
                  strokeDasharray={`${8 * 2.513} ${(100 - 8) * 2.513}`}
                  strokeDashoffset={`-${successRate * 2.513}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{successRate}%</p>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Traffic Growth</span>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-semibold">+24%</span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(75 + (animationStep * 2), 95)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Domain Authority</span>
                <span className="text-white font-semibold">Avg: 87</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: '87%' }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Revenue Attribution</span>
                <span className="text-white font-semibold">$4,250</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(60 + (animationStep * 3), 85)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Achievement Badge */}
          <div className="mt-6 bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-orange-400 font-medium">Performance Milestone!</p>
                <p className="text-white text-sm">You've exceeded 85% success rate this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="mt-8 bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-6 h-6 text-orange-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Live Activity Feed</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`bg-green-900/20 border border-green-500/30 rounded-lg p-4 transition-all duration-300 ${
            animationStep % 3 === 0 ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Link Placed</p>
                <p className="text-green-400 text-sm">TechBlog.com • Just now</p>
              </div>
            </div>
          </div>
          
          <div className={`bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 transition-all duration-300 ${
            animationStep % 3 === 1 ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-white font-medium">In Progress</p>
                <p className="text-orange-400 text-sm">Forbes.com • 2 min ago</p>
              </div>
            </div>
          </div>
          
          <div className={`bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 transition-all duration-300 ${
            animationStep % 3 === 2 ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Analytics Updated</p>
                <p className="text-blue-400 text-sm">New data • 1 min ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDashboardDemo;