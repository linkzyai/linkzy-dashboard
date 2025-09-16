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
    if (status === 'completed') {
      // Get the opportunity to find the source user and credit amount
      const { data: opportunity, error: opportunityError } = await supabase
        .from('placement_opportunities')
        .select('id, source_user_id, estimated_value, status')
        .eq('id', instruction.opportunity_id)
        .single();

      if (opportunity && opportunity.status !== 'placed') {
        // Update opportunity status
        await supabase
          .from('placement_opportunities')
          .update({
            status: 'placed',
            placement_attempted_at: new Date().toISOString(),
            placement_method: 'javascript_injection',
            placement_success: true,
            placement_url: window.location.href // The page where placement occurred
          })
          .eq('id', opportunity.id);

        // 🎯 CREDIT DEDUCTION: Only deduct credits after successful placement
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('credits')
          .eq('id', opportunity.source_user_id)
          .single();

        if (user && !userError) {
          const creditsToDeduct = opportunity.estimated_value || 1;
          const newBalance = Math.max(0, user.credits - creditsToDeduct);

          // Log the credit transaction
          await supabase.from('credit_transactions').insert({
            user_id: opportunity.source_user_id,
            transaction_type: 'debit',
            amount: -creditsToDeduct,
            balance_before: user.credits,
            balance_after: newBalance,
            description: `Credits deducted for successful backlink placement (Opportunity ${opportunity.id})`,
            opportunity_id: opportunity.id
          });

          // Update user balance
          await supabase
            .from('users')
            .update({ credits: newBalance })
            .eq('id', opportunity.source_user_id);

          console.log(`💳 Deducted ${creditsToDeduct} credits from user ${opportunity.source_user_id} for successful placement`);
        }

        // Log successful placement attempt
        await supabase.from('placement_attempts').insert({
          opportunity_id: opportunity.id,
          target_domain: window.location.hostname,
          placement_method: 'javascript_injection',
          success: true,
          verification_attempted: false,
          verification_success: true, // Assume success if placement executed
          link_still_live: true,
          attempted_at: new Date().toISOString()
        });

        console.log(`✅ JavaScript placement completed successfully for opportunity ${opportunity.id}`);
      }
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