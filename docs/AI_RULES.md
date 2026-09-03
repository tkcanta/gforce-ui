# G-Force UI: AI実装強制ルール

この文書はデザイン解説ではない。画面を生成するAIが、判断を推測せず機械的に実装するための命令表である。

## 0. 適用順序

矛盾がある場合は、次の順序で従う。

1. `docs/design-contract.json`
2. この `AI_RULES.md`
3. `src/gforce.css` に存在するコンポーネントAPI
4. 個別画面の要件
5. AI自身の判断

AI自身の美的判断は最下位である。許可されていない値、構造、Variantを追加しない。

---

# 1. 画面生成の固定手順

画面を生成するときは、必ず次の順序で処理する。

## Step 1: ページ種別を1つ選ぶ

ファイル管理・ドライブ・ファイル一覧の場合は、先に `docs/WORKSPACE_FILES.md` を読み、`workspace-files` 1.2.0を使う。このprofileは下記の汎用Page header/CTA/余白より優先する。`examples/files.spec.json` のデータだけを編集し、正規generatorでHTMLを生成する。Dashboard化、独自CSS、テンプレート改変は禁止。未知要件は勝手にprofileを拡張しない。

| 要件 | ページ種別 | 使用する固定構造 |
|---|---|---|
| KPIや全体状況を確認する | Dashboard | App shell → Page header → Alert任意 → Stat grid → Main data → Activity |
| 設定値を編集する | Settings | App shell → Page header → Tabs任意 → 720px Form → Action group |
| 多数の項目を検索・管理する | List management | App shell → Page header → Filter bar → List/Table → Pagination |
| 1件の対象を確認する | Detail | Breadcrumbs → Page header → Description list → Tabs任意 → Danger zone |
| 初回利用でデータがない | Empty first use | Page header → Empty state → Filled CTA 1個 → Text help任意 |
| 認証する | Authentication | Centered 400px surface → Brand → Form → Filled submit → Secondary links |
| 手順を順番に完了する | Wizard | Page header → Stepper 3〜5段 → Form → Back/Text + Next/Filled |

複数に該当しても、主目的を1つ選ぶ。DashboardとSettingsを同じ画面へ混ぜない。

## Step 2: App shellを決める

管理画面・SaaS・CMSは原則として次を使う。

```html
<div class="gfu-app-shell">
  <header class="gfu-topbar">...</header>
  <aside class="gfu-nav-drawer">...</aside>
  <div class="gfu-nav-scrim"></div>
  <main class="gfu-app-main">
    <div class="gfu-page" data-width="wide|form|reading">...</div>
  </main>
</div>
```

### 幅の選択

| 内容 | `data-width` | 最大幅 |
|---|---|---:|
| フォーム中心 | `form` | 720px |
| 長文中心 | `reading` | 768px |
| Dashboard／Table／複数列 | `wide` | 1600px |
| 通常管理画面 | 属性なし | 1440px |

ページ本文へ独自の`max-width`を追加しない。

## Step 3: Page headerを置く

すべての主要ページは次の順序にする。

```text
Eyebrow（必要な場合だけ）
Title（必須、h1はページ内1個）
Description（必要な場合だけ、最大768px）
Actions（右側、Filledは最大1個）
```

```html
<div class="gfu-page-header">
  <div class="gfu-page-header__copy">
    <h1 class="gfu-page-title">ページ名</h1>
    <p class="gfu-page-header__description">説明</p>
  </div>
  <div class="gfu-page-header__actions" data-gfu-action-group>
    <button type="button" class="gfu-button" data-variant="outlined">補助操作</button>
    <button type="button" class="gfu-button" data-variant="filled">主要操作</button>
  </div>
</div>
```

### 禁止

- Page headerのFilled Buttonを2個置く
- Page headerをCardで囲む
- Page titleを太字700にする
- Page titleの上に巨大なHero画像を置く
- Page descriptionを中央揃えにする

---

# 2. 色の強制ルール

## 2.1 使用可能な色

HTMLでは次のSemantic Tokenに接続されたクラスだけを使う。

