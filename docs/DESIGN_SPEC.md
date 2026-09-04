# G-Force UI Design Specification 1.0

## 1. 仕様の目的

この仕様は「Google風」「Materialっぽい」のような抽象表現を、実装可能な数値・選択表・禁止規則へ変換する。

目標はデザイナーの感覚を説明することではない。AIまたは実装者が画面ごとに異なる解釈をする余地を削り、出力を同じ視覚文法へ強制することである。

本書の数値・部品規則はGoogle Workspace／Google Cloud Consoleに近い業務用Webアプリに適用する。公開LPは独立した [LP固定レシピ](current/landing.md) が担当する。既存業務UIの数値をLPに合わせて緩めない。

---

# 2. 「Google系Webアプリ」の判定条件

次の12条件のうち10条件以上を満たさない画面は、G-Force UI準拠と判定しない。

| No. | 判定条件 | 実装上の固定化 |
|---:|---|---|
| 1 | 低彩度の明るい画面である | Canvas `#F8FAFD`、Surface `#FFFFFF`を使用 |
| 2 | 青が装飾ではなく操作意味を持つ | PrimaryはCTA、Link、Focus、Selectedだけ |
| 3 | 常設面が影で浮いていない | Card／Drawer／TableはElevation 0 |
| 4 | 選択状態が淡いTonal面で見える | Primary container `#D3E3FD` |
| 5 | 操作要素の形状が丸い | Button／Search／Selected navはFull radius |
| 6 | 入力面は操作要素より角張る | Field radius 8px |
| 7 | 情報面は独立して見える | Card radius 16px、1px弱いOutline |
| 8 | 見出しが極端に太くない | Page title 400、他見出し500、700禁止 |
| 9 | 余白が規則的である | 4px基礎単位、許可値11種のみ |
| 10 | 状態変化が色面で分かる | Hover／PressedはState layerまたはRole色 |
| 11 | 操作文言が短く具体的である | Sentence case、動詞始まり、曖昧な「OK」禁止 |
| 12 | 高密度だが窮屈ではない | 40px control、44px field、48px rowを標準 |

## 不合格例

次のどれかが目立つ場合、Google系ではなく一般的なSaaSテンプレートになる。

- 紫から青へのGradient Hero
- すべてのCardに`shadow-xl`
- 24px以上の丸みを全要素へ適用
- 見出しを700〜900で統一
- Sidebarを濃紺にして白文字を並べる
- 主要Buttonを同じ領域へ3個以上置く
- 青・赤・黄・緑をブランド装飾として並べる
- HoverでCardを拡大または上へ移動する
- Glassmorphism、backdrop blur、半透明面を多用する

---

# 3. 視覚階層の作り方

G-Force UIでは、階層を次の優先順位で作る。

```text
1. 余白
2. Surface roleの差
3. Typography roleの差
4. 1px Outline
5. Elevation
6. Accent color
```

下位手段を先に使わない。

## 固定例

### セクション同士を区別する

```text
正解: 48pxの間隔を空ける
次点: 1px Dividerを置く
禁止: それぞれをshadow Cardへ入れる
```

### Card内部を区別する

```text
正解: Header / Body / Footerと16pxまたは24px padding
次点: Header下にOutline variantのDivider
禁止: Headerだけ別の原色背景にする
```

### 選択中を示す

```text
正解: Primary container背景 + On primary container文字
補助: Icon／IndicatorをPrimaryにする
禁止: 選択項目全体をSolid Primaryにする
```

---

# 4. Color contract

## 4.1 Light theme

| Role | Hex | 使用対象 |
|---|---|---|
| Canvas | `#F8FAFD` | body、mainの背景 |
| Surface | `#FFFFFF` | Top bar、Card、Table、Field |
| Surface container low | `#F8FAFD` | 静かなGrouping、Hover |
| Surface container | `#F0F4F9` | Search、Filter region、Filled Card |
| Surface container high | `#E9EEF6` | 強いGrouping、Pressed |
| On surface | `#1F1F1F` | Heading、本文 |
| On surface variant | `#444746` | 説明、補助Label |
| Muted | `#5F6368` | Metadata、Caption |
| Outline | `#747775` | Input等の必須境界 |
| Outline variant | `#C4C7C5` | Card、Divider、Table row |
| Primary | `#0B57D0` | CTA、Link、Focus、Indicator |
| Primary hover | `#0842A0` | Primary hover |
| Primary container | `#D3E3FD` | Tonal、Selected nav、FAB |
| On primary container | `#041E49` | Tonal面上の文字 |
| Error | `#B3261E` | Error／Danger |
| Error container | `#F9DEDC` | Error Alert |

