import {getIndustry} from './industries.mjs';
import {documents, datasetVersion} from './knowledge.mjs';
import {canonicalToken,replyLanguage,localNotice} from './lebanese.mjs';
export {documents, datasetVersion};
export const policyVersion = 'policy-v1';
const stop = new Set('the a an is are what how much do does can i you your me my for of and in to it please tell about عند شو كم هل ما هي هو l el la lal bel bl b bade badi baddi shu shou fini fik 3ande 3andkon'.split(' '));
export function tokens(s) { return String(s).normalize('NFKC').toLowerCase().replace(/[أإآ]/g,'ا').replace(/[\u064B-\u065F]/g,'').match(/[\p{L}\p{N}]+/gu)?.filter(x=>!stop.has(x)).map(canonicalToken) || []; }
export function checkInput(value) {
  if(typeof value !== 'string' || !value.trim()) return {ok:false, reason:'empty', message:'Enter a question first.'};
  if(value.length > 1500) return {ok:false, reason:'too_long', message:'Please keep your question under 1,500 characters.'};
  const s=value.normalize('NFKC');
  if(/(?:ignore|disregard|override).{0,40}(?:instructions|rules|previous|system)|(?:reveal|print|show|expose).{0,35}(?:system prompt|api.?key|secret|password)|تجاهل.{0,30}(?:التعليمات|القواعد)|اكشف.{0,20}(?:المفتاح|كلمة السر)|ensa.{0,30}(?:ta3limet|rules|instructions)/i.test(s)) return {ok:false, reason:'injection', message:'I can help with business information, but cannot change my rules or reveal secrets.'};
  if(/(?:list|export|show|give|dump).{0,35}(?:all|other).{0,20}(?:customers|leads|phones|emails)|(?:ارقام|أرقام|بيانات).{0,20}(?:العملاء|الزبائن)|(?:3tine|aatine|a3tine).{0,30}(?:ar2am|emails|data).{0,30}(?:zbayen|customers)/i.test(s)) return {ok:false, reason:'privacy', message:'Customer records are private. This assistant cannot list other people’s data.'};
  if(/(?:diagnos|prescrib|steroid|chest pain|insulin|medical advice|ألم الصدر|دواء|منشطات)/i.test(s)) return {ok:false, reason:'handoff', message:'Please contact an appropriate healthcare professional. I can only explain business services.'};
  return {ok:true};
}
// BM25 lexical retrieval. Scores are relevance scores, NOT confidence probabilities.
export function retrieve(query, corpus=documents, limit=3) {
  const q=[...new Set(tokens(query))], chunks=corpus.map(d=>({...d, terms:tokens(d.text+' '+(d.keywords||[]).join(' '))}));
  const avg=chunks.reduce((n,c)=>n+c.terms.length,0)/Math.max(1,chunks.length);
  return chunks.map(c=>{
    let score=0;
    for(const t of q){const tf=c.terms.filter(w=>w===t).length;if(!tf)continue;
      const df=chunks.filter(d=>d.terms.includes(t)).length;
      score+=Math.log(1+(chunks.length-df+.5)/(df+.5))*tf*2.2/(tf+1.2*(.25+.75*c.terms.length/avg));
    }
    return {id:c.id,title:c.title,text:c.text,replies:c.replies,score:Number(score.toFixed(3)),updated:c.updated};
  }).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function answerQuestion(query, corpus=documents, version=datasetVersion, requestedLanguage='auto') {
  const language=replyLanguage(query,requestedLanguage);
  const policy=checkInput(query);
  if(!policy.ok) return {answer:localNotice(policy.reason,language,policy.message),language,status:policy.reason,sources:[],mode:'extractive',policyVersion,datasetVersion:version};
  const sources=retrieve(query,corpus);
  if(!sources.length) return {answer:localNotice('abstained',language,'I do not have a source for that. Please ask a member of staff.'),language,status:'abstained',sources:[],mode:'extractive',policyVersion,datasetVersion:version};
  // Exact evidence display avoids presenting a lexical retriever as an LLM.
  return {answer:sources[0].replies?.[language]||sources[0].text,language,status:'answered',sources,mode:sources[0].replies?.[language]?'curated-translation':'extractive',policyVersion,datasetVersion:version};
}
export function validateLead(input) {
  const name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase();
  const interest=String(input.interest||'');
  if(name.length<2||name.length>80)throw new Error('Enter a name between 2 and 80 characters.');
  if(email.length>160||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Enter a valid email address.');
  const industry=getIndustry(input.industry||'fitness');
  if(!industry.services.includes(interest))throw new Error('Choose an available service.');
  if(input.consent!==true)throw new Error('Permission to store this enquiry is required.');
  return {name,email,interest,industry:industry.id,consent:true,followUp:input.followUp===true};
}
export function qualifyLead(input) {const lead=validateLead(input);return {...lead,stage:'qualified',reason:'Service selected and contact details supplied.',nextAction:'Choose a trial slot and confirm.'};}
export function availableSlots(now=new Date()) {
  // Fixed UTC offsets are intentionally avoided; UI formats each ISO instant in Asia/Beirut.
  return [1,2,3].map(d=>{const date=new Date(now);date.setUTCDate(date.getUTCDate()+d);date.setUTCHours(12,0,0,0);return date.toISOString();});
}
export function bookingPlan(lead,slot,slots) {
  const safe=validateLead(lead);
  if(!slots.includes(slot))throw new Error('That slot is not available. Refresh and choose another.');
  return {lead:safe,slot,status:'awaiting_confirmation',actions:['Save lead in demo CRM','Reserve one demo appointment',safe.followUp?'Queue a follow-up draft for review':'Do not queue a follow-up']};
}
export function redact(text) {return String(text).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/\+?\d[\d ()-]{7,}\d/g,'[phone]');}
export function summarize(traces) {
  const a=traces.map(t=>t.latencyMs).sort((x,y)=>x-y);
  return {runs:traces.length,answered:traces.filter(t=>t.status==='answered').length,blocked:traces.filter(t=>['injection','privacy','handoff'].includes(t.status)).length,abstained:traces.filter(t=>t.status==='abstained').length,p95Ms:a.length?a[Math.ceil(a.length*.95)-1]:0};
}