| 役割 | Tailwind class | 用途 |
|---|---|---|
| 画面背景 | `bg-canvas` | body、mainのみ |
| 通常面 | `bg-surface` | Card、Field、Table、Top bar |
| 弱い面 | `bg-surface-low` | Grouping、静かなHover |
| グループ面 | `bg-surface-container` | Search、Filled Card、Filter region |
| 強い面 | `bg-surface-high` | Dialog付近、強いGrouping |
| 主文字 | `text-on-surface` | Heading、Body |
| 補助文字 | `text-on-surface-variant` | Description、Metadata |
| 枠 | `border-outline` | Input等の必須境界 |
| 弱い枠 | `border-outline-variant` | Card、Divider、Table row |
| Primary | `bg-primary`, `text-primary` | Filled CTA、Link、Focus、Selected indicator |
| Primary container | `bg-primary-container` | Selected nav、Tonal、FAB |
| Error | `text-error`, `bg-error-container` | Error、Dangerのみ |

## 2.2 色面積

- Viewport内のSolid Primary面積は、おおむね12%以下にする。
- Solid Primaryを大きなCard背景、Sidebar背景、Header背景に使わない。
- Navigationの選択状態はSolid PrimaryではなくPrimary Containerを使う。
- 青文字はLink、選択状態、主要操作に限定する。
- 装飾目的でGoogleの赤・黄・緑・青を同時使用しない。

## 2.3 絶対禁止

```text
#1a73e8
rgb(...)
hsl(...)
bg-[#...]
text-[#...]
border-[#...]
from-blue-...
to-purple-...
bg-gradient-...
```

Skeleton shimmer以外のGradientは禁止する。

---

# 3. Typographyの強制ルール

| 用途 | Class | Size / Line | Weight |
|---|---|---:|---:|
| 特殊な大見出し | `gfu-display` | 36 / 44 | 500 |
| Page h1 | `gfu-page-title` | 32 / 40 | 400 |
| workspace-files h1 | `gfu-files__title` | 24 / 32 | 400 |
| Section h2 | `gfu-section-title` | 24 / 32 | 500 |
| Subsection h3 | `gfu-subsection-title` | 20 / 28 | 500 |
| Card/List title | `gfu-title` | 16 / 24 | 500 |
| 読ませる本文 | `gfu-body-large` | 16 / 26 | 400 |
| UI本文 | `gfu-body` | 14 / 22 | 400 |
| Button/Input label | `gfu-label` | 14 / 20 | 500 |
| Metadata/Support | `gfu-caption` | 12 / 18 | 400 |

## 強制事項

- h1は1ページ1個。
- h2の次にh4を置かない。
- 通常UIで`font-bold`、`font-extrabold`、`font-black`を使わない。
- 600は2文字以内のBrand markだけに許可する。
- 英語のButton labelをALL CAPSにしない。
- 日本語へ負のletter-spacingを任意指定しない。
- Bodyを12pxにしない。12pxはMetadataだけ。

---

# 4. Spacingの強制ルール

## 使用可能値

```text
0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
```

Tailwindでは原則として次だけを使う。

```text
0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16
```

## 場所別固定値

| 場所 | 値 |
|---|---:|
| IconとLabel | 8px |
| LabelとField | 6px。コンポーネントCSSで固定 |
| FieldとSupport | 6px。コンポーネントCSSで固定 |
| 同一Button群 | 8px |
| Card内padding | 16px |
| 大きいCard内padding | 24px |
| Headingと直下Content | 16px |
| Subsection間 | 32px |
| Section間 | 48px |
| Page header下 | 32px |
| Mobile page gutter | 16px |
| Tablet page gutter | 24px |
| Desktop page gutter | 32px |
| Large desktop gutter | 40px |

## 禁止

- `p-[18px]`などのArbitrary spacing
- 14px、18px、22px、28px、30pxなどの未許可余白
- Cardごとに異なるpadding
- Section間隔をBorderの有無で場当たり的に変える

---

# 5. Shapeの強制ルール

| 対象 | Radius |
|---|---:|
| Checkbox | 2px |
| Field | 8px |
| Chip | 8px |
| Tooltip / Menu item | 8px |
| Menu / Popover | 12px |
| Card / Surface | 16px |
| FAB | 16px |
| Dialog | 28px |
| Button | Full |
| Search | Full |
| Selected Navigation | Full |
| Switch / Badge / Avatar | Full |

## 意味

- Full radiusは「押せる短いAction」「検索」「選択状態」に限定する。
- 8pxは「入力・小さな選択単位」に使う。
- 16pxは「独立した面」に使う。
- 28pxは「Modal surface」に使う。

## 禁止

