# G-Force UI Component API

## 共通属性

| 属性 | 値 | 用途 |
|---|---|---|
| `data-variant` | component-defined | 視覚Variant |
| `data-size` | `sm` / `md` / `lg` | 局所サイズ。Density優先 |
| `data-state` | component-defined | JavaScript管理状態 |
| `data-loading` | `true` / `false` | Loading状態 |
| `data-invalid` | `true` / `false` | Invalid状態 |
| `data-gfu-*` | IDまたはboolean | Behavior hook |

`gfu-*`クラスは見た目、`data-gfu-*`は動作に使う。

---

# Component inventory

## Shell and layout

| Component | Root | 主な属性／子要素 |
|---|---|---|
| App shell | `.gfu-app-shell` | Top bar、Drawer、Main |
| Top bar | `.gfu-topbar` | `[data-border]`, `__brand`, `__search`, `__actions` |
| Navigation drawer | `.gfu-nav-drawer` | `[data-gfu-nav-drawer]`, `__section`, `__label` |
| Navigation rail | `.gfu-nav-drawer` responsive mode | 600〜839pxで同一DOMを80px Rail化 |
| Navigation item | `.gfu-nav-item` | `data-active`, `aria-current`, `__text`, `__meta` |
| Navigation scrim | `.gfu-nav-scrim` | `[data-gfu-nav-scrim]` |
| Main | `.gfu-app-main` | Main landmark |
| Page | `.gfu-page` | `data-width="form|reading|wide"` |
| Page header | `.gfu-page-header` | `__copy`, `__description`, `__actions` |
| Toolbar | `.gfu-toolbar` | `__group`, `__spacer` |
| Filter bar | `.gfu-filter-bar` | `__search`, `__actions` |
| Surface | `.gfu-surface` | `data-variant` |
| Divider | `.gfu-divider` | `<hr>`推奨 |

## Typography

| Role | Class |
|---|---|
| Display | `.gfu-display` |
| Page title | `.gfu-page-title` |
| Section title | `.gfu-section-title` |
| Subsection title | `.gfu-subsection-title` |
| Title | `.gfu-title` |
| Body large | `.gfu-body-large` |
| Body | `.gfu-body` |
| Label | `.gfu-label` |
| Caption | `.gfu-caption` |
| Link | `.gfu-link` |
| Visually hidden | `.gfu-visually-hidden` |
| Code | `.gfu-code` |

## Actions

| Component | Root | Variants／Hook |
|---|---|---|
| Button | `.gfu-button` | `filled`, `tonal`, `outlined`, `text`, `danger` |
| Icon button | `.gfu-icon-button` | `standard`, `tonal`; `aria-label`必須 |
| FAB | `.gfu-fab` | `small`, `standard`, `extended` |
| Button group | `.gfu-button-group` | `[data-gfu-action-group]` |
| Split button | `.gfu-split-button` | Button＋Menu trigger |
| Spinner | `.gfu-spinner` | Loading button内 |

### Button

```html
<button type="button" class="gfu-button" data-variant="filled">
  <span data-icon="add"></span>
  <span class="gfu-button__label">新規作成</span>
</button>
```

### Loading

```html
<button type="button" class="gfu-button" data-variant="filled" data-loading="true" aria-busy="true" disabled>
  <span class="gfu-spinner" aria-hidden="true"></span>
  <span>保存中</span>
</button>
```

## Form controls

| Component | Root | 必須構造／Hook |
|---|---|---|
| Field | `.gfu-field` | `__label`, `__control`, `__input`, `__support` |
| Textarea | `.gfu-field__textarea` | Field内 |
| Select | `.gfu-field__select` | Native select推奨 |
| Select wrapper | `.gfu-select-wrap` | Icon配置 |
| Search | `.gfu-search` | `[data-gfu-search]`, accessible label |
| Search clear | `.gfu-icon-button` | `[data-gfu-search-clear]` |
| Combobox | `.gfu-combobox` | `[data-gfu-combobox]`, listbox |
| Checkbox | `.gfu-check` | `.gfu-check__input` |
| Radio | `.gfu-radio` | `.gfu-radio__input` |
| Switch | `.gfu-switch` | `.gfu-switch__input` |
| Slider | `.gfu-slider` | `[data-gfu-slider]`, `__input`, `__output` |
| File upload | `.gfu-file-upload` | `[data-gfu-file-upload]`, input、title、support |
| Counter | `.gfu-field__counter` | `[data-gfu-counter-for]` |

