// A receipt is accepted only when the server confirms the exact reviewed reference.
export async function submitEnquiry(lead,fetcher=fetch){
 const response=await fetcher('/api/agency',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'enquiry',...lead}),signal:AbortSignal.timeout(40000)});
 let out;try{out=await response.json();}catch{throw new Error('Delivery could not be verified. Contact Ahmad with your reference before trying again.');}
 if(!response.ok)throw new Error(out.error||'Delivery could not be verified.');
 if(out.status!=='received'||out.reference!==lead.requestId)throw new Error('Delivery could not be verified. Keep your reference and contact Ahmad.');
 return out;
}
export function reviewedLead(values,requestId){
 const name=String(values.name||'').trim(),email=String(values.email||'').trim().toLowerCase(),service=String(values.service||''),brief=String(values.brief||'').trim();
 if(name.length<2||name.length>80)throw new Error('Enter a name between 2 and 80 characters.');
 if(email.length>160||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
 if(!service||brief.length<10||brief.length>1800)throw new Error('Choose a service and enter a brief between 10 and 1,800 characters.');
 return {name,email,service,brief,requestId};
}
