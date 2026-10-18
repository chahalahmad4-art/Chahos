// Temporary, read-only diagnostics for the protected HubSpot CRM test Preview.
// Never deploy this route as a general-purpose production integration health check.
const branch='feat/reviewed-crm-enquiries';
const expectedTestPortal='149580868';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const output=(res,status,payload)=>{res.statusCode=status;for(const [k,v] of Object.entries(headers))res.setHeader(k,v);res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(payload));};
async function getJSON(url,token){
 const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(8000),cache:'no-store'});
 if(!r.ok)return {ok:false,status:r.status};
 try{return {ok:true,data:await r.json()};}catch{return {ok:false,status:0};}
}
export default async function handler(req,res){
 if(req.method!=='GET')return output(res,405,{status:'method_not_allowed'});
 const env=process.env;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!==branch||
    env.ASSISTANT_CRM_ENABLED==='true'||env.HUBSPOT_EXPECTED_TEST_PORTAL_ID!==expectedTestPortal)
  return output(res,404,{status:'not_available'});
 if(!env.HUBSPOT_PRIVATE_APP_TOKEN||!env.HUBSPOT_ENQUIRY_PIPELINE_ID||!env.HUBSPOT_ENQUIRY_STAGE_ID||
    !env.UPSTASH_REDIS_REST_URL||!env.UPSTASH_REDIS_REST_TOKEN)
  return output(res,424,{status:'configuration_incomplete',writesEnabled:false});
 try{
  const identity=await getJSON('https://api.hubapi.com/integrations/v1/me',env.HUBSPOT_PRIVATE_APP_TOKEN);
  if(!identity.ok)return output(res,424,{status:'hubspot_identity_unavailable',upstreamStatus:identity.status,writesEnabled:false});
  if(String(identity.data?.portalId)!==expectedTestPortal)
   return output(res,409,{status:'wrong_hubspot_account',testAccount:false,writesEnabled:false});
  const pipeline=await getJSON('https://api.hubapi.com/crm/v3/pipelines/deals/'+encodeURIComponent(env.HUBSPOT_ENQUIRY_PIPELINE_ID),env.HUBSPOT_PRIVATE_APP_TOKEN);
  const stage=pipeline.ok?pipeline.data?.stages?.find(s=>String(s.id)===String(env.HUBSPOT_ENQUIRY_STAGE_ID)):null;
  const stageMatches=Boolean(stage&&stage.label==='New Lead'&&stage.archived!==true&&String(stage.metadata?.isClosed)!=='true');
  let redis=false;
  try{
   const r=await fetch(env.UPSTASH_REDIS_REST_URL,{
    method:'POST',headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(['PING']),signal:AbortSignal.timeout(6000),cache:'no-store'
   });
   if(r.ok){const body=await r.json();redis=body?.result==='PONG';}
  }catch{}
  const ok=pipeline.ok&&stageMatches&&redis;
  return output(res,ok?200:424,{
   status:ok?'ready_for_fictional_crm_test':'not_ready',
   testAccount:true,
   pipelineReadable:pipeline.ok,
   pipelineStatus:pipeline.ok?200:pipeline.status,
   newLeadOpen:stageMatches,
   isolatedRedisResponding:redis,
   writesEnabled:false
  });
 }catch{return output(res,424,{status:'read_only_check_unavailable',writesEnabled:false});}
}
