# workspace-files 1.2.0

ファイルを検索・開く・整理する画面専用の固定レシピ。Google Driveの情報密度と、Workspaceの静かな面構成を参照した独自実装です。Google公式製品・完全な画面複製ではありません。

## AIの判断を固定する入口

「ファイル管理」「ドライブ」「ファイル一覧」なら、このレシピを選びます。Dashboardから組み立てません。
AIが作るのは `examples/files.spec.json` と同じ形式のデータだけです。HTML、CSS、アイコン、余白、レイアウト、主要操作の位置を再発明しません。

```sh
npm ci
npm run generate:files
npm run check
```

独立した利用側への生成例（対象ディレクトリは事前に用意する）:

```sh
node tools/generate-files.mjs examples/files.spec.json ../index.html --assets gforce-ui/assets
node tools/generate-files.mjs examples/files.spec.json ../index.html --assets gforce-ui/assets --check
node tools/design-lint.mjs ../index.html
```

`--check` は生成物の差分があれば失敗します。独自修正でlintを通さず、入力かライブラリのレシピを修正してください。

## 再現性の保証範囲

同じレシピ版・入力データ・asset相対パスからは、モデルを使わず同じHTMLバイト列を生成します。JSONのキー順序は正規化します。フォントは同梱し、端末の「Roboto」への名前衝突を避けます。

任意の自然言語を異なるAIが同じデータへ解釈すること、異なるOS/ブラウザのピクセル完全一致、未実装の画面種別までの同一性は保証しません。これらを「同じ判断」の検証済み範囲に含めません。

ライブラリを導入するときは、Git commitを固定し `npm ci` を使います。`main` の常時追従や浮動CDN版で再現性を主張しないでください。

## 固定する設計

| 項目 | 契約 |
|---|---|
| 用途 | list-management / my-drive。KPI、常設リマインダー、広告風説明、重複見出しは禁止 |
| 面 | メインの作業面1枚。Toolbar/Tableを別Cardにしない |
| タイトル | 24/32/400。汎用Pageの32/40/400とは別の明示的profile |
| Shell | Topbar 64px、Drawer 256px、600–839pxはRail 80px |
| 余白 | ページ左右16px、作業面内部はdesktop24px / compact0px |
| 検索 | expanded時、外枠左端と作業面内容左端を一致。320pxの空検索入力は160px以上 |
| 新規 | Desktopは左ナビのTonal、Compactは見出し右のTonal。常に表示1個 |
| フィルター | 共通Dropdown。種別・更新日とも全体のfocus枠＋スタイル済みlistbox。内側selectだけの枠とOS標準popupは禁止 |
| 形式 | 内容領域720px未満はList、以上はTable。viewport幅だけで決めない |
| 行 | Table48px、Touch56px。名前14/20/400、アイコン24px、数値は右寄せ |
| First row | 1366×768、390×844で上端280px以内。完全表示6件/4件以上 |
| 状態 | 通常、選択中、検索結果なし、初回空、Loading、Error + 再試行 |
| 作成 | Menu → 名前入力Dialog。Dialog DOM・focus帰還を固定 |
| 容量 | native meter（0–100）。進捗は `GForceUI.progress.set(element, value)` |
| 種別色 | 文書/画像/PDF専用token。成功/警告/エラーの意味を流用しない |

## 入力と実装の境界

`docs/workspace-files.schema.json` が編集用schema、`tools/generate-files.mjs` が相互参照・循環・日付まで検査する実行時の入口です。不明フィールド、未知の種類、重複ID、壊れた親子関係、未対応版は拒否します。

`referenceDate` は固定したデモ基準日です。実行日で「7日以内」の結果が変わらないようにします。実アプリへ接続するときは取得データと基準日を一緒に更新してください。

`templates/workspace-files.html` は構造、`src/gforce.css` は視覚、`src/gforce.js` は共通部品、`src/workspace-files.js` はローカルデモの操作を所有します。配布先は `assets/` の一組だけです。

このデモは永続化・実ファイル読み取り・送信・課金・権限管理を行いません。アップロードも固定サンプルの成功/失敗を再現します。件数は現在の配列から算出し、架空の総件数やページ送りを置きません。最大1000件のローカルfixtureを対象とし、実運用の大量データはサーバー側ページング等を別途接続してください。

## 合格の条件

1. `check:files`：同一入力による生成物の完全一致。
2. `lint:design`：未登録class/icon/hook、リンク先CSS、Dialog構造、生成DOM改変などの静的検査。
3. `test`：正常fixtureの合格と既知の不正fixtureの拒否。
4. `test:browser`：幅別の寸法、フォント実使用、操作、focus、値、既知不具合の再現検出。
5. `test-results/files/` の画像を人または画像を読めるAIが確認。機械検査がgreenでも視覚合格の代用にはしない。

## AIへ貼る最小指示

```text
gforce-uiの workspace-files 1.2.0 を使う。
READMEの導入版をGit commitで固定し、docs/WORKSPACE_FILES.mdを読む。
examples/files.spec.jsonの形式に合わせ、データだけを編集する。
テンプレート、CSS、DOM、アイコン、操作位置を自由生成・上書きしない。
generate-files.mjsでHTMLを生成し、npm run checkと生成物--checkを通す。
未対応要件は既存profileへ無理に押し込まず、未対応として報告する。
```