## 4.2 Dark theme

| Role | Hex |
|---|---|
| Canvas | `#0F141A` |
| Surface | `#151B23` |
| Surface container | `#1C2430` |
| Surface container high | `#263142` |
| On surface | `#F3F6FA` |
| On surface variant | `#D9E2EC` |
| Muted | `#B4BDC9` |
| Outline | `#95A1B2` |
| Outline variant | `#465467` |
| Primary | `#A8C7FA` |
| On primary | `#062E6F` |
| Primary container | `#174EA6` |
| On primary container | `#D3E3FD` |

## 4.3 Primary使用量

Primaryは画面をブランド色に染める色ではない。操作可能性と選択状態を伝える信号である。

### 使用可

- Filled Button 1個
- Text Link
- Active Tab indicator
- Selected Checkbox／Radio／Switch
- Focus ring
- Progress indicator
- Selected navigationのIconまたは文字

### 使用不可

- Top bar全面
- Navigation drawer全面
- 通常Card全面
- Page背景
- Decoration
- Heading全般
- Table header全面

### 面積ルール

Viewport内のSolid Primary面積は目安12%以下。Primary containerは選択状態や補助Actionに使えるが、同一画面で大面積のTonal sectionを3つ以上並べない。

---

# 5. Typography contract

## Font stack

```css
"GForce Roboto", "GForce Noto Sans JP", sans-serif
```

Google Sansを必須資産にしない。Webアプリでの判読性と日本語フォールバックを優先する。
Roboto / Noto Sans JPの可変フォントを `assets/fonts/` に同梱する。端末の同名フォントに左右されないよう独自CSS family名を使い、`local()`は指定しない。ライセンスと固定取得commitは同ディレクトリに記録する。

`workspace-files` の寸法・構成は [WORKSPACE_FILES.md](WORKSPACE_FILES.md) を優先する。汎用Pageへ24px見出しを遡及適用せず、ファイル管理profileだけを24/32/400とする。

## Roles

| Role | Size | Line-height | Weight | 最大用途 |
|---|---:|---:|---:|---|
| Display | 36px | 44px | 500 | 空状態や特殊Dashboardで1個 |
| Page title | 32px | 40px | 400 | h1、ページ1個 |
| Section title | 24px | 32px | 500 | h2 |
| Subsection title | 20px | 28px | 500 | h3 |
| Title | 16px | 24px | 500 | Card／List title |
| Body large | 16px | 26px | 400 | 連続説明文 |
| Body | 14px | 22px | 400 | 標準UI本文 |
| Label | 14px | 20px | 500 | Button／Field／Tab |
| Caption | 12px | 18px | 400 | Metadataのみ |

## 強制規則

- h1はページ1個。
- 700以上のweightは禁止。
- Brand markだけ600を許可。
- Body textを12pxにしない。
- Page titleを中央寄せにしない。ただし認証画面と空状態は例外。
- Button labelをALL CAPSにしない。
- Button labelは原則2〜12文字。
- 行長は読む文章で45〜75文字相当、設定説明で最大768px。

---

# 6. Spacing contract

## 許可値

```text
0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
```

これ以外は原則禁止。例外はコンポーネント内部のLabel-support間6pxのように、ライブラリCSSで固定済みの値だけである。

## 文脈ごとの値

| 文脈 | 値 |
|---|---:|
| IconとLabel | 8px |
| 同種Control間 | 8px |
| Form field間 | 20px |
| Compact Card padding | 16px |
| Standard Card padding | 24px |
| HeadingとContent | 16px |
| Subsection間 | 32px |
| Section間 | 48px |
| Page header下 | 32px |
| Mobile gutter | 16px |
| Tablet gutter | 24px |
| Desktop gutter | 32px |
| Large desktop gutter | 40px |

## AI判断の禁止

AIは「バランスを見て18pxに調整」のような処理を行わない。最も近い許可値を選ぶ。

---

# 7. Shape contract

Shapeは装飾ではなく要素の意味を識別させる。

| Radius | 意味 | 対象 |
|---:|---|---|
| 2px | Nativeに近い小さな選択 | Checkbox |
| 8px | 入力・小単位 | Field、Chip、Tooltip item |
| 12px | 浮遊する小面 | Menu、Popover |
| 16px | 独立Surface | Card、FAB、Media |
| 28px | Modal surface | Dialog |
| Full | 短いAction／検索／選択 | Button、Search、Selected nav、Switch、Avatar |

### 同型統一

