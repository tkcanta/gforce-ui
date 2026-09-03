import { GForceUI as UI } from './gforce.js';

// Local demo only. Data is deliberately not persisted or sent to a server.
const spec = JSON.parse(document.getElementById('files-config').textContent);
let files = structuredClone(spec.files);
let selected = new Set();
let visible = [];
let sort = { key: 'name', ascending: true };
let demo = 'normal';
let activeId, activeTrigger, nameMode, uploadTimer;
let newId = 0;
const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icons = { folder: 'folder', document: 'description', image: 'image', pdf: 'picture_as_pdf' };
const kinds = { folder: 'フォルダ', document: '文書', image: '画像', pdf: 'PDF' };
const routes = { 'my-drive': 'マイドライブ', shared: '共有アイテム', recent: '最近更新した項目', starred: 'スター付き', trash: 'ゴミ箱' };
const route = () => location.hash.slice(1) || 'my-drive';
const folder = () => route().startsWith('folder/') ? files.find((file) => file.id === route().slice(7) && file.kind === 'folder' && !file.trashed) : null;
const size = (file) => file.kind === 'folder' ? '—' : file.bytes >= 1048576 ? `${(file.bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(file.bytes / 1024)} KB`;
const icon = (name) => `<span data-icon="${name}" data-size="24"></span>`;
const announce = (message) => UI.snackbar.show(message);
const resetFilters = () => {
  $('#file-search').value = ''; $('#file-kind').value = ''; $('#file-date').value = '';
  UI.dropdown.sync($('#file-kind')); UI.dropdown.sync($('#file-date'));
  $('#file-search').dispatchEvent(new Event('input', { bubbles: true }));
};
function inScope(file) {
  if (route() === 'trash') return file.trashed;
  if (file.trashed) return false;
  if (folder()) return file.parentId === folder().id;
  if (route() === 'shared') return file.shared;
  if (route() === 'recent') return true;
  if (route() === 'starred') return file.starred;
  return file.parentId === null && file.owner === '自分';
}
function check(file, location) {
  return `<label class="gfu-files__check"><input class="gfu-check__input" type="checkbox" data-files-select="${file.id}" aria-label="${escape(file.name)}を選択" ${selected.has(file.id) ? 'checked' : ''} id="select-${location}-${file.id}"></label>`;
}
function name(file, location, metadata = false) {
  return `<button type="button" class="gfu-files__name" data-files-open="${file.id}" id="open-${location}-${file.id}" title="${escape(file.name)}"><span class="gfu-files__kind" data-kind="${file.kind}" data-icon="${icons[file.kind]}" data-size="24"></span><span class="gfu-files__file-content"><span class="gfu-files__name-text">${escape(file.name)}</span>${metadata ? `<span class="gfu-files__metadata">${escape(file.owner)} · ${file.modified} · ${size(file)}</span>` : ''}</span>${file.starred ? '<span data-icon="star" data-size="16" aria-label="スター付き"></span>' : ''}</button>`;
}
function menu(file, location) {
  return `<button type="button" class="gfu-icon-button" id="menu-${location}-${file.id}" data-files-menu="${file.id}" data-gfu-menu-trigger="file-menu" aria-controls="file-menu" aria-haspopup="menu" aria-expanded="false" aria-label="${escape(file.name)}の操作">${icon('more_vert')}</button>`;
}
function renderSelection() {
  $('#file-count').textContent = selected.size ? `${selected.size} 件を選択中` : `${visible.length} 件`;
  $('#file-toolbar').dataset.selected = String(selected.size > 0);
  for (const id of ['clear-selection', 'bulk-star', 'bulk-trash']) $(`#${id}`).hidden = selected.size === 0;
  $('#bulk-trash').setAttribute('aria-label', route() === 'trash' ? '選択項目を復元' : '選択項目をゴミ箱へ移動');
  all('[data-files-select]').forEach((input) => {
    input.checked = selected.has(input.dataset.filesSelect);
    input.closest('tr,li').dataset.selected = String(input.checked);
  });
  $('#file-select-all').checked = !!visible.length && visible.every((file) => selected.has(file.id));
  $('#file-select-all').indeterminate = visible.some((file) => selected.has(file.id)) && !$('#file-select-all').checked;
  $('#file-select-all').disabled = !visible.length;
}
function render() {
  const activeFolder = folder();
  $('#files-title').textContent = activeFolder?.name || routes[route()] || routes['my-drive'];
  document.title = `${$('#files-title').textContent} — ${spec.appName}`;
  all('[data-files-route]').forEach((link) => {
    if (link.dataset.filesRoute === (activeFolder ? 'my-drive' : route())) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const crumbs = [];
  let parent = activeFolder;
  while (parent) { crumbs.unshift(parent); parent = files.find((file) => file.id === parent.parentId); }
  $('#file-breadcrumbs').hidden = !activeFolder;
  $('#file-breadcrumbs').innerHTML = activeFolder ? `<a href="#my-drive">マイドライブ</a>${crumbs.slice(0, -1).map((file) => `<span aria-hidden="true">/</span><a href="#folder/${file.id}">${escape(file.name)}</a>`).join('')}` : '';
  const query = $('#file-search').value.trim().toLocaleLowerCase('ja');
  const kind = $('#file-kind').value;
  const days = Number($('#file-date').value);
  visible = files.filter((file) => inScope(file) && (!query || file.name.toLocaleLowerCase('ja').includes(query)) && (!kind || file.kind === kind) && (!days || (Date.parse(spec.referenceDate) - Date.parse(file.modified)) / 86400000 <= days));
  if (demo === 'first-empty' || demo === 'loading' || demo === 'error') visible = [];
  visible.sort((a, b) => {
    if (sort.key === 'name' && a.kind !== b.kind && (a.kind === 'folder' || b.kind === 'folder')) return a.kind === 'folder' ? -1 : 1;
    const comparison = typeof a[sort.key] === 'number' ? a[sort.key] - b[sort.key] : a[sort.key].localeCompare(b[sort.key], 'ja', { numeric: true });
    return (sort.ascending ? comparison : -comparison) || a.id.localeCompare(b.id);
  });
  selected = new Set([...selected].filter((id) => visible.some((file) => file.id === id)));
  $('#file-rows').innerHTML = visible.map((file) => `<tr data-file-id="${file.id}"><td>${check(file, 'table')}</td><td>${name(file, 'table')}</td><td>${escape(file.owner)}</td><td>${file.modified}</td><td class="gfu-table__number">${size(file)}</td><td>${menu(file, 'table')}</td></tr>`).join('');
  $('#file-list').innerHTML = visible.map((file) => `<li class="gfu-files__item" data-file-id="${file.id}">${check(file, 'list')}${name(file, 'list', true)}${menu(file, 'list')}</li>`).join('');
  $('#clear-filters').hidden = !query && !kind && !days;
  $('#file-table-wrap').hidden = !visible.length;
  $('#file-list').hidden = !visible.length;
  $('#file-state').hidden = !!visible.length;
  $('.gfu-files').setAttribute('aria-busy', String(demo === 'loading'));
  const empty = !query && !kind && !days;
  const messages = demo === 'loading' ? ['読み込み中', 'ファイルを読み込んでいます。デモを終了できます。', '読み込みを完了']
    : demo === 'error' ? ['ファイルを読み込めませんでした', '接続を確認して、もう一度お試しください。', '再試行']
    : empty ? ['ファイルがありません', '新規メニューからフォルダや文書を作成できます。', 'フォルダを作成']
    : ['一致するファイルがありません', 'キーワードや絞り込み条件を変更してください。', '絞り込みを解除'];
  $('#file-state-title').textContent = messages[0]; $('#file-state-body').textContent = messages[1]; $('#file-state-action').textContent = messages[2];
  const stateIcon = $('#file-state-icon');
  stateIcon.className = demo === 'loading' ? 'gfu-spinner' : '';
  stateIcon.replaceChildren(); delete stateIcon.dataset.iconRendered;
  if (demo === 'loading') delete stateIcon.dataset.icon;
  else stateIcon.dataset.icon = demo === 'error' ? 'error' : empty ? 'folder' : 'search';
  $('#file-state').setAttribute('role', demo === 'error' ? 'alert' : 'status');
  all('[data-files-sort]').forEach((button) => {
    const active = button.dataset.filesSort === sort.key;
    if (active) button.closest('th').setAttribute('aria-sort', sort.ascending ? 'ascending' : 'descending');
    else button.closest('th').removeAttribute('aria-sort');
    const glyph = button.querySelector('[data-icon]');
    if (glyph) { glyph.dataset.icon = active ? (sort.ascending ? 'arrow_up' : 'arrow_down') : 'sort'; delete glyph.dataset.iconRendered; }
  });
  const nextSort = `名前の${sort.key === 'name' && sort.ascending ? '降順' : '昇順'}に並べ替え`;
  $('#mobile-sort').setAttribute('aria-label', nextSort); $('#mobile-sort').dataset.tooltip = nextSort;
  UI.renderIcons(); renderSelection();
}
function showDialog(id, trigger = document.activeElement) {
  const dialog = document.getElementById(id);
  dialog.dataset.returnFocus = trigger?.id || (innerWidth < 600 ? 'create-compact' : 'create-desktop');
  dialog.showModal();
}
function open(file, trigger) {
  if (file.kind === 'folder' && !file.trashed) { location.hash = `folder/${file.id}`; return; }
  $('#preview-title').textContent = 'ファイルの詳細';
  $('#preview-detail').innerHTML = Object.entries({ 名前: file.name, 種類: kinds[file.kind], オーナー: file.owner, 更新日: file.modified, サイズ: size(file), 場所: file.trashed ? 'ゴミ箱' : files.find((item) => item.id === file.parentId)?.name || 'マイドライブ' }).map(([key, value]) => `<dt>${key}</dt><dd>${escape(value)}</dd>`).join('');
  showDialog('preview-dialog', trigger);
}
function showName(mode, trigger) {
  nameMode = mode;
  $('#name-title').textContent = mode === 'rename' ? '名前を変更' : '新規作成';
  $('#file-name-label').textContent = mode === 'rename' ? '名前' : `${kinds[mode]}名`;
  $('#name-submit').textContent = mode === 'rename' ? '保存' : '作成';
  $('#file-name').value = mode === 'rename' ? files.find((file) => file.id === activeId).name : '';
  $('#name-error').textContent = '';
  $('#file-name').setAttribute('aria-invalid', 'false');
  showDialog('name-dialog', trigger); $('#file-name').focus();
}
function addFile(name, kind) {
  demo = 'normal';
  let id; do { id = `created-${++newId}`; } while (files.some((file) => file.id === id));
  const file = { id, parentId: folder()?.id || null, name, kind, owner: '自分', modified: spec.referenceDate, bytes: kind === 'folder' ? 0 : 4096, shared: false, starred: false, trashed: false };
  files.push(file);
  if (!folder() && route() !== 'my-drive') location.hash = 'my-drive';
  resetFilters(); render(); return file;
}
function moveToTrash(ids) {
  const restore = route() === 'trash';
  const affected = files.filter((file) => ids.has(file.id));
  const previous = affected.map((file) => [file, file.trashed]);
  affected.forEach((file) => { file.trashed = !restore; });
  selected.clear(); render(); $('#files-title').focus();
  UI.snackbar.show(`${affected.length} 件を${restore ? '復元しました' : 'ゴミ箱へ移動しました'}`, { action: { label: '元に戻す', onClick() { previous.forEach(([file, value]) => { file.trashed = value; }); render(); } } });
}
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-files-menu]');
  if (trigger) {
    activeId = trigger.dataset.filesMenu; activeTrigger = trigger;
    $('#star-label').textContent = files.find((file) => file.id === activeId).starred ? 'スターを外す' : 'スターを付ける';
    $('#trash-label').textContent = route() === 'trash' ? '復元' : 'ゴミ箱へ移動';
  }
}, true);
document.addEventListener('click', (event) => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.filesOpen) open(files.find((file) => file.id === button.dataset.filesOpen), button);
  if (button.dataset.filesCreate) showName(button.dataset.filesCreate, $('#create-menu').dataset.returnTrigger ? document.getElementById($('#create-menu').dataset.returnTrigger) : null);
  if (button.matches('[data-gfu-menu-trigger="create-menu"]')) $('#create-menu').dataset.returnTrigger = button.id;
  if (button.dataset.filesAction) {
    const file = files.find((item) => item.id === activeId);
    if (button.dataset.filesAction === 'open') open(file, activeTrigger);
    if (button.dataset.filesAction === 'rename') showName('rename', activeTrigger);
    if (button.dataset.filesAction === 'star') { file.starred = !file.starred; render(); document.getElementById(activeTrigger.id)?.focus(); announce(file.starred ? 'スターを付けました' : 'スターを外しました'); }
    if (button.dataset.filesAction === 'trash') moveToTrash(new Set([file.id]));
  }
  if (button.dataset.filesSort || button.id === 'mobile-sort') {
    const key = button.dataset.filesSort || 'name'; sort = { key, ascending: sort.key !== key || !sort.ascending }; render();
  }
  if (button.id === 'view-grid' || button.id === 'view-list') {
    const grid = button.id === 'view-grid'; $('.gfu-files').dataset.view = grid ? 'grid' : 'list';
    $('#view-grid').setAttribute('aria-pressed', String(grid)); $('#view-list').setAttribute('aria-pressed', String(!grid));
  }
  if (button.id === 'clear-filters') { resetFilters(); $('#file-search').focus(); }
  if (button.id === 'clear-selection') { selected.clear(); renderSelection(); $('#files-title').focus(); }
  if (button.id === 'bulk-star') { files.forEach((file) => { if (selected.has(file.id)) file.starred = true; }); render(); announce('選択した項目にスターを付けました'); }
  if (button.id === 'bulk-trash') moveToTrash(selected);
  if (button.dataset.filesDemo) {
    selected.clear(); resetFilters(); demo = button.dataset.filesDemo;
    if (demo === 'no-results') { $('#file-search').value = '存在しないファイル'; $('#file-search').dispatchEvent(new Event('input', { bubbles: true })); }
    render();
    if (demo === 'selected') { selected = new Set(visible.slice(0, 2).map((file) => file.id)); renderSelection(); }
    $('#files-title').focus();
  }
  if (button.id === 'file-state-action') {
    if (demo === 'loading' || demo === 'error') { demo = 'normal'; render(); $('#files-title').focus(); }
    else if ($('#file-search').value || $('#file-kind').value || $('#file-date').value) { resetFilters(); $('#file-search').focus(); }
    else showName('folder', button);
  }
  if (button.matches('[data-files-upload]')) {
    $('#upload-status').textContent = '結果を選んで実行してください。'; UI.progress.set($('#upload-progress'), 0);
    showDialog('upload-dialog', document.getElementById($('#create-menu').dataset.returnTrigger));
  }
  if (button.dataset.filesUploadResult) {
    const success = button.dataset.filesUploadResult === 'success';
    all('[data-files-upload-result]').forEach((node) => { node.disabled = true; });
    $('#upload-status').textContent = 'アップロード中…'; UI.progress.set($('#upload-progress'), 50);
    uploadTimer = setTimeout(() => {
      all('[data-files-upload-result]').forEach((node) => { node.disabled = false; });
      UI.progress.set($('#upload-progress'), success ? 100 : 0);
      $('#upload-status').textContent = success ? 'サンプル文書を追加しました。' : 'アップロードできませんでした。もう一度お試しください。';
      if (success) addFile(`アップロード文書 ${newId + 1}.pdf`, 'pdf');
    }, 500);
  }
});
$('#upload-dialog').addEventListener('close', () => { clearTimeout(uploadTimer); all('[data-files-upload-result]').forEach((button) => { button.disabled = false; }); });
$('#storage-dialog').addEventListener('gfu:open', () => { if (innerWidth < 600) $('#storage-dialog').dataset.returnFocus = 'nav-toggle'; });
$('#name-form').addEventListener('submit', (event) => {
  event.preventDefault(); const value = $('#file-name').value.trim();
  const target = nameMode === 'rename' ? files.find((file) => file.id === activeId) : null;
  const invalid = (message) => { $('#name-error').textContent = message; $('#file-name').setAttribute('aria-invalid', 'true'); $('#file-name').focus(); };
  if (!value || /[\u0000-\u001f]/u.test(value)) { invalid('空白以外の名前を入力してください。'); return; }
  const parentId = target ? target.parentId : folder()?.id || null;
  if (files.some((file) => file.id !== target?.id && !file.trashed && file.parentId === parentId && file.name === value)) { invalid('同じ名前があります。別の名前を入力してください。'); return; }
  if (target) { target.name = value; render(); } else addFile(value, nameMode);
  $('#name-dialog').close('save'); announce(target ? '名前を変更しました' : '作成しました');
});
document.addEventListener('change', (event) => {
  const id = event.target.dataset.filesSelect;
  if (id) { if (event.target.checked) selected.add(id); else selected.delete(id); renderSelection(); }
  if (event.target.id === 'file-select-all') { selected = new Set(event.target.checked ? visible.map((file) => file.id) : []); renderSelection(); }
});
for (const id of ['file-search', 'file-kind', 'file-date']) $(`#${id}`).addEventListener(id === 'file-search' ? 'input' : 'change', () => { if (demo === 'no-results') demo = 'normal'; render(); });
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]') && !$('#files-nav').matches('[data-open="true"]')) { event.preventDefault(); $('#file-search').focus(); }
});
window.addEventListener('hashchange', () => {
  if (!routes[route()] && !folder()) { location.hash = 'my-drive'; return; }
  selected.clear(); demo = 'normal'; sort = { key: route() === 'recent' ? 'modified' : 'name', ascending: route() !== 'recent' };
  resetFilters(); render(); $('#files-title').focus();
});
if (!routes[route()] && !folder()) location.hash = 'my-drive';
render();
