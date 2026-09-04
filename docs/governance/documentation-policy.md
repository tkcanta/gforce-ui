---
status: current
owner: tkcanta
last_reviewed: 2026-09-04
review_triggers:
  - 正本・責任者・文書構成・レビュー運用の変更
---

# 文書運用規則

## 配置と読み込み

minimal構成を採用する。既存の契約・仕様書があるため、新規の現行資料はプロジェクト概要と検証手順に絞る。AGENTSは常時必要な規則、INDEXは読む資料の選択、currentは現行運用、decisionsは重要判断の理由、historyは過去の証跡を担当する。

既存資料は移動・本文複製をせず、[INDEX](../INDEX.md)で正本として登録する。既存のJSONへ管理用フィールドを追加しない。新しい正本文書は `docs/current/`、文書管理規則は `docs/governance/` に置く。

## 状態・メタデータ

- `current`: 現在有効な正本。
- `draft`: 未承認の案。実装根拠として扱わない。
- `deprecated`: 置換済みで移行中。置換先を明記する。
- `archived`: 過去の経緯・結果。現在の仕様・検証結果ではない。
- `unknown`: 有効性未確認。推測でcurrentにしない。

新規の正本・governanceはfront matterに `status`、`owner`、`last_reviewed`、`review_triggers` を持つ。既存ファイルのstatus・owner・確認日はINDEXで管理し、更新契機は下表で管理する。確認日は内容を確認したときだけ更新する。

## 同じ変更で更新する対象

| 変更契機 | 更新・照合する資料 |
|---|---|
| 公開クラス・トークン・属性・DOM・JS API・アクセシビリティ | design-contract.json、AI_RULES、COMPONENTS、必要なDESIGN_SPECとカタログ |
| workspace-filesの入力・レシピ・版 | schema、generator、WORKSPACE_FILES、テンプレート、作例、対応する契約・テスト |
| LPの用途・入力・レシピ・版・視覚・操作 | landing-contract、landing.schema、current/landing、generator、テンプレート、配布元、作例、回帰テスト |
| コマンド・ビルド・依存・CI | package.json、lockfile、CI、current/testing、READMEの該当手順 |
| URL・外部API・保存形式・認証認可・個人情報・秘密・信頼境界 | 関連コードと契約、current/project-overview。詳細が必要になった時点で個別正本を追加 |
| 配置・設定・リリース・移行・ロールバック | current/project-overview。公開運用の確定時にdeployment正本を追加 |
| スコープ・システム境界・責任者 | current/project-overview、関係するINDEX行 |
| 文書の追加・移動・廃止 | INDEX、参照元、置換先。理由が重要ならADR |

既存仕様の優先順位を維持する。明示的なユーザー指示との競合はユーザー指示を優先し、整合が必要な既存資料を変更対象として扱う。

## レビューと置換

作業担当はコード・設定との整合、リンク、状態、更新契機を自己確認する。責任者はtkcanta。PRを使う場合は同じPR内で対応する文書をレビューし、採用前の案はdraftのままにする。

置換時は旧資料にstatus、置換先、アーカイブ日、理由を記録する。必要に応じて `docs/history/` へ移動し、参照元を修正する。旧リンクの利用がある場合は旧パスに短い案内を残す。履歴は削除せず、通常の既定読み込み対象から外す。

既存資料は今回すべてパスを維持する。QA_REPORTとCHANGELOGは記録として分類し、追記先も維持する。既存ファイルに変更がないため、今回の整備は追加ファイル単位で取り消せる。

## 増やす基準

一つの資料に独立して変更される複数の主題が集まったときだけ分割し、INDEXへ読む条件を追加する。特定領域だけの常時規則が必要になった場合に限り、近接AGENTSを設ける。DB・認証・公開運用など未導入機能の空テンプレートは作らない。
