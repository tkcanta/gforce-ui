import { readFile, writeFile, rename, rm, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const landingContract = JSON.parse(await readFile(resolve(root, 'docs/landing-contract.json'), 'utf8'));
const schema = JSON.parse(await readFile(resolve(root, 'docs/landing.schema.json'), 'utf8'));
export const recipeVersion = landingContract.meta.recipeVersion;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;

// This walker implements only the keywords used in landing.schema.json; it is not a general JSON Schema engine.
function validate(value, rule, path = 'spec') {
  const fail = message => { throw new Error(`${path}: ${message}`); };
  if (Object.hasOwn(rule, 'const') && value !== rule.const) fail(`expected ${rule.const}`);
  if (rule.enum && !rule.enum.includes(value)) fail(`expected ${rule.enum.join(' | ')}`);
  if (!rule.type) return;
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (![rule.type].flat().some(expected => expected === type || expected === 'integer' && Number.isSafeInteger(value))) fail(`expected ${rule.type}`);
  if (type === 'object') {
    for (const key of Object.keys(value)) if (!Object.hasOwn(rule.properties, key)) fail(`unknown field ${key}`);
    for (const key of rule.required) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const [key, child] of Object.entries(value)) validate(child, rule.properties[key], `${path}.${key}`);
  }
  if (type === 'array') {
    if (value.length < rule.minItems || value.length > rule.maxItems) fail(`requires ${rule.minItems}..${rule.maxItems} items`);
    value.forEach((item, index) => validate(item, rule.items, `${path}[${index}]`));
  }
  if (type === 'string') {
    if (!value.trim() || value !== value.trim() || [...value].length > rule.maxLength || /[<>\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069\u200b\ufeff]/u.test(value) || /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(value)) fail('plain trimmed text required; HTML, controls and emoji forbidden');
  }
  if (type === 'number' && (!Number.isFinite(value) || value < rule.minimum || value > rule.maximum)) fail('number outside allowed range');
}

