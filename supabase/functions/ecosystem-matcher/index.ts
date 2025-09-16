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
    
    // Create one opportunity with the first other user
    const targetUser = otherUsers[0];
    
         const opportunity = {
       source_user_id: userId,
       source_content_id: contentId,
       target_user_id: targetUser.id,
       target_url: targetUser.website || 'https://example.com',
       anchor_text: 'health and wellness',
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