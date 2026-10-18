// Temporary read-only diagnostics on the isolated CRM test Preview.
// Intentionally fails closed: never proves account ownership from a Vercel flag alone.
const testBranch='feat/reviewed-crm-enquiries';
const expectedPortal='149580868';
function respond(res,status,data){
 res.statusCode=status;
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.end(JSON.stringify({...data,writesEnabled:false}));
}
async function hubspotGet(path,token){
 try{
  const r=await fetch('https://api.hubapi.com'+path,{
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},
   cache:'no-store',signal:AbortSignal.timeout(8000)
  });
  if(!r.ok)return {ok:false,status:r.status};
  return {ok:true,status:200,body:await r.json()};
 }catch{return {ok:false,status:0};}
}
async function redisPing(env){
 try{
  const response=await fetch(env.UPSTASH_REDIS_REST_URL,{
   method:'POST',
   headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify(['PING']),cache:'no-store',signal:AbortSignal.timeout(6000)
  });
  return Boolean(response.ok&&(await response.json())?.result==='PONG');
 }catch{return false;}
}
export default async function handler(req,res){
 if(req.method!=='GET')return respond(res,405,{status:'method_not_allowed'});
 const env=process.env;
 if(env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!==testBranch||
    env.ASSISTANT_CRM_ENABLED==='true'||env.HUBSPOT_EXPECTED_TEST_PORTAL_ID!==expectedPortal)
  return respond(res,404,{status:'not_available'});
 if(!env.HUBSPOT_PRIVATE_APP_TOKEN||!env.HUBSPOT_ENQUIRY_PIPELINE_ID||
    !env.HUBSPOT_ENQUIRY_STAGE_ID||!env.UPSTASH_REDIS_REST_URL||
    !env.UPSTASH_REDIS_REST_TOKEN)
  return respond(res,424,{status:'configuration_incomplete'});
 const token=env.HUBSPOT_PRIVATE_APP_TOKEN;
 // Modern account endpoint first; old /integrations/v1/me can reject newer Service Keys.
 const account=await hubspotGet('/account-info/2025-09/details',token);
 const legacy=account.ok?null:await hubspotGet('/integrations/v1/me',token);
 const identity=account.ok?account:legacy?.ok?legacy:null;
 const hubId=identity?.body?.portalId;
 if(identity&&String(hubId)!==expectedPortal)
  return respond(res,409,{status:'wrong_hubspot_account',testAccount:false});
 // The Pipeline read and Redis ping are safe even when identity cannot be proved.
 // These checks distinguish an unsupported account endpoint from an invalid key.
 const pipeline=await hubspotGet('/crm/v3/pipelines/deals/'+encodeURIComponent(env.HUBSPOT_ENQUIRY_PIPELINE_ID),token);
 const stage=pipeline.ok?pipeline.body?.stages?.find(s=>String(s.id)===String(env.HUBSPOT_ENQUIRY_STAGE_ID)):null;
 const stageValid=Boolean(stage&&stage.label==='New Lead'&&!stage.archived&&String(stage.metadata?.isClosed)!=='true');
 const redis=await redisPing(env);
 const base={
  testAccount:identity?true:null,
  accountStatus:account.status,
  legacyAccountStatus:legacy?.status??null,
  pipelineStatus:pipeline.status,
  pipelineReadable:pipeline.ok,
  newLeadOpen:stageValid,
  isolatedRedisResponding:redis
 };
 if(!identity)return respond(res,424,{status:'hubspot_identity_unverified',...base});
 if(!pipeline.ok||!stageValid||!redis)return respond(res,424,{status:'not_ready',...base});
 return respond(res,200,{status:'ready_for_fictional_crm_test',...base});
}
