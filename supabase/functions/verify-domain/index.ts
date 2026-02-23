/**
 * Edge Function: verify-domain
 *
 * Domain verification for track-content. Users add a meta tag or file to their site,
 * then we fetch and verify ownership.
 *
 * POST body: { domain: string }  (e.g. "example.com" or "https://example.com")
 * Requires: Authorization: Bearer <user-jwt>
 *
 * Verification methods:
 * 1. Meta tag: <meta name="linkzy-verification" content="TOKEN">
 * 2. File: https://domain/.well-known/linkzy-verify.txt containing TOKEN
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function extractHostname(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").split("/")[0];
  if (!s || s === "yourdomain.com" || s === "example.com") return null;
  // Basic validation: allow domain-like strings
  if (s.length > 253 || /[^a-z0-9.\-]/.test(s)) return null;
  // Normalize to apex (www.example.com -> example.com) so one verification covers both
  return s.replace(/^www\./, "");
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyViaFile(domain: string, token: string): Promise<boolean> {
  try {
    const url = `https://${domain}/.well-known/linkzy-verify.txt`;
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Linkzy-Verification/1.0" },
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.trim() === token;
  } catch {
    return false;
  }
}

async function verifyViaMeta(domain: string, token: string): Promise<boolean> {
  try {
    const url = `https://${domain}/`;
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Linkzy-Verification/1.0" },
    });
    if (!res.ok) return false;
    const html = await res.text();
    // Match: <meta name="linkzy-verification" content="TOKEN"> (flexible attr order)
    const metaRe = new RegExp(
      `<meta[^>]+name=["']linkzy-verification["'][^>]+content=["']${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
      "i"
    );
    if (metaRe.test(html)) return true;
    const metaRe2 = new RegExp(
      `<meta[^>]+content=["']${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+name=["']linkzy-verification["']`,
      "i"
    );
    return metaRe2.test(html);
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json(401, { error: "Invalid or expired token" });
  }

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const domain = extractHostname(body.domain ?? "");
  if (!domain) {
    return json(400, { error: "Invalid or missing domain" });
  }

  const now = new Date().toISOString();

  // Get or create verified_domains record
  const { data: existing } = await supabase
    .from("verified_domains")
    .select("id, verification_token, verification_method, verified_at")
    .eq("user_id", user.id)
    .eq("domain", domain)
    .maybeSingle();

  let recordToken: string;
  let isNew = false;

  if (existing) {
    recordToken = existing.verification_token;
    if (existing.verified_at) {
      return json(200, {
        domain,
        verified: true,
        verified_at: existing.verified_at,
        method: existing.verification_method,
      });
    }
  } else {
    isNew = true;
    recordToken = generateToken();
    const { error: insertErr } = await supabase.from("verified_domains").insert({
      user_id: user.id,
      domain,
      verification_token: recordToken,
    });
    if (insertErr) {
      // Race: another request created it, fetch that record
      const { data: retry } = await supabase
        .from("verified_domains")
        .select("verification_token, verified_at")
        .eq("user_id", user.id)
        .eq("domain", domain)
        .single();
      if (retry?.verified_at) {
        return json(200, { domain, verified: true, verified_at: retry.verified_at });
      }
      if (retry?.verification_token) recordToken = retry.verification_token;
    }
  }

  // Attempt verification
  const viaFile = await verifyViaFile(domain, recordToken);
  const viaMeta = !viaFile && (await verifyViaMeta(domain, recordToken));

  if (viaFile || viaMeta) {
    const { error: updateErr } = await supabase
      .from("verified_domains")
      .update({
        verification_method: viaFile ? "file" : "meta",
        verified_at: now,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .eq("domain", domain);

    if (updateErr) {
      console.error("Failed to update verified_domains:", updateErr);
      return json(500, { error: "Verification succeeded but update failed" });
    }

    return json(200, {
      domain,
      verified: true,
      verified_at: now,
      method: viaFile ? "file" : "meta",
    });
  }

  return json(200, {
    domain,
    verified: false,
    token: recordToken,
    instructions: {
      meta: `Add this tag to your site's <head>: <meta name="linkzy-verification" content="${recordToken}">`,
      file: `Create file https://${domain}/.well-known/linkzy-verify.txt with content: ${recordToken}`,
    },
    isNew,
  });
});
