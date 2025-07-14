import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Generic hook for API calls with loading and error states
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useApi called for', apiCall.name);
        const result = await apiCall();
        if (mounted) {
          setData(result);
          console.log('API result for', apiCall.name, ':', result);
        }
      } catch (err) {
        if (mounted) {
          console.error('API call failed:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
          
          // For now, don't use fallback data - let the components handle the error state
          // This ensures we're always trying to connect to the real API
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      console.error('API refetch failed:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Specific hooks for common API calls
export function useDashboardStats() {
  // Use the same shape as useApi for consistency
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Replace with actual supabase call
    setData(null);
    setLoading(false);
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    // Replace with actual supabase call
    setData(null);
    setLoading(false);
  };

  return { data, loading, error, refetch };
}

export function useBacklinks(page = 1, limit = 10) {
  return useApi(() => supabase.rpc('get_backlinks', {
    params: { page, limit },
  }), [page, limit]);
}

export function useAnalytics(timeframe = '30d') {
  return useApi(() => supabase.rpc('get_analytics', {
    params: { timeframe },
  }), [timeframe]);
}

export function useDetectedPages() {
  return useApi(() => supabase.rpc('get_detected_pages', {
    params: {},
  }), []);
}

export function useUserProfile() {
  return useApi(() => supabase.rpc('get_user_profile', {
    params: {},
  }), []);
}

export function useBillingInfo() {
  return useApi(() => supabase.rpc('get_billing_info', {
    params: {},
  }), []);
}

export function useApiUsage() {
  return useApi(() => supabase.rpc('get_api_usage', {
    params: {},
  }), []);
}

export function useKeywordAnalytics() {
  return useApi(() => supabase.rpc('get_keyword_analytics', {
    params: {},
  }), []);
}