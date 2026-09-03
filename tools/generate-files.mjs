import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

export const recipeVersion = '1.2.0';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exact = (object, keys, path) => {
  if (!object || typeof object !== 'object' || Array.isArray(object)) throw new Error(`${path}: object required`);
  for (const key of Object.keys(object)) if (!keys.includes(key)) throw new Error(`${path}.${key}: unknown field`);
  for (const key of keys) if (!Object.hasOwn(object, key)) throw new Error(`${path}.${key}: required`);
};
const text = (value, max, path) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/u.test(value)) throw new Error(`${path}: nonempty text <= ${max} required`);
};
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function validateSpec(spec) {
  exact(spec, ['recipeVersion', 'profile', 'appName', 'referenceDate', 'storage', 'files'], 'spec');
  if (spec.recipeVersion !== recipeVersion || spec.profile !== 'workspace-files') throw new Error(`Use workspace-files / recipeVersion ${recipeVersion}; no automatic profile fallback`);
  text(spec.appName, 24, 'appName');
  if (!date(spec.referenceDate)) throw new Error('referenceDate: valid ISO date required');
  exact(spec.storage, ['usedGB', 'totalGB'], 'storage');
  if (!Number.isFinite(spec.storage.usedGB) || !Number.isFinite(spec.storage.totalGB) || spec.storage.totalGB <= 0 || spec.storage.usedGB < 0 || spec.storage.usedGB > spec.storage.totalGB) throw new Error('storage: 0 <= usedGB <= totalGB required');
  if (!Array.isArray(spec.files) || spec.files.length > 1000) throw new Error('files: array <= 1000 required');
  const ids = new Set();
  spec.files.forEach((file, index) => {
    const path = `files[${index}]`;
    exact(file, ['id', 'parentId', 'name', 'kind', 'owner', 'modified', 'bytes', 'shared', 'starred', 'trashed'], path);
    if (typeof file.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(file.id) || ids.has(file.id)) throw new Error(`${path}.id: unique safe identifier required`);
    ids.add(file.id);
    text(file.name, 120, `${path}.name`); text(file.owner, 40, `${path}.owner`);
    if (!['folder', 'document', 'image', 'pdf'].includes(file.kind)) throw new Error(`${path}.kind: unsupported`);
    if (!date(file.modified) || file.modified > spec.referenceDate) throw new Error(`${path}.modified: valid date <= referenceDate required`);
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 || (file.kind === 'folder' && file.bytes !== 0)) throw new Error(`${path}.bytes: nonnegative integer required; folders use 0`);
    for (const key of ['shared', 'starred', 'trashed']) if (typeof file[key] !== 'boolean') throw new Error(`${path}.${key}: boolean required`);
  });
  spec.files.forEach((file) => {
    const visited = new Set([file.id]);
    let id = file.parentId;
    while (id !== null) {
      const parent = spec.files.find((item) => item.id === id);
      if (!parent || parent.kind !== 'folder' || visited.has(id)) throw new Error(`${file.id}: parent must resolve to a folder; cycles forbidden`);
      visited.add(id); id = parent.parentId;
    }
  });
  return spec;
}
const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export async function generateFiles(spec, assets = '../assets') {
  validateSpec(spec);
  if (!/^(?:(?:\.\.?|[a-zA-Z0-9_-]+)\/)*assets$/.test(assets)) throw new Error('assets: relative local assets directory required');
  const template = (await readFile(resolve(root, 'templates/workspace-files.html'), 'utf8')).replaceAll('\r\n', '\n');
  const values = {
    APP_NAME: escape(spec.appName), ASSETS: assets,
    STORAGE_USED: spec.storage.usedGB, STORAGE_TOTAL: spec.storage.totalGB,
    STORAGE_PERCENT: Math.round(spec.storage.usedGB / spec.storage.totalGB * 100),
    CONFIG: JSON.stringify(stable(spec), null, 2).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026')
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown template slot ${key}`);
    return values[key];
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [input, output, ...flags] = process.argv.slice(2);
    if (!input || !output || flags.some((flag, i) => !['--check', '--assets'].includes(flag) && flags[i - 1] !== '--assets')) throw new Error('Usage: node tools/generate-files.mjs input.json output.html [--assets ../assets] [--check]');
    const assetIndex = flags.indexOf('--assets');
    const html = await generateFiles(JSON.parse(await readFile(input, 'utf8')), assetIndex < 0 ? '../assets' : flags[assetIndex + 1]);
    if (flags.includes('--check')) {
      if (await readFile(output, 'utf8') !== html) throw new Error(`Recipe drift: regenerate ${output}; do not hand-edit generated HTML`);
      console.log(`Recipe ${recipeVersion}: exact output verified (${output})`);
    } else {
      await writeFile(output, html, 'utf8');
      console.log(`Generated ${output} with workspace-files ${recipeVersion}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
