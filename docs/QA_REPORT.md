# G-Force UI QA Report

## 2026-09-04 — workspace-files 1.1.0

ファイル管理モックの25指摘を修正。検証は以下を別々に扱う。

- 静的：製品5ページの未登録class/icon/hook、Dialog DOM、フォーム名、linked CSS、生成DOM改変を検査。正常fixtureと26の不正入力/markup fixtureを確認。
- 生成：`files.spec.json`からのHTMLが完全一致。キー順序を正規化し、不明な値・親子関係・日付・版を拒否。
- ブラウザ：`tools/files-browser-test.mjs`の28検証グループ。9幅（320/390/600/768/839/840/1024/1366/1440）、6状態、検索/作成/選択/並べ替え/詳細/Undo、通常/軽減Motion、Drawer/Tooltip/Dialogのキーボード挙動。
- 寸法：1366×768は先頭行274px・8行完全表示。390×844は先頭234px・8件完全表示。通常Table48px、Touch56px。320px検索入力160px以上。wide1600px、xlarge gutter48px。
- フォント：400/500/600の英数字・日本語が同梱のcustom fontを使用。外部リクエストを遮断したローカルHTTPで確認。フォント名のOS差ではなく実使用ファイルと要求weightを検査。
- 視覚：最終画像で情報階層、整列、1面構成、狭幅の名前/メニュー、6状態、Light/Dark、Dialogを確認。機械検査だけで視覚合格としない。
- 既存回帰：Menu/Popoverの初回/再表示/中断/Escape/軽減Motionの6ケースを維持。

実行は `npm ci` → `npm run check`。Windowsの既存Chromeなら`GFU_BROWSER_CHANNEL=chrome`を設定する。GitHub Actionsでも同じチェックを実行し、`test-results/files/`をartifactとして保存する。

主な再発防止：不明アイコンの無言フォールバックを廃止、visually-hidden列名をwrapper内へ収容、進捗spanのblock化と任意値setter、軽減Motionの継承visibility遷移を回避、非同期Menu focusとDialog循環を修正。body overflowの非表示や検査閾値の緩和で合格させていない。

この記録はローカルモックの対象フローに関するもので、全ブラウザ・支援技術・本番バックエンドの包括的な認証ではない。

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
