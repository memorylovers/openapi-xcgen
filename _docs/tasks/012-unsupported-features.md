# 制約事項・未実装機能

## 概要

openapi-xcgenプロジェクトにおける制約事項と未実装機能の一覧です。

---

## @openapi-xcgen/core

### 未実装機能

#### Reference parameter

**説明**: components.parameters内の$ref参照

**影響範囲**:

- 共通パラメータの再利用ができない

**実装時の考慮点**:

- components.parametersの実装が前提
- $ref解決ロジックの追加

---

#### components.parameters

**説明**: 共通パラメータ定義の管理

**影響範囲**:

- 共通パラメータの再利用ができない

**実装時の考慮点**:

- IR型定義に`commonParameters`フィールド追加
- `parameters-components-visitor.ts`の実装
- $ref参照の解決

---

#### Reference schema（header/parameter内の$ref）

**説明**: ヘッダー・パラメータでの$refスキーマ参照

**影響範囲**:

- ヘッダー・パラメータで$refスキーマが使えない

**実装時の考慮点**:

- visitTypeで$ref処理を統一

---

#### Nested $ref

**説明**: components.responses/requestBodies内での$ref参照

**影響範囲**:

- components内で別のcomponentsを参照できない

**実装時の考慮点**:

- $ref解決の再帰処理

---

#### webhooks（OpenAPI 3.1）

**説明**: Webhook API定義

**影響範囲**:

- Webhook API定義
- イベント駆動アーキテクチャ

**実装時の考慮点**:

- OpenAPI 3.1専用機能
- pathsと同様の構造
- IR型定義に`webhooks`フィールド追加

---

#### externalDocs（ルートレベル）

**説明**: API全体の外部ドキュメントリンク

**現状**: tagsには実装済み、ルートレベルは未処理

**影響範囲**:

- API全体の外部ドキュメントリンク

**実装時の考慮点**:

- IRMetadataに`externalDocs`フィールド追加
- 既存の`IRTagExternalDocs`を再利用

---

#### multipleOf

**説明**: 数値の倍数制約

**影響範囲**:

- 数値の倍数制約

**実装時の考慮点**:

- IRValidationに`multipleOf`フィールド追加
- extract-validation.tsでの処理追加

---

#### contentMediaType/contentEncoding

**説明**: コンテンツエンコーディング情報

**影響範囲**:

- コンテンツエンコーディング情報

**実装時の考慮点**:

- ファイルアップロード関連
- Base64エンコーディングなど

---

#### Reference security scheme

**説明**: セキュリティスキームの$ref参照

**影響範囲**:

- セキュリティスキームの$ref参照ができない

**実装時の考慮点**:

- 外部ファイル参照の必要性は低い

---

#### components.examples

**説明**: サンプル値の管理

**影響範囲**:

- サンプル値の管理
- APIドキュメント生成時に有用

**実装時の考慮点**:

- コード生成には直接影響しない
- ドキュメント生成機能と合わせて実装

---

#### components.headers

**説明**: 共通ヘッダー定義の再利用

**影響範囲**:

- 共通ヘッダー定義の再利用

**実装時の考慮点**:

- レスポンスヘッダーは既に実装済み
- 共通定義の再利用部分のみ

---

#### additionalProperties: true

**説明**: 任意のキーを持つMap型

**現状**: 警告を出してスキップ

**影響範囲**:

- 任意のキーを持つMap型

**実装時の考慮点**:

- `Map<string, any>`として扱う
- 型安全性の低下

---

#### OAuth2 flows検証の強化

**説明**: OAuth2スキームのバリデーション強化

**現状**: 基本的な警告のみ

**影響範囲**:

- OAuth2スキームの厳密性

**実装時の考慮点**:

- より詳細なバリデーション
- エラーメッセージの改善

---

### 実装予定なし（制限事項）

以下の機能は実装予定がなく、プロジェクトの制限事項として継続します。

#### not（否定スキーマ）

**理由**: 使用頻度極めて低く、コード生成での表現が困難

---

#### components.links

**理由**: HATEOAS対応、使用例極めて少ない

---

#### components.callbacks

**理由**: webhooksで代替可能

---

#### patternProperties

**理由**: 型システムでの表現が困難

---

#### if/then/else

**理由**: JSON Schema Draft 7の機能、コード生成での表現が極めて困難

---

#### $id/$anchor

**理由**: OpenAPIでの使用例が極めて少ない

---

#### 空のスキーマ `{}`

**理由**: 型安全性の観点から意図的に除外

**説明**: any型相当（すべての型を許可）だが、明示的な型定義を推奨

---

#### xml

**理由**: JSON APIが主流、XML対応はニッチな要件

---

## 参考資料

- [OpenAPI Specification 3.0.3](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Specification 3.1.0](https://spec.openapis.org/oas/v3.1.0)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [TypeSpec Documentation](https://typespec.io/docs/)
