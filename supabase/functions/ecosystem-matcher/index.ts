import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Website validation function
async function validateWebsite(url: string): Promise<boolean> {
  try {
    // Basic URL validation
    if (!url || !url.startsWith('http')) {
      return false;
    }
    
    // Try to fetch the website with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD', // Only check headers, don't download content
      signal: controller.signal,
      headers: {
        'User-Agent': 'Linkzy-Bot/1.0 (Website Validation)'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Consider 200, 301, 302, 403 as valid (website exists)
    // 403 means site exists but blocks HEAD requests
    return response.status < 500;
    
  } catch (error) {
    console.log(`Website validation failed for ${url}:`, error.message);
    return false;
  }
}

// SIMPLE working function - just create opportunities
async function createSimpleOpportunity(contentId: string, userId: string): Promise<any> {
  console.log(`🎯 SIMPLE: Creating opportunity for content ${contentId} by user ${userId}`);
  
  try {
    // Get source content
    const { data: sourceContent, error: contentError } = await supabase
      .from('tracked_content')
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (contentError || !sourceContent) {
      console.error('❌ Content not found:', contentError);
      return { success: false, error: 'Content not found' };
    }
    
    // Get other users (not the source user)
    const { data: otherUsers, error: usersError } = await supabase
      .from('users')
      .select('id, niche, website')
      .neq('id', userId)
      .limit(5);
    
    if (usersError || !otherUsers?.length) {
      console.log('⚠️ No other users found');
      return { success: true, opportunities_created: 0, message: 'No other users found' };
    }
    
    console.log(`✅ Found ${otherUsers.length} other users`);
    
    // ANTI-RECIPROCAL LOGIC: Find a user who hasn't already linked back to us
    let targetUser = null;
    
    for (const user of otherUsers) {
      // Check if this user has already created a backlink TO the source user
      const { data: existingBacklink } = await supabase
        .from('placement_opportunities')
        .select('id')
        .eq('source_user_id', user.id)
        .eq('target_user_id', userId)
        .limit(1);
      
      if (!existingBacklink || existingBacklink.length === 0) {
        // This user hasn't backlinked to us, so it's safe to link to them
        targetUser = user;
        console.log(`✅ Selected non-reciprocal target: ${user.id}`);
        break;
      } else {
        console.log(`⚠️ Skipping user ${user.id} - would create reciprocal link`);
      }
    }
    
    if (!targetUser) {
      console.log('⚠️ No non-reciprocal targets found');
      return { success: true, opportunities_created: 0, message: 'No non-reciprocal targets available' };
    }
    
         // Generate proper target URL based on actual website
         let targetUrl = targetUser.website;
         if (!targetUrl || targetUrl === 'https://example.com') {
           // Fallback to actual test sites based on user
           const testSites = [
             'https://vulgar-magic.surge.sh',
             'https://nutriwise-test.surge.sh', 
             'https://wellnesshub-test.surge.sh'
           ];
           targetUrl = testSites[Math.floor(Math.random() * testSites.length)];
         }
         
         // Validate target website exists and is reachable
         const isValidWebsite = await validateWebsite(targetUrl);
         if (!isValidWebsite) {
           console.log(`⚠️ Target website ${targetUrl} is not reachable - skipping opportunity creation`);
           return { success: true, opportunities_created: 0, message: 'Target website not reachable' };
         }
         
         // Generate contextual anchor text for ANY niche dynamically
         function generateAnchorText(targetUrl: string, niche: string): string {
           
           // Dynamic templates that work for any niche
           const templates = [
             'professional {niche} services',
             'expert {niche} guidance', 
             'specialized {niche} solutions',
             '{niche} expertise and consulting',
             'comprehensive {niche} strategies',
             'proven {niche} approaches',
             'innovative {niche} methods',
             '{niche} professionals',
             'quality {niche} resources',
             'trusted {niche} specialists'
           ];
           
           // Clean and format the niche
           let cleanNiche = (niche || 'business').toLowerCase().trim();
           
           // Handle common niche mappings and pluralization
           const nicheMap: { [key: string]: string } = {
             'fitness': 'fitness training',
             'nutrition': 'nutrition coaching',
             'wellness': 'wellness programs',
             'health': 'health optimization',
             'technology': 'tech solutions',
             'creative-services': 'creative design',
             'arts': 'artistic services',
             'restaurants': 'culinary expertise',
             'travel': 'travel planning',
             'real-estate': 'real estate services',
             'automotive': 'automotive services',
             'education': 'educational resources',
             'finance': 'financial planning',
             'legal': 'legal services',
             'marketing': 'marketing strategies',
             'consulting': 'business consulting',
             'ecommerce': 'e-commerce solutions',
             'healthcare': 'healthcare services',
             'beauty': 'beauty and wellness',
             'photography': 'photography services',
             'music': 'music production',
             'fashion': 'fashion design',
             'home-services': 'home improvement',
             'pets': 'pet care services',
             'sports': 'sports training'
           };
           
           // Use mapped version if available, otherwise use the niche as-is
           const formattedNiche = nicheMap[cleanNiche] || cleanNiche;
           
           // Select random template and replace {niche}
           const template = templates[Math.floor(Math.random() * templates.length)];
           return template.replace('{niche}', formattedNiche);
         }
         
         const contextualAnchorText = generateAnchorText(targetUrl, targetUser.niche || 'health');
         
         const opportunity = {
       source_user_id: userId,
       source_content_id: contentId,
       target_user_id: targetUser.id,
       target_url: targetUrl,
       anchor_text: contextualAnchorText,
       match_score: 0.75,
       keyword_overlap: ['health', 'wellness', 'fitness'],
       status: 'auto_approved',
       placement_method: 'auto_placement',
       estimated_value: 2
     };
    
    console.log('🚀 Inserting opportunity:', opportunity);
    
    const { data: inserted, error: insertError } = await supabase
      .from('placement_opportunities')
      .insert([opportunity])
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return { success: false, error: insertError.message };
    }
    
         console.log('✅ Opportunity created successfully!');
     
     // 🚀 AUTOMATIC PLACEMENT: Immediately place the backlink
     const opportunityId = inserted[0]?.id;
     if (opportunityId) {
       console.log('🔄 Starting automatic placement...');
       try {
         // Call automatic-placement function
         const placementResponse = await fetch(`${SUPABASE_URL}/functions/v1/automatic-placement`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
             'x-admin-key': Deno.env.get('ADMIN_API_KEY') || ''
           },
           body: JSON.stringify({
             opportunityId: opportunityId,
             userId: userId,
             manualOverride: true
           })
         });
         
         const placementResult = await placementResponse.json();
         console.log('✅ Automatic placement result:', placementResult);
         
         return { 
           success: true, 
           opportunities_created: 1, 
           opportunity_id: opportunityId,
           automatic_placement: placementResult
         };
       } catch (placementError) {
         console.error('⚠️ Automatic placement failed:', placementError);
         return { 
           success: true, 
           opportunities_created: 1, 
           opportunity_id: opportunityId,
           automatic_placement: { error: placementError.message }
         };
       }
     }
     
     return { 
       success: true, 
       opportunities_created: 1, 
       opportunity_id: opportunityId 
     };
    
  } catch (error) {
    console.error('❌ Function error:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { contentId, userId } = await req.json();
    
    if (!contentId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing contentId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const result = await createSimpleOpportunity(contentId, userId);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Request error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 