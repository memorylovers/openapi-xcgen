# タスク012: Coreパッケージ未対応機能一覧

## 概要

本ドキュメントは、`@openapi-xcgen/core`パッケージにおける未対応のOpenAPI機能を網羅的にリストアップしたものです。各機能について実装推奨度を評価し、今後の開発計画の参考とします。

## コード生成前の推奨実装項目

### 必須対応（IR型定義への影響が大きい）

**Phase 1: コード生成前に完了すべき項目**

1. **servers**（最高）- 生成コードのベースURL設定に必須
2. **readOnly**（高）- リクエスト/レスポンスで型を分ける必要
3. **writeOnly**（高）- セキュリティ上重要（パスワードなど）

### 推奨対応（IR構造の完成度を高める）

**Phase 2: 型システム対応**

4. **allOf**（高）- 継承・マージパターン、IR設計への影響大
5. **oneOf / anyOf**（中）- Union型の表現方法がIR設計に影響

### 後回し可能

以下はIRへの情報追加のみで、コード生成ロジックへの影響が限定的：

- components.parameters, webhooks, externalDocs, multipleOf など

---

## 1. 最高: servers

**現状**: 未処理

**影響範囲**:

- APIベースURL情報
- 環境別エンドポイント管理

**実装時の考慮点**:

- IR型定義に`servers`フィールド追加
- variables（テンプレート変数）の処理
- コード生成時の活用方法

**推奨アクション**:
最高で実装を検討すべき機能。生成コードの設定管理に有用。

---

## 2. 高: allOf（スキーママージ）

**現状**: 警告を出してスキップ

```typescript
// schema-visitor.ts:90-94
if ("allOf" in schema && schema.allOf) {
  consola.warn(
    `allOf is not supported yet: ${buildReferencePath(context.documentPath)}`,
  );
  return result;
}
```

**影響範囲**:

- e2eテスト: `discriminator-all-of.yaml` が失敗
- 使用例: 継承関係の表現、複数スキーマの結合

**実装時の考慮点**:

- プロパティのマージロジック
- required配列のマージ
- 循環参照の処理

---

## 3. 高: Reference parameter（components.parameters内の$ref）

**現状**: 警告を出してスキップ

```typescript
// parameters-visitor.ts
consola.warn(`Reference parameter not supported yet: ${param.$ref}`);
```

**影響範囲**:

- 共通パラメータの再利用ができない

**実装時の考慮点**:

- components.parametersの実装が前提
- $ref解決ロジックの追加

---

## 4. 高: readOnly

**現状**: 未実装

**影響範囲**:

- レスポンス専用プロパティ
- リクエストには含めない

**実装時の考慮点**:

- IRPropertyに`readOnly`フィールド追加
- コード生成時の除外ロジック

---

## 5. 高: writeOnly

**現状**: 未実装

**影響範囲**:

- リクエスト専用プロパティ
- レスポンスには含めない（パスワードなど）

**実装時の考慮点**:

- IRPropertyに`writeOnly`フィールド追加
- セキュリティ観点で重要

---

## 6. 中: oneOf（排他的Union）

**現状**: 警告を出してスキップ

```typescript
// schema-visitor.ts:96-100
if ("oneOf" in schema && schema.oneOf) {
  consola.warn(
    `oneOf is not supported yet: ${buildReferencePath(context.documentPath)}`,
  );
  return result;
}
```

**影響範囲**:

- e2eテスト: `discriminator-one-of.yaml` が失敗
- 使用例: レスポンスが成功/エラーの複数パターンを持つ場合

**実装時の考慮点**:

- 型システムでの表現（TypeScript: Union型、Dart: Sealed class）
- discriminatorとの連携
- 生成コードの複雑性

---

## 7. 中: anyOf（包含的Union）

**現状**: 警告を出してスキップ

```typescript
// schema-visitor.ts:102-106
if ("anyOf" in schema && schema.anyOf) {
  consola.warn(
    `anyOf is not supported yet: ${buildReferencePath(context.documentPath)}`,
  );
  return result;
}
```