- 通常Text FieldをFull radiusにする
- すべてのCardを24px以上にする
- 同じ種類のCardでRadiusを変える
- `rounded-2xl`、`rounded-3xl`を場当たり的に使う

---

# 6. Elevationの強制ルール

| Level | 使用対象 |
|---|---|
| 0 | Page、Card、Field、List、Table、Navigation Drawer |
| 1 | Sticky Top bar、Interactive Card hover |
| 2 | Menu、Popover、Search focus、FAB |
| 3 | Side Sheet、Snackbar |
| Dialog | Modal Dialogのみ |

## 禁止

- 静的CardへShadowを付ける
- `shadow-lg`、`shadow-xl`、`shadow-2xl`
- Borderと強いShadowを同時使用する
- Hover時にCardを上方向へ移動する
- 1画面に4段階以上の影を同時表示する

---

# 7. Motionの強制ルール

| 操作 | Duration |
|---|---:|
| Hover / Pressed | 100ms |
| Tabs / Selection | 180ms |
| Menu / Tooltip | 100ms |
| Dialog / Side Sheet / Snackbar | 260ms |
| 特別な強調 | 340ms以下 |

- Hoverでscaleしない。
- Hoverでtranslateしない。
- Button pressedで位置を動かさない。
- Bouncy easingを使わない。
- `prefers-reduced-motion`で実質1msにする。
- Loop animationはProgressとSkeletonだけに許可する。

### 表示状態とMotionの所有者

- Menu／PopoverはライブラリのTriggerと`data-open`で開閉する。アプリ側で`hidden`、`display`、`opacity`、`visibility`、`transform`を切り替えない。
- 初期HTMLは`data-open="false"`とし、`hidden`属性は付けない。既存HTMLの初期`hidden`属性は互換性のためライブラリが解除し、閉状態のレイアウトを確定してから開く。
- `hidden`クラス（レスポンシブ指定を含む）は付けない。`transition-none`、`animate-none`、`duration-0`で標準Motionを消さない。`motion-reduce:`による軽減は許可する。
- アニメーション前にDOMを削除・再作成しない。条件付き描画が必要なら、閉じた状態でDOMへ接続してからライブラリのTriggerで開く。
- 初回表示と2回目以降は別々に検証する。通常設定ではOpacity／Transformの中間状態が存在し、Reduced motionでは実質1msになることを確認する。

---

# 8. コンポーネント選択表

## 8.1 Action

| 条件 | 使用するもの |
|---|---|
| 領域内で最重要の操作 | Filled Button |
| 重要だがPrimaryではない | Tonal Button |
| 中程度の補助操作 | Outlined Button |
| Cancel、Close、低優先度 | Text Button |
| 破壊操作の確定 | Danger Filled Button |
| 破壊操作を開始 | Danger Text Button |
| 名前が広く認知された単一Icon操作 | Icon Button |
| 画面の主要な「作成」 | FAB、Viewportに最大1個 |
| ページ遷移 | `<a>`またはLink Button |

### Button label

必ず動詞から始める。

```text
良い: 保存する、メンバーを招待、完全に削除、CSVをダウンロード
悪い: OK、実行、はい、こちら、送信ボタン
```

## 8.2 Selection

| 条件 | 使用するもの |
|---|---|
| 複数選択 | Checkbox |
| 2件以上から単一選択 | Radio |
| 即時反映されるON/OFF | Switch |
| 選択肢3〜5件の表示モード | Segmented Button |
| 検索結果の短い絞り込み | Filter Chip |
| 既に入力されたToken | Input Chip |
| 数値範囲 | Slider |

Switchへ「保存」ボタンを要求しない。保存が必要ならCheckboxを使う。

## 8.3 Input

| 条件 | 使用するもの |
|---|---|
| 1行テキスト | Text Field |
| 複数行 | Textarea |
| 候補2〜10件、検索不要 | Dropdown（`.gfu-dropdown[data-gfu-dropdown]`） |
| OS標準の表示を意図する場合 | Native Select。固定デザインのフィルターでは使わない |
| 候補が多く検索必要 | Combobox |
| 日付 | Native `input[type=date]` |
| 時刻 | Native `input[type=time]` |
| ファイル | File Upload |
| 全体検索 | Search Field |

## 8.4 Navigation

