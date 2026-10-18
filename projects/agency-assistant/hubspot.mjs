const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function saveEnquiry(lead,env,fetcher=fetch){
 async function call(path,body){const r=await fetcher('https://api.hubapi.com'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+env.HUBSPOT_PRIVATE_APP_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(9000)});return {ok:r.ok,status:r.status,data:await r.json()};}
 const dealMode=env.HUBSPOT_ENQUIRY_MODE==='deal';
 if(dealMode){
  if(!env.HUBSPOT_ENQUIRY_PIPELINE_ID||!env.HUBSPOT_ENQUIRY_STAGE_ID)throw new Error('CRM_PIPELINE_NOT_CONFIGURED');
  const pipeline=await call('/crm/v3/pipelines/deals/'+encodeURIComponent(env.HUBSPOT_ENQUIRY_PIPELINE_ID));
  const stage=pipeline.data?.stages?.find(s=>s.id===env.HUBSPOT_ENQUIRY_STAGE_ID);
  if(!pipeline.ok||!stage||String(stage.metadata?.isClosed)==='true')throw new Error('CRM_PIPELINE_UNAVAILABLE');
 }
 const read=()=>call('/crm/v3/objects/contacts/batch/read',{idProperty:'email',properties:['email'],inputs:[{id:lead.email}]});
 let lookup=await read();if(!lookup.ok)throw new Error('CRM_UNAVAILABLE');
 let contactId=lookup.data.results?.[0]?.id;
 if(!contactId){const created=await call('/crm/v3/objects/contacts',{properties:{email:lead.email,firstname:lead.name}});if(created.ok)contactId=created.data.id;else if(created.status===409){lookup=await read();if(lookup.ok)contactId=lookup.data.results?.[0]?.id;}if(!contactId)throw new Error('CRM_UNAVAILABLE');}
 if(dealMode){
  const timestamp=new Date().toISOString();
  const deal=await call('/crm/v3/objects/deals',{properties:{dealname:`Website enquiry · ${lead.requestId}`,pipeline:env.HUBSPOT_ENQUIRY_PIPELINE_ID,dealstage:env.HUBSPOT_ENQUIRY_STAGE_ID,description:`Website enquiry (unverified sender)\nReference: ${lead.requestId}\nSubmitted: ${timestamp}\nName supplied: ${lead.name}\nEmail supplied: ${lead.email}\nService: ${lead.service}\nBrief: ${lead.brief}\nExplicit contact/storage consent: yes. Not marketing consent. Policy: assistant-privacy-v1.`},associations:[{to:{id:String(contactId)},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:3}]}]});
  if(!deal.ok||!deal.data.id)throw new Error('CRM_UNAVAILABLE');
  return {status:'received',reference:lead.requestId};
 }
 // Existing contact properties are never overwritten by an unauthenticated enquiry.
 const note=await call('/crm/v3/objects/notes',{properties:{hs_timestamp:new Date().toISOString(),hs_note_body:escapeHTML(`Website enquiry (unverified sender)\nReference: ${lead.requestId}\nName supplied: ${lead.name}\nService: ${lead.service}\nBrief: ${lead.brief}\nExplicit contact/storage consent: yes. Not marketing consent. Policy: assistant-privacy-v1.`).replaceAll('\n','<br>')},associations:[{to:{id:String(contactId)},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:202}]}]});
 if(!note.ok||!note.data.id)throw new Error('CRM_UNAVAILABLE');
 // Do not return HubSpot IDs or contact properties to the public visitor.
 return {status:'received',reference:lead.requestId};
}
