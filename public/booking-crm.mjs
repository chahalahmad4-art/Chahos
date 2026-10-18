import {reviewedLead,submitEnquiry} from './enquiry-client.mjs';
const $=s=>document.querySelector(s),status=$('#crm-feedback'),approval=$('#crm-approval'),send=$('#crm-send'),permission=$('#crm-permission');
let enabled=false,pending=null,locked=false;
const receiptKey='chahos-enquiry-receipt-v1';
// Retain only the opaque reference and delivery state, never contact fields or chat.
function receipt(value){try{sessionStorage.setItem(receiptKey,JSON.stringify(value));}catch{}}
try{const saved=JSON.parse(sessionStorage.getItem(receiptKey)||'null');if(saved&&/^[a-f0-9-]{36}$/i.test(saved.reference)){locked=true;status.textContent=(saved.state==='received'?'An enquiry was received.':'A previous delivery may still be processing. Contact Ahmad before sending again.')+' Reference: '+saved.reference;}}catch{}
try{const response=await fetch('/api/agency',{signal:AbortSignal.timeout(7000)});if(response.ok)enabled=(await response.json()).crm===true;}catch{}
if(!locked)status.textContent=enabled?'CRM available. Nothing is sent until you review, consent and confirm.':'CRM is not active. You can review your details or use the manual WhatsApp option above.';
$('#crm-review').disabled=locked;
function invalidate(){if(locked)return;pending=null;approval.hidden=true;permission.checked=false;send.disabled=true;}
$('#project-form').addEventListener('input',invalidate);
$('#project-form').addEventListener('change',invalidate);
$('#crm-edit').onclick=()=>{invalidate();$('#details').focus();};
permission.onchange=()=>{send.disabled=!enabled||!pending||!permission.checked||locked;};
$('#crm-review').onclick=()=>{
 if(locked)return;
 try{pending=reviewedLead({name:$('#full-name').value,email:$('#email').value,service:$('#service').value,brief:$('#details').value},crypto.randomUUID());}
 catch(error){status.textContent=error.message;return;}
 permission.checked=false;send.disabled=true;
 $('#crm-summary').textContent=`Name: ${pending.name}\nEmail: ${pending.email}\nService: ${pending.service}\n\n${pending.brief}\n\nReference: ${pending.requestId}`;
 approval.hidden=false;approval.scrollIntoView({behavior:'smooth',block:'nearest'});
};
send.onclick=async()=>{
 if(!pending||!enabled||!permission.checked||locked)return;
 locked=true;send.disabled=true;permission.disabled=true;$('#crm-edit').disabled=true;$('#crm-review').disabled=true;
 const lead={...pending,consent:true,confirmed:true};receipt({reference:lead.requestId,state:'pending'});
 status.textContent='Sending your reviewed enquiry…';
 try{const out=await submitEnquiry(lead);receipt({reference:out.reference,state:'received'});status.textContent='Enquiry received. Reference: '+out.reference+'. No appointment has been booked and no WhatsApp message was sent.';send.textContent='Enquiry received';}
 catch(error){status.textContent=error.message+' Reference: '+lead.requestId+'. Contact Ahmad before resubmitting.';send.textContent='Verify delivery with Ahmad';}
};