| 条件 | 使用するもの |
|---|---|
| アプリ主要領域 | Navigation Drawer / Rail |
| 同一ページ内の同格カテゴリ3〜7件 | Tabs |
| 現在位置の階層 | Breadcrumbs |
| 同じ結果集合のページ分割 | Pagination |
| 3〜5段の順次フロー | Stepper |
| 多数の画面・操作の高速検索 | Command Palette |

## 8.5 Overlay

| 条件 | 使用するもの |
|---|---|
| 短い操作一覧 | Menu |
| 元画面を保った短い説明・操作 | Popover |
| Icon名の補足 | Tooltip |
| 判断が終わるまで背後を操作させない | Dialog |
| 文脈を保った詳細編集 | Side Sheet |
| 一時的な非重大結果 | Snackbar |

---

# 9. コンポーネントDOM契約

## 9.1 Filled Button

```html
<button type="button" class="gfu-button" data-variant="filled">
  <span data-icon="add"></span>
  <span>新規作成</span>
</button>
```

必須:

- `button`に`type`
- Iconは先頭または末尾の1個まで
- Labelは省略しない。Icon Buttonの場合だけ省略可
- 同じ`data-gfu-action-group`内にFilledは1個まで

## 9.2 Icon Button

```html
<button type="button" class="gfu-icon-button" aria-label="更新">
  <span data-icon="refresh"></span>
</button>
```

`aria-label`がないIcon Buttonは不合格。

## 9.3 Text Field

```html
<div class="gfu-field">
  <label class="gfu-field__label" for="project-name">プロジェクト名</label>
  <div class="gfu-field__control">
    <input id="project-name" class="gfu-field__input" type="text" aria-describedby="project-name-help">
  </div>
  <p id="project-name-help" class="gfu-field__support">50文字以内で入力してください。</p>
</div>
```

Error時:

```html
<div class="gfu-field" data-invalid="true">
  ...
  <input aria-invalid="true" aria-describedby="email-error">
  <p id="email-error" class="gfu-field__support" role="alert">
    name@example.com の形式で入力してください。
  </p>
</div>
```

## 9.4 Search

```html
<label class="gfu-search" data-gfu-search>
  <span data-icon="search"></span>
  <span class="gfu-visually-hidden">検索</span>
  <input class="gfu-search__input" type="search" placeholder="プロジェクトを検索">
  <button type="button" class="gfu-icon-button" aria-label="検索語を消去" data-gfu-search-clear hidden>
    <span data-icon="close"></span>
  </button>
</label>
```

Searchは通常Fieldより高さを4px大きくし、Full radiusにする。

## 9.5 Tabs

- `role=tablist`
- 各Tabに`role=tab`
- 選択Tabだけ`tabindex=0`
- 未選択Tabは`tabindex=-1`
- `aria-controls`とPanel IDを一致させる
- Panelに`role=tabpanel`と`aria-labelledby`

## 9.6 Dialog

- Native `<dialog>`を使う。
- `aria-labelledby`を持つ。
- Destructive Dialogは`data-dismissible=false`。
- Destructive Dialogの初期FocusはCancel。
- Confirm labelは対象Actionを明示する。「OK」は禁止。

## 9.7 Side Sheet

- Widthは最大480px。
- Header、scrollable Body、Footerの3領域。
- Close Icon Buttonに`aria-label=閉じる`。
- Current pageの詳細編集に使う。重要な確認には使わない。

## 9.8 Menu／Popover

- 完全なDOM例と開閉契約は`COMPONENTS.md`の「Menu / Popover: 初期状態と開閉」を使う。
- Triggerに対応する`data-gfu-menu-trigger`／`data-gfu-popover-trigger`、`aria-controls`、`aria-expanded="false"`を付ける。
- 対象パネルは対応する`.gfu-menu`／`.gfu-popover`と`data-open="false"`を持つ。
- 開閉のイベント処理とCSSをアプリ側で重ねて実装しない。選択による業務処理だけ追加する。

---

# 10. ページ別固定レシピ

## 10.1 Dashboard

```text
Top bar 64px
Drawer 256px
Page gutter 32px
Page header margin-bottom 32px
Alert 0〜1個
Stat grid: 2列 at 600px, 4列 at 1200px
Main data area: 2/3幅
Activity area: 1/3幅
Section gap: 32px〜48px
```

Filled ButtonはPage headerの「作成」1個だけ。

## 10.2 Settings

