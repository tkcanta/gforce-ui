# 資料索引

依頼とAGENTSで対象・禁止事項・完了条件を確認し、下表から最も狭い正本を選ぶ。根拠不足のときだけ関連資料を1件ずつ追加し、理由が必要な場合だけADRを読む。根拠が揃ったら探索を止める。

下表のownerはすべて `tkcanta（リポジトリ管理者）`。最終確認日は索引上の役割・参照先の確認日であり、全仕様の再検証日ではない。既存資料のメタデータはこの索引と文書運用規則で管理する。

| 主題 | 正本・参照先 | 状態 | 読む条件 | 読まない条件 | owner | 最終確認日 |
|---|---|---|---|---|---|---|
| 作業範囲・構成 | [プロジェクト概要](current/project-overview.md) | current | 初回作業、構成・公開方法の変更 | 対象範囲が確定した局所修正 | tkcanta | 2026-09-04 |
| 導入・利用方法 | [README](../README.md) | current | 導入、利用側の手順確認 | 履歴の通読は不要 | tkcanta | 2026-09-04 |
| UIの機械契約 | [design-contract.json](design-contract.json) | current | UI、API、Lint、レシピ変更 | 運用文書のみの変更 | tkcanta | 2026-09-04 |
| UI生成規則 | [AI_RULES](AI_RULES.md) | current | 画面制作・UI規則変更 | 運用文書のみの変更 | tkcanta | 2026-09-04 |
| 視覚仕様 | [DESIGN_SPEC](DESIGN_SPEC.md) | current | 視覚値・レイアウトの確認 | 挙動だけの局所修正 | tkcanta | 2026-09-04 |
| 部品API | [COMPONENTS](COMPONENTS.md) | current | 対象部品のDOM・状態・API変更 | 関係しない部品 | tkcanta | 2026-09-04 |
| ファイル管理レシピ | [WORKSPACE_FILES](WORKSPACE_FILES.md)、[入力schema](workspace-files.schema.json) | current | ファイル管理・生成処理の変更 | 他の画面・文書運用 | tkcanta | 2026-09-04 |
| 公開LP | [LP固定レシピ](current/landing.md)、[機械契約](landing-contract.json)、[入力schema](landing.schema.json) | current | LP制作・レシピ・生成器・LP検証の変更 | 業務ツールだけの変更 | tkcanta | 2026-09-04 |
| コマンド・CI | [検証手順](current/testing.md)、[package.json](../package.json)、[CI](../.github/workflows/check.yml) | current | 検証、ビルド、依存変更 | 対象のない手順は実行不要 | tkcanta | 2026-09-04 |
| 文書運用 | [documentation-policy](governance/documentation-policy.md) | current | 正本・索引・責任・文書構成の変更 | 通常の部品実装 | tkcanta | 2026-09-04 |
| リソース管理 | [リソースポリシー](mcp-browser-automation-resource-policy.md) | current | MCP、ブラウザ自動化、プロセス管理 | ファイル編集だけの作業 | tkcanta | 2026-09-04 |
| 判断理由 | [ADR運用](decisions/README.md)、[参照資料](SOURCES.md) | current | 設計理由・外部根拠の確認 | 通常の実装では通読しない | tkcanta | 2026-09-04 |
| 過去の検証・変更 | [履歴運用](history/README.md)、[QA_REPORT](QA_REPORT.md)、[CHANGELOG](../CHANGELOG.md) | archived（記録） | 回帰・移行・監査・経緯調査、明示依頼 | 通常実装の現行仕様確認 | tkcanta | 2026-09-04 |

`archived（記録）` は過去の結果という分類。記録先は継続利用し、過去の成功を現在の検証結果として扱わない。`draft`、`deprecated`、`unknown` の資料を追加するときも状態を明示する。
