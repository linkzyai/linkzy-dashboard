import React, { createContext, useContext, useState, useEffect } from 'react';
// @ts-ignore
import supabaseService from '../services/supabaseService';
// @ts-ignore
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (apiKey: string, userProfile?: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRefreshing, setSessionRefreshing] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    console.log('🔐 AuthContext useEffect triggered:', {
      authInitialized,
      loading,
      isAuthenticated,
      userExists: !!user,
      timestamp: new Date().toISOString()
    });
    
    // Check if user is already logged in on app start
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const initAuth = async () => {
      try {
        // Check if we're in a payment flow - if so, be more patient with auth checks
        const urlParams = new URLSearchParams(window.location.search);
        const isPaymentFlow = urlParams.get('canceled') === 'true' || urlParams.get('success') === 'true';
        const timeoutDuration = isPaymentFlow ? 15000 : 10000;
        
        // Set timeout for authentication check
        authTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn(`Authentication check timed out after ${timeoutDuration/1000} seconds`);
            
            // For payment flows, try to preserve existing auth state from localStorage
            if (isPaymentFlow) {
              const existingUser = localStorage.getItem('linkzy_user');
              const existingApiKey = localStorage.getItem('linkzy_api_key');
              
              if (existingUser && existingApiKey) {
                console.log('Payment flow detected - preserving existing authentication');
                try {
                  const userData = JSON.parse(existingUser);
                  setIsAuthenticated(true);
                  setUser(userData);
                  setLoading(false);
                  return;
                } catch (e) {
                  console.error('Failed to restore auth from localStorage:', e);
                }
              }
            }
            
            setLoading(false);
            setIsAuthenticated(false);
            setUser(null);
          }
        }, timeoutDuration);
        
        // Use the new robust auth status checker
        const { isAuthenticated: authStatus, user: authUser } = await supabaseService.getAuthStatus();
        
        if (!isMounted) return;
        
        if (authStatus && authUser) {
          // Fetch the user's profile from Supabase users table (not auth.users)
          const { data: profile, error } = await supabase
            .from('users')
            .select('id, email, website, niche, is_pro, plan, credits')
            .eq('id', authUser.id)
            .single();
          if (profile) {
            setIsAuthenticated(true);
            setUser({
              ...authUser,
              website: profile.website,
              niche: profile.niche,
              is_pro: profile.is_pro,
              plan: profile.plan,
              credits: profile.credits,
            });
          } else {
            setIsAuthenticated(true);
            setUser(authUser);
          }

          // Ensure API key is set
          if (authUser.api_key) {
            supabaseService.setApiKey(authUser.api_key);
          } else if (authUser.user_metadata?.api_key) {
            supabaseService.setApiKey(authUser.user_metadata.api_key);
          }
        } else {
          // Supabase auth failed, try localStorage fallback
          console.log('Supabase auth failed, attempting localStorage fallback...');
          const localUser = localStorage.getItem('linkzy_user');
          const localApiKey = localStorage.getItem('linkzy_api_key');
          
          if (localUser && localApiKey) {
            try {
              const userData = JSON.parse(localUser);
              console.log('Successfully restored user from localStorage');
              setIsAuthenticated(true);
              setUser(userData);
              supabaseService.setApiKey(localApiKey);
            } catch (e) {
              console.error('Failed to parse localStorage user data:', e);
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        
        // Try localStorage fallback before giving up
        const localUser = localStorage.getItem('linkzy_user');
        const localApiKey = localStorage.getItem('linkzy_api_key');
        
        if (localUser && localApiKey) {
          try {
            const userData = JSON.parse(localUser);
            console.log('Auth error - falling back to localStorage user data');
            setIsAuthenticated(true);
            setUser(userData);
            supabaseService.setApiKey(localApiKey);
          } catch (e) {
            console.error('Failed to parse localStorage user data:', e);
            // Clear any invalid stored data
            localStorage.removeItem('linkzy_user');
            localStorage.removeItem('linkzy_api_key');
            supabaseService.clearApiKey();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Clear any invalid stored data
          supabaseService.clearApiKey();
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (authTimeout) clearTimeout(authTimeout);
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    // Only run once
    if (!authInitialized) {
      initAuth();
    }
    
    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
    };
  }, [authInitialized]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        try {
          if (event === 'SIGNED_IN') {
            if (session?.user) {
              // Fetch the user's profile from Supabase users table (not auth.users)
              const { data: profile, error } = await supabase
                .from('users')
                .select('id, email, website, niche, is_pro, plan, credits')
                .eq('id', session.user.id)
                .single();
              if (profile) {
                const userObj = {
                  id: session.user.id,
                  email: session.user.email,
                  website: profile.website,
                  niche: profile.niche,
                  api_key: session.user.user_metadata?.api_key || `linkzy_${session.user.email?.replace('@', '_').replace('.', '_')}_${Date.now()}`,
                  is_pro: profile.is_pro,
                  plan: profile.plan,
                  credits: profile.credits,
                };
                setIsAuthenticated(true);
                setUser(userObj);
                supabaseService.setApiKey(
                  session.user.user_metadata?.api_key || `linkzy_${session.user.email?.replace('@', '_').replace('.', '_')}_${Date.now()}`
                );
                localStorage.setItem('linkzy_user', JSON.stringify(userObj));
              } else {
                setIsAuthenticated(true);
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  api_key: session.user.user_metadata?.api_key || `linkzy_${session.user.email?.replace('@', '_').replace('.', '_')}_${Date.now()}`,
                });
                supabaseService.setApiKey(
                  session.user.user_metadata?.api_key || `linkzy_${session.user.email?.replace('@', '_').replace('.', '_')}_${Date.now()}`
                );
                localStorage.setItem('linkzy_user', JSON.stringify({
                  id: session.user.id,
                  email: session.user.email,
                  api_key: session.user.user_metadata?.api_key || `linkzy_${session.user.email?.replace('@', '_').replace('.', '_')}_${Date.now()}`,
                }));
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setUser(null);
            supabaseService.clearApiKey();
            localStorage.removeItem('linkzy_user');
          } else if (event === 'TOKEN_REFRESHED') {
          } else if (event === 'USER_UPDATED') {
            // Refresh user data
            try {
              const { isAuthenticated: authStatus, user: authUser } = await supabaseService.getAuthStatus();
              if (authStatus && authUser) {
                setUser(authUser);
              }
            } catch (error) {
            }
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodically check and refresh session
  useEffect(() => {
    const refreshInterval = 15 * 60 * 1000; // 15 minutes
    
    const refreshSession = async () => {
      if (!isAuthenticated) return;
      
      try {
        setSessionRefreshing(true);
        
        // Get current session and refresh if needed
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message !== 'Invalid JWT token') {
            setIsAuthenticated(false);
            setUser(null);
            supabaseService.clearApiKey();
          }
        } else if (data.session) {
          // Session is still valid, no action needed
        } else {
          // Try to recover from storage
          const apiKey = supabaseService.getApiKey();
          if (apiKey) {
            try {
              const userData = await supabaseService.getUserProfile();
              if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
              }
            } catch (recoveryError) {
              setIsAuthenticated(false);
              setUser(null);
              supabaseService.clearApiKey();
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (e) {
      } finally {
        setSessionRefreshing(false);
      }
    };
    
    // Set up interval to refresh session
    const intervalId = setInterval(refreshSession, refreshInterval);
    
    // Run once on mount
    refreshSession();
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const login = (apiKey: string, userProfile?: any) => {
    supabaseService.setApiKey(apiKey);

    setIsAuthenticated(true);
    
    // Create a standardized user object
    const standardizedUser = userProfile 
      ? {
          ...userProfile,
          api_key: apiKey,
          creditsRemaining: userProfile.credits || userProfile.creditsRemaining || 3
        }
      : { 
          email: 'user@example.com',
          api_key: apiKey, 
          creditsRemaining: 3 
        };
    
    setUser(standardizedUser);
    
    // Store user data for persistence
    localStorage.setItem('linkzy_user', JSON.stringify(standardizedUser));
    setLoading(false);
    
    return standardizedUser;
  };

  const logout = async () => {
    try {
      // First clear local storage to prevent race conditions
      supabaseService.clearApiKey();
      localStorage.removeItem('linkzy_user');
      
      // Then sign out from Supabase
      await supabaseService.signOut();
    } catch (error) {
    }
    
    // Always clear the auth state regardless of any errors
    setIsAuthenticated(false);
    setUser(null);
    
    // Use a more reliable redirect method
    try {
      window.location.replace('/');
    } catch (redirectError) {
      // Fallback to simple href
      window.location.href = '/';
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading: loading || sessionRefreshing
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};