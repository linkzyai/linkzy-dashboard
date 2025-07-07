import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Example payload interface (customize as needed)
interface SnippetPayload {
  apiKey: string;
  url: string;
  title?: string;
  referrer?: string;
  timestamp: string;
  content?: string;
  [key: string]: any;
}

// Import Supabase client for Edge Functions
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Environment variables for service role key and project URL
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Simple stopwords list for English
const STOPWORDS = new Set([
  'the','and','for','are','but','not','you','with','this','that','from','have','was','your','all','can','will','has','our','they','their','what','when','where','which','who','how','why','about','into','more','than','then','them','out','use','any','had','his','her','its','one','two','three','four','five','on','in','at','by','to','of','a','an','is','it','as','be','or','if','so','do','we','he','she','i','my','me','no','yes','up','down','over','under','again','new','just','now','only','very','also','after','before','such','each','other','some','most','many','much','like','see','get','got','make','made','back','off','own','too','via','per','via','should','could','would','may','might','must','shall','let','let\'s','did','does','done','being','were','been','because','while','during','between','among','within','without','across','through','upon','against','toward','towards','upon','around','amongst','beside','besides','behind','ahead','along','alongside','amid','amidst','among','amongst','beyond','despite','except','inside','outside','since','than','though','unless','until','upon','versus','via','whether','yet','etc'
]);

function extractKeywords(text) {
  if (!text) return [];
  // Remove punctuation, lowercase, split by whitespace
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  // Count frequency
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  // Sort by frequency
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  // Return top 20 keywords
  return sorted.slice(0, 20).map(([word, count]) => ({ word, count }));
}

function keywordDensity(words, totalWords) {
  const density = {};
  for (const { word, count } of words) {
    density[word] = ((count / totalWords) * 100).toFixed(2);
  }
  return density;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: SnippetPayload;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Basic validation
  if (!payload.apiKey || !payload.url || !payload.timestamp) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Extract keywords and calculate density
  const contentText = payload.content || '';
  const keywordList = extractKeywords(contentText);
  const totalWords = contentText
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w)).length;
  const density = keywordDensity(keywordList, totalWords || 1);

  // Store tracked content in the database
  const { error } = await supabase.from('tracked_content').insert([
    {
      api_key: payload.apiKey,
      url: payload.url,
      title: payload.title || '',
      referrer: payload.referrer || '',
      timestamp: payload.timestamp,
      content: payload.content || '',
      keywords: keywordList.map(k => k.word),
      keyword_density: density,
    }
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to store tracked content', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Placeholder for opportunity suggestion logic
  // const suggestions = getSuggestions(payload.content);

  return new Response(JSON.stringify({ success: true, message: 'Data received and stored' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}); 