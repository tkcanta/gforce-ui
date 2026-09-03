import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const css = await readFile(new URL('../assets/gforce.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../assets/gforce.js', import.meta.url), 'utf8');
const markup = (kind, hidden) => `<button id="trigger" type="button" aria-expanded="false" data-gfu-${kind}-trigger="panel">開く</button><div id="panel" class="gfu-${kind}" role="${kind === 'menu' ? 'menu' : 'dialog'}" data-open="false"${hidden ? ' hidden' : ''}><button id="item" type="button"${kind === 'menu' ? ' class="gfu-menu__item" role="menuitem"' : ''}>項目</button></div>`;
const server = createServer((request, response) => {
  if (request.url === '/gforce.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(js);
    return;
  }
  const url = new URL(request.url, 'http://localhost');
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<!doctype html><html lang="ja"><head><style>${css}</style></head><body>${url.searchParams.has('dynamic') ? '' : markup(url.searchParams.get('kind'), url.searchParams.has('hidden'))}<script type="module" src="/gforce.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
let count = 0;
try {
  browser = await chromium.launch({ channel: process.env.GFU_BROWSER_CHANNEL || undefined });
  for (const kind of ['menu', 'popover']) {
    for (const initial of ['css', 'hidden', 'dynamic']) {
      const page = await browser.newPage();
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/?kind=${kind}&${initial}`);
        await page.waitForFunction(() => document.documentElement.dataset.gfuInitialized === 'true');
        if (initial === 'dynamic') await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), markup(kind, true));
        for (const phase of ['first', 'reopen']) {
          const result = await page.evaluate(async () => {
            const panel = document.getElementById('panel');
            document.getElementById('trigger').click();
            const transitions = panel.getAnimations();
            const names = transitions.map(animation => animation.transitionProperty);
            for (const animation of transitions) { animation.pause(); animation.currentTime = 50; }
            const opacity = Number(getComputedStyle(panel).opacity);
            for (const animation of transitions) animation.play();
            await Promise.all(transitions.map(animation => animation.finished));
            return { names, opacity, endOpacity: getComputedStyle(panel).opacity };
          });
          assert(result.names.includes('opacity') && result.names.includes('transform'), `${kind}/${initial}/${phase}: missing transitions`);
          assert(result.opacity > 0 && result.opacity < 1, `${kind}/${initial}/${phase}: no intermediate opacity`);
          assert.equal(result.endOpacity, '1');
          await page.keyboard.press('Escape');
          await page.evaluate(async () => { await Promise.all(document.getElementById('panel').getAnimations().map(animation => animation.finished)); });
          assert.equal(await page.locator('#trigger').getAttribute('aria-expanded'), 'false');
          assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('panel')).visibility), 'hidden');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'trigger');
        }
        await page.evaluate(() => {
          const trigger = document.getElementById('trigger');
          trigger.click(); trigger.click(); trigger.click();
        });
        await page.evaluate(async () => { await Promise.all(document.getElementById('panel').getAnimations().map(animation => animation.finished)); });
        assert.equal(await page.locator('#trigger').getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const duration = await page.evaluate(() => {
          document.getElementById('trigger').click();
          return Math.max(...getComputedStyle(document.getElementById('panel')).transitionDuration.split(',').map(value => parseFloat(value)));
        });
        assert(duration <= 0.001, `${kind}/${initial}: reduced motion not honored`);
        count++;
      } finally { await page.close(); }
    }
  }
  console.log(`Floating motion passed: ${count} cases; first open, reopen, interrupted open, Escape/focus, reduced motion.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
