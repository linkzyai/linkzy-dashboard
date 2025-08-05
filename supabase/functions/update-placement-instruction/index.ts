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
    const { instructionId, status, result } = await req.json();
    
    if (!instructionId || !status) {
      return new Response(JSON.stringify({ error: 'Missing instructionId or status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['executing', 'completed', 'failed'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the placement instruction
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'executing') {
      updateData.executed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.execution_result = result;
      updateData.executed_at = updateData.executed_at || new Date().toISOString();
    } else if (status === 'failed') {
      updateData.execution_result = result;
      updateData.retry_count = supabase.raw('retry_count + 1');
    }

    const { data: instruction, error: updateError } = await supabase
      .from('placement_instructions')
      .update(updateData)
      .eq('id', instructionId)
      .select('*, placement_opportunities!inner(*)')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update instruction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If completed successfully, update the related opportunity and process credits
    if (status === 'completed' && result?.verificationSuccess) {
      const opportunityId = instruction.opportunity_id;
      
      // Update opportunity status
      await supabase
        .from('placement_opportunities')
        .update({
          status: 'placed',
          placement_attempted_at: new Date().toISOString(),
          placement_method: 'javascript_injection',
          placement_success: true,
          placement_url: result.placementUrl
        })
        .eq('id', opportunityId);

      // Log successful placement attempt
      await supabase.from('placement_attempts').insert({
        opportunity_id: opportunityId,
        target_domain: new URL(result.placementUrl).hostname,
        placement_method: 'javascript_injection',
        success: true,
        verification_attempted: true,
        verification_success: result.verificationSuccess,
        link_still_live: true,
        attempted_at: new Date().toISOString()
      });

      console.log(`✅ JavaScript placement completed successfully for opportunity ${opportunityId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      instruction_id: instructionId,
      status: status,
      updated_at: updateData.updated_at
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Update placement instruction error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 