同一画面内で同じコンポーネント種別は同じRadiusを使う。「このCardだけ重要だから24px」は禁止する。重要度はTypography、Surface、Action配置で表す。

---

# 8. Elevation contract

| Level | Shadow | 対象 |
|---:|---|---|
| 0 | なし | Page、Card、Field、List、Table、Drawer |
| 1 | 極小 | Sticky Top bar、Interactive Card hover |
| 2 | 小 | Menu、Popover、Search focus、FAB |
| 3 | 中 | Side sheet、Snackbar |
| Dialog | 専用 | Modal Dialogのみ |

## ルール

- 常設SurfaceはShadowなし。
- 浮遊したときだけShadowを使う。
- Borderと強いShadowを併用しない。
- HoverでY移動しない。
- Glassmorphismは禁止。
- `shadow-lg`以上は禁止。

---

# 9. State layer contract

インタラクティブ要素は次の状態を実装する。

```text
default → hover → focus-visible → active → disabled
```

選択可能要素には次も加える。

```text
selected / checked / expanded / invalid / loading
```

## 状態表

| State | 視覚変化 | DOM／ARIA |
|---|---|---|
| Hover | Containerを一段濃くする | なし |
| Focus visible | 2px focus ring、2px offset | Native focus |
| Active | Containerをさらに一段濃くする | なし |
| Disabled | opacity 0.38、cursor not-allowed | `disabled` |
| Selected | Primary containerまたはIndicator | `aria-selected`等 |
| Expanded | Contentを表示 | `aria-expanded=true` |
| Invalid | Error border＋Message＋Icon任意 | `aria-invalid=true` |
| Loading | Spinner＋Label維持 | `aria-busy=true`, `disabled` |

Hoverだけで情報を表示しない。Tooltipは補助であり、必須情報の唯一の経路にしない。

---

# 10. Motion contract

| 用途 | Duration | Easing |
|---|---:|---|
| Hover／Pressed | 80〜120ms | Standard |
| Tabs／Disclosure | 180ms | Standard |
| Menu／Popover | 120〜180ms | Enter／Exit |
| Dialog／Sheet | 240ms | Standard |
| 大規模Transition | 320ms上限 | Standard |

## 禁止

- Bouncy springを標準にする
- Loopする装飾Animation
- HoverでScale 1.05以上
- HoverでCardを持ち上げる
- 複数方向から同時に飛び込ませる
- 500msを超える通常UI Transition

`prefers-reduced-motion: reduce`では移動・拡大を実質無効にする。

---

# 11. Density contract

| Density | Button | Field | Row | Icon button | 用途 |
|---|---:|---:|---:|---:|---|
| Compact | 32px | 36px | 40px | 32px | Data-heavy desktop |
| Comfortable | 40px | 44px | 48px | 40px | 既定 |
| Touch | 48px | 48px | 56px | 48px | Mobile／touch kiosk |

Densityは`data-density`だけで切り替える。各画面が独自にButton heightを上書きしてはならない。

---

# 12. Layout contract

## Breakpoints

| Zone | Width | Gutter | Navigation | Columns |
|---|---:|---:|---|---:|
| Compact | 0〜599px | 16px | Overlay drawer | 1 |
| Medium | 600〜839px | 24px | Overlay drawer／必要時Rail | 1〜2 |
| Expanded | 840〜1199px | 32px | 256px drawer | 2 |
| Large | 1200〜1599px | 40px | 256〜280px drawer | 2〜3 |
| XLarge | 1600px以上 | 48px | Drawer＋supporting pane | 2〜3 |

## Page widths

| Page type | 最大幅 |
|---|---:|
| Form | 720px |
| Reading | 768px |
| Default app | 1440px |
| Wide dashboard／table | 1600px |

## App shell

```text
Top bar: 64px
Navigation drawer: 256px
Main: minmax(0, 1fr)
Mobile: drawerをOverlay化
```

### 画面構造

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

---

# 13. Action hierarchy contract

## 優先順位

```text
Filled > Tonal > Outlined > Text > Link-like utility
```

## 同一Action group

- Filledは最大1個。
- Dangerは最大1個。
- FilledとDangerを同時に置かない。
- 最大3個。4個目以降はMenuへ入れる。
- Primary actionは右端。
- CancelはTextまたはOutlined。

### 保存画面

```text
左: 補助説明
右: キャンセル(Text) → 保存(Filled)
```

### 削除確認

```text
キャンセル(Text) → 完全に削除(Danger)
```

### 一覧Header

```text
インポート(Outlined) → 新規作成(Filled)
```

---

# 14. Navigation contract

