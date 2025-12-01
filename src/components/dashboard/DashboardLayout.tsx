import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  BarChart3,
  Link as LinkIcon,
  User,
  LogOut,
  Menu,
  X,
  Search
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Track window resize to determine if on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const diff = touchEndX - touchStartX;
      if (!sidebarOpen && touchStartX < 40 && diff > 60) {
        setSidebarOpen(true);
      } else if (sidebarOpen && diff < -60) {
        setSidebarOpen(false);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    // { 
    //   name: 'Analytics', 
    //   href: '/dashboard/analytics', 
    //   icon: BarChart3, 
    //   current: location.pathname === '/dashboard/analytics' 
    // },

    {
      name: 'Account',
      href: '/dashboard/account',
      icon: User,
      current: location.pathname === '/dashboard/account'
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors p-2 mr-2"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-xl font-bold">Linkzy</span>
              </Link>
              <span className="text-gray-400 hidden md:inline">•</span>
              <span className="text-white font-semibold hidden md:inline">{title}</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="text-orange-500 font-semibold">
                  {(() => {
                    const plan = user?.plan || 'free';
                    const credits = user?.credits ?? 0;
                    return (plan === 'free' && credits < 3) ? 3 : credits;
                  })()} credits
                </span> remaining
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Simplified Sidebar */}
        <nav className={`${isMobile
          ? 'fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out' + (sidebarOpen ? ' translate-x-0' : ' -translate-x-full')
          : 'w-64 border-r border-gray-700'} bg-gray-900 min-h-[calc(100vh-4rem)]`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {isMobile && sidebarOpen && (
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
          <div className="p-6 pt-14 md:pt-6">
            <div className="space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`${item.current
                      ? 'border-l-4 border-orange-500 bg-gray-800/50 text-white shadow-lg shadow-orange-500/25'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    } group flex items-center px-6 py-4 min-h-12 text-base font-medium rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105`}
                >
                  <item.icon
                    className={`${item.current ? 'text-white' : 'text-gray-400 group-hover:text-orange-400'
                      } mr-4 h-6 w-6 transition-colors duration-200`}
                  />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* User Info Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800/50 rounded-xl">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.plan && user.plan !== 'free' ? 'Pro' : 'Free'} Plan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 bg-black min-h-screen pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40">
          <div className="grid grid-cols-3 h-16">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center ${item.current ? 'text-orange-500' : 'text-gray-400'
                  }`}
              >
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;