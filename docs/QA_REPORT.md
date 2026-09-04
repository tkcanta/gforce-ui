# G-Force UI QA Report

## 2026-09-04 — Landing統合 1.3.0

- `npm run check` 成功（Windows、Node.js 24、既存Chrome使用）。追加のRuntime/開発依存なし。
- LPは3レシピ×10幅（320〜1920px）で横はみ出し・見出し・リンクを検証。14グループでフォント、コントラスト、キーボード、FAQ、Mega、料金、Mobile dialog、Carousel、JS無効、最大長文、200%表示、問い合わせフォーム、画像、英語固定ラベル、既存ツール非干渉、Reduced motion/Forced colorsを確認。
- 85不正ケースを拒否。未知入力、危険URL、HTML/絵文字混入、壊れた参照、生成HTMLの手編集、追加CSS/JS、配布CSS/JS/フォント改変などを検証。
- メニューのfocusout時の誤閉じ、mobile dialogのTab循環、carouselの先頭snap位置を実操作テストで修正。
- 既存workspaceは30ブラウザグループ、32不正fixture、Floating motion 6ケースを維持。既存CSS/JSの生成元・配布物・files.htmlに差分がないことをGitで確認。
- LPのDesktop/Mobile画像は `test-results/landing/` に生成。全体構成、見出し、CTA、製品stage、価格比較、狭幅の配置を画像確認。機械検査だけを視覚合格の代用にしていない。
- この結果は同じ入力・recipe・assetからの生成再現性を対象とする。自然言語からの文章推測、他エンジン、スクリーンリーダーの包括検証、外部POST先の運用は対象外。

## 2026-09-04 — Native Select禁止・矢印の別行配置禁止

1.2.0で「OS標準表示を意図する場合」という例外と旧Native Selectのカタログを残した判断が不適切だった。旧CSSは生成SVGの親spanに合わない直接子セレクターを使い、矢印が通常フローで次行へ落ちていた。

- 旧Select/Select wrapperのCSS・公開契約を廃止。カタログは長い値のDropdownへ、詳細画面の作例も共通Dropdownへ移行。
- `GFU028`はDropdown外のselectと旧クラスを拒否。`GFU029`は手書きtrigger/arrow/listboxを拒否。禁止事項はAI_RULESとJSON契約に明記。
- 320/390/1366px・Light/Darkでnative select非表示、長い値の省略、値と矢印の縦中心・非重複、開いた候補と選択後を確認する。意図的に矢印を別行にしたfixtureが実寸検査で失敗することも確認する。
- 全体の検査は30ブラウザグループ、32不正fixture、Floating motion 6ケース。`npm run check`で再実行できる。

以下は各時点の履歴であり、旧Native Selectを許可する根拠にはしない。

## 2026-09-04 — Dropdown 1.2.0

前回のレビューはフィルターの閉状態と値変更だけを確認し、OS標準popupと内側selectのfocus枠の見た目を見落としていた。ユーザー指摘を受け、共通Dropdownを追加し、ファイル種別・更新日の双方へ適用した。

- native selectは値/フォームの正本として維持し、生成したbutton/comboboxとtop-layer listboxが表示を所有する。原本モックは変更しない。
- 1366/390/320pxの開状態、単一focus枠、12pxのpopup、選択済みcheckmark、値変更後の幅不変、Light/Darkを検査・画像確認。
- Arrow/Home/End/typeahead/Enter/Tab/Escape、取消、外側クリック、required/disabled/reset、FormData、input/change各1回、動的init、通常/軽減motionを検査。Dialog内のtop layerと画面端での上向き反転も確認。既存のファイル操作とFloating motionも再実行した。
- `GFU027`で壊れたDropdown DOMを拒否。生成物の完全一致検査により、AIがOS標準selectや独自triggerへ戻す変更も拒否する。
- 全体は29ブラウザ検証グループ、29不正fixture、既存Floating motion 6ケース。実行は `npm run check`、開状態の証跡は `test-results/files/dropdown-*.png`。

スクリーンリーダー/全ブラウザの包括的な適合認証ではない。以下の1.1.0記録はその時点の履歴として残す。

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
