import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateFiles, validateSpec } from './generate-files.mjs';
import { contractLint } from './contract-lint.mjs';

const spec = JSON.parse(await readFile('examples/files.spec.json', 'utf8'));
const generated = await generateFiles(spec);
assert.equal(generated, await readFile('examples/files.html', 'utf8'));
assert.equal(generated, await generateFiles(Object.fromEntries(Object.entries(spec).reverse())));
assert.deepEqual(await contractLint(resolve('examples/files.html'), generated), []);
let cases = 0;
for (const mutate of [
  (s) => { s.extra = true; }, (s) => { s.profile = 'dashboard'; }, (s) => { s.recipeVersion = 'future'; },
  (s) => { s.appName = ''; }, (s) => { s.referenceDate = '2026-02-30'; }, (s) => { s.storage.usedGB = 99; },
  (s) => { s.files[0].kind = 'video'; }, (s) => { s.files[1].id = s.files[0].id; },
  (s) => { s.files[0].id = '<script>'; }, (s) => { s.files[0].parentId = 'missing'; },
  (s) => { s.files[0].parentId = s.files[0].id; }, (s) => { s.files[0].parentId = 'planning'; },
  (s) => { s.files[0].name = 'x'.repeat(121); }, (s) => { s.files[0].shared = 'yes'; },
  (s) => { s.files[0].bytes = -1; }, (s) => { s.files[0].modified = '2027-01-01'; }
]) {
  const invalid = structuredClone(spec); mutate(invalid); assert.throws(() => validateSpec(invalid)); cases++;
}
const hostile = structuredClone(spec); hostile.files[0].name = '</script><script>alert(1)</script>';
const hostileHTML = await generateFiles(hostile);
assert(!hostileHTML.includes(hostile.files[0].name));
assert(hostileHTML.includes('\\u003c/script\\u003e'));
await assert.rejects(() => generateFiles(spec, 'https://example.com/assets'));

const temporary = await mkdtemp(join(tmpdir(), 'gfu-contract-'));
try {
  const fixtures = [
    ['R02', '<div class="gfu-section"></div>', 'GFU020'],
    ['R04', '<table class="gfu-table"><tbody><tr><td><strong>file.pdf</strong></td></tr></tbody></table>', 'GFU026'],
    ['R05', '<span data-icon="not_registered"></span>', 'GFU021'],
    ['hook', '<button type="button" data-gfu-snackbar-trigger="wrong">Save</button>', 'GFU022'],
    ['dialog', '<dialog class="gfu-dialog"><h2>Wrong wrapper</h2></dialog>', 'GFU023'],
    ['sort', '<button type="button" aria-sort="ascending">名前</button>', 'GFU023'],
    ['target', '<button type="button" data-gfu-dialog-open="missing">Open</button>', 'GFU023'],
    ['label', '<select><option>種類</option></select>', 'GFU023'],
    ['recipe', generated.replace('マイドライブ</h1>', 'Dashboard</h1>'), 'GFU025']
  ];
  for (const [name, html, expected] of fixtures) {
    const result = await contractLint(join(temporary, `${name}.html`), html);
    assert(result.some((issue) => issue.rule === expected), `${name} must fail with ${expected}`); cases++;
  }
  await writeFile(join(temporary, 'app.css'), '.gfu-toolbar { padding: 19px; }');
  const linked = await contractLint(join(temporary, 'consumer.html'), '<link rel="stylesheet" href="app.css">');
  assert(linked.some((issue) => issue.rule === 'GFU024')); cases++;
  assert.deepEqual(await contractLint(join(temporary, 'valid.html'), '<button type="button" class="gfu-button" data-variant="tonal"><span data-icon="folder"></span>開く</button>'), []);
} finally { await rm(temporary, { recursive: true, force: true }); }
console.log(`Files contract passed: deterministic HTML, escaped data, positive fixtures, ${cases} negative cases rejected.`);
