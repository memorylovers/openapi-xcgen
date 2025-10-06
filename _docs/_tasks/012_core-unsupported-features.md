# タスク012: Coreパッケージ未対応機能一覧

## 概要

本ドキュメントは、`@openapi-xcgen/core`パッケージにおける未対応のOpenAPI機能を網羅的にリストアップしたものです。各機能について実装推奨度を評価し、今後の開発計画の参考とします。

## 実装状況サマリー

### ✅ Phase 1完了: 基盤機能（必須対応）

1. ✅ **servers** - APIベースURL設定
2. ✅ **readOnly** - レスポンス専用プロパティ
3. ✅ **writeOnly** - リクエスト専用プロパティ（セキュリティ）

### ✅ Phase 2完了: 型システム基礎

4. ✅ **allOf** - 継承・スキーママージ（TypeSpec `model extends`）

### ✅ Phase 3完了: Union型サポート（anyOf）

5. ✅ **anyOf** - 包含的Union（TypeSpec 1.0で高頻度 ⭐⭐⭐⭐）

### ✅ Phase 4完了: Union型サポート（oneOf + discriminator）

6. ✅ **oneOf** - 排他的Union（TypeSpec 1.0で中頻度 ⭐⭐⭐）
7. ✅ **discriminator** - ポリモーフィズム（oneOf/anyOfと連携）

### Phase 4以降: 拡張機能

- Reference parameter, components.parameters
- webhooks, externalDocs
- その他のバリデーション・メタデータ

---

## 完了済み機能詳細

### ✅ servers（最高優先度）

**実装状況**: 完了

**実装内容**:

- IR型定義に`IRServer`と`IRServerVariable`を追加
- `servers-visitor.ts`で処理
- 環境別エンドポイント、テンプレート変数に対応

**影響範囲**:

- APIベースURL情報の管理
- 環境別エンドポイント（dev/stg/prod）
- URLテンプレート変数の処理

---

### ✅ readOnly（高優先度）

**実装状況**: 完了

**実装内容**:

- `IRProperty`に`readOnly: boolean`フィールド追加
- `object-visitor.ts`で処理

**影響範囲**:

- レスポンス専用プロパティの表現
- リクエストボディから除外される

**使用例**:

```yaml
properties:
  id:
    type: string
    readOnly: true  # レスポンスのみ
```

---

### ✅ writeOnly（高優先度）

**実装状況**: 完了

**実装内容**:

- `IRProperty`に`writeOnly: boolean`フィールド追加
- `object-visitor.ts`で処理

**影響範囲**:

- リクエスト専用プロパティの表現
- レスポンスから除外される（パスワードなど）

**使用例**:

```yaml
properties:
  password:
    type: string
    writeOnly: true  # リクエストのみ
```

---

### ✅ allOf（高優先度）

**実装状況**: 完了（[タスク013参照](./013_allof-implementation-plan.md)）

**実装内容**:

- IR型定義に`IRAllOfModel`を追加
- `allof-visitor.ts`で処理
- インラインスキーマの自動モデル化（`{親名}AllOf{インデックス}`形式）
- E2Eテスト: `allof.yaml`で検証

**TypeSpecでの重要性**: ⭐⭐⭐⭐⭐（最高頻度）

- `model extends`で必ず生成される

**影響範囲**:

- 継承関係の表現
- 複数スキーマの結合
- Generator側で継承または交差型として実装可能

**使用例**:

```yaml
# TypeSpec: model Dog extends Animal { }
Dog:
  allOf:
    - $ref: '#/components/schemas/Animal'
    - type: object
      properties:
        breed: { type: string }
```

---

## 未対応機能（優先度順）

### 1. ✅ anyOf（包含的Union）

**実装状況**: 完了（[タスク014参照](./014_anyof-implementation-plan.md)）

**実装内容**:

- IR型定義に`IRAnyOfModel`を追加
- `anyof-visitor.ts`で処理
- インラインスキーマの自動モデル化（`{親名}AnyOf{インデックス}`形式）
- **nullable型パターン検出**: `anyOf: [{type: X}, {type: 'null'}]` → `nullable: true`
- E2Eテスト: `anyof.yaml`、`anyof-discriminator.yaml`で検証

**TypeSpecでの重要性**: ⭐⭐⭐⭐（高頻度）

- TypeSpec 1.0では`union`のデフォルト出力がanyOf

**影響範囲**:

- Union型の表現
- 型システムでの複数型の選択
- **OpenAPI 3.1のnullable型パターン対応**
- Generator側でUnion型として実装可能

