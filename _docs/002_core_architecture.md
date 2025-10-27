# Core パッケージ アーキテクチャ

## 概要

`@openapi-xcgen/core` は、OpenAPI仕様書（YAML/JSON）を言語非依存のコード生成向け中間表現（IR: Intermediate Representation）に変換する責務を持つコアライブラリです。

本パッケージは、TypeScript/Dart等の各言語生成器（`xcgen-ts`、`xcgen-dart`）が共通して利用する基盤を提供します。

## 全体フロー

coreパッケージは、以下の2段階でOpenAPIからIRへの変換を担当します:

```
OpenAPI YAML/JSON
    ↓
[Parser] parse()
    ↓
OpenAPIDocument (bundle済み、$refは内部参照)
    ↓
[Transformer] transform()
    ↓
XcgenIR (中間表現)
    ↓
(coreの責務はここまで)
    ↓
[各言語生成器] xcgen-ts / xcgen-dart
    ↓
TypeScript/Dart コード
```

## モジュール構成

coreパッケージは以下の3つの主要モジュールから構成されます。

- **parser/**: OpenAPI仕様書のパース。`@apidevtools/swagger-parser`の薄いラッパー
- **transformer/**: OpenAPIDocumentを中間表現（IR）に変換
- **types/ir/**: コード生成向けに抽象化した中間表現。言語固有の詳細を排除

## 設計原則

- **関数ベース**: Tree-shakingに配慮し、純粋関数で実装
- **1ファイル1関数**: in-source testingに対応するため
- **Visitorパターン**: OpenAPIの構造要素ごとに分離（1 Visitor = 1責務）

## 参考資料

### 関連ドキュメント

- [001-requirements.md](./001-requirements.md) - プロジェクト全体の要件定義
- [003_core_ir_design.md](./003_core_ir_design.md) - IR型設計の詳細
- [004_core_parser_transformer.md](./004_core_parser_transformer.md) - Parser/Transformer設計の詳細
- [005-visitor-context-mapping.md](./005-visitor-context-mapping.md) - Visitor実装マッピング
- [tasks/012-unsupported-features.md](./tasks/012-unsupported-features.md) - 制約事項・未実装機能
- [CLAUDE.md](../CLAUDE.md) - 開発ガイドライン全般

### 外部仕様

- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [@apidevtools/swagger-parser](https://apitools.dev/swagger-parser/docs/)
