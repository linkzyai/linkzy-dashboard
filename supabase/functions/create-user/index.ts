import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CreateUserRequest {
  userId: string;
  email: string;
  website?: string;
  niche?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: CreateUserRequest = await req.json();
    
    if (!payload.userId || !payload.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate API key
    const apiKey = `linkzy_${payload.email.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`;

    // Create user record using service role (bypasses RLS)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        id: payload.userId,
        email: payload.email,
        website: payload.website || 'yourdomain.com', // Default triggers onboarding
        niche: payload.niche || 'technology', // Default triggers onboarding
        api_key: apiKey,
        credits: 3,
        plan: 'free'
      }])
      .select()
      .single();

    if (insertError) {
      // Check if user already exists
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        // Fetch existing user
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', payload.userId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch existing user: ${fetchError.message}`);
        }

        return new Response(JSON.stringify({
          success: true,
          user: existingUser,
          message: 'User already exists'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    console.log('✅ User created successfully:', newUser.id);

    return new Response(JSON.stringify({
      success: true,
      user: newUser,
      message: 'User created successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 