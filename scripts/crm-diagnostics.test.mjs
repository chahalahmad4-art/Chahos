import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/crm-test-check.mjs';

const setup={
 VERCEL_ENV:'preview',
 VERCEL_GIT_COMMIT_REF:'feat/reviewed-crm-enquiries',
 ASSISTANT_CRM_ENABLED:'false',
 HUBSPOT_EXPECTED_TEST_PORTAL_ID:'149580868',
 HUBSPOT_PRIVATE_APP_TOKEN:'fake-test-token',
 HUBSPOT_ENQUIRY_PIPELINE_ID:'default',
 HUBSPOT_ENQUIRY_STAGE_ID:'6244753599',
 UPSTASH_REDIS_REST_URL:'https://example.test',
 UPSTASH_REDIS_REST_TOKEN:'fake-redis-token'
};
async function probe(overrides={},onFetch=()=>{throw new Error('unexpected network request')}){
 const keys=Object.keys(setup);
 const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 const orig=globalThis.fetch;
 try{
  for(const key of keys)process.env[key]=String(overrides[key]??setup[key]);
  globalThis.fetch=onFetch;
  let output,code;
  await handler({method:'GET'},{setHeader(){},set statusCode(v){code=v;},end(v){output=JSON.parse(v);}});
  return {code,output};
 }finally{
  globalThis.fetch=orig;
  for(const [k,v]of Object.entries(prior))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
}
const response=(value,status=200)=>({ok:status===200,status,json:async()=>value});
test('diagnostic refuses production and enabled CRM before network I/O',async()=>{
 const one=await probe({VERCEL_ENV:'production'});
 assert.equal(one.code,404);
 const two=await probe({ASSISTANT_CRM_ENABLED:'true'});
 assert.equal(two.code,404);
});
test('diagnostic refuses non-test HubSpot portal without any pipeline or Redis call',async()=>{
 let calls=0;
 const r=await probe({},async url=>{calls++;assert.match(url,/integrations\/v1\/me/);return response({portalId:149509587});});
 assert.equal(r.code,409);assert.equal(r.output.testAccount,false);assert.equal(calls,1);
});
test('diagnostic confirms test account, valid open stage and Redis PING with no CRM writes',async()=>{
 let calls=0;
 const r=await probe({},async(url,options)=>{
  calls++;
  if(url.includes('/integrations/v1/me')){assert.equal(options?.method,undefined);return response({portalId:149580868});}
  if(url.includes('/crm/v3/pipelines/deals/default')){assert.equal(options?.method,undefined);return response({stages:[{id:'6244753599',label:'New Lead',archived:false,metadata:{isClosed:'false'}}]});}
  assert.equal(url,'https://example.test');
  assert.equal(options?.method,'POST');
  assert.deepEqual(JSON.parse(options.body),['PING']);
  return response({result:'PONG'});
 });
 assert.equal(r.code,200);assert.equal(r.output.status,'ready_for_fictional_crm_test');assert.equal(r.output.writesEnabled,false);assert.equal(calls,3);
});
test('diagnostic rejects closed stage and reports safe status only',async()=>{
 const r=await probe({},async(url)=>{
  if(url.includes('/integrations/v1/me'))return response({portalId:149580868});
  if(url.includes('/crm/v3/pipelines/'))return response({stages:[{id:'6244753599',label:'New Lead',metadata:{isClosed:'true'}}]});
  return response({result:'PONG'});
 });
 assert.equal(r.code,424);assert.equal(r.output.newLeadOpen,false);
 assert.equal(JSON.stringify(r.output).includes('fake-test-token'),false);
});