### Invalid field

```html
<div class="gfu-field" data-invalid="true">
  <label class="gfu-field__label" for="email">メールアドレス</label>
  <div class="gfu-field__control">
    <input id="email" class="gfu-field__input" type="email" aria-invalid="true" aria-describedby="email-error">
  </div>
  <p id="email-error" class="gfu-field__support" role="alert">「name@example.com」の形式で入力してください。</p>
</div>
```

## Selection and identity

| Component | Root | 属性 |
|---|---|---|
| Chip set | `.gfu-chip-set` | Group wrapper |
| Chip | `.gfu-chip` | `data-selected`, `data-gfu-chip`, `aria-pressed` |
| Removable chip | `.gfu-chip__remove` | accessible label |
| Badge | `.gfu-badge` | `data-variant` |
| Status | `.gfu-status` | `success`, `warning`, `error`, `neutral` |
| Avatar | `.gfu-avatar` | `data-size="sm|md|lg"` |
| Avatar stack | `.gfu-avatar-stack` | Avatar children |
| Segmented control | `.gfu-segmented` | `[data-gfu-segmented]` |
| Segment | `.gfu-segmented__button` | `aria-pressed` |

## Content

| Component | Root | 子要素 |
|---|---|---|
| Card | `.gfu-card` | `__media`, `__header`, `__body`, `__footer` |
| Stat | `.gfu-stat` | `__label`, `__value`, `__trend` |
| List | `.gfu-list` | List item |
| List item | `.gfu-list-item` | `__content`, `__title`, `__support`, `__meta` |
| Description list | `.gfu-description-list` | Native `dl/dt/dd` |
| Setting row | `.gfu-setting-row` | `__title`, `__support`, trailing control |
| Timeline | `.gfu-timeline` | `__item`, `__time`, `__title`, `__body` |
| Accordion | `.gfu-accordion` | Native `details/summary` |
| Empty state | `.gfu-empty-state` | `__icon`, `__title`, `__body`, `__actions` |

## Navigation

| Component | Root | Hook／ARIA |
|---|---|---|
| Tabs | `.gfu-tabs` | `[data-gfu-tabs]`, tablist/tab/tabpanel |
| Tab list | `.gfu-tabs__list` | `role="tablist"` |
| Tab | `.gfu-tabs__tab` | `role="tab"`, `aria-selected` |
| Tab panel | `.gfu-tabs__panel` | `role="tabpanel"` |
| Breadcrumbs | `.gfu-breadcrumbs` | `nav[aria-label]`, separator |
| Pagination | `.gfu-pagination` | `aria-label`, current page |
| Page button | `.gfu-pagination__page` | `aria-current="page"` |
| Stepper | `.gfu-stepper` | `[data-gfu-stepper]` |
| Step | `.gfu-stepper__item` | `data-state="complete|current|upcoming"` |

## Overlays

| Component | Root | Trigger／Hook |
|---|---|---|
| Menu anchor | `.gfu-menu-anchor` | Positioning parent |
| Menu | `.gfu-menu` | `[data-gfu-menu]`, `role="menu"` |
| Menu item | `.gfu-menu__item` | `role="menuitem"` |
| Popover | `.gfu-popover` | `[data-gfu-popover]` |
| Tooltip | generated | Trigger uses `data-tooltip` |
| Dialog | `.gfu-dialog` | Native `<dialog>`, `[data-gfu-dialog-open]` |
| Side sheet | `.gfu-side-sheet` | `[data-gfu-side-sheet]` |
| Overlay | `.gfu-overlay` | Side sheet scrim |
| Command palette | `.gfu-command-dialog` | `Ctrl/Cmd+K`, `[data-command-input]` |

### Menu / Popover: 初期状態と開閉

