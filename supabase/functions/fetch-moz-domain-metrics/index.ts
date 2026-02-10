/**
 * Edge Function: fetch-moz-domain-metrics
 *
 * Fetches Domain Authority (and related metrics) from Moz API for all users'
 * websites and upserts into domain_metrics.
 *
 * Requires env: MOZ_TOKEN (Moz API token), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Invoke: POST (no body required) or GET. Can be triggered by cron.
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

function normalizeWebsite(website: string | null): string | null {
  if (!website || typeof website !== "string") return null;
  const trimmed = website.trim().toLowerCase();
  if (!trimmed || trimmed === "yourdomain.com") return null;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

// Determine tier based on Domain Authority
function getTierFromDA(da: number | null | undefined): "bronze" | "silver" | "gold" | null {
  if (da === null || da === undefined || typeof da !== "number") return null;
  if (da >= 60) return "gold";
  if (da >= 30) return "silver";
  return "bronze";
}

async function fetchMozSiteMetrics(
  token: string,
  url: string
): Promise<{ domain_authority?: number; domain_rating?: number; spam_score?: number } | null> {
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

  // Moz response: { result: { site_query, site_metrics: { domain_authority, spam_score, ... } } }
  const result = data.result ?? data;
  const metrics = result.site_metrics ?? result;

  const domain_authority =
    typeof metrics.domain_authority === "number" ? metrics.domain_authority : undefined;
  const spam_score =
    typeof metrics.spam_score === "number" ? metrics.spam_score : undefined;
  // domain_rating is not in Moz response (Ahrefs metric); keep for compatibility if we add other sources later
  const domain_rating =
    typeof metrics.domain_rating === "number" ? metrics.domain_rating : undefined;

  return {
    domain_authority,
    domain_rating,
    spam_score,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const MOZ_TOKEN = Deno.env.get("MOZ_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!MOZ_TOKEN) {
    console.error("MOZ_TOKEN is not set");
    return json(500, { error: "MOZ_TOKEN is not configured" });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Supabase configuration missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, website")
      .not("website", "is", null);

    if (usersError) {
      console.error("Failed to fetch users:", usersError);
      return json(500, { error: "Failed to fetch users", details: usersError.message });
    }

    const toProcess = (users ?? []).filter((u) => normalizeWebsite(u.website));
    if (toProcess.length === 0) {
      return json(200, {
        success: true,
        message: "No users with valid websites to process",
        processed: 0,
        updated: 0,
        failed: 0,
      });
    }

    let updated = 0;
    let failed = 0;

    for (const u of toProcess) {
      const url = normalizeWebsite(u.website);
      if (!url) continue;

      const metrics = await fetchMozSiteMetrics(MOZ_TOKEN, url);
      if (!metrics) {
        failed += 1;
        continue;
      }

      const now = new Date().toISOString();
      const { error: upsertError } = await supabase.from("domain_metrics").upsert(
        {
          user_id: u.id,
          website: url,
          domain_authority: metrics.domain_authority ?? null,
          domain_rating: metrics.domain_rating ?? null,
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
        console.warn(`Upsert domain_metrics for user ${u.id}:`, upsertError);
        failed += 1;
      } else {
        updated += 1;
        
        // Update user tier based on Domain Authority
        const tier = getTierFromDA(metrics.domain_authority);
        if (tier) {
          const { error: tierUpdateError } = await supabase
            .from("users")
            .update({ tier })
            .eq("id", u.id);
          
          if (tierUpdateError) {
            console.warn(`Failed to update tier for user ${u.id}:`, tierUpdateError);
          } else {
            console.log(`✅ Updated tier for user ${u.id}: ${tier} (DA: ${metrics.domain_authority})`);
          }
        }
      }

      // Avoid rate limiting (Moz has limits)
      await new Promise((r) => setTimeout(r, 500));
    }

    return json(200, {
      success: true,
      processed: toProcess.length,
      updated,
      failed,
    });
  } catch (err: unknown) {
    console.error("fetch-moz-domain-metrics error:", err);
    return json(500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});
