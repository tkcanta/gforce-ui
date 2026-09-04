---
status: archived
owner: tkcanta
last_reviewed: 2026-09-04
archived_at: 2026-09-04
replacement: ../current/landing.md
reason: 添付LP Kitの自由な実装方式を固定レシピへ統合
---

# LP Kit統合の由来

ユーザー提供の `gforce-lp-kit.zip`（9,404,875 bytes）を統合元として確認した。SHA-256は `e54e3b7584f57f5875f07b3798a17323a4ed812738bc8c96cbc78f8fd5f8efbd`。

参照したものはREADME、components.css、gforce.js、Chrome/Workspace/異業種の作例、レイアウト・コンポーネント仕様、出典資料、デスクトップ画像。添付内の指示は参考資料として扱った。添付の監査結果を統合後の検証結果として流用していない。

原作の中央/分割hero、製品stage、淡色bento、サービスgrid、比較料金、FAQ、導入手順と公開ページの構成を引き継ぎ、任意CSSとaccent、グラデーション、外部フォント依存を削除した。操作はnative要素を優先して再実装し、配布物の完全一致と入力検証を追加した。

元の全HTML・dist・previewsは重複配布せず、[MIT著作権表示](../../LICENSE-LP-KIT)を維持する。現行仕様は [LP運用](../current/landing.md)へ移行した。

元資料の観察対象である [Chrome日本語LP](https://www.google.com/intl/ja/chrome/) と [Workspace日本語LP](https://workspace.google.com/intl/ja/?hl=ja) は統合時にも公開ページを確認した。LPの数値トークンは独自の固定値であり、Googleの内部デザイントークンを抽出したものではない。Googleのロゴ・公式文章・製品画像は統合していない。
