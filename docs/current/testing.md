---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - package.jsonのscripts・依存関係・CI・生成対象の変更
  - 公開API・入力契約・UI状態・検証条件の変更
---

# 検証手順

コマンドの正本は [package.json](../../package.json)、CIの正本は [check.yml](../../.github/workflows/check.yml)。現在のCIはNode.js 24でpush・pull_request時に検証する。

## 変更種別ごとの確認

| 変更 | 必須確認 |
|---|---|
| 運用文書・索引だけ | 追加・変更したリンク、メタデータ、正本の優先順位、`git diff --check` |
| Markdown内のUI・クラス例 | 関連契約照合と `npm run check`。MarkdownもCSSビルドの走査対象 |
| CSS・JS・HTML・入力JSON・generator・契約・依存・CI | `npm run check` と `git diff --exit-code -- assets examples` による生成物の同期確認 |
| UIの見た目・操作 | 上記に加え対象状態・キーボード・フォーカス・狭幅を確認。workspace-filesは生成された `test-results/files/` の画像も確認 |

生成元を変更した場合は再生成物を変更に含める。上記の生成物diffは既存HEADとの差分も表示するため、意図した生成物変更と再生成による不整合を区別する。CIではcommit済みの生成物が再生成で変わらないことが必須。

## 実行

初回は `npm ci`。ブラウザ検証には `npx playwright install chromium`、または既存Chromeを使う場合にPowerShellで `$env:GFU_BROWSER_CHANNEL = 'chrome'` を設定する。CIは `npx playwright install --with-deps chromium` を使用する。

- `npm run generate:files`: 入力JSONからHTMLを再生成する。
- `npm run generate:landing`: LPの入力JSONから3つの作例HTMLを再生成する。
- `npm run build`: CSSと配布JavaScriptを生成する。
- `npm run check`: build → check:files → check:landing → lint:design → test → test:browser。
- `npm run serve`: ローカル確認用サーバー、ポート4173。

今回追加する独自のテスト基盤はない。各工程の詳細は既存scriptsを参照する。ブラウザ自動化の前後は [リソースポリシー](../mcp-browser-automation-resource-policy.md)に従う。

LPは `test-results/landing/` の画像を確認する。既存workspaceの操作テストを維持し、LP CSS/JSを追加しても既存画面のスタイルと操作が変わらないことをLPブラウザテストで検証する。

## 完了条件

対象に必要な検証の成功を確認し、意図しない生成物・lockfile差分を残さない。失敗は変更起因と既存・環境起因を区別して報告する。実行できなかった検証や画像未確認を合格としない。過去の [QA_REPORT](../QA_REPORT.md)を今回の成功の根拠にしない。
