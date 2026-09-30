'use strict';
(()=>{
 const root=document.querySelector('.business-preview');
 if(root){
  const tabs=[...root.querySelectorAll('[role=tab]')], panels=[...root.querySelectorAll('[role=tabpanel]')],motion=root.querySelector('#preview-motion'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,paused=reduce.matches,hovered=false,focused=false;
  function show(i){current=i;tabs.forEach((t,j)=>{t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;panels[j].hidden=i!==j})}
  function label(){motion.textContent=paused?'Play animation':'Pause animation';motion.setAttribute('aria-pressed',String(paused))}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>show(i));tab.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%3;else if(e.key==='ArrowLeft')next=(i+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();show(next);tabs[next].focus()})});
  motion.addEventListener('click',()=>{paused=!paused;label()});root.addEventListener('mouseenter',()=>hovered=true);root.addEventListener('mouseleave',()=>hovered=false);root.addEventListener('focusin',()=>focused=true);root.addEventListener('focusout',e=>focused=root.contains(e.relatedTarget));reduce.addEventListener('change',()=>{paused=reduce.matches;label()});
  setInterval(()=>{if(!paused&&!hovered&&!focused&&!document.hidden)show((current+1)%3)},4500);label();
 }
 const proof=window.CHAHOS_PROOF||{};
 function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
 const projects=(proof.projects||[]).filter(p=>p.name&&p.type&&p.work&&p.result);
 const testimonials=(proof.testimonials||[]).filter(t=>t.quote&&t.name&&t.business);
 projects.forEach(p=>{const card=el('article',null,'case-card'),copy=el('div',null,'case-copy');copy.append(el('p',p.type,'eyebrow'),el('h3',p.name));const dl=el('dl');for(const [term,value] of [['What we built',p.work],['Result',p.result]])dl.append(el('dt',term),el('dd',value));copy.append(dl);if(p.url){try{const u=new URL(p.url,location.origin);if(['http:','https:'].includes(u.protocol)){const a=el('a','View project ↗','case-link');a.href=u.href;copy.append(a)}}catch{}}card.append(copy);document.querySelector('#proof-grid').append(card)});
 testimonials.forEach(t=>{const card=el('article',null,'feedback-card');card.append(el('blockquote',t.quote),el('strong',t.name),el('p',t.business));document.querySelector('#feedback-grid').append(card)});
 document.querySelector('#selected-work').hidden=!projects.length;document.querySelector('#client-feedback').hidden=!testimonials.length;
})();
