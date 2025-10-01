import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
// @ts-ignore
import { supabase } from "../lib/supabase";
// @ts-ignore
import supabaseService from "../services/supabaseService";

type AppProfile = {
  id: string;
  email: string | null;
  website?: string | null;
  niche?: string | null;
  plan?: string | null;
  credits?: number | null;
  api_key?: string | null; // keep in memory only
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppProfile | null;
  loading: boolean;
  // legacy helper if you still support API-key-only mode
  login: (apiKey: string, userProfile?: Partial<AppProfile>) => AppProfile;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

async function fetchProfile(userId: string): Promise<AppProfile | null> {
  const { data, error } = await supabase
    .from("users") // consider 'profiles' to avoid confusion with auth.users
    .select("id, email, website, niche, plan, credits, api_key")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("[auth] fetchProfile error:", error.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email ?? null,
    website: data.website ?? null,
    niche: data.niche ?? null,
    plan: data.plan ?? null,
    credits: data.credits ?? null,
    api_key: data.api_key ?? null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial hydrate: session first (instant), then background profile fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession(); // in-memory
        const supaUser = data.session?.user;

        if (!supaUser) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Step 1: reflect session ASAP (stop spinner)
        if (!cancelled) {
          setUser({ id: supaUser.id, email: supaUser.email ?? null });
          setLoading(false);
        }

        // Step 2: fetch app profile in background
        const profile = await fetchProfile(supaUser.id);
        if (!cancelled && profile) {
          setUser({
            id: supaUser.id,
            email: supaUser.email ?? null,
            website: profile.website,
            niche: profile.niche,
            plan: profile.plan,
            credits: profile.credits,
            api_key: profile.api_key,
          });
          if (profile.api_key) supabaseService.setApiKey(profile.api_key);
        }
      } catch (e: any) {
        console.error("[auth] init error:", e?.message || e);
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep in sync with Supabase auth events
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        try {
          if (event === "SIGNED_OUT") {
            supabaseService.clearApiKey();
            setUser(null);
            return;
          }

          const supaUser = session?.user;
          if (!supaUser) return;

          // reflect session immediately
          setUser((prev) => ({
            id: supaUser.id,
            email: supaUser.email ?? prev?.email ?? null,
            website: prev?.website ?? null,
            niche: prev?.niche ?? null,
            plan: prev?.plan ?? null,
            credits: prev?.credits ?? null,
            api_key: prev?.api_key ?? null,
          }));

          // background profile refresh
          const profile = await fetchProfile(supaUser.id);
          if (profile) {
            setUser({
              id: supaUser.id,
              email: supaUser.email ?? null,
              website: profile.website,
              niche: profile.niche,
              plan: profile.plan,
              credits: profile.credits,
              api_key: profile.api_key,
            });
            if (profile.api_key) supabaseService.setApiKey(profile.api_key);
          }
        } catch (e: any) {
          console.error("[auth] onAuthStateChange error:", e?.message || e);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Manual refresh, e.g. after credits/profile updates
  const refreshUserData = async () => {
    const { data } = await supabase.auth.getSession();
    const supaUser = data.session?.user;
    if (!supaUser) return;
    const profile = await fetchProfile(supaUser.id);
    if (profile) {
      setUser({
        id: supaUser.id,
        email: supaUser.email ?? null,
        website: profile.website,
        niche: profile.niche,
        plan: profile.plan,
        credits: profile.credits,
        api_key: profile.api_key,
      });
      if (profile.api_key) supabaseService.setApiKey(profile.api_key);
    }
  };

  // Legacy programmatic login (API-key mode)
  const login = (
    apiKey: string,
    userProfile?: Partial<AppProfile>
  ): AppProfile => {
    supabaseService.setApiKey(apiKey);
    const standardized: AppProfile = {
      id: userProfile?.id ?? user?.id ?? "anonymous",
      email: userProfile?.email ?? user?.email ?? null,
      website: userProfile?.website ?? user?.website ?? null,
      niche: userProfile?.niche ?? user?.niche ?? null,
      plan: userProfile?.plan ?? user?.plan ?? "free",
      credits: userProfile?.credits ?? user?.credits ?? 3,
      api_key: apiKey,
    };
    setUser(standardized);
    setLoading(false);
    return standardized;
  };

  const logout = async () => {
    try {
      sessionStorage.setItem("linkzy_logging_out", "true");
      await supabase.auth.signOut();
    } finally {
      supabaseService.clearApiKey();
      setUser(null);
      setLoading(false);
      try {
        window.location.replace("/");
      } catch {
        window.location.href = "/";
      }
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      refreshUserData,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
