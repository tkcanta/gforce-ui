---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - LPとworkspaceの境界・レシピ・生成器の共有方針の変更
---

# ADR-001: LPを用途別固定レシピと専用bundleで統合する

## 状況

既存UIは業務ツールの小さい見出し・密度・操作契約を持つ。添付LP KitはChrome/Workspace型の公開LPへ適した構図を持つが、全体リセット・自由なアクセント・手書きHTML・任意CSSを許す。同じCSSへそのまま混ぜるとツールの精度と弱いAIへの強制力が低下する。

## 決定

利用者区分から3つのLP profileを決定し、入力schema → canonical generator → 完全一致Lint → 実ブラウザ検証の経路を使う。CSS/JSはLP専用bundleとし、既存workspaceのソース・API・回帰ゲートを維持する。配布CSS/JS/フォントの改変も拒否する。

## 代替案

- 既存トークンの上限を緩める: ツールの制約も弱くなるため採用しない。
- ZIPのHTMLとCSSをそのまま追加: 内容・デザインの自由度を機械的に抑えられない。
- 説明文だけでAIへ制約する: 弱いモデルの判断差を検出できない。

## 結果

生成された構造とスタイルは入力と版で再現できる。単一の依存構成・checkコマンド・CIで両用途を検証する。LP独自の入力・描画処理を持つが、workspace側への変更波及を避ける。未対応のLPは自由なCSSで補わず、新しい契約として追加する。

## 再検討条件

実在する複数レシピで共有すべき挙動が増えた場合、両方のテストを維持したまま共通化を検討する。共通化のためだけにworkspaceを変更しない。

## 関連正本

[LP運用](../current/landing.md)、[機械契約](../landing-contract.json)、[入力schema](../landing.schema.json)。
