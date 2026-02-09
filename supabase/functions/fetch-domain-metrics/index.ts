/**
 * Edge Function: fetch-domain-metrics
 *
 * Fetches Domain Authority from Moz API for a specific user's website
 * and saves to domain_metrics table.
 *
 * POST body: { user_id: string, website: string }
 * Requires env: MOZ_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MOZ_API_URL = "https://api.moz.com/jsonrpc";

function normalizeWebsite(website: string | null | undefined): string | null {
  if (!website || typeof website !== "string") return null;
  const trimmed = website.trim().toLowerCase();
  if (!trimmed || trimmed === "yourdomain.com" || trimmed === "") return null;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

async function fetchMozSiteMetrics(
  token: string,
  url: string
): Promise<{ domain_authority?: number; spam_score?: number } | null> {
  try {
    const id = crypto.randomUUID();
    const res = await fetch(MOZ_API_URL, {
      method: "POST",
      headers: {
        "x-moz-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "data.site.metrics.fetch",
        params: {
          data: {
            site_query: {
              query: url,
              scope: "domain",
            },
          },
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Moz API HTTP ${res.status} for ${url}`);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.warn(`Moz API error for ${url}:`, data.error);
      return null;
    }

    const result = data.result ?? data;
    const metrics = result.site_metrics ?? result;

    const domain_authority =
      typeof metrics.domain_authority === "number" ? metrics.domain_authority : undefined;
    const spam_score =
      typeof metrics.spam_score === "number" ? metrics.spam_score : undefined;

    return { domain_authority, spam_score };
  } catch (err) {
    console.warn(`Failed to fetch Moz metrics for ${url}:`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const MOZ_TOKEN = Deno.env.get("MOZ_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!MOZ_TOKEN) {
    console.warn("MOZ_TOKEN is not set - skipping DA fetch");
    return json(200, { success: false, message: "MOZ_TOKEN not configured" });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Supabase configuration missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { user_id, website } = await req.json();

    if (!user_id || !website) {
      return json(400, { error: "Missing required fields: user_id, website" });
    }

    const normalizedUrl = normalizeWebsite(website);
    if (!normalizedUrl) {
      return json(400, { error: "Invalid website URL" });
    }

    const metrics = await fetchMozSiteMetrics(MOZ_TOKEN, normalizedUrl);
    if (!metrics) {
      return json(200, {
        success: false,
        message: "Failed to fetch metrics from Moz API",
      });
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from("domain_metrics").upsert(
      {
        user_id,
        website: normalizedUrl,
        domain_authority: metrics.domain_authority ?? null,
        spam_score: metrics.spam_score ?? null,
        last_scanned_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

    if (upsertError) {
      console.error(`Failed to save domain_metrics for user ${user_id}:`, upsertError);
      return json(500, {
        success: false,
        error: "Failed to save metrics",
        details: upsertError.message,
      });
    }

    return json(200, {
      success: true,
      domain_authority: metrics.domain_authority,
      spam_score: metrics.spam_score,
    });
  } catch (err: unknown) {
    console.error("fetch-domain-metrics error:", err);
    return json(500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});
