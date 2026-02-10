// supabase/functions/track-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import OpenAI from "npm:openai@4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  // ✅ include apikey so browser requests can pass preflight
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/** -------- Keyword extraction helpers -------- */

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "with", "this", "that", "from", "have", "was", "your", "all", "can", "will", "has",
  "our", "they", "their", "what", "when", "where", "which", "who", "how", "why", "about", "into", "more", "than", "then", "them", "out",
  "use", "any", "had", "his", "her", "its", "one", "two", "three", "four", "five", "on", "in", "at", "by", "to", "of", "a", "an", "is", "it",
  "as", "be", "or", "if", "so", "do", "we", "he", "she", "i", "my", "me", "no", "yes", "up", "down", "over", "under", "again", "new", "just",
  "now", "only", "very", "also", "after", "before", "such", "each", "other", "some", "most", "many", "much", "like", "see", "get", "got",
  "make", "made", "back", "off", "own", "too", "via", "per", "should", "could", "would", "may", "might", "must", "shall", "let", "let's",
  "did", "does", "done", "being", "were", "been", "because", "while", "during", "between", "among", "within", "without", "across", "through",
  "upon", "against", "toward", "towards", "around", "amongst", "beside", "besides", "behind", "ahead", "along", "alongside", "amid", "amidst",
  "beyond", "despite", "except", "inside", "outside", "since", "though", "unless", "until", "versus", "whether", "yet", "etc",
]);

function heuristicCandidates(text: string, maxPhrases = 20) {
  if (!text) return [];
  const cleaned = text
    .replace(/[\u0000-\u001F]+/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .toLowerCase();

  const tokens = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const counts: Record<string, number> = {};

  // unigrams
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;

  // bigrams & trigrams
  for (let i = 0; i < tokens.length; i++) {
    if (i + 1 < tokens.length) {
      const bi = `${tokens[i]} ${tokens[i + 1]}`;
      counts[bi] = (counts[bi] || 0) + 1.5;
    }
    if (i + 2 < tokens.length) {
      const tri = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      counts[tri] = (counts[tri] || 0) + 2.0;
    }
  }

  const entries = Object.entries(counts)
    .map(([phrase, score]) => ({ phrase, score }))
    .filter((k) => {
      const parts = k.phrase.split(" ");
      return !(STOPWORDS.has(parts[0]) || STOPWORDS.has(parts[parts.length - 1]));
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: Array<{ phrase: string; score: number }> = [];
  for (const k of entries) {
    const key = k.phrase;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= maxPhrases) break;
  }
  return out;
}

async function llmExtractKeywords(text: string, langHint?: string | null) {
  if (!openai.apiKey) return null;

  const prompt = `
Extract up to 15 keyphrases (unigram–trigram) from the text. Prefer domain terms, named entities, products/brands, and concrete topics over generic words.
Return strict JSON: {"lang":"<iso639-1 or null>","keywords":[{"phrase":"...","score":0.0,"type":"entity|topic|tech|brand"}, ...]}
Scoring: 0.0–1.0 (higher means more salient in this text). Avoid duplicates (case-insensitive). No explanations.

Lang hint: ${langHint ?? "unknown"}
Text:
${text.slice(0, 6000)}
  `.trim();

  const resp = await openai.responses.create({
    model: "gpt-5",
    input: prompt,
  });

  const raw = resp.output_text || "{}";
  const jsonObj = JSON.parse(raw);

  if (!jsonObj || !Array.isArray(jsonObj.keywords)) return null;

  return {
    lang: typeof jsonObj.lang === "string" ? jsonObj.lang : undefined,
    keywords: jsonObj.keywords
      .map((k: any) => ({
        phrase: String(k.phrase || "").trim(),
        score: typeof k.score === "number" ? Math.min(Math.max(k.score, 0), 1) : 0.5,
        type: ["entity", "topic", "tech", "brand"].includes(k.type) ? k.type : undefined,
      }))
      .filter((k: any) => k.phrase.length > 0)
      .slice(0, 15),
  };
}

function mergeAndRankKeywords(llm: any, heur: any, limit = 15) {
  const map = new Map<string, any>();

  const maxHeur = Math.max(1, ...heur.map((h: any) => h.score));
  for (const h of heur) {
    const key = h.phrase.toLowerCase();
    map.set(key, { phrase: h.phrase, score: h.score / maxHeur, source: "heur" });
  }

  if (llm?.keywords) {
    for (const k of llm.keywords) {
      const key = k.phrase.toLowerCase();
      const prev = map.get(key);
      if (prev) {
        const blended = 0.6 * k.score + 0.4 * prev.score;
        map.set(key, { phrase: prev.phrase, score: blended, source: "both", type: k.type });
      } else {
        map.set(key, { phrase: k.phrase, score: k.score, source: "llm", type: k.type });
      }
    }
  }

  const ranked = Array.from(map.values()).sort((a: any, b: any) => {
    const lenDiff = b.phrase.split(" ").length - a.phrase.split(" ").length;
    if (lenDiff !== 0) return lenDiff;
    return b.score - a.score;
  });

  return ranked.slice(0, limit);
}

/** -------- Ecosystem matching trigger (safe) -------- */

async function triggerEcosystemMatching(contentId: string, userId: string) {
  console.log(`🎯 Starting real-time ecosystem matching for content ${contentId}`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ecosystem-matcher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ✅ include BOTH for reliability when calling Supabase endpoints
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      contentId,
      userId,
      forceReprocess: false,
      realTime: true,
    }),
  });

  // If upstream returns non-JSON, .json() would throw.
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { success: false, raw: text };
  }

  if (!response.ok) {
    // Make it throw so the caller can decide whether it's fatal or not
    throw new Error(`ecosystem-matcher ${response.status}: ${text}`);
  }

  return parsed;
}