```html
<button id="actions-trigger" type="button" class="gfu-button" data-variant="outlined"
  aria-haspopup="menu" aria-controls="actions-menu" aria-expanded="false"
  data-gfu-menu-trigger="actions-menu">操作を選ぶ</button>
<div id="actions-menu" class="gfu-menu" role="menu" aria-labelledby="actions-trigger" data-open="false">
  <button type="button" class="gfu-menu__item" role="menuitem">編集する</button>
</div>

<button id="details-trigger" type="button" class="gfu-button" data-variant="text"
  aria-haspopup="dialog" aria-controls="details-popover" aria-expanded="false"
  data-gfu-popover-trigger="details-popover">詳細を確認</button>
<div id="details-popover" class="gfu-popover" role="dialog" aria-labelledby="details-title" data-open="false">
  <h2 id="details-title" class="gfu-title">利用条件</h2>
  <p class="gfu-body">この操作の対象と条件を確認してください。</p>
</div>
```

CSSが閉状態の不可視化と開閉Transitionを管理し、JavaScriptが`data-open`・位置・Triggerの`aria-expanded`を管理する。アプリは表示用CSSや`hidden`の切り替えを追加しない。

新規HTMLでは`hidden`属性を省略する。旧HTMLの初期`hidden`属性もサポートするが、ライブラリが解除した後に再付与しない。`hidden`クラスは解除対象ではなく禁止。動的DOMも接続後に同じTriggerで開く。初回にも閉状態を確定してから開くため、通常の再表示と同じ100msのOpacity／Transform遷移になる。

Motionは装飾オプションではなく開閉契約の一部。Reduced motionによる軽減を除き、初回・再表示とも標準の動きを保持する。ブラウザー回帰テストは`npm run test:browser`。

### Dialog trigger

```html
<button type="button" class="gfu-button" data-variant="filled" data-gfu-dialog-open="create-dialog">作成</button>

<dialog id="create-dialog" class="gfu-dialog" aria-labelledby="create-dialog-title">
  <div class="gfu-dialog__surface">
    <header class="gfu-dialog__header">
      <h2 id="create-dialog-title" class="gfu-dialog__headline">プロジェクトを作成</h2>
    </header>
    <div class="gfu-dialog__body">...</div>
    <footer class="gfu-dialog__footer" data-gfu-action-group>...</footer>
  </div>
</dialog>
```

## Feedback

| Component | Root | Hook／属性 |
|---|---|---|
| Alert | `.gfu-alert` | `role="status|alert|note"`, `data-variant` |
| Banner | `.gfu-banner` | `__content`, `__actions` |
| Snackbar | `.gfu-snackbar` | generated by `[data-gfu-snackbar-trigger]` |
| Snackbar stack | `.gfu-snackbar-stack` | live region |
| Linear progress | `.gfu-progress-linear` | `role="progressbar"` |
| Circular progress | `.gfu-progress-circular` | SVG track/value |
| Skeleton | `.gfu-skeleton` | `aria-hidden="true"` |

## Data

| Component | Root | Hook／構造 |
|---|---|---|
| Table wrapper | `.gfu-table-wrap` | overflow control |
| Table | `.gfu-table` | Native table |
| Sort control | `.gfu-table__sort` | `[data-sort-key]`, `aria-sort` |
| Row actions | `.gfu-table__actions` | trailing actions |
| Numeric cell | `.gfu-table__number` | right aligned |
| Selectable table | `.gfu-table` | `[data-gfu-table]`, checkboxes |

---

# JavaScript API

初期化は自動実行される。動的に挿入したDOMへ再適用する場合:

```js
GForceUI.init(newElement);
```

## Theme

```js
GForceUI.theme.set("light");
GForceUI.theme.set("dark");
GForceUI.theme.toggle();
```

## Density

```js
GForceUI.density.set("compact");
GForceUI.density.set("comfortable");
GForceUI.density.set("touch");
GForceUI.density.cycle();
```

## Dialog

```js
GForceUI.dialog.open("dialog-id");
GForceUI.dialog.close("dialog-id");
```

## Snackbar

```js
GForceUI.snackbar.show({
  message: "変更を保存しました。",
  action: "元に戻す",
  duration: 6000
});
```

公開APIは`window.GForceUI`に保持される。内部関数やCSS内部構造へ直接依存しない。
