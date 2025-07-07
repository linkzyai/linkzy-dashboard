// API Service for Linkzy Backend Integration
// Enhanced with Netlify proxy support and permission fixes

const API_BASE_URL = 'https://60h5imcedegz.manus.space'; // LATEST MANUS ENDPOINT - CORS Fixed

class ApiService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Try to get API key from localStorage
    this.apiKey = localStorage.getItem('linkzy_api_key') || null;
    
    console.log('🔧 API Service initialized:', {
      baseUrl: this.baseUrl,
      hasStoredApiKey: !!this.apiKey,
      environment: this.getEnvironmentInfo()
    });
  }

  private getEnvironmentInfo() {
    if (typeof window === 'undefined') return 'server';
    
    return {
      hostname: window.location.hostname,
      origin: window.location.origin,
      protocol: window.location.protocol
    };
  }

  // Check if we should use proxy based on environment
  private shouldUseProxy(): boolean {
    if (typeof window === 'undefined') return false;
    
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('linkzy.ai') || 
                        hostname.includes('.netlify.app') || 
                        hostname.includes('.netlify.com');
    
    return isProduction;
  }

  // Set API key for authenticated requests
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('linkzy_api_key', key);
    console.log('✅ API key stored:', key);
  }

  // Get API key
  getApiKey(): string | null {
    return this.apiKey;
  }

  // Clear API key (logout)
  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('linkzy_api_key');
  }

  // Generic fetch wrapper with Netlify proxy support
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const useProxy = this.shouldUseProxy();
    const url = useProxy ? `/proxy${endpoint}` : `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.apiKey) {
      defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      mode: 'cors',
      credentials: 'omit',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    console.log(`🔄 API call: ${config.method || 'GET'} ${url}`);
    console.log(`🔧 Using ${useProxy ? 'Netlify proxy' : 'direct API'}`);
    
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API success:`, data);
      return data;
      
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // MANUS EXACT SPECIFICATIONS - Now with direct URL as requested
  async register(email: string, password: string, website: string, niche: string) {
    console.log('🚀 Starting registration with MANUS API (Direct URL):', { email, website, niche });
    
    try {
      // EXACT format specified by Manus
      const requestBody = {
        email: email,
        name: email  // Use email as name as specified
      };
      
      console.log('📤 Registration request (MANUS format):', requestBody);
      
      // Use direct URL as instructed by Manus
      const url = `${this.baseUrl}/register`;
      
      console.log(`🔄 Making direct request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`📡 Direct API response:`, response.status, response.statusText);
      
      const responseText = await response.text();
      console.log(`📦 Direct API raw response:`, responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`✅ Direct API parsed response:`, result);
      } catch (parseError) {
        console.log(`⚠️ Direct API response is not JSON:`, responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (response.ok) {
        console.log(`🎉 Registration successful with direct API!`);
        
        // Send welcome email after successful registration
        if (result.api_key) {
          try {
            await this.sendWelcomeEmail(email, result.api_key, website, niche);
          } catch (emailError) {
            console.warn('⚠️ Failed to send welcome email:', emailError);
            // Don't fail registration if email fails
          }
        }
        
        return result;
      } else {
        console.log(`❌ Direct API failed:`, response.status, result);
        throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }
  
  // Send welcome email with onboarding instructions
  async sendWelcomeEmail(email: string, apiKey: string, website?: string, niche?: string) {
    try {
      // Use Supabase Edge Function via proper invoke method
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { email, apiKey, website, niche }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      console.log('📧 Welcome email sent successfully via Edge Function:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send welcome email via Edge Function:', error);
      throw error;
    }
  }

  // Send email via resend-email function
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const { supabase } = await import('../lib/supabase');
      
      const { data, error } = await supabase.functions.invoke('resend-email', {
        body: { to, subject, html }
      });
      
      if (error) {
        throw new Error(`Email function error: ${error.message}`);
      }
      
      console.log('📧 Email sent successfully via resend-email function:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send email via resend-email function:', error);
      throw error;
    }
  }

  // Authentication (legacy)
  async login(email: string, password: string) {
    return this.fetchApi<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // User Profile
  async getUserProfile() {
    // MANUS API might not have user profile endpoint
    // Return cached user data if API call fails
    try {
      return await this.fetchApi<any>('/api/user/profile');
    } catch (error) {
      console.log('Profile endpoint not available, using stored user data');
      
      // Try to get user data from localStorage
      const storedUser = localStorage.getItem('linkzy_user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      // Fallback to basic user object
      return {
        apiKey: this.apiKey,
        creditsRemaining: 3,
        email: 'user@example.com'
      };
    }
  }

  async updateUserProfile(data: any) {
    return this.fetchApi<any>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.fetchApi<{
      totalBacklinks: number;
      successRate: number;
      creditsRemaining: number;
      monthlySpend: number;
      recentBacklinks: any[];
      performanceData: any;
    }>('/api/dashboard/stats');
  }

  // Backlinks
  async getBacklinks(page = 1, limit = 10) {
    return this.fetchApi<{
      backlinks: any[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/backlinks?page=${page}&limit=${limit}`);
  }

  async createBacklinkRequest(data: {
    targetUrl: string;
    anchorText: string;
    niche: string;
    notes?: string;
  }) {
    return this.fetchApi<any>('/api/backlinks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBacklinkById(id: string) {
    return this.fetchApi<any>(`/api/backlinks/${id}`);
  }

  // Analytics
  async getAnalytics(timeframe = '30d') {
    return this.fetchApi<{
      metrics: any;
      charts: any;
      topSites: any[];
      recentActivity: any[];
      seoScore: number;
      recommendations: any[];
    }>(`/api/analytics?timeframe=${timeframe}`);
  }

  async getTrafficData(timeframe = '30d') {
    return this.fetchApi<any>(`/api/analytics/traffic?timeframe=${timeframe}`);
  }

  // Link Configuration
  async getDetectedPages() {
    return this.fetchApi<{
      pages: any[];
      total: number;
      lastScan: string;
    }>('/api/config/pages');
  }

  async scanPages(url: string, method: string) {
    return this.fetchApi<{
      success: boolean;
      pagesFound: number;
      pages: any[];
    }>('/api/config/scan', {
      method: 'POST',
      body: JSON.stringify({ url, method }),
    });
  }

  async updatePageConfiguration(data: any) {
    return this.fetchApi<any>('/api/config/pages', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // API Usage & Management
  async getApiUsage() {
    return this.fetchApi<{
      requestsThisMonth: number;
      requestLimit: number;
      successRate: number;
      rateLimits: any;
    }>('/api/usage');
  }

  async regenerateApiKey() {
    return this.fetchApi<{ apiKey: string }>('/api/user/regenerate-key', {
      method: 'POST',
    });
  }

  // Billing
  async getBillingInfo() {
    return this.fetchApi<{
      currentPlan: any;
      billingHistory: any[];
      paymentMethod: any;
    }>('/api/billing');
  }

  async getInvoices() {
    return this.fetchApi<any[]>('/api/billing/invoices');
  }

  // Settings
  async getNotificationSettings() {
    return this.fetchApi<any>('/api/settings/notifications');
  }

  async updateNotificationSettings(settings: any) {
    return this.fetchApi<any>('/api/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getSecuritySettings() {
    return this.fetchApi<any>('/api/settings/security');
  }

  async updateSecuritySettings(settings: any) {
    return this.fetchApi<any>('/api/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getActiveSessions() {
    return this.fetchApi<any[]>('/api/settings/sessions');
  }

  async revokeSession(sessionId: string) {
    return this.fetchApi<any>(`/api/settings/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Export data
  async exportData(type: 'all' | 'backlinks' | 'analytics' = 'all') {
    return this.fetchApi<{ downloadUrl: string }>(`/api/export?type=${type}`, {
      method: 'POST',
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;