// Environment configuration
// All environment variables should be defined here for easy management

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  
  // Stripe Price IDs (Subscriptions)
  STRIPE_PRICE_STARTER: import.meta.env.VITE_STRIPE_PRICE_STARTER || '', // $19/month, 5 credits
  STRIPE_PRICE_PRO: import.meta.env.VITE_STRIPE_PRICE_PRO || '',         // $29/month, 15 credits
  
  // API Endpoints (derived from Supabase URL)
  get SUPABASE_FUNCTIONS_URL() {
    return `${this.SUPABASE_URL}/functions/v1`;
  },
} as const;

// Validation: Warn if critical env vars are missing
if (!ENV.SUPABASE_ANON_KEY) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY is not set. Using fallback (not recommended for production)');
}

if (!ENV.STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe payments will not work.');
}

if (!ENV.STRIPE_PRICE_STARTER || !ENV.STRIPE_PRICE_PRO) {
  console.warn('⚠️ Stripe subscription price IDs are not fully configured. Subscriptions may not work correctly.');
  console.warn('Missing:', {
    starter: !ENV.STRIPE_PRICE_STARTER,
    pro: !ENV.STRIPE_PRICE_PRO,
  });
}
