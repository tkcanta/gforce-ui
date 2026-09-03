# G-Force UI QA Report

## 2026-09-04 — Floating初回Motionの回帰検証（Unreleased）

`tools/floating-motion-test.mjs`を修正前の配布JSで実行し、`menu/hidden/first: missing transitions`を再現した。

修正後はWindows上のheadless Chrome（`GFU_BROWSER_CHANNEL=chrome`）で`npm run check`が成功。Menu／Popoverそれぞれについて、通常DOM・初期hidden属性付き・動的挿入の計6ケースを検証した。

- 初回・再表示ともOpacityとTransformのCSS Transitionが生成される。
- 遷移途中のOpacityが0と1の間にあり、完了時に1になる。
- Escapeで不可視になり、TriggerへFocusが戻る。
- 開閉中の再操作でも最終状態が一致する。
- Reduced motionではTransition durationが1ms以下になる。
- Lint回帰テストでは、hiddenクラスとMotion無効化を拒否し、初期hidden属性とmotion-reduce指定を許容する。

Playwrightはテスト専用の開発依存。以下の1.0.0リリース時の記録は履歴として保持する。

Date: 2026-09-03
Version: 1.0.0

## Automated build and contract checks

Command:

```bash
npm run check
```

Result:

```text
Tailwind build: PASS
Design lint: PASS — 4 HTML files, 0 issues
Smoke test: PASS — 31 catalog sections, 63 inventory entries, 3 composed examples
```

## Structural validation

Validated:

- Duplicate IDs
- `aria-controls`, `aria-labelledby`, `aria-describedby` targets
- `<label for>` targets
- Same-page anchors
- Local file links
- `data-icon` definitions
- HTML `gfu-*` classes against compiled CSS
- JavaScript syntax
- JSON syntax

Result:

```text
4 HTML files validated
50 icon names resolved
199 gfu-* classes resolved
0 structural reference errors
```

## Headless browser interaction checks

Viewport checks:

- Desktop: 1440 × 1100
- Medium / rail: 768 × 1024
- Compact / drawer: 390 × 844

Interaction checks:

| Check | Result |
|---|---|
| Catalog load | PASS |
| JavaScript console errors | 0 |
| Light → Dark theme | PASS |
| Comfortable → Touch density | PASS |
| Catalog search filtering | PASS |
| Dialog open | PASS |
| Dialog close | PASS |
| Compact navigation trigger visible | PASS |
| Compact overlay drawer open | PASS |
| Medium navigation rail width | 80px |
| Medium main content offset | 80px |

## Preview files

- `preview-desktop.png`
- `preview-tablet.png`
- `preview-mobile.png`
- `preview-components.png`
