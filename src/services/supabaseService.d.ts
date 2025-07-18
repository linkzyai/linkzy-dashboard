declare class SupabaseService {
  loginUser(email: string, password: string): Promise<any>;
  registerUser(email: string, password: string, website: string, niche: string): Promise<any>;
  getAuthStatus(): Promise<{ isAuthenticated: boolean; user: any; error?: any }>;
  setApiKey(key: string): void;
  getApiKey(): string | null;
  clearApiKey(): void;
  signOut(): Promise<{ success: boolean; error?: string }>;
  getUserProfile(): Promise<any>;
  createBacklinkRequest(data: any): Promise<any>;
  signInWithGoogle(): Promise<{ success: boolean; data?: any; error?: any }>;
  signUpWithGoogle(website: string, niche: string): Promise<{ success: boolean; data?: any; error?: any }>;
  resetPassword(email: string): Promise<any>;
  resendConfirmationEmail(email: string): Promise<any>;
  generateApiKey(email: string): string;
  sendWelcomeEmail(email: string, apiKey: string, website: string, niche: string, verificationToken?: string): Promise<any>;
  updateUserProfile(website: string, niche: string): Promise<{ success: boolean; error?: string }>;
  getDashboardStats(): Promise<any>;
  getBacklinks(page?: number, limit?: number): Promise<any>;
  getAnalytics?(timeframe?: string): Promise<any>;
  getDetectedPages?(): Promise<any>;
  getBillingInfo?(): Promise<any>;
  getApiUsage?(): Promise<any>;
  getKeywordAnalytics(): Promise<any>;
  // Add other methods as needed
}

declare const supabaseService: SupabaseService;
export default supabaseService; 