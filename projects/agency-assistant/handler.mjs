import {createHash} from 'node:crypto';
import {chat,validateChat,validateEnquiry,knowledgeVersion} from './engine.mjs';
import {redisClient,privateHash,budget,telemetry} from './storage.mjs';
import {saveEnquiry} from './hubspot.mjs';
export function readiness(env){
 const storage=!!(env.UPSTASH_REDIS_REST_URL?.startsWith('https://')&&env.UPSTASH_REDIS_REST_TOKEN&&env.ASSISTANT_HASH_SECRET?.length>=32&&Number.isInteger(Number(env.ASSISTANT_DAILY_REQUEST_LIMIT))&&Number(env.ASSISTANT_DAILY_REQUEST_LIMIT)>0&&Number(env.ASSISTANT_DAILY_REQUEST_LIMIT)<=10000);
 return {chat:!!(storage&&env.ASSISTANT_CHAT_ENABLED==='true'&&env.GEMINI_API_KEY&&env.GEMINI_MODEL),crm:!!(storage&&env.ASSISTANT_CRM_ENABLED==='true'&&env.HUBSPOT_PRIVATE_APP_TOKEN),knowledgeVersion};
}
export function createHandler({env=process.env,fetcher=fetch,redisFactory=redisClient,answer=chat,save=saveEnquiry}={}){
 return async(req,res)=>{
 const start=performance.now();let redis,action='unknown',status='rejected',usage;
 const send=(code,data)=>{status=data.status||String(code);res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 try{
  if(req.method==='GET')return send(200,readiness(env));
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(405,{error:'Method not allowed.'});}
  const origin=env.ASSISTANT_ORIGIN||'https://chahosagency.vercel.app';
  if(req.headers.origin!==origin)return send(403,{error:'Open the assistant on the agency website.'});
  if(!String(req.headers['content-type']).startsWith('application/json'))return send(415,{error:'Use JSON.'});
  let body=req.body;
  if(body===undefined){let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>16000)return send(413,{error:'Request too large.'});chunks.push(chunk);}body=Buffer.concat(chunks).toString();}
  if(typeof body==='string'){if(Buffer.byteLength(body)>16000)return send(413,{error:'Request too large.'});try{body=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON.'});}}
  if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>16000)return send(400,{error:'Invalid request.'});
  action=body.action;if(!['chat','enquiry'].includes(action))return send(400,{error:'Unknown action.'});
  const state=readiness(env);if(!(action==='chat'?state.chat:state.crm))return send(503,{status:'not_configured',error:'This connection is not active yet. Use the agency contact page.'});
  let lead;try{if(action==='chat'){validateChat(body);if(body.processingConsent!==true)throw new Error('Agree to sending this conversation to the AI provider first.');}else lead=validateEnquiry(body);}catch(err){return send(400,{error:err.message});}
  redis=redisFactory(env,fetcher);
  // Vercel-owned ingress header; do not trust client x-forwarded-for for quotas.
  const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  if(!await budget(redis,env,ip,action)){res.setHeader('Retry-After','3600');return send(429,{status:'limited',error:'The usage limit was reached. Please contact Ahmad directly.'});}
  if(action==='chat'){const out=await answer(body,env,fetcher);usage=out.usage;const {usage:_,...publicResult}=out;return send(200,publicResult);}
  const key='chahos:enquiry:'+privateHash(lead.requestId,env),fingerprint=createHash('sha256').update(JSON.stringify(lead)).digest('hex');
  const lock=await redis(['SET',key,JSON.stringify({fingerprint,status:'pending'}),'NX','EX','604800']);
  if(lock!=='OK'){
   const existing=JSON.parse(await redis(['GET',key])||'null');
   if(existing?.fingerprint!==fingerprint)return send(409,{error:'This reference belongs to different details. Review a new request.'});
   if(existing.status==='received')return send(200,{status:'received',reference:lead.requestId});
   return send(409,{status:'pending',error:'This request may already be processing. Contact Ahmad with your reference; do not resubmit.'});
  }
  // Lock remains pending if a remote write times out. Never blindly replay a CRM write.
  const result=await save(lead,env,fetcher);
  await redis(['SET',key,JSON.stringify({fingerprint,status:'received'}),'EX','604800']);
  return send(200,result);
 }catch{return send(502,{status:'unavailable',error:action==='enquiry'?'We could not verify delivery. Keep your reference and contact Ahmad before submitting again.':'The assistant is temporarily unavailable. Please contact Ahmad or try the offline example.'});}
 finally{if(redis)await telemetry(redis,{action,status,latencyMs:performance.now()-start,knowledgeVersion,usage});}
 };
}
