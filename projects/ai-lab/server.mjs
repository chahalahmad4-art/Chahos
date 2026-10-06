import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {Store} from './store.mjs';
import {groundedAnswer} from './provider.mjs';
import {runAgent} from './agent.mjs';
import {ingestDocuments} from '../../public/ai-lab/ingest.mjs';
import {availableSlots,policyVersion,datasetVersion} from '../../public/ai-lab/core.mjs';
import {runEvaluations} from '../../public/ai-lab/cases.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
export function createLabServer({store=new Store(),token,env=process.env,answerer=groundedAnswer}={}){
  if(!token||token.length<24)throw new Error('Use an API token with at least 24 characters.');
  const root=resolve(here,'../../public'),buckets=new Map();
  const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    try{
      const url=new URL(req.url,'http://localhost');
      // Localhost-only runtime: reject alternate Host headers / DNS rebinding.
      if(!/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'Localhost access only.'});
      if(url.pathname.startsWith('/api/')){
        if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host)return json(res,403,{error:'Cross-origin requests are disabled.'});
        const got=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+token);
        if(got.length!==expected.length||!timingSafeEqual(got,expected))return json(res,401,{error:'A valid local API token is required.'});
        const now=Date.now(),key=req.socket.remoteAddress,old=buckets.get(key),bucket=old&&now-old.time<60000?old:{time:now,count:0};bucket.count++;buckets.set(key,bucket);
        if(bucket.count>60)return json(res,429,{error:'Too many requests. Try again in a minute.'});
        const route=url.pathname.slice(5);
        if(req.method==='GET'){
          const values={health:()=>({mode:env.LLM_API_KEY?'llm':'extractive',datasetVersion,policyVersion}),knowledge:()=>({knowledge:store.knowledge()}),slots:()=>({slots:availableSlots()}),records:()=>({records:store.records()}),traces:()=>({traces:store.traces()}),outbox:()=>({drafts:store.outbox()})};
          if(!values[route])return json(res,404,{error:'Unknown API route.'});return json(res,200,values[route]());
        }
        if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});
        if(!String(req.headers['content-type']).startsWith('application/json'))return json(res,415,{error:'Use application/json.'});
        const bodyLimit=route==='knowledge'?131072:8192;
        let bytes=0,parts=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>bodyLimit)return json(res,413,{error:'Request is too large.'});parts.push(chunk);}
        let body;try{body=JSON.parse(Buffer.concat(parts).toString());}catch{return json(res,400,{error:'Invalid JSON.'});}
        if(!body||typeof body!=='object'||Array.isArray(body))return json(res,400,{error:'Expected an object.'});
        if(route==='knowledge'){
          if(body.reset===true){store.setKnowledge(null);return json(res,200,{knowledge:null});}
          const knowledge=await ingestDocuments(body.files);store.setKnowledge(knowledge);return json(res,200,{knowledge});
        }
        if(route==='ask'){
          const start=performance.now(),id=randomUUID();
          try{const knowledge=store.knowledge(),out=await answerer(body.query,env,fetch,knowledge);store.trace({id,status:out.status,mode:out.mode,latencyMs:Number((performance.now()-start).toFixed(2)),sourceIds:out.sources.map(s=>s.id),usage:out.usage||null,policyVersion,datasetVersion:knowledge?.version||datasetVersion});return json(res,200,out);}
          catch{store.trace({id,status:'provider_error',mode:'llm',latencyMs:Number((performance.now()-start).toFixed(2)),sourceIds:[],policyVersion,datasetVersion});return json(res,502,{error:'Generation failed. Check the provider configuration or use extractive mode.'});}
        }
        if(route==='agent'){
          const start=performance.now(),id=randomUUID();
          try{const result=await runAgent(body.message,env);store.trace({id,status:result.status,mode:result.mode,latencyMs:Number((performance.now()-start).toFixed(2)),sourceIds:(result.sources||[]).map(s=>s.id),tool:result.tool,usage:result.usage||null,policyVersion,datasetVersion});return json(res,200,result);}
          catch{store.trace({id,status:'agent_error',mode:'llm-tool-calling',latencyMs:Number((performance.now()-start).toFixed(2)),sourceIds:[],policyVersion,datasetVersion});return json(res,502,{error:'Agent request failed. Use the enquiry form or check the model configuration.'});}
        }
        if(route==='plan'){if(!body.lead||typeof body.lead!=='object')return json(res,400,{error:'Lead details are required.'});return json(res,200,store.plan(body.lead,body.slot));}
        if(route==='confirm'){if(typeof body.planId!=='string')return json(res,400,{error:'A plan ID is required.'});return json(res,200,store.confirm(body.planId,body.confirmed));}
        if(route==='evals')return json(res,200,{results:runEvaluations(),datasetVersion,policyVersion});
        return json(res,404,{error:'Unknown API route.'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'});
      const path=decodeURIComponent(url.pathname),file=resolve(root,'.'+(path.endsWith('/')?path+'index.html':path));
      if(!file.startsWith(root+sep))return json(res,403,{error:'Invalid path.'});
      let content;try{content=await readFile(file);}catch{return json(res,404,{error:'File not found.'});}
      res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);
    }catch(err){json(res,400,{error:err.message||'Request rejected.'});}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const token=process.env.LAB_API_TOKEN||randomBytes(24).toString('hex'),port=Number(process.env.PORT||8787);
  const store=new Store(process.env.LAB_DB_PATH||resolve(here,'lab.sqlite'));
  const server=createLabServer({store,token});server.requestTimeout=30000;server.headersTimeout=10000;
  server.listen(port,'127.0.0.1',()=>{console.log(`AI Lab: http://127.0.0.1:${port}/ai-lab/\nLocal session token (paste in Connect local backend): ${token}\nDemo only. Do not expose this server publicly.`);});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
}
