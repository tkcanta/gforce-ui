# Changelog

## 1.3.0 — 2026-09-04

- 添付LP Kitを一般向け・法人向け・両方向けの固定レシピとして統合。
- LP用JSON契約・schema・生成器・生成物完全一致・配布asset検証・ブラウザ回帰を追加。
- LPのCSS/JSを独立し、既存workspaceのソースとAPIを維持。単一のcheck/CIで両方を検証。
- 導入、移行、契約の適用範囲、AI用の入力手順を整備。

## Unreleased

- Menu／Popoverが初期`hidden`属性付きでも、閉状態を確定してから初回Transitionを開始するよう修正。
- 初期状態とMotionの所有者をAIルール・機械契約・DOM例へ明記し、カタログの推奨HTMLから`hidden`属性を除去。
- 標準の表示制御・Motionを妨げるクラスをDesign Lintで検出。
- 初回・再表示・動的DOM・連続開閉・Escape/Focus・Reduced motionを検証するブラウザー回帰テストを`npm run check`へ追加。
- 配布JavaScriptのコピーをNode標準APIに変更し、Windowsでも同じビルドコマンドを使用可能にした。

## 1.0.0 — 2026-09-03

- Initial strict Google-like design contract
- Tailwind CSS v4 token and component layer
- Vanilla JavaScript behaviors
- Light and dark themes
- Compact, comfortable, and touch density modes
- Interactive catalog with 45+ demonstrations
- 63-item component and pattern inventory
- Dashboard, settings, and list-detail examples
- Design lint and smoke tests
- Machine-readable AI contract and deterministic generation rules
