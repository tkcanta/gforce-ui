---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - 作業範囲・システム境界・主要依存関係の変更
  - GitHub運用・公開先・責任者の確定または変更
---

# プロジェクト概要

このプロジェクトは [tkcanta/gforce-ui](https://github.com/tkcanta/gforce-ui) のUIライブラリ、デザイン契約、カタログ、作例、検証ツール、文書を更新する作業場所。運用責任者はリポジトリ所有者のtkcantaとする。利用対象はライブラリを保守する人・AIと、これを使ってWeb UIを制作する人・AI。

## 構成と正本

- HTML、Tailwind CSS v4、Vanilla JavaScriptを維持する。依存・版・実行コマンドの正本は [package.json](../../package.json) とlockfile。
- [src/gforce.css](../../src/gforce.css) は視覚、[src/gforce.js](../../src/gforce.js) は共通部品の挙動、[src/workspace-files.js](../../src/workspace-files.js) はファイル管理デモの操作を所有する。
- [build-css.mjs](../../tools/build-css.mjs) とbuildコマンドが `assets/` のCSS・JavaScriptを生成する。ビルドはMarkdown内のクラス記述も走査する。
- [入力JSON](../../examples/files.spec.json) → [generate-files.mjs](../../tools/generate-files.mjs) と [テンプレート](../../templates/workspace-files.html) → [生成HTML](../../examples/files.html)。入力契約は [schema](../workspace-files.schema.json) とgeneratorの検証処理。
- 公開するクラス・属性・トークン・DOM・JavaScript APIは既存の [機械契約](../design-contract.json)、[AI規則](../AI_RULES.md)、[部品API](../COMPONENTS.md)を参照し、ここに複製しない。
- 公開LPは [LP契約](landing.md)を使用する。`examples/landing/*.spec.json` → `tools/generate-landing.mjs` → 同名HTML。`src/landing.css` / `src/landing.js` を独立した配布物としてbuildする。

## 作業境界とGitHub運用

利用画面の制作では既存レシピ・APIに従う。ライブラリの変更依頼では、必要な契約・生成元・テスト・説明を一緒に変更する。生成物だけを手編集して差異を隠さない。

ファイル管理デモは実ファイルの送受信、永続化、課金、権限管理を行わない。実サービスへの接続は今回の初期整備の範囲外であり、追加時は信頼境界・入力検証・データ保全を別途定義する。

作業開始時にGitの現在ブランチ・差分・originを確認する。pushやPR作成はその依頼の承認範囲で実行し、対象リポジトリとブランチを確認する。承認済み操作を再確認する必要はない。

## 未決事項

- 更新は目的別の作業ブランチで検証し、GitHubの検証結果と依頼の承認範囲を確認してmainへ反映する。レビュー責任者はtkcanta。
- TBD: 公開サイトの配置先・リリース手順・ロールバック手順。取得したCIは検証用で、デプロイ工程は含まれていない。GitHub側のPages設定・ブランチ保護は未確認。

ローカルの現在状態はGitで確認する。導入説明と製品の目的は [README](../../README.md)を参照。
