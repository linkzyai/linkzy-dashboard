import { createClient } from '@supabase/supabase-js'

console.log('ALL ENV:', import.meta.env);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey);

/**
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error getting from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  }
})