async function safeTriggerMatching(contentId: string, userId: string) {
  try {
    await triggerEcosystemMatching(contentId, userId);
  } catch (e) {
    console.error("⚠️ ecosystem-matcher failed (non-fatal):", e);
  }
}

/** -------- Main handler -------- */

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "Server misconfigured: missing Supabase env vars" });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload.apiKey || !payload.url || !payload.timestamp) {
    return json(400, { error: "Missing required fields: apiKey, url, timestamp" });
  }

  const contentText = String(payload.content || "");

  // Keywords (best-effort, never fatal)
  const heur = heuristicCandidates(contentText, 30);
  let llm: any = null;
  try {
    llm = await llmExtractKeywords(contentText, null);
  } catch (e) {
    console.error("⚠️ LLM keyword extraction failed (non-fatal):", e);
    llm = null;
  }

  const merged = mergeAndRankKeywords(llm, heur, 15);
  const keywordArray = merged.map((k: any) => k.phrase);

  const totalWords = contentText
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  const density: Record<string, string> = {};
  for (const { phrase } of merged as any[]) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = contentText.match(re);
    const count = matches ? matches.length : 0;
    density[phrase] = ((count / Math.max(totalWords, 1)) * 100).toFixed(2);
  }

  // Validate API key -> user id (service role bypasses RLS)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("api_key", payload.apiKey)
    .single();

  if (userError || !userData) {
    return json(401, { error: "Invalid API key" });
  }

  // Try to find existing tracked content (0 rows is NOT fatal)
  const { data: existing, error: fetchError } = await supabase
    .from("tracked_content")
    .select("id, content")
    .eq("user_id", userData.id)
    .eq("url", payload.url)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch existing tracked_content error:", fetchError);
    return json(500, { error: "Failed to query tracked_content", details: fetchError.message });
  }

  // If found, compare hashes
  if (existing?.id) {
    const newContentHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(String(payload.content || ""))
    );
    const existingHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(existing.content || "")
    );

    const toHex = (buf: ArrayBuffer) =>
      Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const newHashHex = toHex(newContentHash);
    const existingHashHex = toHex(existingHash);

    if (newHashHex === existingHashHex) {
      // ✅ non-fatal matching trigger
      await safeTriggerMatching(existing.id, userData.id);

      return json(200, { success: true, message: "Content unchanged — skipping update" });
    }

    // Update record
    const { error: updateError } = await supabase
      .from("tracked_content")
      .update({
        content: String(payload.content || ""),
        title: String(payload.title || ""),
        referrer: String(payload.referrer || ""),
        timestamp: payload.timestamp,
        updated_at: new Date().toISOString(),
        keywords: keywordArray,
        keyword_density: density,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Update tracked_content error:", updateError);
      return json(500, { error: "Failed to update tracked_content", details: updateError.message });
    }

    await safeTriggerMatching(existing.id, userData.id);

    return json(200, { success: true, message: "Content updated successfully" });
  }

  // Insert new tracked content
  const { data: inserted, error: insertError } = await supabase
    .from("tracked_content")
    .insert([
      {
        user_id: userData.id,
        api_key: payload.apiKey,
        url: payload.url,
        title: String(payload.title || ""),
        referrer: String(payload.referrer || ""),
        timestamp: payload.timestamp,
        content: String(payload.content || ""),
        keywords: keywordArray,
        keyword_density: density,
      },
    ])
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.error("Insert tracked_content error:", insertError);
    return json(500, { error: "Failed to store tracked content", details: insertError?.message });
  }

  // Trigger matching safely (do not fail tracking)
  await safeTriggerMatching(inserted.id, userData.id);

  return json(200, {
    success: true,
    message: "Content tracked successfully",
    realTimeMatching: "triggered",
    analytics: {
      keywordsExtracted: keywordArray.length,
      topKeywords: keywordArray.slice(0, 5),
      contentLength: contentText.length,
      wordCount: totalWords,
    },
  });
});
