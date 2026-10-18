import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedLead,submitEnquiry} from '../../../public/enquiry-client.mjs';
const lead={name:'Fictional Person',email:'fiction@example.com',service:'Website or online store',brief:'A fictional business website',requestId:'12345678-1234-1234-1234-123456789012'};
test('review trims details and omits unconsented extra fields',()=>{const result=reviewedLead({...lead,name:'  Fictional Person ',phone:'private',chat:'private'},lead.requestId);assert.equal(result.name,lead.name);assert.equal(result.phone,undefined);assert.equal(result.chat,undefined);});
test('invalid reviewed data is rejected',()=>{assert.throws(()=>reviewedLead({...lead,email:'bad'},lead.requestId));assert.throws(()=>reviewedLead({...lead,brief:''},lead.requestId));});
test('successful HTTP without matching receipt is not success',async()=>{for(const data of [{},{status:'received',reference:'wrong'},{status:'pending',reference:lead.requestId}])await assert.rejects(submitEnquiry(lead,async()=>({ok:true,json:async()=>data})));});
test('valid receipt and server failures are distinguished',async()=>{assert.equal((await submitEnquiry(lead,async()=>({ok:true,json:async()=>({status:'received',reference:lead.requestId})}))).reference,lead.requestId);await assert.rejects(submitEnquiry(lead,async()=>({ok:false,json:async()=>({error:'Delivery unverified'})})),/Delivery unverified/);});
