import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const index = await readFile(join(root, 'index.html'), 'utf8');
const css = await readFile(join(root, 'assets', 'gforce.css'), 'utf8');
const js = await readFile(join(root, 'assets', 'gforce.js'), 'utf8');
const contract = JSON.parse(await readFile(join(root, 'docs', 'design-contract.json'), 'utf8'));

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const ids = [...index.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = ids.filter((id, indexValue) => ids.indexOf(id) !== indexValue);
assert(duplicates.length === 0, `Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

const sections = [...index.matchAll(/data-catalog-item/g)].length;
assert(sections >= 25, `Catalog requires at least 25 searchable sections; found ${sections}`);
assert(contract.component_inventory.length >= 50, `Contract requires at least 50 components; found ${contract.component_inventory.length}`);

for (const ref of index.matchAll(/data-gfu-(?:dialog-open|menu-trigger|popover-trigger|side-sheet-open)\s*=\s*["']([^"']+)["']/g)) {
  assert(ids.includes(ref[1]), `Missing referenced target ID: ${ref[1]}`);
}

for (const className of [
  '.gfu-button', '.gfu-field', '.gfu-search', '.gfu-card', '.gfu-tabs', '.gfu-dialog',
  '.gfu-side-sheet', '.gfu-table', '.gfu-combobox', '.gfu-dropdown', '.gfu-snackbar', '.gfu-stepper'
]) {
  assert(css.includes(className), `Compiled CSS missing ${className}`);
}

for (const symbol of ['initTabs', 'initDialogs', 'initComboboxes', 'initDropdowns', 'initTables', 'showSnackbar']) {
  assert(js.includes(symbol), `Behavior bundle missing ${symbol}`);
}

const exampleFiles = (await readdir(join(root, 'examples'))).filter((name) => name.endsWith('.html'));
assert(exampleFiles.length >= 3, `At least 3 composed examples required; found ${exampleFiles.length}`);

if (failures.length) {
  console.error(`Smoke test failed: ${failures.length} issue(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Smoke test passed: ${sections} catalog sections, ${contract.component_inventory.length} inventory entries, ${exampleFiles.length} composed examples.`);
