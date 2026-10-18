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
test('homepage stays concise while showing selected work, process and no invented proof',()=>{
 const h=home();
 const ids=['home-intro','services','about-chahos','selected-work','how-we-work','contact'];
 const starts=ids.map(id=>h.indexOf('id="'+id+'"'));
 assert.ok(starts.every(i=>i>=0),'six key sections');
 assert.deepEqual(starts,[...starts].sort((a,b)=>a-b));
 assert.equal((h.match(/<section\b/g)||[]).length,6,'six homepage sections including proof and concise approach');
 assert.equal((h.match(/class="trust-item"/g)||[]).length,3,'three visible previous-project previews');
 assert.match(h,/id="pricing"/);
 assert.match(h,/Custom quote after a short project brief/);
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
 for(const href of ['#home-intro','#services','work.html','assistant/','ai-projects.html#tools','services.html#experiences','#contact','ar.html'])
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
 assert.match(a,/Choose a website, a business workflow or an AI tool based on the problem you want to solve/);
 for(const href of ['services.html','ai-projects.html'])assert.ok(a.includes('href="'+href+'"'));
 assert.match(h,/href="https:\/\/wa\.me\/96171727712"/);
 assert.match(h,/id="nav"/);
 assert.match(h,/aria-controls="nav"/);
 assert.match(h,/class="mobile-project-cta"/);
});
test('Who’s Chahos links straight to named founder, phone and Instagram details',()=>{
 const h=home();
 const guide=h.slice(h.indexOf('<nav class="quick-keys wrap"'),h.indexOf('<section id="home-intro"'));
 assert.match(guide,/<a href="#contact">Who’s Chahos<\/a>/);
 assert.match(h,/<a href="#contact">Who’s Chahos<\/a>/);
 const contact=h.slice(h.indexOf('<section id="contact"'));
 for(const content of ['Ahmad Chahal','+961 71 727 712','@chahosagency'])
  assert.ok(contact.includes(content),content);
 assert.match(h,/WHO’S CHAHOS/);
 assert.doesNotMatch(h,/Meet Chahos|MEET CHAHOS/);
});
test('the artificial serif service headline and decorative Arabic text are gone',()=>{
 const h=home();
 assert.match(h,/<span class="service-headline-second">your business forward\.<\/span>/);
 assert.doesNotMatch(h,/class="hero-benefit"|شو بتستفيد/);
 const css=read('public/premium.css');
 assert.match(css,/\.service-overview \.section-head \.service-headline-second/);
 assert.match(css,/font-style:normal/);
 assert.doesNotMatch(css,/@import|url\(\s*["']?https?:/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(h,/HubSpot|CRM_ENABLED|api\/crm-test-check/);
});
test('every AI page offers a large and keyboard-visible Back to Chahos link',()=>{
 const routes=[
 ['public/ai-projects.html','index.html','studio-return.css'],
 ['public/assistant/index.html','../index.html','../studio-return.css'],
 ['public/ai-lab/index.html','../index.html','../studio-return.css']
 ];
 for(const [file,href,css] of routes){
  const h=read(file);
  assert.match(h,/class="studio-return"/);
  assert.ok(h.includes('href="'+href+'" aria-label="Back to Chahos Agency home"'),file);
  assert.ok(h.includes('href="'+css+'"'),file);
  assert.match(h,/Back to Chahos/);
 }
 assert.doesNotMatch(read('public/ai-projects.html'),/اختار مجالك وجرّب بنفسك/);
 assert.match(read('public/assistant/index.html'),/Tell us about your business/);
 assert.match(read('public/assistant/index.html'),/value="ar-LB"/);
 assert.match(read('public/ai-lab/index.html'),/value="ar-LB"/);
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

test('premium display typography is consistent across all Chahos agency pages',()=>{
 const pages=[
 ['public/index.html','studio-typography.css'],
 ['public/services.html','studio-typography.css'],
 ['public/book-project.html','studio-typography.css'],
 ['public/ai-projects.html','studio-typography.css'],
 ['public/assistant/index.html','../studio-typography.css'],
 ['public/ai-lab/index.html','../studio-typography.css']
 ];
 for(const [page,href] of pages){
  const html=read(page);
  assert.equal(html.split('href="'+href+'"').length-1,1,page+' typography stylesheet');
  const em=(html.match(/<em>/g)||[]).length;
  assert.ok(em>0,page+' contains emphasized heading');
 }
 const css=read('public/studio-typography.css');
 assert.match(css,/font-style:normal!important/);
 assert.match(css,/font-family:var\(--chaho-type\)!important/);
 assert.doesNotMatch(css,/@import|url\(/,'no network font downloads');
 assert.match(css,/\.agency-story,\.contact,\.studio-footer/);
 const home=read('public/index.html');
 assert.match(home,/Smarter business\.<\/em>/);
 assert.match(home,/Built to work\.<\/em>/);
 assert.match(home,/next step\?<\/em>/);
});


test('real portfolio route is distinct from Start Project and honestly labels concept work',()=>{
 const h=home();
 const nav=h.slice(h.indexOf('<nav class="quick-keys wrap"'),h.indexOf('<section id="home-intro"'));
 assert.match(nav,/href="work.html">Our Work/);
 assert.doesNotMatch(nav,/href="book-project.html">Projects/);
 const work=read('public/work.html');
 for(const project of ['Motiva','Step by Step Gym','MATAR Construction','Chahos AI Lab'])assert.ok(work.includes(project),project);
 for(const id of ['motiva','step-by-step','matar','automation'])assert.ok(work.includes('id="'+id+'"'),id);
 assert.match(work,/not been verified/i);
 assert.doesNotMatch(work,/\+\d+%|guaranteed sales|verified ROI/i);
 assert.match(work,/illustrative placeholders/i);
 assert.equal((work.match(/class="trust-case"/g)||[]).length,4);
});
test('Arabic translations cover home and eight examples with hreflang and independent links',()=>{
 const ar=read('public/ar.html'), examples=read('public/services-ar.html');
 assert.match(ar,/<html lang="ar-LB" dir="rtl">/);
 assert.match(examples,/<html lang="ar-LB" dir="rtl">/);
 for(const item of ['المواقع والمتاجر الإلكترونية','أنظمة إدارة الأعمال','المساعدون الذكيون','Motiva','Step by Step','MATAR Construction'])
  assert.ok(ar.includes(item),item);
 for(const slug of ['fitness','clinic','architecture','creative','fashion','pharmacy','food','gifts'])
  assert.ok(examples.includes('href="samples/'+slug+'/"'),slug);
 assert.match(ar,/href="index.html" lang="en"/);
 assert.match(examples,/href="services.html" lang="en"/);
 assert.match(home(),/hreflang="ar"/);
 assert.match(read('public/services.html'),/hreflang="ar"/);
 const xml=read('public/sitemap.xml');
 for(const loc of ['/work.html','/ar.html','/services-ar.html'])
  assert.ok(xml.includes('chahosagency.vercel.app'+loc),loc);
});
test('Web Analytics is staged on marketing pages only; approval remains explicit',()=>{
 for(const file of ['public/index.html','public/services.html','public/work.html','public/ar.html','public/services-ar.html','public/book-project.html'])
  assert.equal(read(file).split('src="/_vercel/insights/script.js"').length-1,1,file);
 assert.doesNotMatch(read('public/assistant/index.html'),/\/_vercel\/insights\/script\.js/);
 assert.match(read('docs/trust-preview-readiness.md'),/Activation not confirmed/);
 assert.match(read('docs/trust-preview-readiness.md'),/Do not represent a concept recipient/);
});
