declare class SupabaseService {
  loginUser(email: string, password: string): Promise<any>;
  getAuthStatus(): Promise<{ isAuthenticated: boolean; user: any; error?: any }>;
  // Add other methods as needed
}

declare const supabaseService: SupabaseService;
export default supabaseService; 