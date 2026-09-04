# G-Force UI 更新作業

- この作業場所は `tkcanta/gforce-ui` の更新用。今回のユーザー指示、適用される上位指示、対象に近いAGENTSを尊重する。
- 最初に `git status --short` を確認し、既存差分を保護する。関連コード・呼び出し元・テスト・設定を読んでから、目的に必要な範囲だけを変更する。
- [資料索引](docs/INDEX.md)から対象の正本だけを読む。既存パスの正本も有効。履歴は回帰・移行・監査・経緯調査または明示依頼時だけ読む。
- UI変更前は `docs/design-contract.json` と `docs/AI_RULES.md` を確認する。契約の優先順位は既存READMEに従う。ライブラリ自体の契約変更と利用画面の制作を区別し、契約変更は関連仕様・実装・検証を同時に更新する。
- `assets/` と `examples/files.html` は生成元を修正して再生成する。アクセシビリティ、入力検証、互換性を省略しない。
- 公開LPは `docs/current/landing.md` の固定レシピを使用する。`examples/landing/*.html` はJSONから生成し、既存workspaceの規則・CSS/JSへLP例外を混ぜない。
- 新規の制作物に絵文字・グラデーションを追加しない。ユーザー指示が既存仕様の例外と競合する場合はユーザー指示を優先する。
- 秘密情報・個人情報をファイルやログへ転記しない。削除・上書き・push・公開・送信は対象と既存の承認範囲を確認し、破壊的なGit操作をしない。
- サブエージェントとComputer Useはユーザーまたは適用スキルの明示指示がある場合だけ使用する。MCP・ブラウザ自動化・プロセス管理は[リソースポリシー](docs/mcp-browser-automation-resource-policy.md)に従う。
- [検証手順](docs/current/testing.md)を変更種別に応じて実行し、公開契約・検証・運用を変えたら[文書運用規則](docs/governance/documentation-policy.md)に従って正本も更新する。
- 完了時は変更内容、実行した検証と結果、未検証事項、GitHubへの反映状況を簡潔に報告する。
