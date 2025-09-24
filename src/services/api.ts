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
      // @ts-ignore - supabase.js file exists but lacks TypeScript declarations
      const { supabase } = await import('../lib/supabase.js');
      
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
      // @ts-ignore - supabase.js file exists but lacks TypeScript declarations  
      const { supabase } = await import('../lib/supabase.js');
      
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

  // Content Tracking
  async trackContent(data: {
    apiKey: string;
    url: string;
    title?: string;
    referrer?: string;
    content?: string;
  }) {
    try {
      // Use direct fetch to the Edge Function for better compatibility
      const payload = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/track-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Track content error: ${result.error || response.statusText}`);
      }
      
      console.log('✅ Content tracked successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to track content:', error);
      throw error;
    }
  }

  // Get JavaScript tracking snippet with automatic ecosystem integration
  getTrackingSnippet(apiKey: string): string {
    return `(function(){
  var lz = window.linkzy = window.linkzy || {};
  lz.apiKey = '${apiKey}';
  
  // Track content and trigger automatic ecosystem matching
  lz.track = function(){
    fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/track-content', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
      },
      body: JSON.stringify({
        apiKey: lz.apiKey,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        content: document.body ? document.body.innerText.slice(0, 1000) : ''
      })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        console.log('Linkzy: Content tracked, ecosystem matching triggered automatically');
        if (data.realTimeMatching === 'triggered') {
          console.log('Linkzy: Real-time ecosystem matching in progress...');
          // Check for new opportunities after a delay
          setTimeout(lz.checkForOpportunities, 3000);
        }
      } else {
        console.warn('Linkzy: Content tracking failed:', data.error);
      }
    })
    .catch(function(error) {
      console.warn('Linkzy: Content tracking error:', error.message);
      // Silently fail - don't break the website
    });
  };
  
  // Check for approved placement opportunities from the ecosystem
  lz.checkForOpportunities = function(){
    // Get current user ID from API key (simplified - in production you'd have a proper endpoint)
    fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/rest/v1/placement_opportunities?api_key=eq.' + encodeURIComponent(lz.apiKey) + '&status=eq.approved&select=*', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
      }
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function(opportunities) {
      if (opportunities && opportunities.length > 0) {
        console.log('Linkzy: Found', opportunities.length, 'approved placement opportunities');
        lz.executePlacement(opportunities[0]); // Execute the first opportunity
      } else {
        console.log('Linkzy: No approved opportunities found yet - ecosystem is still matching');
      }
    })
    .catch(function(error) {
      console.warn('Linkzy: Error checking opportunities:', error.message);
    });
  };
  
  // Execute automatic placement using the ecosystem's placement system
  lz.executePlacement = function(opportunity){
    if (!opportunity) return;
    
    // Check if placement is suitable for current page
    if (!lz.isPlacementSuitable()) {
      console.log('Linkzy: Current page not suitable for placement');
      return;
    }
    
    console.log('Linkzy: Executing automatic placement for opportunity', opportunity.id);
    
    // Create the contextual backlink placement
    var anchorText = opportunity.suggested_anchor_text || 'this resource';
    var targetUrl = opportunity.suggested_target_url;
    var context = opportunity.suggested_placement_context || 'Check out this relevant resource';
    
    // Generate natural paragraph with backlink
    var backlinkParagraph = lz.generateNaturalPlacement(anchorText, targetUrl, context);
    
    // Find best placement spot on current page
    var placementSpot = lz.findPlacementSpot();
    if (placementSpot) {
      // Insert the backlink
      var newPara = document.createElement('p');
      newPara.innerHTML = backlinkParagraph;
      newPara.style.margin = '16px 0';
      newPara.style.lineHeight = '1.6';
      newPara.setAttribute('data-linkzy-placement', opportunity.id);
      
      placementSpot.parentNode.insertBefore(newPara, placementSpot.nextSibling);
      
      console.log('Linkzy: Backlink placed successfully!');
      
      // Mark opportunity as completed
      lz.markOpportunityCompleted(opportunity.id);
    } else {
      console.log('Linkzy: No suitable placement spot found on current page');
    }
  };
  
  // Check if current page is suitable for backlink placement
  lz.isPlacementSuitable = function(){
    var currentPath = window.location.pathname.toLowerCase();
    var bodyTextLength = document.body ? document.body.innerText.length : 0;
    
    // Skip homepage
    if (currentPath === '/' || currentPath === '/index.html') {
      return false;
    }
    
    // Ensure page has substantial content
    if (bodyTextLength < 500) {
      return false;
    }
    
    return true;
  };
  
  // Find the best spot to place a backlink
  lz.findPlacementSpot = function(){
    var contentArea = document.querySelector('main') ||
                     document.querySelector('.content') ||
                     document.querySelector('article') ||
                     document.querySelector('.blog-content') ||
                     document.querySelector('.post-content');
    
    if (!contentArea) {
      contentArea = document.body;
    }
    
    // Find paragraphs with substantial content
    var paragraphs = contentArea.querySelectorAll('p');
    for (var i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].innerText.length > 100) {
        return paragraphs[i];
      }
    }
    
    return null;
  };
  
  // Generate natural contextual placement
  lz.generateNaturalPlacement = function(anchorText, targetUrl, context){
    var templates = [
      'For more insights on this topic, check out <a href="' + targetUrl + '" target="_blank" rel="noopener">' + anchorText + '</a>.',
      'If you\'re looking for additional resources, <a href="' + targetUrl + '" target="_blank" rel="noopener">' + anchorText + '</a> provides valuable information.',
      'To learn more about this subject, visit <a href="' + targetUrl + '" target="_blank" rel="noopener">' + anchorText + '</a>.',
      'For a comprehensive guide, see <a href="' + targetUrl + '" target="_blank" rel="noopener">' + anchorText + '</a>.',
      'You might also find <a href="' + targetUrl + '" target="_blank" rel="noopener">' + anchorText + '</a> helpful.'
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  // Mark opportunity as completed in the ecosystem
  lz.markOpportunityCompleted = function(opportunityId){
    fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/rest/v1/placement_opportunities?id=eq.' + opportunityId, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU'
      },
      body: JSON.stringify({ 
        status: 'placed',
        placement_success: true,
        placement_attempted_at: new Date().toISOString()
      })
    })
    .then(function(response) {
      if (response.ok) {
        console.log('Linkzy: Opportunity marked as completed');
      }
    })
    .catch(function(error) {
      console.warn('Linkzy: Failed to mark opportunity as completed:', error);
    });
  };
  
  // Initialize the system
  lz.track(); // Track content and trigger ecosystem matching
  lz.checkForOpportunities(); // Check for existing opportunities
  
  // Set up periodic checking for new opportunities (every 24 hours)
  setInterval(function() {
    lz.checkForOpportunities();
  }, 24 * 60 * 60 * 1000); // 24 hours
})();`;
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;