**影響範囲**:

- e2eテスト: `discriminator-any-of.yaml` が失敗
- 使用例: nullable型の表現（OpenAPI 3.1スタイル）

**実装時の考慮点**:

- oneOfよりも複雑な型関係
- OpenAPI 3.1でのnullable表現として重要

---

## 8. 中: Reference schema（header/parameter内の$ref）

**現状**: 警告を出してスキップ

```typescript
// header-visitor.ts
consola.warn(`Reference schema not supported yet in header: ${context.headerName}`);

// parameter-visitor.ts
consola.warn(`Reference schema not supported yet in parameter: ${parameter.name}`);
```

**影響範囲**:

- ヘッダー・パラメータで$refスキーマが使えない

**実装時の考慮点**:

- visitTypeで$ref処理を統一

---

## 9. 中: components.parameters

**現状**: 警告を出してスキップ

```typescript
// transformer.ts:64-67
if (document.components?.parameters) {
  consola.warn(
    `components.parameters is not supported yet and will be skipped`,
  );
}
```

**影響範囲**:

- 共通パラメータの再利用ができない
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- IR型定義に`commonParameters`フィールド追加
- `parameters-components-visitor.ts`の実装
- $ref参照の解決

---

## 10. 中: webhooks（OpenAPI 3.1）

**現状**: 未処理

**影響範囲**:

- Webhook API定義
- イベント駆動アーキテクチャ

**実装時の考慮点**:

- OpenAPI 3.1専用機能
- pathsと同様の構造
- IR型定義に`webhooks`フィールド追加

---

## 11. 中: externalDocs（ルートレベル）

**現状**: tagsには実装済み、ルートレベルは未処理

**影響範囲**:

- API全体の外部ドキュメントリンク

**実装時の考慮点**:

- IRMetadataに`externalDocs`フィールド追加
- 既存のIRTagExternalDocsを再利用

---

## 12. 低: discriminator

**現状**: 警告を出してスキップ

```typescript
// schema-visitor.ts:108-112
if ("discriminator" in schema && schema.discriminator) {
  consola.warn(
    `discriminator is not supported yet: ${buildReferencePath(context.documentPath)}`,
  );
  return result;
}
```

**影響範囲**:

- oneOf/anyOfと組み合わせて使用
- ポリモーフィズムの表現

**実装時の考慮点**:

- oneOf/anyOfの実装が前提
- propertyNameとmappingの処理

---

## 13. 低: Reference security scheme

**現状**: 警告を出してスキップ

```typescript
// security-schemes-visitor.ts
consola.warn(`Reference security scheme not supported yet: ${securityScheme.$ref}`);
```

**影響範囲**:

- セキュリティスキームの$ref参照ができない

**実装時の考慮点**:

- 外部ファイル参照の必要性は低い

---

## 14. 低: Nested $ref（components.responses/requestBodies内）

**現状**: 警告を出してスキップ

```typescript
// responses-components-visitor.ts
consola.warn(
  `Nested $ref in components.responses["${name}"] is not supported: ${response.$ref}`,
);

// requestBodies-components-visitor.ts
consola.warn(
  `Nested $ref in components.requestBodies["${name}"] is not supported: ${requestBody.$ref}`,
);
```

**影響範囲**:

- components内で別のcomponentsを参照できない

---

## 15. 低: components.examples

**現状**: 未処理（警告なし）

**影響範囲**:

- サンプル値の管理
- APIドキュメント生成時に有用

**実装時の考慮点**:

- コード生成には直接影響しない
- ドキュメント生成機能と合わせて実装

---

## 16. 低: components.headers

**現状**: 未処理（警告なし）

**影響範囲**:

- 共通ヘッダー定義の再利用

**実装時の考慮点**:

- レスポンスヘッダーは既に実装済み
- 共通定義の再利用部分のみ

---

## 17. 低: multipleOf

**現状**: 未処理

**影響範囲**:

