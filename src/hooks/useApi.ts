import { useState, useEffect } from 'react';
import supabaseService from '../services/supabaseService';

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
        
        // Add 10-second timeout to API calls
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API call timed out after 10 seconds')), 10000);
        });
        
        const result = await Promise.race([apiCall(), timeoutPromise]);
        if (mounted) {
          setData(result as T);
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
  return useApi(() => supabaseService.getDashboardStats());
}

export function useBacklinks(page = 1, limit = 10) {
  return useApi(() => supabaseService.getBacklinks(page, limit), [page, limit]);
}

export function useAnalytics(timeframe = '30d') {
  return useApi(() => supabaseService.getAnalytics?.(timeframe) || Promise.resolve({}), [timeframe]);
}

export function useDetectedPages() {
  return useApi(() => supabaseService.getDetectedPages?.() || Promise.resolve({ pages: [], total: 0 }));
}

export function useUserProfile() {
  return useApi(() => supabaseService.getUserProfile());
}

export function useBillingInfo() {
  return useApi(() => supabaseService.getBillingInfo?.() || Promise.resolve({}));
}

export function useApiUsage() {
  return useApi(() => supabaseService.getApiUsage?.() || Promise.resolve({}));
}

export function useKeywordAnalytics() {
  return useApi(() => supabaseService.getKeywordAnalytics(), []);
}