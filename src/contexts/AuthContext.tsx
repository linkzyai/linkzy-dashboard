import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<any>;
  logout: (navigate?: (path: string) => void) => Promise<void>;
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

// Helper to fetch user profile from Supabase users table
const fetchUserProfile = async (id: string) => {
  console.log('fetchUserProfile: called with id', id);
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, credits, plan')
    .eq('id', id)
    .single();
  if (error) {
    console.error('fetchUserProfile: error', error);
    return {};
  }
  console.log('fetchUserProfile: got profile', profile);
  return profile || {};
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for session on mount
  useEffect(() => {
    console.log('AuthContext useEffect: running checkSession');
    checkSession();
    // TEMP: Force loading to false after 5s for debugging
    const timeout = setTimeout(() => {
      console.warn('AuthContext: Forcing setLoading(false) after 5s timeout');
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const checkSession = async () => {
    console.log('checkSession: starting');
    setLoading(true);
    const data = await supabase.auth.getSession();
    console.log('checkSession: got session', data);
    if (data?.session && data.session.user) {
      setIsAuthenticated(true);
      const profile = await fetchUserProfile(data.session.user.id);
      setUser({
        ...data.session.user,
        credits: profile.credits,
        creditsRemaining: profile.credits, // for dashboard compatibility
        plan: profile.plan || 'Free',
      });
      localStorage.setItem('linkzy_user', JSON.stringify({
        ...data.session.user,
        credits: profile.credits,
        creditsRemaining: profile.credits,
        plan: profile.plan || 'Free',
      }));
      console.log('checkSession: user set, isAuthenticated true');
    } else {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('linkzy_user');
      console.log('checkSession: no session, isAuthenticated false');
    }
    setLoading(false);
    console.log('checkSession: setLoading(false) called');
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('onAuthStateChange: event', event, 'session', session);
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        const profile = await fetchUserProfile(session.user.id);
        setUser({
          ...session.user,
          credits: profile.credits,
          creditsRemaining: profile.credits,
          plan: profile.plan || 'Free',
        });
        localStorage.setItem('linkzy_user', JSON.stringify({
          ...session.user,
          credits: profile.credits,
          creditsRemaining: profile.credits,
          plan: profile.plan || 'Free',
        }));
        console.log('onAuthStateChange: user set, isAuthenticated true');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('linkzy_user');
        console.log('onAuthStateChange: signed out, isAuthenticated false');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    console.log('login: starting', email);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('login: result', data, error);
    if (data?.user) {
      setIsAuthenticated(true);
      const profile = await fetchUserProfile(data.user.id);
      setUser({
        ...data.user,
        credits: profile.credits,
        creditsRemaining: profile.credits,
        plan: profile.plan || 'Free',
      });
      localStorage.setItem('linkzy_user', JSON.stringify({
        ...data.user,
        credits: profile.credits,
        creditsRemaining: profile.credits,
        plan: profile.plan || 'Free',
      }));
      console.log('login: user set, isAuthenticated true');
    }
    setLoading(false);
    console.log('login: setLoading(false) called');
    return data.user;
  };

  // Logout
  const logout = async (navigate?: (path: string) => void) => {
    setLoading(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('linkzy_user');
    setLoading(false);
    if (navigate) {
      navigate('/');
    } else {
      window.location.replace('/');
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};