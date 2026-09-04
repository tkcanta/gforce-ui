---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - LPの入力・レシピ・トークン・DOM・操作・生成器・配布物の変更
  - 対応用途・対応言語・公開フォームの信頼境界の変更
---

# Landing pages — 固定レシピ 1.0.0

LPは [landing-contract.json](../landing-contract.json) → [landing.schema.json](../landing.schema.json) → [generate-landing.mjs](../../tools/generate-landing.mjs) の順で作る。AIが編集できるのは入力JSONの文章・リンク・画像・利用者区分と、定義済みコンテンツの有無だけ。レイアウト、色、フォント、順序、余白、アイコン、CSS、JSは入力に含められない。

## 用途の決定

最初にページの仕事を区別する。製品の説明・比較・問い合わせ・申込みへ導く公開ページはLP。ファイル管理・設定・日々の業務操作は既存workspace契約。両方必要ならページを分ける。同じページに2つのCSS・JSやprofileを混ぜない。

| 確定した利用者 | audience | 自動決定profile | 固定構成 |
|---|---|---|---|
| 個人・消費者 | consumer | lp-expressive | 単段header、中央hero、製品stage、bento |
| 法人・組織の導入者 | business | lp-enterprise | 二段header、分割hero、部品grid、比較・導入支援 |
| 個人と運営者の両方 | mixed | lp-hybrid | 二段header、中央hero、bento、サービス一覧 |

業種名だけで見た目を選ばない。例えばゲームの法人向け運営ツール紹介はbusiness、参加者と主催者の共通入口はmixed。利用者が不明なら確認し、ランダムに選ばない。未知のaudience・版は生成器が拒否し、似たレシピへ自動で落とさない。

## 入力と生成

[一般向けJSON](../../examples/landing/consumer.spec.json)、[法人向けJSON](../../examples/landing/business.spec.json)、[両方向けJSON](../../examples/landing/mixed.spec.json)を起点にする。省略可能な内容もキーは残し、単一ブロックはnull、一覧は空配列で不使用を表す。任意の並べ替えは許可しない。

```sh
npm ci
npm run generate:landing
npm run check
```

利用側へ出力する場合（出力ディレクトリを先に用意する）:

```sh
node tools/generate-landing.mjs input.json output.html --assets gforce-ui/assets
node tools/generate-landing.mjs input.json output.html --assets gforce-ui/assets --check
node tools/design-lint.mjs output.html
```

利用側には `assets/landing.css`、`assets/landing.js`、`assets/fonts/` をそのまま配布する。独自画像はassets配下へ置き、`media.src`にはassetsからの相対パスを渡す。PNG/JPEG/WebP/AVIF、alt、幅・高さが必要。外部URL、SVG、パス遡上は不可。mediaがnullなら同じデータから固定の画面イメージを生成する。これは実製品のスクリーンショットではない。

出力するHTMLはタイトル、description、見出し、主要内容を静的に含む。JavaScriptなしでも本文・FAQ・リンク・フォーム・月額と年額を利用できる。JS有効時にタブ、料金の表示切替、モバイルdialog、カルーセルの操作を追加する。

## ブロックと入力範囲

| ブロック | 入力・制約 | 操作と構造の所有者 |
|---|---|---|
| Announcement | nullまたは1リンク | セクションより前、固定淡色面 |
| Header / Mega / Mobile nav | ブランドと存在するセクションから自動生成 | details、native dialog、Escape、focus帰還・循環 |
| Hero / product stage | 見出し1〜3行、各24文字以内。主要CTA1個、補助CTA最大1個 | profileが配置を固定。携帯幅では補助レイヤーを除去 |
| Features | 3〜4件 | 順番に固定したbento/gridと背景面 |
| Capability tabs | 2〜5件。labelは一意 | roving tabindex、左右/Home/End、tabpanel連動 |
| Products | 0〜8件 | 固定のサービス一覧 |
| Proof | nullまたは引用1〜4件、指標0〜4件、組織名0〜8件 | 指標と引用には出典リンク必須。実績・組織名を捏造しない |
| Pricing | nullまたは2〜4プラン。推奨最大1個 | 月額と年間総額を別表示。JPY/USD/EURの整数額。税込等の条件をnoteで明示 |
| Migration | nullまたは3ステップ | 順序付き説明とリンク |
| Resources | 0〜6件 | 手動カルーセル、境界でボタン無効、自動再生なし |
| FAQ | 2〜8件 | native details、キーボード対応、同時展開1件 |
| Contact | nullまたは実際のPOST先・privacyリンク・説明 | 名前・email・内容・同意は必須、法人/両方向けには組織名。Native検証を使用 |
| Final CTA / Footer | 主要CTAはheroを再利用。リンク群1〜4件 | 固定階層、表示順、モバイル折返し |

