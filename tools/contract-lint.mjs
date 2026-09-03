import { parse } from 'parse5';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFiles } from './generate-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = await readFile(resolve(root, 'src/gforce.css'), 'utf8');
const js = await readFile(resolve(root, 'src/gforce.js'), 'utf8');
const classes = new Set([...css.matchAll(/\.(gfu-[a-zA-Z0-9_-]+)/g)].map((match) => match[1]));
const icons = new Set([...js.slice(0, js.indexOf('const qsa')).matchAll(/^  ([a-z0-9_]+):/gm)].map((match) => match[1]));
const hooks = new Set([...js.matchAll(/data-gfu-[a-z0-9-]+/g)].map((match) => match[0]));
['data-gfu-action-group', 'data-gfu-profile', 'data-gfu-recipe-version', 'data-gfu-snackbar-action'].forEach((hook) => hooks.add(hook));
const nodes = (node) => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, name) => node?.attrs?.find((item) => item.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const ancestor = (node, predicate) => node && (predicate(node) ? node : ancestor(node.parentNode, predicate));
export async function contractLint(file, source) {
  const document = parse(source, { sourceCodeLocationInfo: true });
  const elements = nodes(document).filter((node) => node.tagName);
  const issues = [];
  const add = (node, rule, message) => issues.push({ index: node?.sourceCodeLocation?.startOffset || 0, rule, message });
  const byId = new Map();
  for (const node of elements) {
    const id = attr(node, 'id');
    if (id) { if (byId.has(id)) add(node, 'GFU023', `Duplicate id: ${id}`); byId.set(id, node); }
  }
  for (const node of elements) {
    for (const name of (attr(node, 'class') || '').split(/\s+/)) if (name.startsWith('gfu-') && !classes.has(name)) add(node, 'GFU020', `未登録class: ${name}. Consumer CSSで補完しない`);
    if (attr(node, 'data-icon') !== undefined && !icons.has(attr(node, 'data-icon'))) add(node, 'GFU021', `未登録icon: ${attr(node, 'data-icon')}`);
    for (const { name } of node.attrs || []) if (name.startsWith('data-gfu-') && !hooks.has(name)) add(node, 'GFU022', `未登録hook: ${name}`);
    for (const [hook, className] of [['data-gfu-dialog-open', 'gfu-dialog'], ['data-gfu-menu-trigger', 'gfu-menu'], ['data-gfu-popover-trigger', 'gfu-popover']]) {
      const id = attr(node, hook);
      if (id !== undefined && !hasClass(byId.get(id), className)) add(node, 'GFU023', `${hook}=${id}: target must be ${className}`);
    }
    if (hasClass(node, 'gfu-dialog') && attr(node, 'data-gfu-command') === undefined && !hasClass(node, 'gfu-command-dialog')) {
      const children = nodes(node);
      if (node.tagName !== 'dialog' || !['gfu-dialog__surface', 'gfu-dialog__header', 'gfu-dialog__headline', 'gfu-dialog__body', 'gfu-dialog__footer'].every((name) => children.some((child) => hasClass(child, name))) || !byId.has(attr(node, 'aria-labelledby'))) add(node, 'GFU023', 'Dialog requires native dialog, surface/header/headline/body/footer and aria-labelledby');
    }
    if (['input', 'select', 'textarea'].includes(node.tagName) && !['hidden', 'submit', 'reset'].includes(attr(node, 'type'))) {
      const labelled = attr(node, 'aria-label')?.trim() || attr(node, 'aria-labelledby')?.split(/\s+/).every((id) => byId.has(id)) || ancestor(node.parentNode, (item) => item.tagName === 'label') || elements.some((label) => label.tagName === 'label' && attr(label, 'for') === attr(node, 'id') && attr(node, 'id'));
      if (!labelled) add(node, 'GFU023', 'Form control requires an accessible name');
    }
    if (attr(node, 'aria-sort') !== undefined && node.tagName !== 'th' && attr(node, 'role') !== 'columnheader') add(node, 'GFU023', 'aria-sort belongs to th/columnheader, not button');
    if (node.tagName === 'strong' && ancestor(node.parentNode, (item) => hasClass(item, 'gfu-table') || hasClass(item, 'gfu-files') || hasClass(item, 'gfu-page-title'))) add(node, 'GFU026', 'UI names/headings use role typography, not strong/700');
    if (node.tagName === 'link' && attr(node, 'rel') === 'stylesheet') {
      const href = attr(node, 'href') || '';
      try {
        if (/^(?:\w+:|\/\/)/.test(href)) throw new Error('non-local stylesheet');
        const content = await readFile(resolve(dirname(file), href), 'utf8');
        const distribution = await readFile(resolve(root, 'assets/gforce.css'), 'utf8');
        if (content !== distribution && /gfu-|--gfu-|font-weight\s*:\s*(?:bold|[7-9]00)|(?:#[\da-f]{3,8}\b|rgba?\(|hsla?\()/i.test(content)) add(node, 'GFU024', `Consumer CSS overrides/unregistered values: ${href}`);
      } catch (error) { add(node, 'GFU024', `Stylesheet must resolve locally: ${href} (${error.code || error.message})`); }
    }
  }
  const profile = attr(elements.find((node) => node.tagName === 'html'), 'data-gfu-profile');
  if (profile || elements.some((node) => hasClass(node, 'gfu-files'))) {
    try {
      if (profile !== 'workspace-files') throw new Error('workspace-files profile required');
      const config = JSON.parse(text(byId.get('files-config')));
      const links = elements.filter((node) => node.tagName === 'link' && attr(node, 'rel') === 'stylesheet');
      if (links.length !== 1) throw new Error('Exactly one library stylesheet required');
      const assets = attr(links[0], 'href').replace(/\/gforce\.css$/, '');
      const expected = await generateFiles(config, assets);
      if (source.replaceAll('\r\n', '\n') !== expected) throw new Error('Generated DOM drift. Regenerate from validated JSON; do not invent layout, classes, controls or scripts');
    } catch (error) { add(null, 'GFU025', error.message); }
  }
  return issues;
}
