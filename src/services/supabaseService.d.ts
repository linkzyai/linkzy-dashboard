declare class SupabaseService {
  loginUser(email: string, password: string): Promise<any>;
  getAuthStatus(): Promise<{ isAuthenticated: boolean; user: any; error?: any }>;
  setApiKey(key: string): void;
  getApiKey(): string | null;
  clearApiKey(): void;
  signOut(): Promise<{ success: boolean; error?: string }>;
  getUserProfile(): Promise<any>;
  // Add other methods as needed
}

declare const supabaseService: SupabaseService;
export default supabaseService; 