詳細の必須項目・文字数・件数はschemaが正本。JSONのキー順によらず同じHTMLを生成する。CTAのリンク先に存在しないセクションは指定できない。内部ページのパス・外部サービスの稼働・入力文章の事実性は利用者が確認する。

フォームは指定先へnative POSTし、ライブラリが送信成功を偽装しない。実サービスでは受信側の入力検証、CSRF対策、同意・個人情報の扱い、エラー・完了画面を用意する。デモJSONではcontactをnullにしており、個人情報を外部送信しない。課金処理も実装しない。

## 視覚と挙動の契約

目的は、製品の価値を理解して次の行動へ進めること。トーンは白・淡色・細い罫線と落ち着いた文字。差別化は大きな価値提案と製品画面のstageで作る。装飾や任意テーマは追加しない。

- LPの同梱フォントは既存と同じRoboto/Noto Sans JP。本文の基準は16px、機能説明18px、hero説明20px（携帯幅18px）。heroは40/56/72px、法人hero上限56px、見出し32/40/48px。文字weightは400/500。
- Primaryは固定の青。余白、幅、角丸、breakpointは機械契約で固定。グラデーション、絵文字、自由なブランド色、太字700、背景blur、装飾ループは禁止。
- 影は製品stageと一時的なメニューに限定。全セクションを影付きCardにしない。既存のworkspace規則を緩めてLPを通さない。
- CSSはLP profile配下へスコープし、JSもLP以外では初期化しない。LP用の大見出し・大余白はworkspaceへ波及しない。
- 320pxで本文やCTAを失わず、600/840/1100pxで構造を切り替える。reduced motionでは即時切替。JSなしでコンテンツを隠さない。

## 機械的な拒否と検証

`npm run check` に全工程を含む。生成器は不正型・未知項目・URL・入力上限を拒否する。LintはLPの識別属性を削除してもクラス・配布ファイル・configを手掛かりに契約を適用する。

- GFU030: 生成HTMLとの不一致、profileの誤り、追加CSS/JS、改変DOM、欠落asset、未対応の旧LP Kit。
- GFU032: 配布CSS/JS/フォントがライブラリと一致しない。
- GFU033: 空の画像ファイル。

全3profileを320〜1920pxの10幅で確認する。料金・menu・tabs・FAQ・carousel・mobile dialog・フォーム・JavaScript無効・長文・200%表示・媒体・フォント・コントラスト・workspaceへの非干渉をブラウザ検査する。画像は `test-results/landing/`、実行結果は同ディレクトリのreport.json。画像の目視確認も合格条件。

同一性の保証対象は「同じ入力JSON・recipe版・配布asset・assetパス」。自然言語から文章を作る工程、意味的な正しさ、任意のブラウザやOS間のピクセル一致まで保証しない。未対応構成をAIの自由制作へ逃がさず、管理者が契約・generator・検証を同時に拡張する。

## ZIPからの移行

元の [LP Kitの統合記録](../history/lp-kit-integration.md)を参照する。旧gf-*のHTMLやdistをそのまま読み込まず、文章とコンテンツをschemaへ移す。旧HTMLの自由なCSS、accent指定、任意のsection順は受け付けない。

ブラウザ/ウィンドウ/suiteのstage、bento、分割説明、サービス一覧、引用、料金、導入、FAQ、リソース、最終CTA、フォームの役割を固定レシピに統合した。コピー・トースト・テーマ操作のカタログ専用デモ、数値を増やす演出、revealで内容を隠す動作は公開LPの入力APIにしない。

## AIへ渡す指示

```text
この公開LPはG-Force UIのlanding 1.0.0で作る。
docs/current/landing.mdとdocs/landing.schema.jsonを読む。
audienceをconsumer/business/mixedから利用者条件で確定する。
対応するexamples/landing/*.spec.jsonを元にデータだけを編集する。
HTML/CSS/JS、色、レイアウト、順序を自由生成しない。
generate-landing.mjsで生成し、--check、design-lint、npm run checkを通す。
test-results/landingの画像も確認する。未対応要件は契約拡張が必要と報告する。
```
