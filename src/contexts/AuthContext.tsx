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

  useEffect(() => {
    // Check if user is already logged in on app start
    let isMounted = true;
    const initAuth = async () => {
      try {
        console.log('🔍 Initializing authentication...');

        // Use the new robust auth status checker
        const { isAuthenticated: authStatus, user: authUser } = await supabaseService.getAuthStatus();
        
        if (!isMounted) return;
        
        if (authStatus && authUser) {
          console.log('✅ Found authenticated user:', authUser.email || authUser.id);
          setIsAuthenticated(true);
          setUser(authUser);

          // Ensure API key is set
          if (authUser.api_key) {
            supabaseService.setApiKey(authUser.api_key);
          } else if (authUser.user_metadata?.api_key) {
            supabaseService.setApiKey(authUser.user_metadata.api_key);
            console.log('✅ API key set from user_metadata');
          }
        } else {
          console.log('🚫 No authenticated user found');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.log('❌ Auth initialization failed:', error);
        // Clear any invalid stored data
        supabaseService.clearApiKey();
        setIsAuthenticated(false);
        setUser(null); 
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('🔄 Auth state changed:', event);
        try {
          if (event === 'SIGNED_IN') {
            console.log('✅ User signed in, updating auth state');
            // Fetch user data when signed in
            const { isAuthenticated: authStatus, user: authUser } = await supabaseService.getAuthStatus();
            if (authStatus && authUser) {
              setIsAuthenticated(true);
              setUser(authUser);
              // Ensure API key is set
              if (authUser.api_key) {
                supabaseService.setApiKey(authUser.api_key);
              } else if (authUser.user_metadata?.api_key) {
                supabaseService.setApiKey(authUser.user_metadata.api_key);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out');
            setIsAuthenticated(false);
            setUser(null);
            supabaseService.clearApiKey();
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Session token refreshed');
          } else if (event === 'USER_UPDATED') {
            console.log('👤 User data updated, refreshing profile');
            // Refresh user data
            try {
              const { isAuthenticated: authStatus, user: authUser } = await supabaseService.getAuthStatus();
              if (authStatus && authUser) {
                setUser(authUser);
              }
            } catch (error) {
              console.error('Error updating user data:', error);
            }
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
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
        console.log('🔄 Refreshing session...');
        
        // Get current session and refresh if needed
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session refresh error:', error);
          // If serious error, clear auth state
          if (error.message !== 'Invalid JWT token') {
            setIsAuthenticated(false);
            setUser(null);
            supabaseService.clearApiKey();
          }
        } else if (data.session) {
          // Session is still valid, no action needed
          console.log('✅ Session is valid');
        } else {
          console.log('⚠️ Session expired, attempting recovery');
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
              console.error('Recovery failed:', recoveryError);
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
        console.error('Session refresh failed:', e);
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
    console.log('🔐 Logging in user:', userProfile?.email);
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
    console.log('✅ Auth context updated, user is authenticated');
    
    return standardizedUser;
  };

  const logout = async () => {
    console.log('🚪 Logging out user');
    try {
      // First clear local storage to prevent race conditions
      supabaseService.clearApiKey();
      localStorage.removeItem('linkzy_user');
      
      // Then sign out from Supabase
      await supabaseService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    // Always clear the auth state regardless of any errors
    setIsAuthenticated(false);
    setUser(null);
    
    // Use a more reliable redirect method
    try {
      window.location.replace('/');
    } catch (redirectError) {
      console.error('Redirect error:', redirectError);
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