import {createHmac} from 'node:crypto';
export function redisClient(env,fetcher=fetch){
 const url=new URL(env.UPSTASH_REDIS_REST_URL);if(url.protocol!=='https:')throw new Error('Invalid storage configuration');
 return async command=>{const r=await fetcher(url,{method:'POST',headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('Storage unavailable');const data=await r.json();if(data.error)throw new Error('Storage unavailable');return data.result;};
}
export function privateHash(value,env){return createHmac('sha256',env.ASSISTANT_HASH_SECRET).update(value).digest('hex');}
// Both counters are checked and incremented atomically, with expiry set in the same script.
const budgetScript=`local a=tonumber(redis.call('GET',KEYS[1]) or '0'); local b=tonumber(redis.call('GET',KEYS[2]) or '0'); if a>=tonumber(ARGV[1]) or b>=tonumber(ARGV[2]) then return 0 end; redis.call('INCR',KEYS[1]);redis.call('EXPIRE',KEYS[1],86400);redis.call('INCR',KEYS[2]);redis.call('EXPIRE',KEYS[2],86400);return 1`;
export async function budget(redis,env,ip,action,now=new Date()){
 const day=now.toISOString().slice(0,10),global=Number(env.ASSISTANT_DAILY_REQUEST_LIMIT),perIp=action==='chat'?20:3;
 if(!Number.isInteger(global)||global<1||global>10000)throw new Error('Configure a valid request limit');
 return await redis(['EVAL',budgetScript,'2',`chahos:${day}:${action}:ip:${privateHash(ip,env)}`,`chahos:${day}:global`,String(perIp),String(global)])===1;
}
export async function telemetry(redis,entry){
 // No text, IPs, emails, lead data or credentials in observability records.
 const data={at:new Date().toISOString(),action:entry.action,status:entry.status,latencyMs:Math.round(entry.latencyMs),knowledgeVersion:entry.knowledgeVersion,usage:entry.usage||null};
 const script="redis.call('LPUSH',KEYS[1],ARGV[1]);redis.call('LTRIM',KEYS[1],0,499);redis.call('EXPIRE',KEYS[1],604800);return 1";
 try{await redis(['EVAL',script,'1','chahos:telemetry',JSON.stringify(data)]);}catch{/* Telemetry failure must not replay an external mutation. */}
}
