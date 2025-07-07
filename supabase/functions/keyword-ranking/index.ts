import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const SEARCH_API_KEY = Deno.env.get('SEARCH_API_KEY') || 'YOUR_API_KEY';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
  const { keywords, domain, api_key, user_id } = await req.json(); // keywords: string[]
  if (!Array.isArray(keywords) || !domain || !user_id) {
    return new Response(JSON.stringify({
      error: 'Missing keywords, domain, or user_id'
    }), {
      status: 400
    });
  }
  const results = [];
  for (const keyword of keywords){
    const searchRes = await fetch('https://www.searchapi.io/api/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEARCH_API_KEY}`
      },
      body: JSON.stringify({
        engine: 'google',
        q: keyword,
        num: 100
      })
    });
    if (!searchRes.ok) {
      results.push({
        keyword,
        error: 'SearchApi.io request failed'
      });
      continue;
    }
    const data = await searchRes.json();
    const resultsArr = data.organic_results || [];
    const found = resultsArr.findIndex((r)=>r.link && r.link.includes(domain));
    const position = found >= 0 ? found + 1 : null;
    // Store in Supabase with user_id
    await supabase.from('keyword_rankings').insert([
      {
        keyword,
        domain,
        position,
        checked_at: new Date().toISOString(),
        api_key: api_key || null,
        source: 'google',
        user_id
      }
    ]);
    results.push({
      keyword,
      position
    });
  }
  return new Response(JSON.stringify({
    results
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