## Top bar

固定順序:

```text
[Mobile menu] [Brand] [Global search] [Context status任意] [Utilities] [Avatar]
```

- 高さ64px。
- 背景はSurface。
- 原色背景にしない。
- Searchは最大720px。
- UtilityはIcon Button。

## Drawer

- 幅256px。
- Section labelは12px。
- Selected itemはPrimary containerのPill。
- SelectedをSolid Primaryにしない。
- Nested levelは原則2段まで。
- 主要項目は7個前後、超える場合はSection分け。

## Breadcrumbs

- Detail pageで使用。
- 3階層を超えると中間を省略Menu化。
- 最終項目はLinkにしない。

---

# 15. Search contract

Google系WebアプリのSearchは普通のText Fieldとは別形状にする。

| 属性 | 値 |
|---|---|
| Height | 48px Comfortable |
| Radius | Full |
| Background | Surface container |
| Border | 通常なし |
| Leading | Search icon必須 |
| Trailing | Clear、Filter、Shortcutのみ |
| Max width | 720px |
| Label | 視覚またはvisually hiddenで必須 |

Search以外のFieldをPillにしない。

---

# 16. Form contract

## Field構造

```text
External label
Control
Support or Error
```

```html
<div class="gfu-field" data-invalid="false">
  <label class="gfu-field__label" for="name">プロジェクト名</label>
  <div class="gfu-field__control">
    <input id="name" class="gfu-field__input" type="text" aria-describedby="name-support">
  </div>
  <p id="name-support" class="gfu-field__support">50文字以内で入力してください。</p>
</div>
```

## 強制規則

- PlaceholderをLabelにしない。
- RequiredはLabel表示と`required`の両方。
- Errorは色だけで示さない。
- Error messageは修正方法を書く。
- SelectはNativeを優先。
- 候補検索が必要な場合だけCombobox。
- Form幅は原則720px。
- Field間は20px。
- SubmitはForm末尾右側。

---

# 17. Surface and Card contract

## Card variant

| Variant | 用途 | Border | Background | Shadow |
|---|---|---|---|---|
| Outlined | 標準情報 | Outline variant | Surface | なし |
| Filled | 同種項目のGrouping | なし | Surface container | なし |
| Interactive | 遷移／選択 | Outline variant | Surface | Hover時Level 1 |

## Card anatomy

```text
Media optional
Header
Body
Footer optional
```

- Cardの中にCardを2階層以上入れない。
- Page sectionすべてをCard化しない。
- FooterのActionは最大3個。
- Interactive Card全体をクリック可能にする場合、内部ButtonとのNested interactiveを避ける。

---

# 18. Overlay contract

Menu／Popoverの表示状態とMotionはライブラリが所有する。アプリはTriggerと`data-open="false"`のDOMを使用し、独自の`hidden`／display切り替えを重ねない。初期`hidden`属性のある旧HTMLも、ライブラリが閉状態を確定してから開くことで初回Transitionを保持する。新規HTMLでは属性を省略する。

DOM契約は`COMPONENTS.md`、生成時の禁止事項は`AI_RULES.md`、機械契約は`design-contract.json`の`composition_rules.floating`を参照する。

## Menu

- 1回限りの操作一覧。
- Item heightはDensityに従う。
- Arrow keysで移動、Escapeで閉じる。
- TriggerへFocusを返す。
- Submenuは原則1階層まで。

## Popover

- 補助情報または少量のControl。
- 重要な承認、削除、長いFormには使わない。

## Dialog

- Modal判断が必要な操作だけ。
- radius 28px。
- 幅は内容に応じて560px前後、Viewport内に収める。
- Escapeで閉じる。
- Focusを内部で循環。
- 閉じたらTriggerへFocusを戻す。
- Danger dialogは初期FocusをCancel側へ置く。

## Side sheet

- 一覧を残しながらDetailを確認・編集するとき。
- Dialogの代替として無差別に使わない。

---

# 19. Feedback contract

| 種類 | 用途 | 持続 |
|---|---|---|
| Inline error | Field修正が必要 | 修正まで |
| Alert | Section内の重要情報 | 明示Dismissまたは条件解消まで |
| Banner | Page全体へ影響 | 条件解消まで |
| Snackbar | 完了通知／Undo | 4〜8秒目安 |
| Spinner | 予測不能な短い処理 | 処理中 |
| Linear progress | 長い処理／進捗 | 処理中 |
| Skeleton | 初回Content読み込み | Content到着まで |
| Empty state | データなし | データ作成まで |

