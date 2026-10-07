import test from 'node:test';
import assert from 'node:assert/strict';
import {industries,getIndustry} from '../../../public/ai-lab/industries.mjs';
import {answerQuestion,validateLead,availableSlots} from '../../../public/ai-lab/core.mjs';
import {runAgent,executeTool} from '../agent.mjs';
import {Store} from '../store.mjs';
for(const i of industries)test(i.id+' keeps retrieval and agent within selected business',async()=>{
 const answer=answerQuestion(i.question,i.documents,i.version);assert.equal(answer.status,'answered');assert.ok(answer.sources.every(s=>i.documents.some(d=>d.id===s.id)));assert.equal(answer.language,'ar-LB');
 const agent=await runAgent('bade talab '+i.services[0],{},undefined,'arabizi',i.id);assert.equal(agent.interest,i.services[0]);assert.equal(agent.tool,'prepare_trial');
 assert.equal(validateLead({industry:i.id,name:'Demo',email:'test@example.com',interest:i.services[0],consent:true}).industry,i.id);
 if(i.id!=='fitness')assert.throws(()=>executeTool('prepare_trial',{interest:'Boxing'},'en',i.id));
});
test('unknown industries are rejected',()=>assert.throws(()=>getIndustry('not-real')));
test('same callback time can be used by different industries; duplicates remain blocked',()=>{
 const s=new Store(),slot=availableSlots()[0],lead={name:'Demo',email:'test@example.com',consent:true};try{
 for(const id of ['fitness','food']){const i=getIndustry(id),l={...lead,industry:id,interest:i.services[0]},p=s.plan(l,slot);s.confirm(p.id,true);assert.throws(()=>s.plan(l,slot));}
 assert.equal(s.records().length,2);
 }finally{s.close();}
});
