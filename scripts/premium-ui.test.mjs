import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const read=(f)=>readFileSync(path.join(process.cwd(),f),'utf8');

test('the premium layer loads only on homepage, services and booking',()=>{
 for(const p of ['public/index.html','public/services.html','public/book-project.html']){
  const html=read(p);
  const link='<link rel="stylesheet" href="premium.css">';
  assert.equal(html.split(link).length-1,1,p);
  assert.ok(html.indexOf(link)>html.indexOf('href="navigation.css"'),p);
 }
 for(const p of ['public/assistant/index.html','public/ai-lab/index.html','public/ai-projects.html']){
  assert.doesNotMatch(read(p),/premium\.css/,p);
 }
});
test('homepage retains unique accessible navigation, AI and primary actions',()=>{
 const home=read('public/index.html');
 for(const href of ['services.html','ai-projects.html','book-project.html','https://wa.me/96171727712']){
  assert.ok(home.includes('href="'+href+'"'),href);
 }
 assert.match(home,/<nav aria-label="Main navigation"/);
 assert.match(home,/<button class="menu" aria-label="Open navigation"/);
 assert.match(home,/class="mobile-project-cta"/);
 assert.match(home,/id="preview-tab-0"/);
 assert.match(home,/id="preview-tab-1"/);
 assert.match(home,/id="preview-tab-2"/);
 assert.match(home,/id="selected-work"[^>]*hidden/);
 assert.match(home,/id="client-feedback"[^>]*hidden/);
});
test('homepage prioritizes introduction, services, agency CTA, discovery, and contact',()=>{
 const html=read('public/index.html');
 const ids=['home-intro','services','about-chahos','explore','how-we-work','contact'];
 const indexes=ids.map(id=>html.indexOf('id="'+id+'"'));
 assert.ok(indexes.every(i=>i>=0),'every section has a jump target');
 assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b),'critical content appears first');
 const introduction=html.slice(indexes[0],indexes[1]);
 assert.match(introduction,/We’re Chahos Agency/);
 assert.match(introduction,/Start your project/);
 const service=html.slice(indexes[1],indexes[2]);
 assert.equal((service.match(/class="service-card service-card--link/g)||[]).length,4);
 const about=html.slice(indexes[2],indexes[3]);
 assert.match(about,/MEET CHAHOS AGENCY/);
 assert.match(about,/class="story-book" href="book-project.html"/);
 const explore=html.slice(indexes[3],indexes[4]);
 assert.equal((explore.match(/class="industry-tile industry-tile--/g)||[]).length,8);
 assert.match(explore,/class="solution-preview"/);
 assert.match(explore,/details id="solution-preview"/);
 assert.match(html,/id="proof-grid"/);
 assert.match(html,/id="feedback-grid"/);
 assert.equal((html.match(/class="section-back(?: section-back--light)?"/g)||[]).length,5);
 const contact=html.slice(indexes[5]);
 for(const value of ['Ahmad Chahal','+961 71 727 712','@chahosagency'])assert.ok(contact.includes(value));
 assert.doesNotMatch(html,/id="site-guide"/);
});
test('top keyword navigation gives direct access without duplicating a giant guide',()=>{
 const html=read('public/index.html');
 const begin=html.indexOf('<nav class="quick-keys wrap"');
 const hero=html.indexOf('id="home-intro"');
 assert.ok(begin>0&&begin<hero);
 const keys=html.slice(begin,hero);
 assert.match(keys,/aria-label="Quick navigation"/);
 for(const href of ['#home-intro','#services','#about-chahos','#explore','ai-projects.html','#how-we-work','#contact','book-project.html'])
  assert.ok(keys.includes('href="'+href+'"'),href);
 assert.match(html,/class="return-button" href="#top"/);
});
test('every industry image links to a real existing demo and remains labelled illustrative',()=>{
 const {existsSync}=requireLikeFs();
 const html=read('public/index.html');
 const explore=html.slice(html.indexOf('id="explore"'),html.indexOf('id="how-we-work"'));
 for(const key of ['fitness','clinic','architecture','creative','fashion','pharmacy','food','gifts']){
  assert.ok(explore.includes('href="samples/'+key+'/"'),'missing '+key);
  assert.ok(existsSync('public/samples/'+key+'/index.html'),'demo files for '+key);
 }
 assert.match(explore,/Demos only — not client projects/);
});
function requireLikeFs(){return {existsSync:(path)=>{try{return !!read(path)}catch{return false}}};}
test('no new remote assets or tracking, and reduced motion is honored',()=>{
 const css=read('public/premium.css');
 assert.doesNotMatch(css,/@import|url\(\s*["']?https?:/i);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(css,/@media\s*\(max-width:760px\)/);
 assert.match(css,/\.business-preview/);
 const js=read('public/upgrade.js');
 assert.match(js,/prefers-reduced-motion/);
 assert.match(js,/paused=true;label\(\)/);
});
test('booking handoff still requires manual WhatsApp confirmation',()=>{
 const html=read('public/book-project.html');
 assert.match(html,/id="project-form"/);
 assert.match(html,/Continue to WhatsApp/);
 assert.match(html,/Tap <strong>Send<\/strong> there/);
 assert.match(html,/id="whatsapp-fallback"/);
 assert.match(html,/href="https:\/\/wa\.me\/96171727712"/);
});