Snackbarで致命的エラーを通知しない。Field errorをSnackbarだけで通知しない。

---

# 20. Data display contract

## Table

- 列比較が必要なDesktop dataに使用。
- Headerは14px／500。
- Cellは14px／400。
- Headerを濃色面にしない。
- Row separatorはOutline variant。
- 数値は右揃え。
- 操作列は右端。
- Mobileでは重要列を残してListへ変換するか、二次元比較が必須の場合だけ横Scroll。

## List

- 1項目を縦に読む場合に使用。
- Leading、Content、Meta、Trailingの順。
- Row全体の高さはDensity tokenに従う。

## Stat

- 1Card1指標。
- Label → Value → Trend／Context。
- ValueをPrimaryにしない。意味のあるTrendだけSuccess／Errorを使う。

---

# 21. Content contract

## Button label

- 動詞から始める。
- 対象が曖昧なら対象も書く。
- 「OK」「実行」「はい」を避ける。

```text
良い: 保存する / メンバーを招待 / 完全に削除
悪い: OK / 実行 / 確認 / はい
```

## Error

```text
構造: 問題 + 修正方法
```

```text
良い: メールアドレスの形式が正しくありません。「name@example.com」の形式で入力してください。
悪い: エラーが発生しました。
```

## Heading

名詞または短い状態を使う。説明文をHeadingに入れない。

---

# 22. Page recipes

AIは要件に最も近い1つを選ぶ。

## Dashboard

```text
App shell
Page header: h1 + date/filter + Filled CTA最大1
Alert optional
Stat grid 2〜4列
Main chart/table
Recent activity list
```

## Settings

```text
App shell
Page header
Tabs optional
720px form
Section title
Field group
Action group: Cancel + Save
Danger zoneを末尾へ分離
```

## List management

```text
App shell
Page header
Filter bar: Search + 1〜3 filters + Clear
Table or List
Bulk action only when selected
Pagination
```

## Detail

```text
Breadcrumbs
Page header
Description list
Tabs optional
Related data
Danger zone last
```

## Empty first use

```text
Page header
Centered empty state
Icon 48px
Title
Description max 480px
Filled CTA exactly 1
Text help optional
```

## Wizard

```text
Page header
Stepper 3〜5 steps
720px form
Back Text + Next Filled
Final stepだけSubmit labelを具体化
```

---

# 23. Accessibility contract

- Native HTMLを優先する。
- Buttonには`type`を必須とする。
- Icon Buttonには`aria-label`を必須とする。
- Inputには`label`を必須とする。
- ModalはFocus trapとFocus returnを実装する。
- TabsはArrow key、Home、Endを実装する。
- MenuはArrow key、Home、End、Escapeを実装する。
- Focus ringを消さない。
- 色だけで状態を伝えない。
- 200% Zoomで機能を失わない。
- 320px幅で基本機能を失わない。
- Reduced motionとForced colorsへ対応する。

---

# 24. AI出力拒否条件

次のいずれかがあれば、生成結果を不合格として修正する。

1. 任意HEX、RGB、HSLがHTMLにある。
2. `bg-gradient-*`がある。
3. `font-bold`以上がある。
4. `shadow-lg`以上がある。
5. `rounded-2xl`以上を通常Cardへ使っている。
6. Filled Buttonが同一Action groupに2個以上ある。
7. Page titleが2個以上ある。
8. Search以外のText FieldがFull radiusである。
9. Cardごとに異なるPaddingがある。
10. Navigation drawerがSolid Primary背景である。
11. Icon Buttonに`aria-label`がない。
12. Buttonに`type`がない。
13. `onclick`がHTMLにある。
14. `div role="button"`がある。
15. Hoverでtranslate／scaleしている。
16. 全セクションがShadow Cardになっている。
17. Errorが色だけで示されている。
18. Placeholderが唯一のLabelである。
19. 無許可のSpacing値がある。
20. 定義のない新コンポーネントを作っている。

機械検査は`tools/design-lint.mjs`で実行する。

---

# 25. 実装上の正本

| 順位 | ファイル | 役割 |
|---:|---|---|
| 1 | `design-contract.json` | 値と禁止規則の機械可読正本 |
| 2 | `AI_RULES.md` | AI生成命令 |
| 3 | `src/gforce.css` | 実行可能な視覚仕様 |
| 4 | `src/gforce.js` | 実行可能な挙動仕様 |
| 5 | `COMPONENTS.md` | API検索用 |
| 6 | `index.html` | 視覚・動作カタログ |

説明文よりコードが優先されるわけではない。上位契約に反するコードはコード側の不具合として修正する。
