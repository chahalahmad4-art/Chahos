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
   assert.equal(await page.locator('.pathway').count(),3,'three homepage paths at '+width);
   assert.equal(await page.locator('.preview-tabs [role=tab]').count(),3,'three preview tabs');
   await page.locator('#preview-tab-1').click();
   assert.equal(await page.locator('#preview-motion').textContent(),'Play animation','manual selection pauses rotation');
   assert.equal(await page.locator('#preview-tab-1').getAttribute('aria-selected'),'true');
   const h=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
   assert.ok(h.scroll<=h.inner+2,'homepage horizontal overflow '+width+': '+JSON.stringify(h));
   if(width<=760){
    assert.equal(await page.locator('.mobile-project-cta').isVisible(),true);
    const button=page.getByRole('button',{name:'Open navigation'});
    await button.click();
    assert.equal(await button.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await button.getAttribute('aria-expanded'),'false');
   }
   if(width===390||width===1440)await page.screenshot({path:path.join(__dirname,'..','artifacts',width===390?'premium-mobile.png':'premium-desktop.png'),fullPage:true,animations:'disabled'});
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
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto(base+'/index.html',{waitUntil:'networkidle'});
  assert.equal(await reduced.locator('#preview-motion').textContent(),'Play animation');
  await reduced.close();
  assert.deepEqual(errors,[]);
  console.log('Premium UI browser smoke PASS: 3 home sizes, services, booking, keyboard, reduced motion, tabs; screenshots saved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>new Promise(resolve=>server.close(resolve)));
