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
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, credits, plan')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Failed to fetch user profile:', error);
    return {};
  }
  return profile || {};
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
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
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('linkzy_user');
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('linkzy_user');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
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
    }
    setLoading(false);
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