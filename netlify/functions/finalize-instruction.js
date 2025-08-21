const fetch = global.fetch;
const J = (s,b)=>({statusCode:s,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},body:JSON.stringify(b)});
const H = (k,j=true)=>({...(j?{'Content-Type':'application/json'}:{}),apikey:k,Authorization:`Bearer ${k}`});

exports.handler = async (event) => {
  if (event.httpMethod==='OPTIONS') return {statusCode:200,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, apikey','Access-Control-Allow-Methods':'POST, OPTIONS'}};
  if (event.httpMethod!=='POST') return J(405,{error:'Method not allowed'});

  const URL = process.env.SUPABASE_URL || 'https://sljlwvrtwqmhmjunyplr.supabase.co';
  const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL||!SK) return J(500,{error:'Missing env vars'});

  const body = safe(event.body)||{};
  const instructionId = body.instructionId||null;
  const opportunityId = body.opportunityId||null;
  const targetUserId = body.targetUserId||null; // optional filter

  try {
    // 1) Find instruction
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
    if (!instr) return J(200,{ok:true,message:'No pending placement instructions found.'});

    // 2) Mark executed
    const execResult = { verified:true, note:'Simulated placement executed by admin.' };
    await fetch(`${URL}/rest/v1/placement_instructions?id=eq.${instr.id}`,{
      method:'PATCH',headers:{...H(SK)},body:JSON.stringify({status:'executed',executed_at:new Date().toISOString(),execution_result:execResult})
    });

    // 3) Close opportunity and mark success
    const oppId = instr.opportunity_id || opportunityId;
    if (oppId) {
      await fetch(`${URL}/rest/v1/placement_opportunities?id=eq.${oppId}`,{
        method:'PATCH',headers:{...H(SK)},body:JSON.stringify({status:'completed',placement_success:true})
      });
    }

    // 4) Credit transaction (debit 1 from source user)
    // Fetch opportunity to know source_user_id
    let opp = null;
    if (oppId) {
      const r = await fetch(`${URL}/rest/v1/placement_opportunities?id=eq.${oppId}&select=id,source_user_id,estimated_value`,{headers:{...H(SK,false)}});
      const a = await r.json();
      opp = a?.[0]||null;
    }
    if (opp?.source_user_id) {
      const credits = Number(opp.estimated_value||1);
      // Insert transaction
      await fetch(`${URL}/rest/v1/credit_transactions`,{method:'POST',headers:{...H(SK)},body:JSON.stringify([{user_id:opp.source_user_id,amount:-credits,transaction_type:'placement',description:'Credit deducted after confirmed placement',opportunity_id:oppId}])});
      // Decrement user credits
      await fetch(`${URL}/rest/v1/users?id=eq.${opp.source_user_id}`,{method:'PATCH',headers:{...H(SK)},body:JSON.stringify({credits:{"decrement":credits}})});
    }

    return J(200,{ok:true,instructionId:instr.id,opportunityId:oppId});
  } catch(e) {
    return J(500,{ok:false,error:String(e?.message||e)});
  }
};

function safe(s){try{return s?JSON.parse(s):{};}catch{return{};}} 