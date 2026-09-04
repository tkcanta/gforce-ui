# 意思決定記録

重要な代替案があり、互換性・データ・安全性・運用へ長期影響がある判断だけをADRに残す。通常作業で全件を読まない。

- [ADR-001: LPとworkspaceの契約・bundleを分離](ADR-001-landing-profiles.md)

必要時に `ADR-NNN-短い主題.md` を作成する。front matterは `status: draft`、`owner`、`last_reviewed`、`review_triggers`。本文は「状況」「決定」「代替案」「結果」「再検討条件」「関連正本」の順とし、採用時にcurrentへ更新する。

採用した判断を関連する現行正本からリンクする。日々の作業ログや小さな実装選択をADRにしない。独立した空テンプレートは作らず、この書式を使用する。
