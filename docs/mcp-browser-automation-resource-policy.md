---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - グローバルポリシー・実行環境・cleanup手順の変更
---

# リソースポリシーへの導線

このWindows作業環境の正本は `C:/Users/canta/.codex/docs/mcp-browser-automation-resource-policy.md`。MCP・ブラウザ自動化・subagentを使う前にその本文を読む。実装詳細をプロジェクトへ複製しない。

グローバル `hooks.json` と `Invoke-CodexProcessCleanup.ps1` を利用し、フックを迂回しない。工程scopeの開始・終了、Previewによる対象確認、Cleanupは正本の手順に従う。手動終了はPreviewでSafeToCleanupを確認した対象に限り、名前・PIDだけの一括終了をしない。定義を変更した場合はSelfTestを実行し、フックの再信頼が必要ならユーザーに伝える。

別環境で正本が存在しない場合は、その環境の適用ポリシーを確認してから対象操作を行う。この導線はComputer Useやサブエージェントの利用許可を与えるものではない。
