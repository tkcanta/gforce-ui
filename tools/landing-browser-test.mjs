import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import { generateLanding, landingContract } from './generate-landing.mjs';

const root=resolve('.'), output=resolve('test-results/landing');
await mkdir(output,{recursive:true});
let caseHTML='',caseImage;
const server=createServer(async(request,response)=>{
  try {
    const pathname=new URL(request.url,'http://localhost').pathname;
    if (pathname === '/__case.html') { response.setHeader('Content-Type','text/html; charset=utf-8'); response.end(caseHTML); return; }
    if (pathname === '/assets/__test.png' && caseImage) { response.setHeader('Content-Type','image/png'); response.end(caseImage); return; }
    const file=resolve(root,`.${decodeURIComponent(pathname)}`);
    if (!file.startsWith(root+sep)) throw new Error('outside root');
    response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png'})[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode=404; response.end('Not found'); }
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const report={recipe:'landing@1.0.0',layouts:[],checks:[]};
const test=async(name,fn)=>{ await fn(); report.checks.push(name); console.log(`PASS LP ${name}`); };
try {
  browser=await chromium.launch({channel:process.env.GFU_BROWSER_CHANNEL || undefined});
  const context=await browser.newContext({reducedMotion:'reduce',locale:'ja-JP'});
  const errors=[];
  await context.route('**/*',route=>route.request().url().startsWith(base) ? route.continue() : route.abort());
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{ if(response.status() >=400) errors.push(`${response.status()} ${response.url()}`); });
  const load=async(audience='business',width=1440)=>{
    await page.setViewportSize({width,height:900});
    await page.goto(`${base}/examples/landing/${audience}.html`);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>document.documentElement.dataset.lpReady === 'true');
  };
  const layout=async()=>page.evaluate(()=>{
    const h1=document.querySelector('h1'),r=h1.getBoundingClientRect(),style=getComputedStyle(h1);
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,h1:{width:r.width,size:style.fontSize,weight:style.fontWeight},header:document.querySelector('header').getBoundingClientRect().height,theme:document.documentElement.dataset.gfuProfile};
  });
  for (const audience of ['consumer','business','mixed']) {
    for (const width of landingContract.verification.widths) {
      await load(audience,width); const metrics=await layout(); report.layouts.push({audience,...metrics});
      assert(metrics.scroll <= metrics.client+1,`overflow ${audience} ${JSON.stringify(metrics)}`);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(metrics.h1.weight,'400');
      assert.equal(metrics.h1.size,width <600 ? '40px' : audience === 'business' || width <1100 ? '56px' : '72px');
      assert.equal(await page.locator('main').count(),1);
      const broken=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));
      assert.deepEqual(broken,[]);
      if ([320,1440].includes(width)) {
        await page.screenshot({path:resolve(output,`${audience}-${width}.png`),fullPage:true});
        await page.screenshot({path:resolve(output,`${audience}-${width}-top.png`)});
      }
    }
    report.checks.push(`${audience}-10-widths`); console.log(`PASS LP ${audience}-10-widths`);
  }
  await load();
  await test('local-fonts-colors-type-and-contrast',async()=>{
    const cdp=await context.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const {root:doc}=await cdp.send('DOM.getDocument');
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#hero-title'});
    const fonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
    assert(fonts.length && fonts.every(font=>font.isCustomFont),JSON.stringify(fonts)); report.fonts=fonts;
    await cdp.detach();
    const colors=await page.locator('.gfu-lp-hero [data-variant="filled"]').evaluate(node=>({foreground:getComputedStyle(node).color,background:getComputedStyle(node).backgroundColor,height:node.getBoundingClientRect().height}));
    assert.deepEqual(colors,{foreground:'rgb(255, 255, 255)',background:'rgb(11, 87, 208)',height:landingContract.tokens.buttonHeight});
    const luminance=rgb=>rgb.map(value=>{ value/=255; return value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4; }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    assert(1.05/(luminance([11,87,208])+.05)>=4.5);
    assert((luminance([232,240,254])+.05)/(luminance([95,99,104])+.05)>=4.5);
  });
  await test('tabs-keyboard-focus-and-idempotence',async()=>{
    const buttons=page.locator('.gfu-lp-tab'); await buttons.first().focus();
    await page.keyboard.press('End'); assert.equal(await buttons.last().getAttribute('aria-selected'),'true');
    await page.keyboard.press('ArrowRight'); assert.equal(await buttons.first().getAttribute('aria-selected'),'true');
    await page.keyboard.press('ArrowLeft'); assert.equal(await buttons.last().getAttribute('aria-selected'),'true');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('.gfu-lp-tabpanel:visible').count(),1);
    await page.evaluate(async()=>{ const {initLanding}=await import('/assets/landing.js'); initLanding(); });
    await page.keyboard.press('ArrowRight'); assert.equal(await buttons.nth(1).getAttribute('aria-selected'),'true');
    assert.equal(await buttons.evaluateAll(nodes=>nodes.filter(node=>node.tabIndex===0).length),1);
  });
  await test('native-faq-keyboard-and-exclusive-open',async()=>{
    const summaries=page.locator('.gfu-lp-faq summary');
    await summaries.first().focus(); await page.keyboard.press('Enter'); assert.equal(await page.locator('.gfu-lp-faq details[open]').count(),1);
    await summaries.nth(1).focus(); await page.keyboard.press('Space'); assert.equal(await page.locator('.gfu-lp-faq details[open]').count(),1);
    assert(await page.locator('.gfu-lp-faq details').nth(1).getAttribute('open') !== null);
  });
  await test('mega-escape-outside-and-focus-return',async()=>{
    const summary=page.locator('.gfu-lp-mega > summary'); await summary.focus(); await page.keyboard.press('Enter');
    assert(await page.locator('.gfu-lp-mega').getAttribute('open') !== null);
    await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); assert.equal(await page.locator('.gfu-lp-mega').getAttribute('open'),null);
    assert(await summary.evaluate(node=>node === document.activeElement));
    await summary.click(); await page.locator('#hero-title').click(); assert.equal(await page.locator('.gfu-lp-mega').getAttribute('open'),null);
  });
  await test('annual-total-monthly-and-announcement',async()=>{
    await page.locator('input[value="annual"]').check(); assert.equal(await page.locator('[data-lp-price="monthly"]:visible').count(),0);
    assert((await page.locator('[data-lp-price="annual"]').first().innerText()).includes('¥8,000'));
    assert((await page.locator('[data-lp-price-status]').textContent()).includes('総額'));
    await page.locator('input[value="monthly"]').check(); assert.equal(await page.locator('[data-lp-price="annual"]:visible').count(),0);
  });
  await load('business',390);
  await test('mobile-dialog-trap-escape-backdrop-link-and-resize',async()=>{
    const trigger=page.locator('[data-lp-mobile-open]'),dialog=page.locator('#lp-navigation');
    await trigger.click(); assert(await dialog.evaluate(node=>node.open));
    for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert(await dialog.evaluate(node=>node.contains(document.activeElement)));}
    await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.getElementById('lp-navigation').open);
    assert(await trigger.evaluate(node=>node === document.activeElement));
    await trigger.click(); await dialog.locator('a[href="#features"]').click(); assert(await dialog.evaluate(node=>!node.open));
    await trigger.click(); await page.setViewportSize({width:1100,height:900}); await page.waitForFunction(()=>!document.getElementById('lp-navigation').open);
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    await page.setViewportSize({width:600,height:900}); await trigger.click(); await page.mouse.click(10,300); assert(await dialog.evaluate(node=>!node.open));
  });
  await load('business',390);
  await test('carousel-scroll-disabled-bounds-and-reduced-motion',async()=>{
    const track=page.locator('.gfu-lp-carousel__track'),previous=page.locator('[data-lp-dir="previous"]'),next=page.locator('[data-lp-dir="next"]');
    assert(await previous.isDisabled()); await next.click(); await page.waitForFunction(()=>document.querySelector('.gfu-lp-carousel__track').scrollLeft>0);
    await page.waitForFunction(()=>!document.querySelector('[data-lp-dir="previous"]').disabled);
    assert(await previous.isEnabled());
    await track.evaluate(node=>node.scrollLeft=node.scrollWidth); await page.waitForFunction(()=>document.querySelector('[data-lp-dir="next"]').disabled);
    assert(await next.isDisabled());
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  });
  await test('without-javascript-content-navigation-faq-pricing',async()=>{
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const p=await nojs.newPage(); await p.goto(`${base}/examples/landing/business.html`);
    assert.equal(await p.locator('.gfu-lp-tabpanel:visible').count(),3);
    assert(await p.locator('.gfu-lp-subnav').isVisible());
    assert.equal(await p.locator('[data-lp-price="annual"]:visible').count(),3);
    await p.locator('.gfu-lp-faq summary').first().click(); assert(await p.locator('.gfu-lp-faq details[open]').isVisible());
    await nojs.close();
  });
  await test('max-content-english-media-zoom-and-native-form',async()=>{
    const spec=JSON.parse(await readFile('examples/landing/business.spec.json','utf8'));
    spec.brand.name='長いブランド名でも読みやすさを維持する名称';
    spec.hero.headline=['一'.repeat(24),'二'.repeat(24),'三'.repeat(24)];
    spec.hero.summary='説明'.repeat(90);
    spec.features.items.push({title:'四つ目の機能',body:'長い本文'.repeat(40),media:null});
    spec.pricing.plans.push({...structuredClone(spec.pricing.plans[0]),name:'Fourth'});
    spec.proof.logos=Array.from({length:8},(_,i)=>`組織${i}`);
    spec.contact={title:'お問い合わせ',body:'送信先はテスト専用です。',submit:{label:'送信する',href:'/__contact'},privacy:{label:'プライバシー',href:'https://example.com/privacy'}};
    for (const width of [320,840,1440]) {
      caseHTML=await generateLanding(spec,'assets'); await page.setViewportSize({width,height:900}); await page.goto(`${base}/__case.html`); await page.evaluate(()=>document.fonts.ready);
      const metrics=await layout(); assert(metrics.scroll<=metrics.client+1,`stress overflow ${JSON.stringify(metrics)}`);
    }
    // 200% text zoom/reflow; fixed heights must not clip the copy.
    await page.evaluate(()=>{document.body.style.zoom='2';});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.evaluate(()=>{document.body.style.zoom='';});
    const form=page.locator('.gfu-lp-form'); assert.equal(await form.evaluate(node=>node.checkValidity()),false);
    await page.locator('#lp-name').fill('Test'); await page.locator('#lp-email').fill('invalid'); await page.locator('#lp-message').fill('Testing');
    assert.equal(await form.evaluate(node=>node.checkValidity()),false);
    await page.locator('#lp-email').fill('test@example.com'); await page.locator('[name="consent"]').check(); assert.equal(await form.evaluate(node=>node.checkValidity()),true);
    let submitted=false;
    await page.route('**/__contact',route=>{ assert.equal(route.request().method(),'POST'); submitted=true; return route.fulfill({status:200,contentType:'text/plain',body:'Test submission received'}); });
    await form.locator('[type="submit"]').click(); await page.waitForURL('**/__contact'); assert(submitted);
    await load('consumer',1440); caseImage=await page.locator('.gfu-lp-preview').first().screenshot();
    spec.locale='en'; spec.hero.media={src:'__test.png',alt:'Product preview',width:944,height:400}; caseHTML=await generateLanding(spec,'assets');
    await page.goto(`${base}/__case.html`); await page.locator('img').first().waitFor();
    assert(await page.locator('img').first().evaluate(node=>node.complete && node.naturalWidth>0));
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('.gfu-lp-skip').textContent(),'Skip to content');
  });
  await test('tool-screen-style-and-behavior-isolation',async()=>{
    await page.setViewportSize({width:1366,height:768}); await page.goto(`${base}/examples/files.html`); await page.evaluate(()=>document.fonts.ready);
    await page.waitForSelector('#open-table-planning');
    const metrics=()=>page.locator('.gfu-files__title, .gfu-topbar, .gfu-files__table, .gfu-dropdown__trigger').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return [s.fontFamily,s.fontSize,s.fontWeight,s.color,s.backgroundColor,r.width,r.height];}));
    const before=await metrics();
    await page.addStyleTag({url:`${base}/assets/landing.css`}); await page.evaluate(()=>import('/assets/landing.js'));
    assert.deepEqual(await metrics(),before); assert.equal(await page.locator('html').getAttribute('data-lp-ready'),null);
    await page.locator('#file-search').fill('事業計画'); assert.equal(await page.locator('.gfu-files__table tbody tr:visible').count(),1);
  });
  await test('normal-motion-and-forced-colors',async()=>{
    await page.emulateMedia({reducedMotion:'no-preference'}); await load('consumer',1440);
    assert.equal(await page.locator('.gfu-lp-button').first().evaluate(node=>getComputedStyle(node).transitionDuration),'0.18s');
    await page.emulateMedia({forcedColors:'active'}); await page.locator('.gfu-lp-tab').first().focus();
    assert.notEqual(await page.locator('.gfu-lp-tab').first().evaluate(node=>getComputedStyle(node).outlineStyle),'none');
  });
  assert.deepEqual(errors,[],'No JS or asset load failures');
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Landing browser passed: ${report.layouts.length} layouts, ${report.checks.length} groups; ${output}`);
} finally { await browser?.close(); await new Promise(done=>server.close(done)); }
