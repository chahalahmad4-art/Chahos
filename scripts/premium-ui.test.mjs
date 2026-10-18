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
test('editorial pathways have exactly three functional links and no fabricated social proof',()=>{
 const html=read('public/index.html');
 const region=html.split('<section class="pathways wrap"')[1]?.split('</section>')[0];
 assert.ok(region,'missing pathways');
 assert.equal((region.match(/class="pathway(?: pathway--highlight)?"/g)||[]).length,3);
 for(const href of ['services.html','ai-projects.html','book-project.html'])assert.ok(region.includes('href="'+href+'"'));
 assert.match(region,/aria-labelledby="pathways-title"/);
 assert.doesNotMatch(region,/(100\+|five stars|guaranteed results|trusted by thousands)/i);
});
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
