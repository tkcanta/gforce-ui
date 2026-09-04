import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { generateLanding, validateLanding, landingContract } from './generate-landing.mjs';
import { contractLint } from './contract-lint.mjs';

const root = resolve('.');
const spec = JSON.parse(await readFile('examples/landing/business.spec.json','utf8'));
let rejected=0;
const bad = (name,change) => { const value=structuredClone(spec); change(value); assert.throws(()=>validateLanding(value),undefined,name); rejected++; };
const reverse = value => Array.isArray(value) ? value.map(reverse) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key,child])=>[key,reverse(child)])) : value;
assert.equal(await generateLanding(spec),await generateLanding(reverse(spec)),'JSON property order must not affect output');
for (const audience of ['consumer','business','mixed']) {
  const file=resolve(`examples/landing/${audience}.html`);
  const value=JSON.parse(await readFile(`examples/landing/${audience}.spec.json`,'utf8'));
  const html=await generateLanding(value,'../../assets');
  assert.equal(html,await readFile(file,'utf8'));
  assert(html.includes(`data-gfu-profile="${landingContract.routing[audience]}"`));
  assert.deepEqual(await contractLint(file,html),[]);
}
for (const key of Object.keys(spec)) bad(`required ${key}`,value=>delete value[key]);
for (const [name,change] of [
  ['unknown field',s=>s.customCSS='body{}'], ['manual variant',s=>s.hero.layout='split'], ['unknown audience',s=>s.audience='creative'],
  ['unknown version',s=>s.recipeVersion='latest'], ['wrong profile',s=>s.profile='workspace-files'], ['wrong locale',s=>s.locale='auto'],
  ['script injection',s=>s.brand.name='<script>alert(1)</script>'], ['HTML',s=>s.hero.headline=['<b>Hello</b>']], ['emoji',s=>s.brand.name='Hello\u{1f680}'],
  ['flag emoji',s=>s.brand.name='\u{1f1ef}\u{1f1f5}'], ['control',s=>s.hero.summary='a\nb'], ['bidi',s=>s.brand.name='ab\u202ecd'],
  ['whitespace',s=>s.brand.name='  '], ['long headline',s=>s.hero.headline=['a'.repeat(25)]], ['too many lines',s=>s.hero.headline=['a','b','c','d']],
  ['empty features',s=>s.features.items=[]], ['extra features',s=>s.features.items.push(...s.features.items)], ['empty tabs',s=>s.capabilities.items=[]],
  ['duplicate tab',s=>s.capabilities.items[1].label=s.capabilities.items[0].label], ['unknown icon',s=>s.features.items[0].icon='special'],
  ['javascript URL',s=>s.hero.primary.href='javascript:alert(1)'], ['data URL',s=>s.hero.primary.href='data:text/html,hello'],
  ['HTTP',s=>s.hero.primary.href='http://example.com'], ['protocol relative',s=>s.hero.primary.href='//example.com'],
  ['credentials',s=>s.hero.primary.href='https://user:pass@example.com'], ['backslash',s=>s.hero.primary.href='https://example.com\\evil'],
  ['escaped control',s=>s.hero.primary.href='https://example.com/%0a'], ['missing anchor',s=>s.hero.primary.href='#missing'],
  ['absent section',s=>{s.pricing=null;s.hero.primary.href='#pricing';}], ['same CTA',s=>s.hero.secondary.href=s.hero.primary.href],
  ['string price',s=>s.pricing.plans[0].monthly='800'], ['negative price',s=>s.pricing.plans[0].monthly=-1], ['NaN',s=>s.pricing.plans[0].annual=NaN],
  ['fractional amount',s=>s.pricing.plans[0].annual=.5], ['expensive annual',s=>s.pricing.plans[0].annual=999999], ['two recommendations',s=>s.pricing.plans[0].recommended=true],
  ['unsupported currency',s=>s.pricing.currency='BTC'], ['no proof source',s=>delete s.proof.stats[0].source],
  ['SVG image',s=>s.hero.media={src:'evil.svg',alt:'test',width:640,height:400}], ['external image',s=>s.hero.media={src:'https://example.com/a.png',alt:'test',width:640,height:400}],
  ['path traversal',s=>s.hero.media={src:'../secret.png',alt:'test',width:640,height:400}], ['missing alt',s=>s.hero.media={src:'image.png',alt:'',width:640,height:400}],
  ['bad image ratio',s=>s.hero.media={src:'image.png',alt:'test',width:4000,height:180}], ['unknown FAQ field',s=>s.faq[0].html='x'],
  ['fake form handler',s=>s.contact={title:'Contact',body:'Send a message.',submit:{label:'Send',href:'#conversion'},privacy:{label:'Privacy',href:'https://example.com/privacy'}}]
]) bad(name,change);
const escaped=structuredClone(spec); escaped.brand.name='A & "B"';
const escapedHTML=await generateLanding(escaped); assert(escapedHTML.includes('A &amp; &quot;B&quot;')); assert(escapedHTML.includes('A \\u0026 \\"B\\"'));
const english=structuredClone(spec); english.locale='en'; const en=await generateLanding(english); assert(en.includes('Skip to content')); assert(en.includes(' / year'));
const contact=structuredClone(spec); contact.contact={title:'お問い合わせ',body:'ご相談をお送りください。',submit:{label:'送信する',href:'/contact'},privacy:{label:'個人情報の取り扱い',href:'https://example.com/privacy'}};
const form=await generateLanding(contact); assert(form.includes('method="post"')); assert(form.includes('type="email"')); assert(!form.includes('onsubmit'));
const temp=await mkdtemp(join(tmpdir(),'gfu-landing-contract-'));
try {
  await mkdir(join(temp,'assets'));
  for (const name of ['landing.css','landing.js','fonts']) await cp(resolve('assets',name),join(temp,'assets',name),{recursive:true});
  const file=join(temp,'page.html'); const html=await generateLanding(spec,'assets');
  assert.deepEqual(await contractLint(file,html),[]);
  const variants=[
    ['missing profile',html.replace(/ data-gfu-profile="[^"]+"/,'')], ['wrong profile',html.replace('lp-enterprise','workspace-files')],
    ['unknown profile',html.replace('lp-enterprise','lp-custom')], ['legacy kit','<html><body class="gf-hero">Legacy kit</body></html>'],
    ['changed headline',html.replace('仕事の流れを、','自由な見出し')], ['custom CSS',html.replace('</head>','<style>h1{font-size:90px}</style></head>')],
    ['extra script',html.replace('</body>','<script src="extra.js"></script></body>')], ['unknown class',html.replace('class="gfu-lp-page"','class="gfu-lp-page custom"')],
    ['extra primary',html.replace('</main>','<a class="gfu-lp-button" data-variant="filled" href="#top">Extra</a></main>')],
    ['removed config',html.replace('id="landing-config"','id="other"')], ['extra CSS',html.replace('</head>','<link rel="stylesheet" href="extra.css"></head>')],
    ['remote CSS',html.replace('href="assets/landing.css"','href="https://example.com/assets/landing.css"')], ['wrong version',html.replace('data-gfu-recipe-version="1.0.0"','data-gfu-recipe-version="0.0.0"')]
  ];
  for (const [name,source] of variants) { assert((await contractLint(file,source)).some(issue=>issue.rule === 'GFU030'),name); rejected++; }
  for (const name of ['landing.css','landing.js','fonts/Roboto.ttf']) {
    const original=await readFile(join(temp,'assets',name));
    await writeFile(join(temp,'assets',name),Buffer.concat([original,Buffer.from(' /* override */')]));
    assert((await contractLint(file,html)).some(issue=>issue.rule === 'GFU032'),name); rejected++;
    await writeFile(join(temp,'assets',name),original);
  }
  const media=structuredClone(spec); media.hero.media={src:'missing.png',alt:'Product',width:640,height:400};
  assert((await contractLint(file,await generateLanding(media,'assets'))).some(issue=>issue.rule === 'GFU030')); rejected++;
  await writeFile(join(temp,'input.json'),JSON.stringify(spec)); await writeFile(file,html);
  const cli=(...args)=>spawnSync(process.execPath,[resolve(root,'tools/generate-landing.mjs'),...args],{cwd:temp,encoding:'utf8'});
  assert.equal(cli('input.json','page.html','--assets','assets','--check').status,0);
  for (const args of [['--assets'],['--force'],['--assets','https://example.com/assets']]) { assert.notEqual(cli('input.json','page.html',...args).status,0); assert.equal(await readFile(file,'utf8'),html); rejected++; }
  assert.notEqual(cli('input.json','input.json').status,0); rejected++;
  await writeFile(file,'Changed'); assert.notEqual(cli('input.json','page.html','--assets','assets','--check').status,0); rejected++;
} finally { await rm(temp,{recursive:true,force:true}); }
const css=await readFile('src/landing.css','utf8');
assert(!/gradient\(|backdrop-filter|font-weight:\s*(?:[6-9]00|bold)/i.test(css));
assert(css.includes('html[data-gfu-profile^="lp-"]'));
assert.equal(landingContract.tokens.primary,'#0b57d0');
console.log(`Landing contract passed: 3 deterministic profiles, key-order invariance, escaping, form/en, distribution integrity; ${rejected} invalid cases rejected.`);
