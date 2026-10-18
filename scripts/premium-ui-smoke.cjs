'use strict';
// Only local static files and sandbox demos. Never calls real CRM APIs.
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const {createReadStream,statSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..','public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  const filepath=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(filepath!==root&&!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  const stat=statSync(filepath);
  if(!stat.isFile())throw Error('not file');
  res.writeHead(200,{'Content-Type':mime[path.extname(filepath)]||'application/octet-stream'});
  createReadStream(filepath).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
const errors=[];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const base='http://127.0.0.1:'+port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  mkdirSync(path.join(__dirname,'..','artifacts'),{recursive:true});
  for(const [width,height] of [[390,844],[768,1024],[1440,900]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push('home '+width+': '+e.message));
   await page.goto(base+'/index.html',{waitUntil:'networkidle'});
   assert.equal(await page.locator('main > section').count(),6,'six compact homepage sections at '+width);
   assert.equal(await page.locator('.quick-keys a').count(),8,'quick links to separate pages');
   assert.equal(await page.locator('.service-overview .service-card').count(),4,'four clear service cards');
   assert.equal(await page.locator('#about-chahos .story-book').count(),1,'green Meet Chahos CTA');
   assert.equal(await page.locator('#contact .contact-quick-grid > div').count(),4,'contact details only at very end');
   assert.equal(await page.locator('.industry-tile').count(),0,'no eight-demo gallery on homepage');
   assert.equal(await page.locator('#selected-work .selected-work-item').count(),3,'three featured work rows');
   assert.equal(await page.locator('#process .mini-process-steps li').count(),3,'three simple steps');
   assert.equal(await page.locator('.hero-benefit').count(),0,'decorative Arabic removed');
   assert.equal(await page.locator('.quick-keys a[href="#contact"]').filter({hasText:'Who’s Chahos'}).count(),1,'Who’s Chahos targets contact');
   const typography=await page.locator('.service-headline-second').evaluate(el=>({style:getComputedStyle(el).fontStyle,family:getComputedStyle(el).fontFamily}));
   assert.equal(typography.style,'normal','headline is no longer artificial italic');
   assert.ok(!/Georgia/i.test(typography.family),'service heading uses clean sans');

   const positions=await page.evaluate(()=>['#home-intro','#services','#about-chahos','#selected-work','#process','#contact'].map(sel=>document.querySelector(sel).getBoundingClientRect().top+scrollY));
   assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),'proper homepage hierarchy');
   await page.locator('.quick-keys a[href="#contact"]').filter({hasText:'Who’s Chahos'}).click();
   assert.equal(new URL(page.url()).hash,'#contact','Who’s Chahos opens named contact details');
   assert.equal(await page.locator('#contact').getByText('Ahmad Chahal').count(),1);
   await page.locator('.quick-keys a[href="#services"]').click();
   assert.equal(new URL(page.url()).hash,'#services');
   await page.locator('#services .section-back').click();
   assert.equal(new URL(page.url()).hash,'#top');
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
   assert.ok(dimensions.scroll<=dimensions.inner+2,'horizontal overflow at '+width+': '+JSON.stringify(dimensions));
   if(width===390){
    const first=await page.locator('.quick-keys').boundingBox();
    assert.ok(first&&first.y<190,'shortcuts immediately under header');
    const labels=await page.locator('.quick-keys').locator('a').allTextContents();
    assert.ok(labels.some(v=>v.includes('AI Assistant')));
   }
   if(width<=760){
    assert.equal(await page.locator('.mobile-project-cta').isVisible(),true);
    const button=page.locator('.menu');
    assert.equal(await button.getAttribute('aria-label'),'Open navigation');
    await button.click();
    assert.equal(await button.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await button.getAttribute('aria-expanded'),'false');
   }
   if(width===390||width===1440)
    await page.screenshot({path:path.join(__dirname,'..','artifacts',width===390?'premium-mobile.png':'premium-desktop.png'),fullPage:true,animations:'disabled'});
   await page.close();
  }
  for(const route of ['/services.html','/book-project.html']){
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900}});
    page.on('pageerror',e=>errors.push(route+' '+width+': '+e.message));
    await page.goto(base+route,{waitUntil:'networkidle'});
    const h=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    assert.ok(h.scroll<=h.inner+2,route+' horizontal overflow '+width+': '+JSON.stringify(h));
    if(route==='/book-project.html'){
     assert.equal(await page.locator('#project-form').count(),1);
     assert.equal(await page.locator('#industry option[value="fitness"]').count(),1);
     assert.ok((await page.locator('#project-form').textContent()).includes('Continue to WhatsApp'));
    }else assert.equal(await page.locator('.experience-card').count(),8);
    await page.close();
   }
  }
  for(const route of ['/ai-projects.html','/assistant/','/ai-lab/']){
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844}});
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    const back=page.getByRole('link',{name:'Back to Chahos Agency home'});
    assert.equal(await back.isVisible(),true,route+' floating Back missing at '+width);
    const style=await back.evaluate(el=>({position:getComputedStyle(el).position,height:el.getBoundingClientRect().height}));
    assert.equal(style.position,'fixed');
    assert.ok(style.height>=44,'Back touch target meets 44px');
    assert.equal(await page.locator('header .back').isVisible(),true,route+' header back missing');
    await back.click();
    assert.ok(page.url().endsWith('/index.html'),route+' Back did not return to agency');
    await page.close();
   }
  }
  // Inspect rendered font metrics instead of only asserting stylesheet text.
  for(const route of ['/index.html','/services.html','/book-project.html','/ai-projects.html','/assistant/','/ai-lab/']){
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    const emphasized=await page.locator('h1 em, h2 em, h3 em').evaluateAll(nodes=>nodes.map(el=>({
     text:el.textContent.trim().slice(0,42),
     family:getComputedStyle(el).fontFamily,
     style:getComputedStyle(el).fontStyle,
     weight:getComputedStyle(el).fontWeight
    })));
    assert.ok(emphasized.length>0,'no title highlights in '+route);
    for(const e of emphasized){
     assert.equal(e.style,'normal','decorative italic survived on '+route+' at '+width+': '+e.text);
     assert.doesNotMatch(e.family,/Georgia|Times New Roman|(?:^|,\\s*)serif\\s*$/i,'serif survived on '+route+' at '+width+': '+e.text);
    }
    if(route==='/index.html'){
     const second=await page.locator('.service-headline-second').evaluate(el=>({
      family:getComputedStyle(el).fontFamily,style:getComputedStyle(el).fontStyle
     }));
     assert.equal(second.style,'normal');
     assert.doesNotMatch(second.family,/Georgia|Times New Roman/);
    }
    await page.close();
   }
  }

  for(const route of ['/work.html','/ar/','/ar/services.html']){
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844}});
    page.on('pageerror',err=>errors.push(route+' '+width+': '+err.message));
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
    assert.ok(dims.scroll<=dims.inner+2,route+' overflow: '+JSON.stringify(dims));
    if(route==='/work.html'){
     assert.equal(await page.locator('.work-case').count(),4,'four honest work case studies');
     assert.equal(await page.locator('a[href="ai-lab/#sales"]').count(),1);
    }else{
     assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
     const dir=await page.evaluate(()=>getComputedStyle(document.body).direction);
     assert.equal(dir,'rtl',route+' must have RTL text flow');
     if(route==='/ar/services.html')assert.equal(await page.locator('.ar-gallery a').count(),8);
    }
    await page.close();
   }
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto(base+'/index.html',{waitUntil:'networkidle'});
  const behavior=await reduced.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior);
  assert.equal(behavior,'auto');
  await reduced.close();
  assert.deepEqual(errors,[]);
  console.log('Premium UI browser smoke PASS: four-section home, direct links, services/booking, mobile menu, keyboard, reduced motion.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>new Promise(resolve=>server.close(resolve)));