**使用例**:

```yaml
# 通常のUnion: TypeSpec union Fruit { apple: Apple, banana: Banana }
Fruit:
  anyOf:
    - $ref: '#/components/schemas/Apple'
    - $ref: '#/components/schemas/Banana'

# Nullable型パターン（OpenAPI 3.1）
NullableString:
  anyOf:
    - type: string
    - type: 'null'
# → IR: { kind: "anyOf", nullable: true, schemas: ["string"] }
```

---

### 2. ✅ oneOf（排他的Union）

**実装状況**: 完了（[タスク015参照](./015_oneof-implementation-plan.md)）

**実装内容**:

- IR型定義に`IRUnionModel`と`IRDiscriminator`を追加
- `oneof-visitor.ts`で処理
- discriminatorサポート（propertyName + optional mapping）
- インラインスキーマの自動モデル化（`{親名}OneOf{インデックス}`形式）
- nullable型パターン検出: `oneOf: [{$ref: X}, {type: 'null'}]` → `nullable: true`
- E2Eテスト: `oneof.yaml`、`discriminator-one-of.yaml`で検証

**TypeSpecでの重要性**: ⭐⭐⭐（中頻度）

- `@oneOf`デコレータで明示的に指定
- discriminated unionで使用

**影響範囲**:

- 排他的Union型（exactly one）の表現
- レスポンスが成功/エラーの複数パターン
- Generator側でUnion型またはSealed classとして実装可能

**使用例**:

```yaml
# TypeSpec: @oneOf union Pet { cat: Cat, dog: Dog }
Pet:
  oneOf:
    - $ref: '#/components/schemas/Cat'
    - $ref: '#/components/schemas/Dog'
  discriminator:
    propertyName: petType
# → IR: { kind: "union", discriminator: { propertyName: "petType" }, types: [...] }
```

---

#### 3. ✅ discriminator

**実装状況**: 完了（oneOfと同時実装）

**実装内容**:

- `IRDiscriminator` interfaceを追加
- `IRUnionModel`と`IRAnyOfModel`でサポート
- propertyNameとmappingの処理
- Generator側でタグ付きUnion生成に活用

**影響範囲**:

- oneOf/anyOfと組み合わせて使用
- ポリモーフィズムの表現
- 型安全なUnion型の実現

**使用例**:

```yaml
Pet:
  oneOf:
    - $ref: '#/components/schemas/Cat'
    - $ref: '#/components/schemas/Dog'
  discriminator:
    propertyName: petType
    mapping:
      cat: '#/components/schemas/Cat'
      dog: '#/components/schemas/Dog'
```

---

### 🟡 中優先度: 参照と再利用

#### 4. Reference parameter（components.parameters内の$ref）

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

#### 5. components.parameters

**現状**: 警告を出してスキップ

```typescript
// transformer.ts
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

#### 6. Reference schema（header/parameter内の$ref）

**現状**: 警告を出してスキップ

```typescript
// header-visitor.ts
consola.warn(`Reference schema not supported yet in header`);

