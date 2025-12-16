import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
// Import Supabase client for Edge Functions
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// Environment variables for service role key and project URL
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});
async function llmExtractKeywords(text, langHint) {
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
  try {
    const json = JSON.parse(resp.output_text || "{}");
    if (!json || !Array.isArray(json.keywords)) return null;
    // sanitize
    const result = {
      lang: typeof json.lang === "string" ? json.lang : undefined,
      keywords: json.keywords
        .map((k) => ({
          phrase: String(k.phrase || "").trim(),
          score:
            typeof k.score === "number"
              ? Math.min(Math.max(k.score, 0), 1)
              : 0.5,
          type: ["entity", "topic", "tech", "brand"].includes(k.type)
            ? k.type
            : undefined,
        }))
        .filter((k) => k.phrase.length > 0)
        .slice(0, 15),
    };
    return result;
  } catch {
    return null;
  }
}
function heuristicCandidates(text, maxPhrases = 20) {
  if (!text) return [];
  const cleaned = text
    .replace(/[\u0000-\u001F]+/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .toLowerCase();
  const tokens = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const counts = {};
  // unigrams
  for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
  // bigrams & trigrams (simple sliding window)
  for (let i = 0; i < tokens.length; i++) {
    if (i + 1 < tokens.length) {
      const bi = `${tokens[i]} ${tokens[i + 1]}`;
      counts[bi] = (counts[bi] || 0) + 1.5; // weight phrases a bit higher
    }
    if (i + 2 < tokens.length) {
      const tri = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      counts[tri] = (counts[tri] || 0) + 2.0;
    }
  }
  const entries = Object.entries(counts)
    .map(([phrase, score]) => ({
      phrase,
      score,
    })) // drop phrases starting/ending with stopwords
    .filter((k) => {
      const parts = k.phrase.split(" ");
      return !(
        STOPWORDS.has(parts[0]) || STOPWORDS.has(parts[parts.length - 1])
      );
    })
    .sort((a, b) => b.score - a.score);
  // de-dup near duplicates by prefix
  const seen = new Set();
  const out = [];
  for (const k of entries) {
    const key = k.phrase;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= maxPhrases) break;
  }
  return out;
}
function mergeAndRankKeywords(llm, heur, limit = 15) {
  const map = new Map();
  // add heuristic with normalized score 0..1
  const maxHeur = Math.max(1, ...heur.map((h) => h.score));
  for (const h of heur) {
    const key = h.phrase.toLowerCase();
    const s = h.score / maxHeur;
    map.set(key, {
      phrase: h.phrase,
      score: s,
      source: "heur",
    });
  }
  // add llm; if exists, blend: score = 0.6*llm + 0.4*heur
  if (llm?.keywords) {
    for (const k of llm.keywords) {
      const key = k.phrase.toLowerCase();
      const prev = map.get(key);
      if (prev) {
        const blended = 0.6 * k.score + 0.4 * prev.score;
        map.set(key, {
          phrase: prev.phrase,
          score: blended,
          source: "both",
          type: k.type,
        });
      } else {
        map.set(key, {
          phrase: k.phrase,
          score: k.score,
          source: "llm",
          type: k.type,
        });
      }
    }
  }
  // rank: prefer longer phrases slightly, then score
  const ranked = Array.from(map.values()).sort((a, b) => {
    const lenDiff = b.phrase.split(" ").length - a.phrase.split(" ").length;
    if (lenDiff !== 0) return lenDiff; // prefer bi/tri-grams
    return b.score - a.score;
  });
  return ranked.slice(0, limit);
}
// Real-time ecosystem matching trigger
async function triggerEcosystemMatching(contentId, userId) {
  try {
    console.log(
      `🎯 Starting real-time ecosystem matching for content ${contentId}`
    );
    // Call the ecosystem-matcher function directly
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ecosystem-matcher`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          contentId: contentId,
          userId: userId,
          forceReprocess: false,
          realTime: true,
        }),
      }
    );
    const result = await response.json();
    if (result.success && result.opportunities_created > 0) {
      console.log(
        `✅ Real-time matching success: ${result.opportunities_created} opportunities created`
      );
      // TODO: Send notifications to potential partners
      // await notifyPartners(result.opportunities);
    } else {
      console.log(`ℹ️ No new opportunities found for content ${contentId}`);
    }
  } catch (error) {
    console.error(`❌ Real-time ecosystem matching failed:`, error);
    throw error;
  }
}
// Simple stopwords list for English
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "with",
  "this",
  "that",
  "from",
  "have",
  "was",
  "your",
  "all",
  "can",
  "will",
  "has",
  "our",
  "they",
  "their",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "why",
  "about",
  "into",
  "more",
  "than",
  "then",
  "them",
  "out",
  "use",
  "any",
  "had",
  "his",
  "her",
  "its",
  "one",
  "two",
  "three",
  "four",
  "five",
  "on",
  "in",
  "at",
  "by",
  "to",
  "of",
  "a",
  "an",
  "is",
  "it",
  "as",
  "be",
  "or",
  "if",
  "so",
  "do",
  "we",
  "he",
  "she",
  "i",
  "my",
  "me",
  "no",
  "yes",
  "up",
  "down",
  "over",
  "under",
  "again",
  "new",
  "just",
  "now",
  "only",
  "very",
  "also",
  "after",
  "before",
  "such",
  "each",
  "other",
  "some",
  "most",
  "many",
  "much",
  "like",
  "see",
  "get",
  "got",
  "make",
  "made",
  "back",
  "off",
  "own",
  "too",
  "via",
  "per",
  "via",
  "should",
  "could",
  "would",
  "may",
  "might",
  "must",
  "shall",
  "let",
  "let's",
  "did",
  "does",
  "done",
  "being",
  "were",
  "been",
  "because",
  "while",
  "during",
  "between",
  "among",
  "within",
  "without",
  "across",
  "through",
  "upon",
  "against",
  "toward",
  "towards",
  "upon",
  "around",
  "amongst",
  "beside",
  "besides",
  "behind",
  "ahead",
  "along",
  "alongside",
  "amid",
  "amidst",
  "among",
  "amongst",
  "beyond",
  "despite",
  "except",
  "inside",
  "outside",
  "since",
  "than",
  "though",
  "unless",
  "until",
  "upon",
  "versus",
  "via",
  "whether",
  "yet",
  "etc",
]);
function extractKeywords(text) {
  if (!text) return [];
  // Remove punctuation, lowercase, split by whitespace
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  // Count frequency
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  // Sort by frequency
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  // Return top 20 keywords
  return sorted.slice(0, 20).map(([word, count]) => ({
    word,
    count,
  }));
}
function keywordDensity(words, totalWords) {
  const density = {};
  for (const { word, count } of words) {
    density[word] = ((count / totalWords) * 100).toFixed(2);
  }
  return density;
}
serve(async (req) => {
  // Handle CORS preflight requests
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
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON",
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
  // Basic validation
  if (!payload.apiKey || !payload.url || !payload.timestamp) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: apiKey, url, timestamp",
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
  // Extract keywords and calculate density
  const contentText = payload.content || "";
  const heur = heuristicCandidates(contentText, 30);
  // Optional: you may already have detected language via your summarize step
  const langHint = null; // or pass detected lang if you computed it elsewhere
  const llm = await llmExtractKeywords(contentText, langHint);
  console.log("LLM Keyword", llm);
  const merged = mergeAndRankKeywords(llm, heur, 15);
  const keywordArray = merged.map((k) => k.phrase);
  const totalWords = contentText
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const density = {};
  for (const { phrase } of merged) {
    const re = new RegExp(
      `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    const matches = contentText.match(re);
    const count = matches ? matches.length : 0;
    density[phrase] = ((count / Math.max(totalWords, 1)) * 100).toFixed(2);
  }
  // const keywordList = extractKeywords(contentText);
  // const totalWords = contentText.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)).length;
  // const density = keywordDensity(keywordList, totalWords || 1);
  // Validate API key and get user_id (service role bypasses RLS)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("api_key", payload.apiKey)
    .single();
  if (userError || !userData) {
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
  // Check if this URL is already tracked
  const { data: existing, error: fetchError } = await supabase
    .from("tracked_content")
    .select("id, content")
    .eq("user_id", userData.id)
    .eq("url", payload.url)
    .single();
  //If found, compare content hashes
  if (existing) {
    // Simple string hash comparison
    const newContentHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(payload.content)
    );
    const existingHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(existing.content || "")
    );
    const newHashHex = Array.from(new Uint8Array(newContentHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const existingHashHex = Array.from(new Uint8Array(existingHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (newHashHex === existingHashHex) {
      // ✅ No content change detected
      await triggerEcosystemMatching(existing.id, userData.id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Content unchanged — skipping update",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // ✅ Content changed — update record
    const { error: updateError } = await supabase
      .from("tracked_content")
      .update({
        content: payload.content,
        title: payload.title,
        referrer: payload.referrer,
        timestamp: payload.timestamp,
        updated_at: new Date().toISOString(),
        // keywords: keywordList.map((k) => k.word),
        keywords: keywordArray,
        keyword_density: density,
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    console.log(
      `♻️ Content changed — updated tracked_content ID ${existing.id}`
    );
    // (Optional) re-trigger ecosystem matching for updated content
    await triggerEcosystemMatching(existing.id, userData.id);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Content updated successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  // Store tracked content in the database
  const { error } = await supabase.from("tracked_content").insert([
    {
      user_id: userData.id,
      api_key: payload.apiKey,
      url: payload.url,
      title: payload.title || "",
      referrer: payload.referrer || "",
      timestamp: payload.timestamp,
      content: payload.content || "",
      // keywords: keywordList.map((k) => k.word),
      keywords: keywordArray,
      keyword_density: density,
    },
  ]);
  if (error) {
    console.error("Database insert error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to store tracked content",
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
  // Get the content ID from the insert
  const { data: insertedContent } = await supabase
    .from("tracked_content")
    .select("id")
    .eq("user_id", userData.id)
    .eq("url", payload.url)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .single();
  // 🚀 REAL-TIME ECOSYSTEM MATCHING: Trigger automatic opportunity generation
  let ecosystemResult = null;
  if (insertedContent?.id) {
    console.log(
      `🔄 Triggering real-time ecosystem matching for content ${insertedContent.id}`
    );
    try {
      // Make ecosystem matching synchronous to see results
      ecosystemResult = await triggerEcosystemMatching(
        insertedContent.id,
        userData.id
      );
      console.log("✅ Ecosystem matching completed:", ecosystemResult);
    } catch (error) {
      console.error("⚠️ Ecosystem matching failed:", error);
      ecosystemResult = {
        error: error.message,
      };
    }
  }
  return new Response(
    JSON.stringify({
      success: true,
      message: "Content tracked successfully",
      realTimeMatching: insertedContent?.id ? "triggered" : "skipped",
      ecosystemResult: ecosystemResult,
      analytics: {
        // keywordsExtracted: keywordList.length,
        keywordsExtracted: keywordArray.length,
        // topKeywords: keywordList.slice(0, 5).map((k) => k.word),
        topKeywords: keywordArray.slice(0, 5),
        contentLength: contentText.length,
        wordCount: totalWords,
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