```text
Content max 720px
Page header
Tabs: カテゴリ3〜7件の場合だけ
Card: 設定グループ単位
Field gap 20px
Group gap 32px
Save action: Card footerまたはPage bottom right
Danger zone: 最後に分離
```

## 10.3 List management

```text
Page header: Title + count + Create Filled
Filter bar
TableまたはListのどちらか
Bulk toolbarは選択時だけ
Pagination
Context editはSide Sheet
```

Filter bar内へCreate Filledを置かない。

## 10.4 Detail

```text
Breadcrumbs
Page title + status + actions
Description list
Peer sectionsはTabs
Timeline任意
Danger zoneは最下部
```

## 10.5 Empty state

```text
64px Primary Container circle
24px Title
14px Body, max 448px
Filled CTA 1個
Text help 0〜1個
```

巨大イラストを必須にしない。

---

# 11. Google系に見えなくなる禁止表

| 禁止 | 理由 | 置換 |
|---|---|---|
| Gradient CTA | 広告・ゲーミングUIに寄る | Solid Primary |
| Glass Card | Surface階層が曖昧 | Opaque Surface + Outline |
| 全Card Shadow | 浮遊面が増えすぎる | BorderまたはContainer color |
| 全要素24px Radius | 形状の意味が消える | Component radius map |
| Primary Sidebar | 色面積が過大 | Canvas + selected container |
| Huge bold heading | Marketing landing風になる | 32px / 400 page title |
| 2個以上のFilled CTA | 優先度が不明 | Filled 1 + Outlined/Text |
| Pill Text Field | Searchとの区別が消える | Field 8px |
| Icon style混在 | 一貫性が崩れる | 1画面1セット |
| Hover lift | Google Workspace系より派手 | Background state only |
| 12px Body | 読みにくい | Body 14px |
| Placeholder only | 入力後に意味が消える | Visible Label |
| Color-only Error | 状態を判別できない | Icon + title + repair text |
| Generic OK | 結果が不明 | 保存する／削除する |
| `div role=button` | Native動作を失う | `<button>` |

---

# 12. AIの最終セルフチェック

出力前に以下を全件確認する。1件でもNoなら修正する。

```text
[ ] h1は1個か
[ ] Page headerは指定構造か
[ ] Filled CTAはAction Groupごとに1個以下か
[ ] Raw colorは0件か
[ ] GradientはSkeleton以外0件か
[ ] ShadowはFloating UI以外0件か
[ ] font-bold以上は0件か
[ ] Arbitrary spacing/radius/colorは0件か
[ ] Text Fieldにvisible labelがあるか
[ ] Icon Buttonにaria-labelがあるか
[ ] buttonにtypeがあるか
[ ] Navigation selected stateはPrimary Containerか
[ ] Search以外のFieldをpillにしていないか
[ ] Errorに修正方法が書かれているか
[ ] Mobile 320pxで主要操作が失われないか
[ ] KeyboardだけでMenu、Tabs、Dialogを操作できるか
[ ] prefers-reduced-motionへ対応しているか
[ ] Menu／Popoverの初期状態と開閉をライブラリへ任せているか
[ ] 初回表示・再表示のMotionを実ブラウザーで検証したか
[ ] npm run lint:design が成功するか
```

---

# 13. AIへ渡す固定プロンプト

```text
G-Force UIを使用して画面を実装してください。

必須:
1. docs/design-contract.jsonを最優先の機械契約として扱う。
2. docs/AI_RULES.mdのページ種別を最初に1つ選ぶ。
3. src/gforce.cssに存在しない色、余白、角丸、Shadow、Variantを追加しない。
4. HTML内でHEX、rgb、hsl、Tailwind arbitrary valueを使わない。
5. 1つのdata-gfu-action-group内にdata-variant="filled"を2個以上置かない。
6. UI本文はgfu-body、見出しは定義済みTypography roleを使う。
7. Search以外の入力欄をpillにしない。
8. 静的CardへShadowを付けない。
9. buttonはtype必須。Icon Buttonはaria-label必須。
10. React、Vue、独自Web Componentsを使わない。HTML、Tailwind CSS、Vanilla JavaScriptで実装する。
11. 出力後にnpm run lint:designを実行し、エラー0件にする。

AI独自の装飾判断は禁止します。迷った場合は、より少ない色、より少ないCard、より少ないPrimary Actionを選んでください。
```
