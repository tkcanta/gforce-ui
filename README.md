# G-Force UI

**Google Workspace／Google Cloud系Webアプリの視覚文法を、数値・DOM・状態遷移・禁止規則として固定したUIライブラリです。**

抽象的な「Googleっぽく」「Material風に」という指示を排除し、弱いAIモデルでも同じ判断へ収束することを目的にしています。

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

> G-Force UIはGoogle公式製品ではなく、Google LLCとの提携・承認関係もありません。Material DesignおよびGoogle Workspaceの公開ガイドを参照し、業務用Webアプリ向けに独自実装したデザインシステムです。

## まず開くもの

`index.html`をブラウザで開くと、動作するコンポーネントカタログを確認できます。

ローカルサーバーを使う場合:

```bash
npm install
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

既定では`examples/`を検査し、次をエラーにします。

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
2. Design Lint
3. Smoke TestとLint回帰テスト
4. ブラウザー回帰テスト（Menu／Popoverの初回表示・再表示・連続開閉・Reduced motion）

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
Action group内のFilled Buttonは最大1個にすること。
実装後に node tools/design-lint.mjs <対象ディレクトリ> を実行し、0 errorsにすること。
```

詳細は`docs/AI_RULES.md`を参照してください。

## ライセンス

MIT License。詳細は`LICENSE`を参照してください。
