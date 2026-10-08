const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function saveEnquiry(lead,env,fetcher=fetch){
 async function call(path,body){const r=await fetcher('https://api.hubapi.com'+path,{method:'POST',headers:{Authorization:'Bearer '+env.HUBSPOT_PRIVATE_APP_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(9000)});return {ok:r.ok,status:r.status,data:await r.json()};}
 const read=()=>call('/crm/v3/objects/contacts/batch/read',{idProperty:'email',properties:['email'],inputs:[{id:lead.email}]});
 let lookup=await read();if(!lookup.ok)throw new Error('CRM_UNAVAILABLE');
 let contactId=lookup.data.results?.[0]?.id;
 if(!contactId){const created=await call('/crm/v3/objects/contacts',{properties:{email:lead.email,firstname:lead.name}});if(created.ok)contactId=created.data.id;else if(created.status===409){lookup=await read();if(lookup.ok)contactId=lookup.data.results?.[0]?.id;}if(!contactId)throw new Error('CRM_UNAVAILABLE');}
 // Existing contact properties are never overwritten by an unauthenticated enquiry.
 const note=await call('/crm/v3/objects/notes',{properties:{hs_timestamp:new Date().toISOString(),hs_note_body:escapeHTML(`Website enquiry (unverified sender)\nReference: ${lead.requestId}\nName supplied: ${lead.name}\nService: ${lead.service}\nBrief: ${lead.brief}\nExplicit contact/storage consent: yes. Not marketing consent. Policy: assistant-privacy-v1.`).replaceAll('\n','<br>')},associations:[{to:{id:String(contactId)},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:202}]}]});
 if(!note.ok||!note.data.id)throw new Error('CRM_UNAVAILABLE');
 // Do not return HubSpot IDs or contact properties to the public visitor.
 return {status:'received',reference:lead.requestId};
}