export function validateLanding(spec) {
  validate(spec, schema);
  const anchors = new Set(['top', 'main', 'features', 'capabilities', 'faq', 'conversion', 'footer']);
  for (const key of ['products', 'proof', 'pricing', 'migration', 'resources', 'contact']) if (Array.isArray(spec[key]) ? spec[key].length : spec[key]) anchors.add(key);
  const visit = (value, path = 'spec') => {
    if (!value || typeof value !== 'object') return;
    if (Object.hasOwn(value, 'href')) {
      const href = value.href;
      let valid = false;
      if (href.startsWith('#')) valid = anchors.has(href.slice(1));
      else if (/^https:\/\//.test(href)) {
        try { const url = new URL(href); valid = Boolean(url.hostname) && !url.username && !url.password; } catch { /* rejected below */ }
      } else valid = /^(?:\/(?!\/)[A-Za-z0-9/_?=&.%~-]*|mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|tel:\+?[0-9-]{6,20})$/.test(href);
      if (!valid || /[\s\\"'<>]/u.test(href) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(href)) throw new Error(`${path}.href: safe URL or existing section anchor required`);
    }
    if (Object.hasOwn(value, 'src')) {
      if (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|avif)$/.test(value.src)) throw new Error(`${path}.src: raster image relative to assets; no traversal or external resources`);
      if (value.width / value.height < 1 || value.width / value.height > 2.5) throw new Error(`${path}: image aspect ratio must be 1..2.5`);
    }
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  };
  visit(spec);
  if (spec.contact && !/^(?:https:\/\/|\/(?!\/))/.test(spec.contact.submit.href)) throw new Error('contact.submit: HTTPS or site-root POST endpoint required; no demo success handler');
  const unique = (values, label) => { if (new Set(values).size !== values.length) throw new Error(`${label}: duplicate names`); };
  unique(spec.capabilities.items.map(item => item.label), 'capabilities');
  unique(spec.features.items.map(item => item.title), 'features');
  if (spec.hero.secondary?.href === spec.hero.primary.href) throw new Error('hero: primary and secondary must have different destinations');
  if (spec.pricing) {
    unique(spec.pricing.plans.map(plan => plan.name), 'pricing');
    if (spec.pricing.plans.filter(plan => plan.recommended).length > 1) throw new Error('pricing: at most one recommended plan');
    for (const plan of spec.pricing.plans) if (plan.annual > plan.monthly * 12) throw new Error('pricing: annual amount must not exceed twelve monthly payments');
  }
  return spec;
}

export function landingAssetsPath(assets) {
  if (typeof assets !== 'string' || !/^(?:(?:\.\.?|[a-zA-Z0-9_-]+)\/)*assets$/.test(assets)) throw new Error('assets: relative local assets directory required');
  return assets;
}
const icon = (name = 'arrow') => `<svg class="gfu-lp-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', check: '<path d="m5 12 4 4L19 6"/>' })[name]}</svg>`;
const link = (item, kind = 'text') => `<a class="gfu-lp-button" data-variant="${kind}" href="${escape(item.href)}">${escape(item.label)}${kind === 'text' ? icon() : ''}</a>`;
const heading = (id, title, intro = '') => `<div class="gfu-lp-heading"><h2 id="${id}-title">${escape(title)}</h2>${intro ? `<p>${escape(intro)}</p>` : ''}</div>`;
const section = (id, content) => `<section class="gfu-lp-section" id="${id}" aria-labelledby="${id}-title"><div class="gfu-lp-container">${content}</div></section>`;

export async function generateLanding(input, assets = '../assets') {
  const spec = validateLanding(input);
  landingAssetsPath(assets);
  const profile = landingContract.routing[spec.audience];
  const english = spec.locale === 'en';
  const ui = (ja, en) => english ? en : ja;
  const titles = { features: ui('機能', 'Features'), capabilities: ui('使い方', 'Explore'), products: ui('サービス', 'Products'), proof: ui('導入事例', 'Stories'), pricing: ui('料金', 'Pricing'), migration: ui('導入', 'Get started'), resources: ui('ガイド', 'Resources'), faq: ui('よくある質問', 'Questions'), contact: ui('お問い合わせ', 'Contact') };
  const ids = Object.keys(titles).filter(id => !['products','proof','pricing','migration','resources','contact'].includes(id) || (Array.isArray(spec[id]) ? spec[id].length : spec[id]));
  const navigation = ids.map(id => `<a href="#${id}">${titles[id]}</a>`).join('');
  const actions = `<div class="gfu-lp-actions" data-gfu-action-group>${link(spec.hero.primary, 'filled')}${spec.hero.secondary ? link(spec.hero.secondary, 'outlined') : ''}</div>`;
  const picture = (media, title, index = 0, eager = false) => media
    ? `<figure class="gfu-lp-media"><img src="${assets}/${media.src}" alt="${escape(media.alt)}" width="${media.width}" height="${media.height}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}></figure>`
    : `<div class="gfu-lp-preview" role="img" aria-label="${escape(title)}${ui('の画面イメージ', ' — interface illustration')}"><div class="gfu-lp-preview__bar"><span class="gfu-lp-mark" aria-hidden="true">${escape(spec.brand.name.slice(0,1))}</span><span>${escape(spec.brand.name)}</span><span class="gfu-lp-preview__dots" aria-hidden="true"></span></div><div class="gfu-lp-preview__body"><div class="gfu-lp-preview__sidebar" aria-hidden="true"><span></span><span></span><span></span></div><div class="gfu-lp-preview__content"><span class="gfu-lp-eyebrow">${escape(spec.capabilities.items[index % spec.capabilities.items.length].label)}</span><p>${escape(title)}</p><div class="gfu-lp-preview__tiles" aria-hidden="true"><span>${icon('check')}</span><span>${icon('check')}</span><span>${icon('check')}</span></div><div class="gfu-lp-preview__lines" aria-hidden="true"><span></span><span></span><span></span></div></div></div></div>`;
  const hero = `<section class="gfu-lp-hero" id="top" aria-labelledby="hero-title"><div class="gfu-lp-container"><div class="gfu-lp-hero__layout"><div class="gfu-lp-hero__copy"><p class="gfu-lp-eyebrow">${escape(spec.hero.eyebrow)}</p><h1 id="hero-title">${spec.hero.headline.map((line,index) => `<span${index === spec.hero.headline.length - 1 ? ' class="gfu-lp-accent"' : ''}>${escape(line)}</span>`).join('')}</h1><p class="gfu-lp-lead">${escape(spec.hero.summary)}</p>${actions}${spec.hero.note ? `<p class="gfu-lp-note">${escape(spec.hero.note)}</p>` : ''}</div><div class="gfu-lp-stage">${picture(spec.hero.media, spec.capabilities.items[0].title, 0, true)}${spec.hero.media ? '' : `<div class="gfu-lp-stage__badge" aria-hidden="true">${icon('check')}<span>${escape(spec.brand.description)}</span></div>`}</div></div></div></section>`;
  const features = section('features', heading('features', spec.features.title, spec.features.intro) + `<div class="gfu-lp-bento">${spec.features.items.map((item,index) => `<article class="gfu-lp-feature"><div class="gfu-lp-feature__copy"><span class="gfu-lp-eyebrow" aria-hidden="true">0${index+1}</span><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></div>${picture(item.media, item.title, index)}</article>`).join('')}</div>`);
  const capabilities = section('capabilities', heading('capabilities', spec.capabilities.title) + `<div class="gfu-lp-tabs" data-lp-tabs><div class="gfu-lp-tablist" role="tablist" aria-label="${titles.capabilities}" hidden>${spec.capabilities.items.map((item,index) => `<button type="button" class="gfu-lp-tab" role="tab" id="cap-tab-${index}" aria-controls="cap-panel-${index}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${escape(item.label)}</button>`).join('')}</div>${spec.capabilities.items.map((item,index) => `<div class="gfu-lp-tabpanel" id="cap-panel-${index}" role="tabpanel" aria-labelledby="cap-heading-${index}" tabindex="0"><div class="gfu-lp-feature-copy"><p class="gfu-lp-eyebrow">${escape(item.label)}</p><h3 id="cap-heading-${index}">${escape(item.title)}</h3><p>${escape(item.body)}</p></div>${picture(item.media,item.title,index)}</div>`).join('')}</div>`);
  const products = spec.products.length ? section('products', heading('products',titles.products) + `<div class="gfu-lp-products">${spec.products.map((item,index) => `<article><span class="gfu-lp-product-icon" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p>${link(item.link)}</article>`).join('')}</div>`) : '';
  const proof = spec.proof ? section('proof', heading('proof',spec.proof.title) + (spec.proof.logos.length ? `<ul class="gfu-lp-logos" aria-label="${ui('紹介組織','Featured organizations')}">${spec.proof.logos.map(name=>`<li>${escape(name)}</li>`).join('')}</ul>` : '') + `<div class="gfu-lp-stats">${spec.proof.stats.map(item=>`<div><p class="gfu-lp-stat">${escape(item.value)}</p><p>${escape(item.label)}</p><a href="${escape(item.source.href)}">${escape(item.source.label)}</a></div>`).join('')}</div><div class="gfu-lp-quotes">${spec.proof.quotes.map(item=>`<figure><blockquote><p>${escape(item.quote)}</p></blockquote><figcaption>${escape(item.author)}<br><a href="${escape(item.source.href)}">${escape(item.source.label)}</a></figcaption></figure>`).join('')}</div>`) : '';
  const money = amount => ({JPY:'¥',USD:'$',EUR:'€'})[spec.pricing.currency] + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pricing = spec.pricing ? section('pricing', heading('pricing',spec.pricing.title,spec.pricing.note) + `<div data-lp-pricing><fieldset class="gfu-lp-billing" hidden><legend>${ui('支払い周期','Billing period')}</legend><label><input type="radio" name="lp-billing" value="monthly" checked>${ui('月払い','Monthly')}</label><label><input type="radio" name="lp-billing" value="annual">${ui('年払い','Annual')}</label></fieldset><p class="gfu-lp-sr" aria-live="polite" data-lp-price-status></p><div class="gfu-lp-plans">${spec.pricing.plans.map(plan=>`<article class="gfu-lp-plan" data-recommended="${plan.recommended}"><p class="gfu-lp-plan__badge">${plan.recommended ? ui('おすすめ','Recommended') : ui('プラン','Plan')}</p><h3>${escape(plan.name)}</h3><p>${escape(plan.description)}</p><div class="gfu-lp-prices"><p data-lp-price="monthly"><span>${money(plan.monthly)}</span> / ${ui('月','month')}</p><p data-lp-price="annual"><span>${money(plan.annual)}</span> / ${ui('年','year')}</p></div><ul>${plan.features.map(feature=>`<li>${icon('check')}<span>${escape(feature)}</span></li>`).join('')}</ul><div data-gfu-action-group>${link(plan.action,plan.recommended ? 'filled' : 'outlined')}</div></article>`).join('')}</div></div>`) : '';
  const migration = spec.migration ? section('migration',heading('migration',spec.migration.title,spec.migration.body) + `<ol class="gfu-lp-steps">${spec.migration.steps.map(item=>`<li><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p></li>`).join('')}</ol>${link(spec.migration.action)}`) : '';
  const resources = spec.resources.length ? section('resources',heading('resources',titles.resources) + `<div class="gfu-lp-carousel" data-lp-carousel><div class="gfu-lp-carousel__controls" hidden><button type="button" class="gfu-lp-icon-button" data-lp-dir="previous" aria-label="${ui('前のガイド','Previous resources')}" aria-controls="lp-resource-track">${icon()}</button><button type="button" class="gfu-lp-icon-button" data-lp-dir="next" aria-label="${ui('次のガイド','Next resources')}" aria-controls="lp-resource-track">${icon()}</button></div><div class="gfu-lp-carousel__track" id="lp-resource-track" tabindex="0" role="region" aria-label="${titles.resources}">${spec.resources.map(item=>`<article class="gfu-lp-resource">${picture(item.media,item.title)}<div><p class="gfu-lp-eyebrow">${escape(item.category)}</p><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p>${link(item.link)}</div></article>`).join('')}</div></div>`) : '';
  const faq = section('faq',heading('faq',titles.faq) + `<div class="gfu-lp-faq">${spec.faq.map(item=>`<details name="lp-faq"><summary>${escape(item.question)}<span aria-hidden="true">+</span></summary><p>${escape(item.answer)}</p></details>`).join('')}</div>`);
  const contact = spec.contact ? section('contact',heading('contact',spec.contact.title,spec.contact.body) + `<form class="gfu-lp-form" action="${escape(spec.contact.submit.href)}" method="post"><label for="lp-name">${ui('お名前（必須）','Name (required)')}</label><input id="lp-name" name="name" autocomplete="name" maxlength="100" required><label for="lp-email">${ui('メールアドレス（必須）','Email (required)')}</label><input id="lp-email" name="email" type="email" autocomplete="email" maxlength="254" required>${spec.audience !== 'consumer' ? `<label for="lp-company">${ui('会社・組織名','Company / organization')}</label><input id="lp-company" name="company" autocomplete="organization" maxlength="100">` : ''}<label for="lp-message">${ui('お問い合わせ内容（必須）','Message (required)')}</label><textarea id="lp-message" name="message" rows="5" maxlength="3000" required></textarea><label class="gfu-lp-consent"><input name="consent" type="checkbox" value="accepted" required><span><a href="${escape(spec.contact.privacy.href)}">${escape(spec.contact.privacy.label)}</a>${ui('を確認し、情報の送信に同意します。',' — I agree to submit this information.')}</span></label><button type="submit" class="gfu-lp-button" data-variant="filled">${escape(spec.contact.submit.label)}</button></form>`) : '';
  const conversion = section('conversion',heading('conversion',spec.conversion.title,spec.conversion.body) + actions);
  const values = {
    LANG:spec.locale,PROFILE:profile,VERSION:recipeVersion,TITLE:escape(`${spec.brand.name} — ${spec.hero.headline.join('')}`),DESCRIPTION:escape(spec.hero.summary),ASSETS:assets,
    SKIP:ui('本文へ移動','Skip to content'),
    ANNOUNCEMENT:spec.announcement ? `<aside class="gfu-lp-announcement"><a href="${escape(spec.announcement.href)}">${escape(spec.announcement.label)} ${icon()}</a></aside>` : '',
    HEADER:`<header class="gfu-lp-header"><div class="gfu-lp-header__main"><a class="gfu-lp-brand" href="#top"><span class="gfu-lp-mark" aria-hidden="true">${escape(spec.brand.name.slice(0,1))}</span>${escape(spec.brand.name)}</a><nav class="gfu-lp-desktop-nav" aria-label="${ui('主要ナビゲーション','Main navigation')}"><a href="#features">${titles.features}</a><a href="#capabilities">${titles.capabilities}</a><details class="gfu-lp-mega"><summary>${ui('さらに見る','More')}<span aria-hidden="true">+</span></summary><div>${navigation}</div></details></nav><div class="gfu-lp-header__cta" data-gfu-action-group>${link(spec.hero.primary,'filled')}</div><button type="button" class="gfu-lp-icon-button gfu-lp-mobile-toggle" data-lp-mobile-open aria-controls="lp-navigation" aria-haspopup="dialog" aria-expanded="false" aria-label="${ui('メニューを開く','Open menu')}" hidden>${icon('menu')}</button></div><nav class="gfu-lp-subnav" aria-label="${ui('セクションナビゲーション','Section navigation')}">${navigation}</nav></header><dialog class="gfu-lp-navigation" id="lp-navigation" aria-labelledby="lp-nav-title"><div class="gfu-lp-navigation__head"><h2 id="lp-nav-title">${escape(spec.brand.name)}</h2><button type="button" class="gfu-lp-icon-button" data-lp-mobile-close aria-label="${ui('メニューを閉じる','Close menu')}">${icon('close')}</button></div><nav aria-label="${ui('モバイルナビゲーション','Mobile navigation')}">${navigation}</nav>${link(spec.hero.primary,'filled')}</dialog>`,
    MAIN:hero + `<nav class="gfu-lp-anchor" aria-label="${ui('このページの内容','On this page')}">${ids.filter(id=>['features','capabilities','pricing','faq'].includes(id)).map(id=>`<a href="#${id}">${titles[id]}</a>`).join('')}</nav>` + features + capabilities + products + proof + pricing + migration + resources + faq + contact + conversion,
    FOOTER:`<footer class="gfu-lp-footer" id="footer"><div class="gfu-lp-container"><div class="gfu-lp-footer__grid"><div><a class="gfu-lp-brand" href="#top">${escape(spec.brand.name)}</a><p>${escape(spec.brand.description)}</p></div>${spec.footer.groups.map(group=>`<div><h2>${escape(group.title)}</h2><ul>${group.links.map(item=>`<li><a href="${escape(item.href)}">${escape(item.label)}</a></li>`).join('')}</ul></div>`).join('')}</div><div class="gfu-lp-footer__legal"><p>${escape(spec.footer.copyright)}</p><nav aria-label="${ui('法的情報','Legal')}">${spec.footer.legal.map(item=>`<a href="${escape(item.href)}">${escape(item.label)}</a>`).join('')}</nav></div></div></footer>`,
    CONFIG:JSON.stringify(stable(spec),null,2).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026')
  };
  const template = (await readFile(resolve(root,'templates/landing.html'),'utf8')).replaceAll('\r\n','\n');
  return template.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{
    if (!Object.hasOwn(values,key)) throw new Error(`Unknown template slot ${key}`);
    return values[key];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const batch = args[0] === '--examples';
    const [input, output] = batch ? [] : args;
    const flags = args.slice(batch ? 1 : 2);
    let assets = batch ? '../../assets' : '../assets', check = false;
    for (let i=0; i<flags.length; i++) {
      if (flags[i] === '--check' && !check) check = true;
      else if (flags[i] === '--assets' && flags[i+1] && !batch) assets = landingAssetsPath(flags[++i]);
      else throw new Error(`Unknown/incomplete option: ${flags[i]}`);
    }
    if (!batch && (!input || !output || input.startsWith('--') || output.startsWith('--') || resolve(input) === resolve(output))) throw new Error('Usage: node tools/generate-landing.mjs input.json output.html [--assets ../assets] [--check], or --examples [--check]');
    const jobs = batch ? (await readdir(resolve(root,'examples/landing'))).filter(name=>name.endsWith('.spec.json')).sort().map(name=>[resolve(root,'examples/landing',name),resolve(root,'examples/landing',name.replace('.spec.json','.html'))]) : [[input,output]];
    if (!jobs.length) throw new Error('No LP examples found');
    for (const [source,destination] of jobs) {
      const html = await generateLanding(JSON.parse(await readFile(source,'utf8')),assets);
      if (check) {
        if ((await readFile(destination,'utf8')).replaceAll('\r\n','\n') !== html) throw new Error(`LP recipe drift: regenerate ${destination}`);
      } else {
        const temp = `${destination}.${process.pid}.tmp`;
        let created = false;
        try { await writeFile(temp,html,{encoding:'utf8',flag:'wx'}); created = true; await rename(temp,destination); }
        finally { if (created) await rm(temp,{force:true}); }
      }
      console.log(`Landing ${recipeVersion}: ${check ? 'verified' : 'generated'} ${basename(destination)}`);
    }
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
