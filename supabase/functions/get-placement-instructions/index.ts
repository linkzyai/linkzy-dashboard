import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  try {
    const { apiKey, url } = await req.json();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing apiKey",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Find user by API key
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Invalid API key",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from("tracked_content")
      .select("id, content")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();
    // Get pending placement instructions for this user
    const { data: instructions, error } = await supabase
      .from("placement_instructions")
      .select("*")
      .eq("target_content_id", existing.id)
      .order("created_at", {
        ascending: true,
      })
      .limit(5); // Process max 5 at a time
    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log(
      `📋 Found ${instructions?.length || 0} placement instructions for user ${
        user.id
      }`
    );
    return new Response(
      JSON.stringify({
        success: true,
        instructions: instructions || [],
        count: instructions?.length || 0,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Get placement instructions error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
