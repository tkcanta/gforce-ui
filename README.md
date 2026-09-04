# G-Force UI

**Google Workspace／Google Cloud系の業務UIと、Chrome／Workspace型の公開LPを、数値・DOM・状態遷移・禁止規則として固定したUIライブラリです。**

抽象的な「Googleっぽく」「Material風に」という指示を排除し、弱いAIモデルでも同じ判断へ収束することを目的にしています。

現在のバージョン：**1.3.0** · [バージョン履歴](#バージョン履歴)

- Tailwind CSS v4
- Vanilla JavaScript
- React／Vue不使用
- Runtime依存なし
- Light／Dark
- Compact／Comfortable／Touch density
- WCAG 2.2 AAを基準にしたキーボード・フォーカス設計
- 63種類のコンポーネント／パターン契約
- 45以上の動作デモ
- デザイン違反Lint
- AI向け機械可読JSON契約
- LP用3レシピ、JSON入力検証、生成物・配布assetの一致検査

> G-Force UIはGoogle公式製品ではなく、Google LLCとの提携・承認関係もありません。Material DesignおよびGoogle Workspaceの公開ガイドを参照し、業務用Webアプリ向けに独自実装したデザインシステムです。

## まず開くもの

| 作るもの | 入口 | 動作例 |
|---|---|---|
| 業務ツール・管理画面 | [既存部品API](docs/COMPONENTS.md) | [カタログ](index.html) |
| ファイル管理 | [workspace-files](docs/WORKSPACE_FILES.md) | [作例](examples/files.html) |
| 公開LP | [LP固定レシピ](docs/current/landing.md) | [一般向け](examples/landing/consumer.html)・[法人向け](examples/landing/business.html)・[両方向け](examples/landing/mixed.html) |

LPは利用者区分から構成を固定し、入力JSONだけを編集します。`npm run generate:landing` で作例を生成します。LP専用CSS/JSを使うため、業務UIの見出し・密度・入力・Dropdownの契約は変わりません。詳細の正本は [資料索引](docs/INDEX.md)から選べます。

**禁止：OS標準の選択メニュー、値と下向き矢印の別行配置。** カタログ・作例も例外なし。旧Select/Select wrapperは廃止し、共通Dropdownへ統一しました。GFU028/GFU029とブラウザの実寸検査で再発を防ぎます。

1.2.0では[共通Dropdown](docs/COMPONENTS.md#dropdown)を追加しました。単一のfocus枠、スタイル済みlistbox、キーボード操作、必須/無効/リセットをライブラリが所有します。[部品カタログ](index.html#select-combobox)で確認できます。

ファイル管理ツールを作る場合は **[workspace-files 固定レシピ](docs/WORKSPACE_FILES.md)** を使ってください。`examples/files.spec.json` のデータから `npm run generate:files` で [動作モック](examples/files.html) を生成します。AIがレイアウトを自由生成する必要はありません。

1.1.0では同梱フォント、未登録API検出、生成物の完全一致、狭幅リスト、状態/キーボード/寸法のブラウザ検証を追加しています。同一性の保証は「同じ入力・レシピ版・assetパス」であり、任意の自然言語や異なるOSの完全なピクセル一致ではありません。

`index.html`をブラウザで開くと、動作するコンポーネントカタログを確認できます。

ローカルサーバーを使う場合:

```bash
npm ci
npm run build
npm run serve
```

その後、`http://localhost:4173/`を開きます。

## ディレクトリ

```text
gforce-ui/
├─ index.html                  # 動作するコンポーネントカタログ
├─ assets/
│  ├─ gforce.css              # ビルド済みCSS
│  └─ gforce.js               # ビルド済みVanilla JS
├─ src/
│  ├─ gforce.css              # Tailwind v4ソース／全トークン／全コンポーネント
│  └─ gforce.js               # コンポーネント挙動
├─ docs/
│  ├─ DESIGN_SPEC.md          # Google系UIを具体化した設計仕様
│  ├─ AI_RULES.md             # AIが画面生成時に守る命令
│  ├─ COMPONENTS.md           # コンポーネントAPI一覧
│  ├─ QA_REPORT.md            # 自動・ブラウザ検証結果
│  ├─ design-contract.json    # 機械可読ホワイトリスト
│  └─ SOURCES.md              # 参照した一次資料
├─ examples/
│  ├─ dashboard.html
│  ├─ settings.html
│  └─ list-detail.html
└─ tools/
   ├─ build-css.mjs           # Tailwind CSSビルド
   ├─ design-lint.mjs         # 禁止パターン検出
   └─ smoke-test.mjs          # 構造・参照・在庫テスト
```

## 最小導入

```html
<link rel="stylesheet" href="/gforce-ui/assets/gforce.css">
<script type="module" src="/gforce-ui/assets/gforce.js"></script>
```

```html
<html lang="ja" data-theme="light" data-density="comfortable">
```

```html
<div class="gfu-app-shell">
  <header class="gfu-topbar">...</header>
  <aside class="gfu-nav-drawer">...</aside>
  <div class="gfu-nav-scrim"></div>

  <main class="gfu-app-main">
    <div class="gfu-page" data-width="wide">
      <div class="gfu-page-header">
        <div class="gfu-page-header__copy">
          <h1 class="gfu-page-title">プロジェクト</h1>
          <p class="gfu-page-header__description">プロジェクトとメンバーを管理します。</p>
        </div>

        <div class="gfu-page-header__actions" data-gfu-action-group>
          <button type="button" class="gfu-button" data-variant="outlined">インポート</button>
          <button type="button" class="gfu-button" data-variant="filled">新規作成</button>
        </div>
      </div>
    </div>
  </main>
</div>
```

## 強制順序

最初に業務操作画面か公開LPかを確定します。LPの場合は `docs/design-contract.json` のprofile routingに従い、[LP契約・schema・生成器](docs/current/landing.md)を使います。以下の数値と画面構成は業務UIの契約です。LPの例外を業務画面に持ち込みません。

AIや実装者は、仕様が衝突した場合に次の順序で従います。

1. `docs/design-contract.json`
2. `docs/AI_RULES.md`
3. `src/gforce.css`に存在するAPI
4. 個別画面要件
5. 実装者自身の美的判断

独自判断は最下位です。定義されていない色、余白、Radius、Shadow、Variantを追加しません。

## 主要な固定値

| 対象 | 固定値 |
|---|---|
| 基礎間隔 | 4px |
| 主要リズム | 8px |
| UI本文 | 14px / 22px / 400 |
| UIラベル | 14px / 20px / 500 |
| ページタイトル | 32px / 40px / 400 |
| Field radius | 8px |
| Card radius | 16px |
| Dialog radius | 28px |
| Button／Search radius | 9999px |
| 標準Button高 | 40px |
| 標準Field高 | 44px |
| Top bar | 64px |
| Navigation drawer | 256px |
| 常設Card | Shadowなし |
| Filled CTA | Action group内1個まで |

## デザインLint

```bash
npm run lint:design
```

`npm run lint:design`は`index.html`と`examples/`を検査し、次をエラーにします。

- 任意HEX／RGB／HSL
- Tailwind arbitrary color
- 任意spacing
- `font-bold`以上
- 大きいShadow
- Gradient
- backdrop blur
- 装飾ループAnimation
- `onclick`
- `div role="button"`
- `type`なしButton
- `aria-label`なしIcon Button
- `alt`なしImage
- 同一Action group内のFilled Button複数
- FilledとDangerの同時配置
- ラベルを持たないSearch
- Menu／Popoverの`hidden`クラス、Reduced motion以外でのMotion無効化
- 未登録のclass／icon／hook、壊れたDialog DOM、リンク先CSSの独自上書き
- workspace-filesの生成物の手編集、UI名を`strong`で太字にする指定

任意のHTMLを検査する場合:

```bash
node tools/design-lint.mjs path/to/pages
```

## チェック一式

初回のみ`npm ci`と`npx playwright install chromium`を実行してください。ブラウザー検証用のPlaywrightは開発依存で、配布するUIのRuntime依存には含みません。

```bash
npm run check
```

このコマンドは次を順番に実行します。

1. Tailwind CSSビルド
2. workspace-filesとLP生成物の完全一致確認
3. Design Lint
4. Smoke TestとLint／不正入力の回帰テスト
5. ブラウザー回帰テスト（Menu／Popover、workspace-files、LPの3レシピ・10幅・操作・フォーカス・入力・非干渉）

LPでは入力JSON・recipe版・配布asset・assetパスが同じなら同じHTMLを生成し、自由なCSSや手編集を拒否します。任意の自然言語から同じ文章を推測することや、すべてのOSでのピクセル一致を保証するものではありません。未知の構成は自由制作に切り替えず、契約拡張として扱います。

既存のGoogle Chromeで検証する場合は、環境変数`GFU_BROWSER_CHANNEL=chrome`を設定するとChromiumの追加ダウンロードは不要です。PowerShellでは`$env:GFU_BROWSER_CHANNEL = 'chrome'`を設定してから実行します。

Menu／Popoverを組み込む場合は、[初期状態と開閉のDOM例](docs/COMPONENTS.md#menu--popover-初期状態と開閉)を使ってください。新規HTMLに`hidden`属性や独自の表示切替処理を足す必要はありません。

## テーマ

```js
GForceUI.theme.set("dark");
GForceUI.theme.toggle();
```

またはルート属性を変更します。

```html
<html data-theme="dark">
```

## Density

```js
GForceUI.density.set("compact");
GForceUI.density.set("comfortable");
GForceUI.density.set("touch");
```

| Density | Button | Field | List row | Icon button |
|---|---:|---:|---:|---:|
| Compact | 32px | 36px | 40px | 32px |
| Comfortable | 40px | 44px | 48px | 40px |
| Touch | 48px | 48px | 56px | 48px |

## JavaScript接続規則

見た目のクラスをJavaScript Hookに使いません。

```html
<button
  type="button"
  class="gfu-button"
  data-variant="filled"
  data-gfu-dialog-open="create-dialog"
>
  作成
</button>
```

- `class`: 見た目
- `data-variant`: 視覚Variant
- `data-state`: ライブラリ管理状態
- `data-gfu-*`: JavaScript Hook
- `aria-*`: 支援技術へ伝える状態
- `disabled`／`checked`／`selected`: Native HTML状態

## AIへ渡す最小プロンプト

```text
この画面はG-Force UIで実装する。
最初に docs/design-contract.json と docs/AI_RULES.md を読むこと。
許可されていない色、余白、角丸、影、コンポーネントを追加しないこと。
既存の gfu-* APIだけを使用し、独自コンポーネントを作らないこと。
すべてのButtonにtypeを指定し、Icon Buttonにaria-labelを付けること。
ファイル管理なら docs/WORKSPACE_FILES.md の固定generatorを使い、入力JSON以外は編集しないこと。
Action group内のFilled Buttonは最大1個にすること。
実装後に node tools/design-lint.mjs <対象ディレクトリ> を実行し、0 errorsにすること。
```

詳細は`docs/AI_RULES.md`を参照してください。

## バージョン履歴

`package.json`のバージョンとGit履歴に基づく記録です。日付は日本時間。同じバージョン番号のまま行った追加修正は、コミットで区別しています。

### 1.3.0 — 2026-09-04

- LP Kitを3つの固定レシピへ統合。hero、製品stage、bento、タブ、サービス一覧、出典付き実績・引用、価格、導入、カルーセル、FAQ、問い合わせ、最終CTAをJSONから生成。
- 未知項目・不正URL・HTML混入・任意スタイル・生成DOM改変・配布asset改変を拒否。LPを独立bundleにし、既存workspaceのAPIと検証を維持。
- [移行・生成手順](docs/current/landing.md)、[統合元の記録](docs/history/lp-kit-integration.md)、[LP Kitライセンス](LICENSE-LP-KIT)。

### 1.2.0 — 2026-09-04

- **追加**：共通Dropdown。操作面全体のフォーカス枠、スタイル済みlistbox、キーボード操作、必須・無効・リセット状態を統一。ファイル種別・更新日フィルターに適用。[実装コミット](https://github.com/tkcanta/gforce-ui/commit/457259a56af01124761f7442127062f52f7277df)
- **追加修正・禁止規則**：OS標準の選択メニューと、値・下向き矢印の別行配置を禁止。旧Native Select／Select wrapperを廃止し、カタログ・詳細画面の作例も共通Dropdownへ移行。[修正コミット](https://github.com/tkcanta/gforce-ui/commit/cc4cf6908e2a5a49cbb790356dba8648a96ffab5)
- **検証**：GFU027／GFU028／GFU029、長い値・狭幅・Light/Dark・矢印の実寸検査を追加。追加修正後は30ブラウザ検証グループ、32不正fixture、Floating motion 6ケース。
- **移行**：`.gfu-field__select`／`.gfu-select-wrap`は使用不可。[Dropdownの正規DOM](docs/COMPONENTS.md#dropdown)へ置換する。native selectは共通部品内の値・フォームの正本としてのみ保持する。

### 1.1.0 — 2026-09-04

- **追加**：`workspace-files`固定レシピ、入力JSON検証、HTML生成器。ファイル管理画面のレイアウト・状態・操作を共通化。[実装コミット](https://github.com/tkcanta/gforce-ui/commit/7f5f6ecf73419a990d43acea672c32aaef3cb850)
- **改善**：Roboto／Noto Sans JPの同梱、文字・アイコン・余白の整合、モバイル一覧、検索・選択・作成・詳細・Undo、Drawer／Dialog／Tooltipのフォーカス制御。
- **検証**：未登録APIや生成DOMの改変を拒否。9画面幅・6状態を含むブラウザ検査とGitHub Actionsを追加。非同期の画面遷移・Dialog終了を待つよう検査も修正。[検査修正コミット](https://github.com/tkcanta/gforce-ui/commit/b35c81fb433612fbf6653746e69ad6d5ab61d6b7)

### 1.0.0 — 2026-09-03

- **初期版**：Tailwind CSS v4＋Vanilla JavaScriptのUI基盤、Light/Dark、3段階Density、コンポーネントカタログと作例を追加。[実装コミット](https://github.com/tkcanta/gforce-ui/commit/2534d191d5c8d700922553765cac6afe9139d014)
- **契約**：デザイン仕様、AIルール、機械可読JSON契約、禁止パターンのLint、Smoke Testを整備。
- **2026-09-04の追加修正**：Menu／Popoverの初回表示Motionを修正し、初期状態・開閉の接続規則と回帰テストを追加。[修正コミット](https://github.com/tkcanta/gforce-ui/commit/0dec8db9f84d62a91a9a5c8b030ac3ac96b0499d)

## ライセンス

MIT License。詳細は`LICENSE`を参照してください。
LP Kit由来の実装には [LICENSE-LP-KIT](LICENSE-LP-KIT) の著作権表示も適用します。
同梱フォントはSIL Open Font Licenseです。著作権表示・ライセンス・固定取得元は`assets/fonts/`に同梱しています。
