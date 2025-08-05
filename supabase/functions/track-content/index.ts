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

// Real-time ecosystem matching trigger
async function triggerEcosystemMatching(contentId: string, userId: string): Promise<void> {
  try {
    console.log(`🎯 Starting real-time ecosystem matching for content ${contentId}`);
    
    // Call the ecosystem-matcher function directly
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ecosystem-matcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        contentId: contentId,
        userId: userId,
        forceReprocess: false,
        realTime: true
      })
    });

    const result = await response.json();
    
    if (result.success && result.opportunities_created > 0) {
      console.log(`✅ Real-time matching success: ${result.opportunities_created} opportunities created`);
      
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
    return new Response(JSON.stringify({ error: 'Missing required fields: apiKey, url, timestamp' }), {
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

  // Validate API key and get user_id (service role bypasses RLS)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('api_key', payload.apiKey)
    .single();

  if (userError || !userData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Store tracked content in the database
  const { error } = await supabase.from('tracked_content').insert([
    {
      user_id: userData.id,
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
    console.error('Database insert error:', error);
    return new Response(JSON.stringify({ error: 'Failed to store tracked content', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get the content ID from the insert
  const { data: insertedContent } = await supabase
    .from('tracked_content')
    .select('id')
    .eq('user_id', userData.id)
    .eq('url', payload.url)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 🚀 REAL-TIME ECOSYSTEM MATCHING: Trigger automatic opportunity generation
  if (insertedContent?.id) {
    console.log(`🔄 Triggering real-time ecosystem matching for content ${insertedContent.id}`);
    
    // Trigger ecosystem matching asynchronously (don't wait for it to complete)
    triggerEcosystemMatching(insertedContent.id, userData.id).catch(error => {
      console.error('⚠️ Ecosystem matching failed (non-blocking):', error);
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Content tracked successfully',
    realTimeMatching: insertedContent?.id ? 'triggered' : 'skipped',
    analytics: {
      keywordsExtracted: keywordList.length,
      topKeywords: keywordList.slice(0, 5).map(k => k.word),
      contentLength: contentText.length,
      wordCount: totalWords
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}); 