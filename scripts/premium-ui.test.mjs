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
test('top-level site guide exposes all six routes without scrolling to the end',()=>{
 const html=read('public/index.html');
 const begin=html.indexOf('<section id="site-guide"');
 const hero=html.indexOf('<section class="hero hero-clear hero-connected');
 assert.ok(begin>0&&begin<hero,'guide must appear before hero');
 const region=html.slice(begin,hero);
 assert.match(region,/aria-labelledby="site-guide-title"/);
 assert.match(region,/aria-label="Explore the website"/);
 assert.equal((region.match(/class="site-guide-link(?: site-guide-link--action)?"/g)||[]).length,6);
 for(const href of ['#services','services.html','#case-studies','ai-projects.html','#how-we-work','book-project.html'])
  assert.ok(region.includes('href="'+href+'"'),'missing site route '+href);
 for(const anchor of ['services','case-studies','how-we-work'])
  assert.ok(html.includes('id="'+anchor+'"'),'missing anchor '+anchor);
 assert.match(html,/class="return-button" href="#site-guide"/);
 assert.doesNotMatch(html,/class="pathways wrap"/);
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
