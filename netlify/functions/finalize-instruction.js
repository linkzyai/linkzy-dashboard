const fetch = global.fetch;
const { json, corsHeaders, isAdmin, checkOrigin, isUUID, safeJson } = require('./_utils');
const H = (k,j=true)=>({...(j?{'Content-Type':'application/json'}:{}),apikey:k,Authorization:`Bearer ${k}`});

exports.handler = async (event) => {
  if (event.httpMethod==='OPTIONS') return {statusCode:200,headers:corsHeaders()};
  if (!checkOrigin(event)) return json(403,{error:'Origin not allowed'});
  if (!isAdmin(event)) return json(401,{error:'Admin key required'});
  if (event.httpMethod!=='POST') return json(405,{error:'Method not allowed'});

  const URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
  const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL||!SK) return json(500,{error:'Missing env vars'});

  const body = safeJson(event.body)||{};
  const instructionId = body.instructionId||null;
  const opportunityId = body.opportunityId||null;
  const targetUserId = body.targetUserId||null;

  try {
    if (instructionId && !isUUID(instructionId)) return json(400,{error:'Invalid instructionId'});
    if (opportunityId && !isUUID(opportunityId)) return json(400,{error:'Invalid opportunityId'});

    let instr = null;
    if (instructionId) {
      const r = await fetch(`${URL}/rest/v1/placement_instructions?id=eq.${instructionId}&select=*`,{headers:{...H(SK,false)}});
      const a = await r.json();
      instr = a?.[0]||null;
    } else {
      const qUser = targetUserId?`&target_user_id=eq.${targetUserId}`:'';
      const r = await fetch(`${URL}/rest/v1/placement_instructions?status=eq.pending${qUser}&select=*&order=created_at.desc&limit=1`,{headers:{...H(SK,false)}});
      const a = await r.json();
      instr = a?.[0]||null;
    }
    if (!instr) return json(200,{ok:true,message:'No pending placement instructions found.'});

    const execResult = { verified:true, note:'Simulated placement executed by admin.' };
    await fetch(`${URL}/rest/v1/placement_instructions?id=eq.${instr.id}`,{
      method:'PATCH',headers:{...H(SK)},body:JSON.stringify({status:'executed',executed_at:new Date().toISOString(),execution_result:execResult})
    });

    const oppId = instr.opportunity_id || opportunityId;
    if (oppId) {
      await fetch(`${URL}/rest/v1/placement_opportunities?id=eq.${oppId}`,{
        method:'PATCH',headers:{...H(SK)},body:JSON.stringify({status:'completed',placement_success:true})
      });
    }

    let opp = null;
    if (oppId) {
      const r = await fetch(`${URL}/rest/v1/placement_opportunities?id=eq.${oppId}&select=id,source_user_id,estimated_value`,{headers:{...H(SK,false)}});
      const a = await r.json();
      opp = a?.[0]||null;
    }
    if (opp?.source_user_id) {
      const credits = Number(opp.estimated_value||1);
      await fetch(`${URL}/rest/v1/credit_transactions`,{method:'POST',headers:{...H(SK)},body:JSON.stringify([{user_id:opp.source_user_id,amount:-credits,transaction_type:'placement',description:'Credit deducted after confirmed placement',opportunity_id:oppId}])});
      await fetch(`${URL}/rest/v1/users?id=eq.${opp.source_user_id}`,{method:'PATCH',headers:{...H(SK)},body:JSON.stringify({credits:{"decrement":credits}})});
    }

    return json(200,{ok:true,instructionId:instr.id,opportunityId:oppId});
  } catch(e) {
    return json(500,{ok:false,error:String(e?.message||e)});
  }
}; 