// parameter-visitor.ts
consola.warn(`Reference schema not supported yet in parameter`);
```

**影響範囲**:

- ヘッダー・パラメータで$refスキーマが使えない

**実装時の考慮点**:

- visitTypeで$ref処理を統一

---

#### 7. Nested $ref（components.responses/requestBodies内）

**現状**: 警告を出してスキップ

**影響範囲**:

- components内で別のcomponentsを参照できない

**実装時の考慮点**:

- $ref解決の再帰処理

---

### 🟡 中優先度: 拡張機能

#### 8. webhooks（OpenAPI 3.1）

**現状**: 未処理

**影響範囲**:

- Webhook API定義
- イベント駆動アーキテクチャ

**実装時の考慮点**:

- OpenAPI 3.1専用機能
- pathsと同様の構造
- IR型定義に`webhooks`フィールド追加

---

#### 9. externalDocs（ルートレベル）

**現状**: tagsには実装済み、ルートレベルは未処理

**影響範囲**:

- API全体の外部ドキュメントリンク

**実装時の考慮点**:

- IRMetadataに`externalDocs`フィールド追加
- 既存の`IRTagExternalDocs`を再利用

---

#### 10. multipleOf

**現状**: 未処理

**影響範囲**:

- 数値の倍数制約
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- IRValidationに`multipleOf`フィールド追加
- extract-validation.tsでの処理追加

---

#### 11. contentMediaType/contentEncoding

**現状**: 未処理

**影響範囲**:

- コンテンツエンコーディング情報
- CLAUDE.mdの制限事項に記載

**実装時の考慮点**:

- ファイルアップロード関連
- Base64エンコーディングなど

---

### 🔵 低優先度

#### 12. Reference security scheme

**現状**: 警告を出してスキップ

**影響範囲**:

- セキュリティスキームの$ref参照ができない

**実装時の考慮点**:

- 外部ファイル参照の必要性は低い

---

#### 13. components.examples

**現状**: 未処理（警告なし）

**影響範囲**:

- サンプル値の管理
- APIドキュメント生成時に有用

**実装時の考慮点**:

- コード生成には直接影響しない
- ドキュメント生成機能と合わせて実装

---

#### 14. components.headers

**現状**: 未処理（警告なし）

**影響範囲**:

- 共通ヘッダー定義の再利用

**実装時の考慮点**:

- レスポンスヘッダーは既に実装済み
- 共通定義の再利用部分のみ

---

#### 15. additionalProperties: true

**現状**: 警告を出してスキップ

```typescript
// additional-properties-visitor.ts
if (additionalProperties === true) {
  consola.warn(
    "additionalProperties: true (any type) is not supported",
  );
}
```

**影響範囲**:

- 任意のキーを持つMap型

**実装時の考慮点**:

- `Map<string, any>`として扱う
- 型安全性の低下

---

#### 16. OAuth2 flows検証の強化

**現状**: 基本的な警告のみ

**影響範囲**:

- OAuth2スキームの厳密性

**実装時の考慮点**:

- より詳細なバリデーション
- エラーメッセージの改善

---

### ⚫ 最低優先度（実装予定なし）

以下の機能は実装せず、制限事項として継続：

#### 17. not（否定スキーマ）

**理由**: 使用頻度極めて低く、コード生成での表現が困難

---

#### 18. components.links

**理由**: HATEOAS対応、使用例極めて少ない

---

#### 19. components.callbacks

**理由**: webhooksで代替可能

---

#### 20. patternProperties

**理由**: 型システムでの表現が困難、CLAUDE.mdの制限事項に記載

---

#### 21. if/then/else

**理由**: JSON Schema Draft 7の機能、コード生成での表現が極めて困難

---

#### 22. $id/$anchor

**理由**: OpenAPIでの使用例が極めて少ない、CLAUDE.mdの制限事項に記載

---

#### 23. 空のスキーマ `{}`

**理由**: 型安全性の観点から意図的に除外、CLAUDE.mdの制限事項に記載

---

#### 24. xml

**理由**: JSON APIが主流、XML対応はニッチな要件

---

## 次のアクションプラン

### ✅ Phase 4完了: oneOf/discriminatorサポート

1. ✅ **oneOf実装**
   - IR型定義: `IRUnionModel`追加
   - Visitor実装: `oneof-visitor.ts`
   - discriminatorとの連携設計

2. ✅ **discriminator実装**
   - oneOf/anyOfへの統合
   - propertyName/mappingの処理

### Phase 5: 参照機能の拡充（優先度: 中）

- components.parameters実装
- Reference parameter対応
- Reference schema対応
- Nested $ref対応

### Phase 6以降: その他の拡張機能

- webhooks (OpenAPI 3.1)
- externalDocs (ルートレベル)
- その他のバリデーション強化

---

## TypeSpec 1.0との対応状況

| 機能 | TypeSpec使用頻度 | 実装状況 |
|------|-----------------|---------|
| allOf | ⭐⭐⭐⭐⭐ (最高) | ✅ 完了 |
| anyOf | ⭐⭐⭐⭐ (高) | ✅ 完了 |
| oneOf | ⭐⭐⭐ (中) | ✅ 完了 |
| discriminator | ⭐⭐ (低) | ✅ 完了 |

**進捗**: Phase 4完了により、TypeSpec 1.0のすべての主要なunion型・合成型に対応完了

---

## 参考資料

- [OpenAPI Specification 3.0.3](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Specification 3.1.0](https://spec.openapis.org/oas/v3.1.0)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [TypeSpec Documentation](https://typespec.io/docs/)
- CLAUDE.md - プロジェクト開発ガイドライン
- [タスク013: allOf実装計画](./013_allof-implementation-plan.md)
- [タスク014: anyOf実装計画](./014_anyof-implementation-plan.md)
- [タスク015: oneOf実装計画](./015_oneof-implementation-plan.md)
