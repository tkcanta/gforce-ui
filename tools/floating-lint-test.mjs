import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'gfu-lint-'));
const file = join(directory, 'page.html');
try {
  for (const component of ['gfu-menu', 'gfu-popover']) {
    for (const [utility, expected] of [
      ['', null], ['motion-reduce:transition-none', null],
      ['hidden', 'GFU018'], ['md:hidden', 'GFU018'], ['!hidden', 'GFU018'], ['hidden!', 'GFU018'],
      ['transition-none', 'GFU019'], ['animate-none', 'GFU019'], ['duration-0', 'GFU019']
    ]) {
      await writeFile(file, `<div class="${component} ${utility}" data-open="false" hidden></div>`);
      const result = spawnSync(process.execPath, ['tools/design-lint.mjs', file], { encoding: 'utf8' });
      assert.equal(result.status, expected ? 1 : 0, `${component}/${utility}: ${result.stderr}`);
      if (expected) assert(result.stderr.includes(expected));
    }
  }
  console.log('Floating lint passed: visibility/motion overrides rejected; initial hidden attribute and reduced motion allowed.');
} finally {
  await rm(file, { force: true });
  await rmdir(directory);
}