- 数値の倍数制約
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- IRValidationに`multipleOf`フィールド追加
- extract-validation.tsでの処理追加

---

## 18. 低: contentMediaType/contentEncoding

**現状**: 未処理

**影響範囲**:

- コンテンツエンコーディング情報
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- ファイルアップロード関連
- Base64エンコーディングなど

---

## 19. 低: additionalProperties: true

**現状**: 警告を出してスキップ

```typescript
// additional-properties-visitor.ts:48-51
if (additionalProperties === true) {
  consola.warn(
    "additionalProperties: true (any type) is not supported; specify a schema for map values",
  );
}
```

**影響範囲**:

- 任意のキーを持つMap型

**実装時の考慮点**:

- `Map<string, any>` として扱う
- 型安全性の低下

---

## 20. 低: OAuth2 flows検証の強化

**現状**: 基本的な警告のみ

```typescript
// security-schemes-visitor.ts
consola.warn("OAuth2 security scheme without flows");
consola.warn("OAuth2 security scheme without valid flows");
```

**影響範囲**:

- OAuth2スキームの厳密性

**実装時の考慮点**:

- より詳細なバリデーション
- エラーメッセージの改善

---

## 21. 最低: not（否定スキーマ）

**現状**: 警告を出してスキップ

```typescript
// schema-visitor.ts:114-118
if ("not" in schema && schema.not) {
  consola.warn(
    `not schema is not supported yet: ${buildReferencePath(context.documentPath)}`,
  );
  return result;
}
```

**影響範囲**:

- 使用例: 特定の型を除外する制約

**実装時の考慮点**:

- コード生成での表現が困難
- バリデーションライブラリ依存

---

## 22. 最低: components.links

**現状**: 未処理（警告なし）

**影響範囲**:

- HATEOAS対応
- リンク関係の定義

**実装時の考慮点**:

- REST成熟度レベル3の機能
- 使用例が極めて少ない

---

## 23. 最低: components.callbacks

**現状**: 未処理（警告なし）

**影響範囲**:

- Webhook定義の再利用

**実装時の考慮点**:

- webhooksの実装が前提

---

## 24. 最低: patternProperties

**現状**: 未処理

**影響範囲**:

- 動的なプロパティ名の制約
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- 型システムでの表現が困難
- Map型との関係

---

## 25. 最低: if/then/else

**現状**: 未処理

**影響範囲**:

- 条件付きスキーマ
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- JSON Schema Draft 7の機能
- コード生成での表現が極めて困難

---

## 26. 最低: $id/$anchor

**現状**: 未処理

**影響範囲**:

- スキーマ識別子
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- JSON Schema Draft 2019-09の機能
- OpenAPIでの使用例が極めて少ない

---

## 27. 最低: 空のスキーマ `{}`

**現状**: 未処理

**影響範囲**:

- any型相当（すべての型を許可）
- CLAUDE.mdの制限事項に記載（意図的に除外）

**実装時の考慮点**:

- 型安全性の観点から推奨しない
- 必要に応じて明示的なany型サポート

---

## 28. 最低: xml

**現状**: 未実装（ドキュメントコメントにのみ存在）

**影響範囲**:

- XML表現のカスタマイズ

**実装時の考慮点**:

- JSON APIが主流
- XML対応はニッチな要件

---

## 制限事項として維持するもの

以下の機能は実装せず、制限事項として継続：

- **not** - 使用頻度極めて低く、実装困難
- **if/then/else** - 使用例がほぼなく、コード生成で表現不可
- **$id/$anchor** - OpenAPI文脈での使用例がほぼない
- **patternProperties** - 型システムでの表現が困難
- **components.links** - HATEOAS対応、使用例極めて少ない
- **components.callbacks** - webhooksで代替可能

---

## 参考資料

- [OpenAPI Specification 3.0.3](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Specification 3.1.0](https://spec.openapis.org/oas/v3.1.0)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- CLAUDE.md - プロジェクト開発ガイドライン
