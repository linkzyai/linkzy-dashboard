import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callUserPlacementScheduler(user: { id: string; email?: string }) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/user-placement-scheduler`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ userId: user.id, email: user.email }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return {
      userId: user.id,
      email: user.email,
      success: false,
      error: json?.error || `HTTP ${resp.status}`,
      details: json?.details,
    };
  }

  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  console.log("Scheduler hit:", req.method, Object.fromEntries(req.headers));
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const adminKey = req.headers.get("x-admin-key") || "";
    const requireAdminKey = Deno.env.get("ADMIN_API_KEY") || "";
    const { data: users, error: usersError } = await supabase.from("users").select(`
        *
      `);
    if (usersError) {
      console.error("error:", usersError);
      return new Response(JSON.stringify({
        error: `Users not found: ${usersError}`
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const results = [];
    for (const u of users) {
      if (u.plan != "pro") {
        console.log("not pro plan");
        continue;
      }
      console.log("starting placement for user:", u.email);
      if (u.credits < 1) {
        console.log("not enough credit, continue", u.email);
        continue;
      }
      const r = await callUserPlacementScheduler({ id: u.id, email: u.email });
      results.push(r);
    }
    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Automatic placement error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
