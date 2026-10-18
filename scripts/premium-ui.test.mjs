import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const read=(p)=>readFileSync(path.join(process.cwd(),p),'utf8');
const home=()=>read('public/index.html');
test('premium styling remains Preview-only on the homepage, gallery and booking',()=>{
 for(const p of ['public/index.html','public/services.html','public/book-project.html']){
  const h=read(p);
  assert.equal(h.split('href="premium.css"').length-1,1);
 }
 for(const p of ['public/assistant/index.html','public/ai-lab/index.html','public/ai-projects.html'])
  assert.doesNotMatch(read(p),/href="premium.css"/);
});
test('short homepage ends immediately after the dark agency and final contact',()=>{
 const h=home();
 const starts=['home-intro','services','about-chahos','contact'].map(id=>h.indexOf('id="'+id+'"'));
 assert.ok(starts.every(i=>i>=0));
 assert.deepEqual(starts,[...starts].sort((a,b)=>a-b));
 assert.equal((h.match(/<section\b/g)||[]).length,4,'exactly four public homepage sections');
 assert.doesNotMatch(h,/id="explore"|id="how-we-work"|id="solution-preview"/);
 assert.doesNotMatch(h,/class="industry-tile|class="industry-showcase"|class="process-grid"/);
 assert.match(h,/Creative ideas\.<br><em>Smarter business\.<\/em>/);
 assert.match(h,/Designed with purpose\.<br><em>Built to work\.<\/em>/);
 assert.match(h,/Ready for the<br><em>next step\?<\/em>/);
 assert.equal((h.match(/<footer\b/g)||[]).length,1);
});
test('top shortcuts lead straight to independently served projects, assistant, automation, examples',()=>{
 const h=home();
 const start=h.indexOf('<nav class="quick-keys wrap"');
 const end=h.indexOf('<section id="home-intro"',start);
 assert.ok(start>0&&end>start);
 const nav=h.slice(start,end);
 for(const href of ['#home-intro','#services','book-project.html','assistant/','ai-projects.html#tools','services.html#experiences','#about-chahos','#contact'])
  assert.ok(nav.includes('href="'+href+'"'),'missing shortcut '+href);
 for(const p of ['public/book-project.html','public/assistant/index.html','public/ai-projects.html','public/services.html'])
  assert.ok(existsSync(p),p);
 assert.match(read('public/ai-projects.html'),/id="tools"/);
 assert.match(read('public/services.html'),/id="experiences"/);
 assert.match(h,/class="return-button" href="#top"/);
});
test('service cards remain clear, benefit-focused and accessible; all paths are active',()=>{
 const h=home();
 const a=h.slice(h.indexOf('<section id="services"'),h.indexOf('<section id="about-chahos"'));
 assert.equal((a.match(/class="service-card service-card--link/g)||[]).length,4);
 assert.match(a,/Four ways we help you attract customers, save time and work smarter/);
 for(const href of ['services.html','ai-projects.html'])assert.ok(a.includes('href="'+href+'"'));
 assert.match(h,/href="https:\/\/wa\.me\/96171727712"/);
 assert.match(h,/id="nav"/);
 assert.match(h,/aria-controls="nav"/);
 assert.match(h,/class="mobile-project-cta"/);
});
test('Arabic benefits are natural, isolated RTL text, and no live CRM config added',()=>{
 const h=home();
 assert.match(h,/<p class="hero-benefit" lang="ar" dir="rtl">شو بتستفيد؟/);
 const css=read('public/premium.css');
 assert.match(css,/\.hero-benefit\[dir=rtl\]/);
 assert.doesNotMatch(css,/@import|url\(\s*["']?https?:/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(h,/HubSpot|CRM_ENABLED|api\/crm-test-check/);
});
test('hero, Meet Agency and contact stay recognizably like approved version',()=>{
 const h=home();
 for(const val of ['CHAHOS AGENCY · DIGITAL STUDIO · LEBANON','Designed with purpose.','Built to work.','Ready for the','Ahmad Chahal','+961 71 727 712','@chahosagency'])
  assert.ok(h.includes(val),val);
 assert.match(h,/class="hero-monogram"/);
 assert.match(h,/class="service-card service-card--link service-card--ai"/);
 assert.match(h,/class="contact-quick-grid"/);
});
test('manual booking and WhatsApp logic are untouched',()=>{
 const h=read('public/book-project.html');
 assert.match(h,/id="project-form"/);
 assert.match(h,/Continue to WhatsApp/);
 assert.match(h,/Tap <strong>Send<\/strong> there/);
 assert.match(h,/id="whatsapp-fallback"/);
 assert.match(h,/href="https:\/\/wa\.me\/96171727712"/);
});
