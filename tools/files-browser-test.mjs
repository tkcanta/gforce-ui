import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('.');
const output = resolve(process.env.GFU_TEST_OUTPUT || 'test-results/files');
await mkdir(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const file = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    if (!file.startsWith(root + sep)) throw new Error('outside root');
    const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json' };
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.GFU_BROWSER_CHANNEL || undefined });
const results = { recipe: 'workspace-files@1.2.0', viewports: [], checks: [] };
const test = async (name, fn) => { await fn(); results.checks.push(name); console.log(`PASS ${name}`); };
const context = await browser.newContext({ reducedMotion: 'reduce', locale: 'ja-JP' });
const page = await context.newPage();
await page.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
const errors = [];
page.on('pageerror', (error) => { errors.push(error.message); console.error(error); });
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
async function load(width = 1366, height = 768) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/examples/files.html`);
  await page.evaluate(() => document.fonts.ready);
}
const visibleRows = () => page.locator('.gfu-files__table tbody tr:visible, .gfu-files__list li:visible');
async function chooseDropdown(id, label) {
  await page.locator(`#${id}-trigger`).click();
  await page.locator(`#${id}-listbox`).getByRole('option', { name: label, exact: true }).click();
}
async function demo(state) {
  await page.locator('#account-trigger').click();
  await page.locator(`[data-files-demo="${state}"]`).click();
}
try {
  for (const [width, height] of [[1440, 900], [1366, 768], [1024, 768], [840, 900], [839, 900], [768, 1024], [600, 900], [390, 844], [320, 844]]) {
    await load(width, height);
    const metrics = await page.evaluate(() => {
      const rect = (node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
      const rows = [...document.querySelectorAll('.gfu-files__table tbody tr, .gfu-files__list li')].filter((row) => row.getClientRects().length && getComputedStyle(row).visibility !== 'hidden');
      return { viewport: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, rows: rows.map(rect), name: rect(document.querySelector('.gfu-files__title')), search: rect(document.querySelector('#file-search')), pane: document.querySelector('.gfu-files').clientWidth - parseFloat(getComputedStyle(document.querySelector('.gfu-files')).paddingLeft) - parseFloat(getComputedStyle(document.querySelector('.gfu-files')).paddingRight), visibleFullRows: rows.filter((row) => row.getBoundingClientRect().bottom <= innerHeight).length };
    });
    results.viewports.push(metrics);
    await page.screenshot({ path: resolve(output, `viewport-${width}.png`), fullPage: true });
    await test(`layout-${width}`, async () => {
      assert(metrics.scroll <= metrics.client + 1, `page overflow: ${JSON.stringify(metrics)}`);
      assert.equal(metrics.rows.length, 8);
      if ([1366, 390].includes(width)) {
        assert(metrics.rows[0].y <= 280, `first row ${metrics.rows[0].y}`);
        assert(metrics.visibleFullRows >= (width === 1366 ? 6 : 4));
      }
      if (width === 320) assert(metrics.search.width >= 160, `search input ${metrics.search.width}`);
      assert(metrics.rows.every((row) => row.height >= 48));
      if (metrics.pane < 720) assert(await page.locator('.gfu-files__table-wrap').isHidden());
    });
  }
  await load();
  await test('fonts-and-type', async () => {
    const session = await context.newCDPSession(page);
    await session.send('DOM.enable'); await session.send('CSS.enable');
    const { root: doc } = await session.send('DOM.getDocument');
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: doc.nodeId, selector: '#open-table-planning .gfu-files__name-text' });
    const font = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    results.fonts = font.fonts;
    assert(font.fonts.every((item) => item.isCustomFont), JSON.stringify(font));
    assert(font.fonts.some((item) => /Roboto/i.test(item.familyName)));
    assert(font.fonts.some((item) => /Noto Sans JP/i.test(item.familyName)));
    const type = await page.locator('#open-table-planning').evaluate((node) => ({ weight: getComputedStyle(node).fontWeight, size: getComputedStyle(node).fontSize }));
    assert.deepEqual(type, { weight: '400', size: '14px' });
    results.fontWeights = [];
    for (const weight of [400, 500, 600]) {
      await page.evaluate((weight) => {
        const node = document.createElement('span'); node.id = `font-${weight}`; node.style.fontWeight = String(weight); node.textContent = 'File 日本語 123'; document.body.append(node);
      }, weight);
      await page.evaluate(() => document.fonts.ready);
      const { nodeId: testId } = await session.send('DOM.querySelector', { nodeId: doc.nodeId, selector: `#font-${weight}` });
      const rendered = (await session.send('CSS.getPlatformFontsForNode', { nodeId: testId })).fonts;
      assert(rendered.length >= 2 && rendered.every((font) => font.isCustomFont));
      assert.equal(await page.locator(`#font-${weight}`).evaluate((node) => getComputedStyle(node).fontWeight), String(weight));
      results.fontWeights.push({ weight, rendered }); await page.locator(`#font-${weight}`).evaluate((node) => node.remove());
    }
    await session.detach();
  });
  await test('search-filter-clear-keyboard', async () => {
    await page.keyboard.press('Control+k'); assert(await page.locator('#file-search').evaluate((node) => node === document.activeElement));
    await page.locator('#file-search').fill('事業計画'); assert.equal(await visibleRows().count(), 1);
    await page.locator('[data-gfu-search-clear]').click(); assert.equal(await visibleRows().count(), 8);
    await chooseDropdown('file-kind', 'PDF'); assert.equal(await visibleRows().count(), 2);
    await chooseDropdown('file-date', '7日以内'); assert.equal(await visibleRows().count(), 1);
    await page.locator('#clear-filters').click(); assert.equal(await visibleRows().count(), 8);
    await page.locator('#file-search').fill('not-a-file'); assert(await page.locator('#file-state-title').innerText() === '一致するファイルがありません');
    await page.locator('#file-state-action').click(); assert.equal(await visibleRows().count(), 8);
  });
  await test('navigation-folder-breadcrumbs', async () => {
    // Hash navigation is a queued browser event; assert the resulting view, not click timing.
    await page.locator('[href="#shared"]').click(); await page.waitForFunction(() => document.querySelector('#files-title').textContent === '共有アイテム'); assert.equal(await visibleRows().count(), 5);
    assert.equal(await page.locator('[aria-current="page"]').count(), 1);
    await page.locator('[data-files-route="my-drive"]').click(); await page.waitForFunction(() => document.querySelector('#files-title').textContent === 'マイドライブ');
    await page.locator('#open-table-projects').click(); await page.waitForFunction(() => document.querySelector('#files-title').textContent === 'プロジェクト'); assert.equal(await visibleRows().count(), 1);
    await page.locator('#file-breadcrumbs a').click(); await page.waitForFunction(() => document.querySelector('#files-title').textContent === 'マイドライブ'); assert.equal(await visibleRows().count(), 8);
  });
  await test('selection-sort-bulk-undo', async () => {
    await page.locator('#file-select-all').check(); assert.equal(await page.locator('#file-count').innerText(), '8 件を選択中'); await page.locator('#clear-selection').click();
    const before = await page.locator('#file-toolbar').boundingBox();
    await page.locator('#select-table-guide').check(); await page.locator('#select-table-planning').check();
    assert.equal(await page.locator('#file-count').innerText(), '2 件を選択中');
    assert.equal((await page.locator('#file-toolbar').boundingBox()).height, before.height);
    await page.screenshot({ path: resolve(output, 'state-selected.png'), fullPage: true });
    await page.locator('#bulk-star').click(); await page.locator('#bulk-trash').click(); assert.equal(await visibleRows().count(), 6);
    await page.getByRole('button', { name: '元に戻す', exact: true }).click(); assert.equal(await visibleRows().count(), 8);
    await page.locator('[data-files-sort="modified"]').click(); assert.equal(await page.locator('th[aria-sort="ascending"]').count(), 1); assert.equal(await page.locator('button[aria-sort]').count(), 0);
  });
  await test('create-menu-dialog-focus-validation', async () => {
    await page.locator('#create-desktop').click(); assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.locator('[data-files-create="folder"]').click(); assert(await page.locator('#file-name').evaluate((node) => node === document.activeElement));
    await page.screenshot({ path: resolve(output, 'dialog-name.png'), fullPage: true });
    await page.locator('#file-name').fill('プロジェクト'); await page.locator('#name-submit').click(); assert(await page.locator('#name-error').innerText());
    await page.locator('#file-name').fill('検証用フォルダ'); await page.locator('#name-submit').click(); assert.equal(await visibleRows().count(), 9);
    await page.locator('#create-desktop').click(); await page.locator('[data-files-create="document"]').click(); await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.id === 'create-desktop');
    assert(await page.locator('#create-desktop').evaluate((node) => node === document.activeElement));
  });
  await test('file-menu-preview-and-rename', async () => {
    await page.locator('#menu-table-guide').click(); await page.locator('[data-files-action="open"]').click(); assert(await page.locator('#preview-detail').innerText().then((text) => text.includes('サービスガイド.pdf')));
    await page.keyboard.press('Escape'); await page.waitForFunction(() => document.activeElement?.id === 'menu-table-guide');
    await page.locator('#menu-table-guide').click(); await page.locator('[data-files-action="rename"]').click();
    await page.locator('#file-name').fill('改訂サービスガイド.pdf'); await page.locator('#name-submit').click(); assert(await page.locator('#open-table-guide').innerText().then((text) => text.includes('改訂サービスガイド.pdf')));
  });
  await test('six-states-and-recovery', async () => {
    for (const state of ['normal', 'selected', 'no-results', 'first-empty', 'loading', 'error']) {
      await load();
      await demo(state); await page.screenshot({ path: resolve(output, `state-${state}.png`), fullPage: true });
      if (['no-results', 'first-empty', 'loading', 'error'].includes(state)) assert(await page.locator('#file-state').isVisible());
      if (['no-results', 'loading', 'error'].includes(state)) { await page.locator('#file-state-action').click(); assert(await visibleRows().count() > 0); }
    }
    await demo('normal');
  });
  await test('upload-success-failure-progress', async () => {
    await page.locator('#create-desktop').click(); await page.locator('[data-files-upload]').click();
    await page.locator('[data-files-upload-result="error"]').click(); await page.waitForFunction(() => document.querySelector('#upload-status').textContent.includes('できません'));
    await page.locator('[data-files-upload-result="success"]').click(); await page.waitForFunction(() => document.querySelector('#upload-status').textContent.includes('追加しました'));
    assert.equal(await page.locator('#upload-progress').getAttribute('aria-valuenow'), '100'); await page.keyboard.press('Escape');
  });
  await test('values-icons-and-public-apis', async () => {
    const values = await page.evaluate(() => {
      const progress = document.querySelector('#upload-progress');
      const measurements = [0, 68, 100, -5, 120, NaN].map((value) => { GForceUI.progress.set(progress, value); return [progress.dataset.value, progress.getAttribute('aria-valuenow'), progress.firstElementChild.style.inlineSize]; });
      GForceUI.theme.set('dark'); GForceUI.theme.toggle(); GForceUI.density.set('touch'); GForceUI.density.set('comfortable');
      const unknown = document.createElement('span'); unknown.dataset.icon = 'unregistered-test'; document.body.append(unknown);
      let failed = false; try { GForceUI.renderIcons(); } catch (error) { failed = error.message.includes('GFU_UNKNOWN_ICON'); } finally { unknown.remove(); }
      return { measurements, failed, meter: document.querySelector('.gfu-meter').value };
    });
    assert.deepEqual(values.measurements, [0, 68, 100, 0, 100, 0].map((value) => [String(value), String(value), `${value}%`]));
    assert(values.failed); assert.equal(values.meter, 68);
  });
  await test('tooltip-placement-hover-focus-escape', async () => {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 }); await page.locator('#account-trigger').hover();
      await page.locator('.gfu-tooltip').waitFor({ state: 'visible' });
      const box = await page.locator('.gfu-tooltip').boundingBox(); assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= 844);
      await page.locator('.gfu-tooltip').hover(); await page.waitForTimeout(250); assert(await page.locator('.gfu-tooltip').isVisible());
      await page.keyboard.press('Escape'); assert.equal(await page.locator('.gfu-tooltip').count(), 0);
      await page.locator('#file-search').focus(); await page.locator('#account-trigger').focus(); await page.locator('.gfu-tooltip').waitFor({ state: 'visible' }); await page.keyboard.press('Escape');
    }
  });
  await test('mobile-drawer-trap-return-resize', async () => {
    for (const width of [320, 390]) {
      await load(width, 844); await page.locator('#nav-toggle').click();
      await page.waitForFunction(() => document.activeElement?.dataset.filesRoute === 'my-drive', null, { timeout: 2000 });
      await page.screenshot({ path: resolve(output, `drawer-${width}.png`) });
      assert(await page.locator('main').evaluate((node) => node.inert));
      await page.keyboard.press('Shift+Tab'); assert(await page.locator('#storage-trigger').evaluate((node) => node === document.activeElement), await page.evaluate(() => `${document.activeElement.tagName}#${document.activeElement.id}`));
      await page.keyboard.press('Tab'); assert(await page.locator('[data-files-route="my-drive"]').evaluate((node) => node === document.activeElement));
      await page.keyboard.press('Escape'); assert(await page.locator('#nav-toggle').evaluate((node) => node === document.activeElement));
      await page.locator('#nav-toggle').click(); await page.locator('[data-gfu-nav-scrim]').click({ position: { x: width - 4, y: 10 } }); assert(await page.locator('#nav-toggle').evaluate((node) => node === document.activeElement));
      await page.locator('#nav-toggle').click(); await page.setViewportSize({ width: 600, height: 844 }); await page.waitForFunction(() => !document.querySelector('[inert]')); assert.equal(await page.locator('[inert]').count(), 0);
      await page.setViewportSize({ width: 840, height: 844 }); assert.equal(await page.locator('[aria-modal="true"]').count(), 0);
    }
  });
  await test('ordinary-motion-drawer-and-storage-return', async () => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(390, 844); await page.locator('#nav-toggle').click();
    await page.waitForFunction(() => document.activeElement?.dataset.filesRoute === 'my-drive');
    await page.locator('#storage-trigger').click(); assert(await page.locator('#storage-dialog').isVisible());
    await page.keyboard.press('Escape'); await page.waitForFunction(() => document.activeElement?.id === 'nav-toggle');
    assert.equal(await page.locator('[inert]').count(), 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });
  await test('keyboard-filters-menu-dialog-at-320', async () => {
    await load(320, 844);
    await page.locator('#file-kind-trigger').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#file-kind').inputValue(), 'folder'); assert.equal(await visibleRows().count(), 2);
    await page.locator('#clear-filters').click();
    await page.locator('#create-compact').focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.dataset.filesCreate === 'folder');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#file-name-label').innerText(), '文書名');
    assert.equal(await page.locator('#name-title').innerText(), '新規作成');
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab'); assert(await page.locator('#name-submit').evaluate((node) => node === document.activeElement));
    await page.screenshot({ path: resolve(output, 'dialog-mobile.png'), fullPage: true });
    await page.keyboard.press('Escape'); await page.waitForFunction(() => document.activeElement?.id === 'create-compact');
    await page.keyboard.press('Enter'); await page.locator('#create-menu').waitFor({ state: 'visible' }); await page.keyboard.press('Escape'); await page.waitForFunction(() => document.activeElement?.id === 'create-compact');
  });
  await test('long-names-mobile-selection-and-grid', async () => {
    await load();
    await page.locator('#menu-table-guide').click(); await page.locator('[data-files-action="rename"]').click();
    const longName = '仕様検討資料'.repeat(16) + '.pdf';
    await page.locator('#file-name').fill(longName); await page.locator('#name-submit').click();
    await page.locator('#view-grid').click(); assert(await page.locator('#file-table-wrap').isHidden()); assert.equal(await visibleRows().count(), 8);
    await page.screenshot({ path: resolve(output, 'grid-desktop.png'), fullPage: true });
    await page.locator('#view-list').click();
    for (const width of [1366, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const action = page.locator(`#menu-${width === 1366 ? 'table' : 'list'}-guide`);
      const bounds = await action.boundingBox(); assert(bounds.x >= 0 && bounds.x + bounds.width <= width);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
      await action.click(); await page.locator('[data-files-action="open"]').click(); assert((await page.locator('#preview-detail').innerText()).includes(longName)); await page.keyboard.press('Escape');
    }
    await page.locator('#select-list-guide').check();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY === 0);
    await page.screenshot({ path: resolve(output, 'long-name-mobile-selected.png'), fullPage: true });
    await page.locator('#clear-selection').click();
  });
  await test('alignment-row-height-rail-and-contrast', async () => {
    await load();
    const alignment = await page.evaluate(() => ({ search: document.querySelector('.gfu-topbar__search').getBoundingClientRect().left, title: document.querySelector('#files-title').getBoundingClientRect().left, row: document.querySelector('#file-rows tr').getBoundingClientRect().height }));
    assert(Math.abs(alignment.search - alignment.title) <= 8); assert.equal(alignment.row, 48);
    assert.equal((await page.locator('[data-files-route="my-drive"] svg').boundingBox()).width, 24);
    assert.equal((await page.locator('#open-table-guide .gfu-files__kind svg').boundingBox()).width, 24);
    await page.evaluate(() => GForceUI.density.set('touch')); assert.equal((await page.locator('#file-rows tr').first().boundingBox()).height, 56); await page.evaluate(() => GForceUI.density.set('comfortable'));
    await page.setViewportSize({ width: 768, height: 1024 });
    assert.equal((await page.locator('#files-nav').boundingBox()).width, 80); assert(await page.locator('.gfu-files__storage').isHidden());
    await page.setViewportSize({ width: 1366, height: 768 });
    for (const theme of ['light', 'dark']) {
      const contrasts = await page.evaluate((theme) => {
        GForceUI.theme.set(theme);
        const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const lum = (value) => rgb(value).map((n) => n / 255).map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
        const bg = getComputedStyle(document.querySelector('.gfu-files')).backgroundColor;
        return ['#open-table-planning', '.gfu-files__metadata', '.gfu-files__kind[data-kind="document"]', '.gfu-files__kind[data-kind="image"]', '.gfu-files__kind[data-kind="pdf"]'].map((selector) => {
          const color = getComputedStyle(document.querySelector(selector)).color;
          const a = lum(color), b = lum(bg); return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
        });
      }, theme);
      assert(contrasts.every((item) => item.ratio >= (item.selector.includes('__kind') ? 3 : 4.5)), JSON.stringify(contrasts));
      results[`${theme}Contrast`] = contrasts;
    }
  });
  await test('numeric-progress-geometry-and-negative-fixture', async () => {
    await page.evaluate(() => { const node = document.createElement('div'); node.id = 'progress-fixture'; node.className = 'gfu-progress-linear'; node.innerHTML = '<span class="gfu-progress-linear__bar"></span>'; document.body.append(node); });
    const ratio = () => page.locator('#progress-fixture').evaluate((node) => node.firstElementChild.getBoundingClientRect().width / node.getBoundingClientRect().width);
    for (const value of [0, 68, 100]) {
      await page.evaluate((value) => GForceUI.progress.set(document.querySelector('#progress-fixture'), value), value);
      await page.waitForFunction((value) => { const node = document.querySelector('#progress-fixture'); return Math.abs(node.firstElementChild.getBoundingClientRect().width / node.getBoundingClientRect().width - value / 100) < .001; }, value);
      assert(Math.abs(await ratio() - value / 100) < .001);
    }
    await page.evaluate(() => { const node = document.querySelector('#progress-fixture'); node.dataset.progress = '68'; node.firstElementChild.style.inlineSize = '100%'; });
    const broken = await ratio(); assert.throws(() => assert(Math.abs(broken - .68) < .001), 'R19 negative fixture must fail value/width gate');
    await page.locator('#progress-fixture').evaluate((node) => node.remove());
  });
  await test('shared-table-containment-positive-negative', async () => {
    const fixture = await context.newPage();
    await fixture.setViewportSize({ width: 390, height: 844 });
    await fixture.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${base}/assets/gforce.css"></head><body><div class="gfu-table-wrap"><table class="gfu-table"><colgroup><col style="width:624px"><col style="width:48px"></colgroup><thead><tr><th>名前</th><th><span class="gfu-visually-hidden">操作</span></th></tr></thead></table></div></body></html>`);
    await fixture.waitForFunction(() => getComputedStyle(document.querySelector('.gfu-table-wrap')).position === 'relative');
    const overflow = () => fixture.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.equal(await overflow(), 0);
    await fixture.addStyleTag({ content: '.gfu-table-wrap {position:static}' });
    assert(await overflow() > 0, 'R13 known broken fixture must overflow: ' + await fixture.evaluate(() => JSON.stringify({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, parent: document.querySelector('.gfu-visually-hidden').offsetParent?.tagName, hidden: document.querySelector('.gfu-visually-hidden').getBoundingClientRect().toJSON(), wrap: getComputedStyle(document.querySelector('.gfu-table-wrap')).position, table: document.querySelector('table').getBoundingClientRect().toJSON() })));
    await fixture.close();
  });
  await test('wide-xlarge-and-documented-hooks', async () => {
    const fixture = await context.newPage(); await fixture.setViewportSize({ width: 2000, height: 900 });
    await fixture.goto(`${base}/index.html`);
    const values = await fixture.evaluate(() => {
      const page = document.createElement('div'); page.className = 'gfu-page'; page.dataset.width = 'wide'; document.body.append(page);
      return { width: page.getBoundingClientRect().width, gutter: getComputedStyle(document.documentElement).getPropertyValue('--gfu-page-gutter').trim() };
    });
    assert.equal(values.width, 1600); assert.equal(values.gutter, '3rem');
    const chip = fixture.locator('[data-gfu-filter-chip]').first();
    assert.equal(await chip.getAttribute('aria-pressed'), 'true'); await chip.click(); assert.equal(await chip.getAttribute('aria-pressed'), 'false'); await chip.click(); assert.equal(await chip.getAttribute('aria-pressed'), 'true');
    await fixture.locator('[data-gfu-snackbar]').first().click(); assert(await fixture.locator('.gfu-snackbar').count() > 0);
    await fixture.evaluate(() => {
      const button = document.createElement('button'); button.id = 'dynamic-theme'; button.type = 'button'; button.dataset.gfuThemeToggle = ''; button.textContent = 'テーマ'; document.body.append(button);
      GForceUI.theme.set('light'); GForceUI.init(button); GForceUI.init(button); button.click();
    });
    assert.equal(await fixture.locator('html').getAttribute('data-theme'), 'dark');
    await fixture.close();
  });
  await test('dropdown-visual-keyboard-form-and-motion', async () => {
    for (const width of [1366, 390, 320]) {
      await load(width, 844);
      await page.evaluate(() => GForceUI.theme.set('light'));
      const trigger = page.locator('#file-kind-trigger'), list = page.locator('#file-kind-listbox');
      await trigger.focus(); const before = await trigger.boundingBox(); await page.keyboard.press('Enter');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      assert(await trigger.evaluate((node) => node === document.activeElement));
      const geometry = await list.boundingBox();
      assert(geometry.x >= 8 && geometry.x + geometry.width <= width - 8 && geometry.y >= before.y + before.height + 7);
      const style = await trigger.evaluate((node) => ({ outline: getComputedStyle(node).outlineWidth, shadow: getComputedStyle(node).boxShadow }));
      assert.equal(style.outline, '0px'); assert.notEqual(style.shadow, 'none');
      assert(await page.locator('#file-kind').isHidden());
      assert.equal(await list.evaluate((node) => getComputedStyle(node).borderRadius), '12px');
      assert.notEqual(await list.evaluate((node) => getComputedStyle(node).boxShadow), 'none');
      await page.screenshot({ path: resolve(output, `dropdown-${width}.png`) });
      await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('#file-kind').inputValue(), '');
      await page.keyboard.press('Escape'); assert.equal(await page.locator('#file-kind').inputValue(), '');
      await chooseDropdown('file-kind', 'PDF'); assert.equal(await page.locator('#file-kind').inputValue(), 'pdf');
      assert.equal(await page.locator('#file-kind-value').innerText(), 'PDF');
      assert.equal((await trigger.boundingBox()).width, before.width);
      await page.locator('#clear-filters').click(); assert.equal(await page.locator('#file-kind-value').innerText(), 'すべて');
      await trigger.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
      assert.equal(await page.locator('#file-kind').inputValue(), 'folder');
      assert(await page.locator('#file-date-trigger').evaluate((node) => node === document.activeElement));
      await page.locator('#clear-filters').click();
      await trigger.click(); await page.locator('#files-title').click(); assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    }
    await load(); await page.evaluate(() => GForceUI.theme.set('dark')); await page.locator('#file-kind-trigger').click();
    await page.screenshot({ path: resolve(output, 'dropdown-dark.png') }); await page.keyboard.press('Escape');
    await page.goto(`${base}/index.html`); await page.evaluate(() => document.fonts.ready);
    const plan = page.locator('#plan-dropdown-trigger');
    assert(await page.locator('#locked-dropdown-trigger').isDisabled());
    assert.equal(await page.locator('#dropdown-form').evaluate((form) => form.reportValidity()), false);
    assert.equal(await plan.getAttribute('aria-invalid'), 'true'); assert(await plan.evaluate((node) => node === document.activeElement));
    await plan.press('t'); await plan.press('Enter'); assert.equal(await page.locator('#plan-dropdown').inputValue(), 'team');
    assert.equal(await page.locator('#dropdown-form').evaluate((form) => new FormData(form).get('plan')), 'team');
    assert.equal(await plan.getAttribute('aria-invalid'), 'false');
    await page.locator('#dropdown-form [type="reset"]').click(); await page.waitForFunction(() => document.querySelector('#plan-dropdown-value').textContent === '選択してください');
    await page.locator('#role-dropdown-trigger').focus(); await page.keyboard.press('End');
    assert.equal(await page.locator('#role-dropdown-trigger').getAttribute('aria-activedescendant'), 'role-dropdown-option-1'); await page.keyboard.press('Escape');
    await page.evaluate(() => { const select = document.querySelector('#role-dropdown'); select.value = 'editor'; GForceUI.dropdown.sync(select); GForceUI.init(select.parentElement); GForceUI.init(select.parentElement); });
    assert.equal(await page.locator('#role-dropdown-value').innerText(), '編集者'); assert.equal(await page.locator('#role-dropdown-trigger').count(), 1);
    await page.evaluate(() => { window.dropdownEvents = { input: 0, change: 0 }; for (const type of ['input', 'change']) document.querySelector('#role-dropdown').addEventListener(type, () => window.dropdownEvents[type]++); });
    await chooseDropdown('role-dropdown', '閲覧者'); await chooseDropdown('role-dropdown', '閲覧者');
    assert.deepEqual(await page.evaluate(() => window.dropdownEvents), { input: 1, change: 1 });
    await page.locator('#select-combobox').screenshot({ path: resolve(output, 'dropdown-catalog.png') });
    await page.evaluate(() => { const dialog = document.querySelector('#standard-dialog'); dialog.querySelector('.gfu-dialog__body').append(document.querySelector('#role-dropdown').parentElement); dialog.showModal(); });
    await page.locator('#role-dropdown-trigger').click();
    assert(await page.locator('#role-dropdown-listbox').evaluate((node) => { const rect = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(rect.left + 24, rect.top + 24)); }));
    await page.locator('#role-dropdown-listbox').getByRole('option', { name: '編集者', exact: true }).click(); await page.keyboard.press('Escape');
    await page.evaluate(() => { const host = document.querySelector('#role-dropdown').parentElement; document.body.append(host); Object.assign(host.style, { position: 'fixed', bottom: '8px', right: '8px' }); });
    await page.locator('#role-dropdown-trigger').click(); assert.equal(await page.locator('#role-dropdown-listbox').getAttribute('data-placement'), 'top');
    const edge = await page.locator('#role-dropdown-listbox').boundingBox(), anchor = await page.locator('#role-dropdown-trigger').boundingBox();
    assert(edge.x >= 8 && edge.x + edge.width <= 1358 && edge.y + edge.height <= anchor.y - 7); await page.keyboard.press('Escape');
    await load(); await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert(await page.locator('#file-kind-trigger').evaluate((node) => { node.click(); return document.querySelector('#file-kind-listbox').getAnimations().some((animation) => animation.transitionProperty === 'opacity'); }));
    await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#file-kind-trigger').click(); assert(await page.locator('#file-kind-listbox').evaluate((node) => getComputedStyle(node).transitionDuration.split(',').every((duration) => parseFloat(duration) <= .001))); await page.keyboard.press('Escape');
  });
  await test('dropdown-native-ban-and-single-row-arrow', async () => {
    const aligned = () => page.locator('.gfu-dropdown__trigger').evaluateAll((buttons) => buttons.every((button) => {
      const value = button.querySelector('.gfu-dropdown__value').getBoundingClientRect(), arrow = button.querySelector('.gfu-dropdown__arrow').getBoundingClientRect(), box = button.getBoundingClientRect();
      return value.width > 0 && arrow.width >= 20 && Math.abs(value.y + value.height / 2 - arrow.y - arrow.height / 2) <= 1 && value.right <= arrow.left && arrow.right <= box.right && box.right <= innerWidth;
    }));
    for (const width of [1366, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(`${base}/index.html`); await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('select:visible').count(), 0);
      assert.equal(await page.locator('.gfu-select-wrap, .gfu-field__select').count(), 0);
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => GForceUI.theme.set(theme), theme);
        assert(await aligned(), `value/arrow must share one row: ${width}/${theme}`);
        await page.locator('#long-dropdown-trigger').click();
        const menu = await page.locator('#long-dropdown-listbox').boundingBox(); assert(menu.x >= 8 && menu.x + menu.width <= width - 8);
        if (theme === 'light') await page.screenshot({ path: resolve(output, `dropdown-long-${width}.png`) });
        await page.keyboard.press('Escape'); await chooseDropdown('long-dropdown', 'マイドライブ'); assert(await aligned());
        await page.evaluate(() => { const select = document.querySelector('#long-dropdown'); select.selectedIndex = 0; GForceUI.dropdown.sync(select); });
      }
      if (width === 320) await page.locator('#select-combobox').screenshot({ path: resolve(output, 'dropdown-catalog-320.png') });
    }
    await page.locator('#long-dropdown-trigger').evaluate((node) => { node.style.flexDirection = 'column'; });
    assert.equal(await aligned(), false, 'known wrapped-arrow fixture must fail geometry gate');
    await page.goto(`${base}/examples/list-detail.html`);
    await page.locator('#list-detail-sheet-trigger').click(); await page.locator('#detail-status-trigger').click();
    assert.equal(await page.locator('select:visible').count(), 0);
    await page.locator('#detail-status-listbox').getByRole('option', { name: '下書き', exact: true }).click();
    assert.equal(await page.locator('#detail-status').inputValue(), '下書き');
  });
  await load(1440, 900);
  await page.evaluate(() => GForceUI.theme.set('dark'));
  await page.screenshot({ path: resolve(output, 'dark-desktop.png'), fullPage: true });
  assert.deepEqual(errors, []);
  results.checks.push('no-browser-errors');
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close(); await new Promise((done) => server.close(done));
}
console.log(`Files browser checks passed: ${results.checks.length}; evidence: ${output}`);
