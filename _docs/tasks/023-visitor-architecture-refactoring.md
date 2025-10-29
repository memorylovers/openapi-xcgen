# Task 023: Visitor Architecture Refactoring

**Status**: ✅ Completed (Phase 1-9 完了、残存課題あり)
**Priority**: High
**Complexity**: High
**Estimated Effort**: 3-5 days

## タスク概要

従来の`visitors/`実装は、トラバーサル（子要素訪問）と変換処理が混在し、単一責任原則に違反していました。このタスクでは、**3層アーキテクチャ（Dispatcher/Traverser/Transformer）**を導入し、責務を明確に分離することで、コード品質・テスタビリティ・保守性を向上させました。

**Phase 1-9 完了**: Schema系とOperation系のv2移行が完了し、710件のテストが全て成功しています。

## v2アーキテクチャ設計

### 設計方針: 3層アーキテクチャの導入

```
┌─────────────────────────────────────────┐
│  Dispatcher Layer (型判定とルーティング)  │
│  - dispatchSchema()                     │
│  - dispatchType()                       │
└─────────────────┬───────────────────────┘
                  │ 委譲
┌─────────────────▼───────────────────────┐
│  Traverser Layer (子要素の訪問)          │
│  - traverseObject()                     │
│  - traverseArray()                      │
│  - traverseAllOf()                      │
└─────────────────┬───────────────────────┘
                  │ 再帰呼び出し
┌─────────────────▼───────────────────────┐
│  Transformer Layer (変換処理)            │
│  - transformObject()                    │
│  - transformEnum()                      │
│  - transformArray()                     │
└─────────────────────────────────────────┘
```

### 1. Dispatcher Layer（型判定とルーティング）

**責務**: SchemaObjectの型を判定し、適切なtransformerを選択

```typescript
/**
 * Schema型を判定し、適切な処理に委譲
 */
export function dispatchSchema(
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: TransformContext,
): TransformResult {
  // $ref参照
  if (isReferenceObject(schema)) {
    return transformReference(schema, context);
  }

  // composition schemas
  if ("allOf" in schema && schema.allOf) {
    return transformAllOf(schema, context);
  }
  if ("oneOf" in schema && schema.oneOf) {
    return transformOneOf(schema, context);
  }
  if ("anyOf" in schema && schema.anyOf) {
    return transformAnyOf(schema, context);
  }

  // enum
  if (schema.enum !== undefined) {
    return transformEnum(schema, context);
  }

  // object (明示的または暗黙的)
  if (schema.type === "object" || (!schema.type && schema.properties)) {
    return transformObject(schema, context);
  }

  // array
  if (schema.type === "array") {
    return transformArray(schema, context);
  }

  // map (additionalPropertiesのみ)
  if (
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    (!schema.properties || Object.keys(schema.properties).length === 0)
  ) {
    return transformMap(schema, context);
  }

  // primitive
  return transformPrimitive(schema, context);
}
```

### 2. Traverser Layer（子要素の訪問）

**責務**: 子要素をイテレートし、再帰的にdispatcherを呼び出す

```typescript
/**
 * Objectのプロパティを訪問
 */
function traverseObjectProperties(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): PropertyTraversalResult {
  const properties: IRProperty[] = [];
  const childModels: IRModel[] = [];

  if (!schema.properties) {
    return { properties, childModels };
  }

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const propContext = buildPropertyContext(context, propName);

    // 再帰的にdispatcherを呼び出し
    const propResult = dispatchSchema(
      propSchema as SchemaObjectWithNullable,
      propContext,
    );

    // 子モデルを収集
    childModels.push(...propResult.models);

    // プロパティを構築
    if (propResult.type) {
      properties.push(buildProperty(propName, propSchema, propResult.type));
    }
  }

  return { properties, childModels };
}

/**
 * additionalPropertiesを訪問
 */
function traverseAdditionalProperties(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): AdditionalPropertiesTraversalResult {
  if (!("additionalProperties" in schema) || !schema.additionalProperties) {
    return { type: undefined, models: [] };
  }

  const additionalContext = buildAdditionalPropertiesContext(context);
  const result = dispatchSchema(
    schema.additionalProperties,
    additionalContext,
  );

  return { type: result.type, models: result.models };
}
```

### 3. Transformer Layer（変換処理）

**責務**: OpenAPIスキーマをIR型に変換（子要素訪問はTraverserに委譲）

```typescript
/**
 * Object型スキーマをIRModelに変換
 */
export function transformObject(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const name = extractModelName(context);

  // Validation
  if (!name.trim()) {
    return createErrorResult("Invalid model name: empty or whitespace only");
  }

  // 子要素の訪問はtraverserに委譲
  const propertiesResult = traverseObjectProperties(schema, context);
  const additionalResult = traverseAdditionalProperties(schema, context);

  // 自身の変換のみを行う
  const model: IRModel = {
    kind: "object",
    name,
    referencePath: buildReferencePath(context.documentPath),
    properties: propertiesResult.properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalResult.type && { additionalProperties: additionalResult.type }),
  };

  // 結果を返す（メインモデル + 子モデル）
  return {
    type: { kind: "ref", name: buildReferencePath(context.documentPath) },
    models: [model, ...propertiesResult.childModels, ...additionalResult.models],
  };
}

/**
 * Enum型スキーマをIRModelに変換
 */
export function transformEnum(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const name = extractModelName(context);

  if (!schema.enum || schema.enum.length === 0) {
    return createErrorResult("Invalid enum: empty values");
  }

  const model: IRModel = {
    kind: "enum",
    name,
    referencePath: buildReferencePath(context.documentPath),
    type: mapEnumType(schema.type),
    values: schema.enum.map(value => ({
      value,
      name: generateEnumMemberName(value, schema.type),
    })),
    ...(schema.description && { description: schema.description }),
  };

  return {
    type: { kind: "ref", name: buildReferencePath(context.documentPath) },
    models: [model],
  };
}

/**
 * Primitive型スキーマをIRScalarTypeに変換
 */
export function transformPrimitive(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const type = resolvePrimitiveType(schema);

  if (!type) {
    return createErrorResult(`Invalid primitive type: ${schema.type}`);
  }

  return {
    type,
    models: [],
  };
}
```

### 4. 統一されたインターフェース

```typescript
/**
 * 全transformer/traverser/dispatcherの統一戻り値型
 */
export interface TransformResult {
  /** 変換後の型（nullの場合はエラー） */
  type: IRType | null;
  /** 抽出されたモデル */
  models: IRModel[];
  /** エラー情報（オプション） */
  error?: {
    code: string;
    message: string;
    context: unknown;
  };
}

/**
 * プロパティトラバーサルの結果
 */
export interface PropertyTraversalResult {
  properties: IRProperty[];
  childModels: IRModel[];
}

/**
 * additionalPropertiesトラバーサルの結果
 */
export interface AdditionalPropertiesTraversalResult {
  type: IRType | undefined;
  models: IRModel[];
}
```

### 5. コンテキストの簡素化

```typescript
/**
 * 変換コンテキスト（簡素化版）
 */
export interface TransformContext {
  /** ドキュメントパス */
  documentPath: string[];
  /** ルートセグメント */
  rootSegment: "paths" | "components";
  /** 追加メタデータ（必要に応じて） */
  metadata?: Record<string, unknown>;
}

/**
 * コンテキストビルダー関数
 */
export function buildPropertyContext(
  parent: TransformContext,
  propName: string,
): TransformContext {
  return {
    ...parent,
    documentPath: [...parent.documentPath, propName],
  };
}
```

### 6. エラーハンドリングの標準化

```typescript
/**
 * エラー結果を作成
 */
export function createErrorResult(
  message: string,
  code: string = "TRANSFORM_ERROR",
): TransformResult {
  consola.warn(message);
  return {
    type: null,
    models: [],
    error: {
      code,
      message,
      context: {},
    },
  };
}

/**
 * エラーチェック
 */
export function isErrorResult(result: TransformResult): boolean {
  return result.type === null || result.error !== undefined;
}
```

### 7. 命名規約

| 層 | プレフィックス | 例 | 責務 |
|----|--------------|-----|------|
| Dispatcher | `dispatch*` | `dispatchSchema` | 型判定とルーティング |
| Traverser | `traverse*` | `traverseObjectProperties` | 子要素の訪問 |
| Transformer | `transform*` | `transformObject` | 変換処理 |
| Helper | なし | `buildPropertyContext` | ユーティリティ |

## 期待される効果

### 1. コード品質の向上

- **単一責任原則の実現**: 各関数が1つの責務のみを持つ
- **可読性の向上**: 関数名から役割が明確
- **保守性の向上**: 影響範囲が明確

### 2. テスタビリティの向上

- **モックが容易**: Traverserをモック化してTransformerのテストが可能
- **独立したテスト**: 各層を独立してテスト可能
- **テスト速度の向上**: 必要な層のみをテスト

### 3. 拡張性の向上

- **新機能追加が容易**: 新しいTransformerを追加するだけ
- **再利用性の向上**: Traverserを異なる用途で再利用可能
- **カスタマイズ性**: Dispatcherのロジックを変更可能

### 4. パフォーマンスの向上可能性

- **最適化のポイントが明確**: Traverserのキャッシュ化等
- **並列処理の導入余地**: 独立した変換処理を並列化

## 参考資料

- [Visitor Pattern - GoF Design Patterns](https://en.wikipedia.org/wiki/Visitor_pattern)
- [Strategy Pattern vs Visitor Pattern](https://refactoring.guru/design-patterns/visitor)
- [TypeScript AST Transformer](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#creating-and-printing-a-typescript-ast)

## 関連タスク

- Task 025: IRComponent Architecture Redesign（アーキテクチャ全体の見直し）
- Task 024: Barrel Files Reduction（エクスポート構造の整理）

---

## 実装ステータス

### Phase 1-4: Schema型のv2移行（完了 ✅）

**実装日**: 2025-10-27
**テスト**: 100件 全て成功

- schema-dispatcher.ts
- enum/primitive/array/map/object transformers
- composition (allOf/oneOf/anyOf) transformers
- array/map/object/composition traversers
- 統一されたTransformResult型
- エラーハンドリングの標準化

### Phase 5-9: Operation系のv2移行（完了 ✅）

**実装日**: 2025-10-28
**テスト**: 199件 全て成功 (Schema 100件 + Operation 99件)

#### Phase 5: 基盤整備 (11テスト)

**新設ファイル**:

- `v2/types.ts`: Operation系の型定義追加
  - ContentTraversalResult
  - HeadersTraversalResult
  - ParametersTraversalResult
  - ResponsesTraversalResult
  - OperationTraversalResult
  - ParameterAggregationResult
  - ParameterTransformResult

- `v2/aggregators/parameter-aggregator.ts` (11テスト)
  - パラメータ統合モデル生成（例: `GetUsersIdParams`）
  - `aggregateParameters()`, `generateParameterModelName()`, `convertToParameterProperty()`, `generateDescription()`

- `v2/errors.ts`: 拡張
  - `createParameterErrorResult()`

#### Phase 6: Transformer層 (35テスト)

**新設ファイル**:

- `v2/transformers/parameter-transformer.ts` (12テスト)
  - ParameterObjectをIRParameterに変換
  - ParameterTransformResult型を返す
  - バリデーション、拡張フィールド抽出

- `v2/transformers/request-body-transformer.ts` (6テスト)
  - RequestBodyObjectをIRRequestBodyに変換
  - `transformRequestBody()`, `transformRequestBodyObject()`
  - ContentTraversalResultを利用

- `v2/transformers/response-transformer.ts` (8テスト)
  - ResponseObjectをIRResponseに変換
  - `transformResponse()`, `transformResponseObject()`
  - ContentTraversalResultとHeadersTraversalResultを利用

- `v2/transformers/paths-transformer.ts` (5テスト)
  - PathsObjectを処理してエンドポイント抽出
  - operation-dispatcherとの統合

- `v2/transformers/operation-transformer.ts` (4テスト - skeleton)
  - OperationObjectをIREndpointに変換（基本情報のみ）
  - OperationTraversalResultとの完全統合は将来実装予定

#### Phase 7: Traverser層 (46テスト)

**新設ファイル**:

- `v2/traversers/content-traverser.ts` (9テスト)
  - RequestBodyとResponseで共有
  - MIMEタイプとスキーマのマッピング処理
  - インラインobjectスキーマの検出

- `v2/traversers/headers-traverser.ts` (10テスト)
  - Responseのheadersフィールドを処理
  - 各ヘッダーのスキーマ変換

- `v2/traversers/parameters-traverser.ts` (10テスト)
  - Operationのparametersフィールドを処理
  - parameter-transformerを利用

- `v2/traversers/responses-traverser.ts` (9テスト)
  - Operationのresponsesフィールドを処理
  - content-traverserとheaders-traverserを利用

- `v2/traversers/operation-traverser.ts` (8テスト)
  - OperationObject全体を処理
  - parameters, requestBody, responsesのtraverserを統合

#### Phase 8: Dispatcher層 (7テスト)

**新設ファイル**:

- `v2/dispatchers/operation-dispatcher.ts` (7テスト)
  - operation-traverserとoperation-transformerを統合
  - schema処理はschema-dispatcherに委譲
  - paths-transformerから呼ばれる

#### Phase 9: 統合とエクスポート

**変更ファイル**:

- `v2/index.ts`: 新しいモジュールのエクスポート追加
  - Operation系の型エクスポート
  - parameter-aggregator
  - Operation系のtransformers
  - Operation系のtraversers
  - operation-dispatcher

- `v2/transformers/paths-transformer.ts`: 統合完了
  - operation-dispatcherの呼び出し
  - エンドポイントとモデルの収集

#### アーキテクチャ

```
┌────────────────────────────────────────────────┐
│  paths-transformer                             │
│  ├─ dispatchOperation() ←─────────────┐       │
└──────────────────┬─────────────────────┘       │
                   │                              │
┌──────────────────▼─────────────────────┐       │
│  operation-dispatcher                  │       │
│  ├─ traverseOperation()                │       │
│  └─ transformOperation()               │       │
└──────────────────┬─────────────────────┘       │
                   │                              │
      ┌────────────┴────────────────┐            │
      │                              │            │
┌─────▼──────────┐        ┌──────────▼────────┐ │
│  operation-    │        │  operation-        │ │
│  traverser     │        │  transformer       │ │
│  ├─ parameters │        │  (skeleton)        │ │
│  ├─ requestBody│        │  基本情報のみ生成  │ │
│  └─ responses  │        └────────────────────┘ │
└────────┬───────┘                               │
         │                                        │
    ┌────┴────┐                                  │
    │         │                                   │
┌───▼───┐ ┌──▼───┐                               │
│content│ │headers│                               │
│       │ │       │                               │
└───┬───┘ └──┬───┘                               │
    │        │                                    │
    └────┬───┴─────────────┐                     │
         │                 │                      │
┌────────▼────────┐  ┌────▼─────────────┐        │
│ schema-dispatcher│  │parameter-        │        │
│                  │  │aggregator        │        │
└──────────────────┘  │統合モデル生成    │        │
                      └──────────────────┘        │
```

### Phase 5-9 完了報告（追加実装 - 2025-10-29）

**実装日**: 2025-10-29
**commit**: 6446569
**テスト**: 710件 全て成功 ✅

#### operation-transformerの完全実装

**operation-transformer.ts** (214行 → 608行):

1. **convertToIRParameter()** ヘルパー関数実装
   - ParametersTraversalResultからIRParameterへの型変換

2. **Parameters処理の実装**
   - parameter-aggregatorの統合
   - 統合パラメータモデル生成 (例: `GetUsersIdParams`)
   - IRRef参照または空配列を返す

3. **RequestBody処理の実装**
   - traversalResultからIRRequestBodyへの変換
   - required、description、contentの処理
   - 子モデルの収集

4. **Responses処理の実装**
   - traversalResultからIRResponse[]への変換
   - 参照レスポンスとコンテンツレスポンスの処理
   - headersの処理

5. **子モデル収集の実装**
   - traversalResult.childModelsの収集
   - parameters/requestBody/responsesからのモデル収集

6. **5つの新規テスト追加** (計9テスト)
   - パラメータモデル生成テスト
   - 空パラメータ処理テスト
   - RequestBody処理テスト
   - Responses処理テスト
   - 子モデル収集テスト

#### テスト更新

**operation-dispatcher.ts** (5テスト):

- スケルトン前提の期待値を実装後の正しい期待値に更新
- パラメータモデル、RequestBodyモデル、Responseモデルの収集を検証

**paths-transformer.ts** (2テスト):

- モデル収集の期待値を更新

#### コード品質改善

- **index.ts**: ParameterTransformResult重複エクスポートを修正
- **未使用インポート削除**: consola, buildInlineSchemaPath等
- **responses-traverser.ts**: ResponsesObject型エイリアスを定義

#### 成果

- ✅ **3層アーキテクチャの完全稼働**: Dispatcher/Traverser/Transformer
- ✅ **v2移行完了**: Schema系（Phase 1-4）+ Operation系（Phase 5-9）
- ✅ **全テスト合格**: 710/710 tests passed
- ✅ **operation-transformerの実装完成**: スケルトンから完全実装へ

---

## 残存課題（Phase 10以降）

### 🔴 優先度: 高

#### 1. TypeScript型エラーの修正（17件）

**本番コード** (5件):

- `paths-transformer.ts(102)`: pathItem.parameters の型不一致
  - 問題: `(ReferenceObject | ParameterObject)[]` → `ParameterObject[]`
  - 対策: ReferenceObjectのフィルタリングまたは解決処理を追加

- `operation-traverser.ts(81)`: 同様のParameterObject型エラー

- `operation-traverser.ts(103)`: VisitSchemaFn型不一致
  - 問題: `{ type: unknown }` → `{ type: IRType | null }`
  - 対策: schema-dispatcherの型定義を統一

- `responses-traverser.ts(96, 103)`: VisitSchemaFn型エラー (2件)

**テストコード** (12件):

- `content-traverser.ts` (5件): テストモックのschema定義で `type: "string"` が型エラー
- `headers-traverser.ts` (6件): 同様のschema型エラー
- `operation-traverser.ts(318)`: ResponseObjectに `description` プロパティが必須だが欠落

**推定作業時間**: 2-3時間

**影響**:

- 型安全性が担保されていない
- 将来的なバグの温床になる可能性
- 実行時エラーは発生しないが、TypeScriptの利点を活かせていない

### 🟡 優先度: 中

#### 2. ドキュメント更新

**対象**:

- `CLAUDE.md`: v2アーキテクチャの反映
- アーキテクチャ図の追加
  - 3層アーキテクチャの図解
  - Dispatcher/Traverser/Transformerの役割説明
- このタスクファイルの完了マーク更新

**推定作業時間**: 1-2時間

#### 3. 古いvisitors/ディレクトリの削除

**現状**:

- 32ファイルが残存
- v2への移行は完了しているため、古いコードは不要

**注意点**:

- `transformer.ts` や `index.ts` がまだ古いvisitorをインポート・使用している可能性
- 削除前に依存関係を確認

**推定作業時間**: 1-2時間

### ⚪ 優先度: 低

#### 4. v2/ → transformers/ リネーム

**タイミング**: v2が正式版になった時点で実施

**作業内容**:

- `v2/` ディレクトリを `transformers/` にリネーム
- 全インポートパスの更新
- テストの更新

**推定作業時間**: 30分-1時間

---

## 統計

- **TypeScript型エラー**: 17件 (テストコード: 12件、本番コード: 5件)
- **テスト成功率**: 100% (710/710) ✅
- **実装完了**: Phase 1-9 完了 ✅
- **古いvisitorsファイル**: 32ファイル（削除待ち）
- **未完了サブタスク**: 4件

---

## 次のアクション

1. **TypeScript型エラー修正** (最優先)
   - 本番コードの型エラー5件を修正
   - テストコードの型エラー12件を修正
   - 型安全性の担保

2. **ドキュメント更新**
   - CLAUDE.md更新
   - アーキテクチャ図追加

3. **クリーンアップ**
   - 古いvisitors/削除
   - v2/リネーム

---

**Created**: 2025-10-27
**Author**: AI Analysis
**Last Updated**: 2025-10-29
**Phase 1-4 Completed**: 2025-10-27
**Phase 5-9 Completed**: 2025-10-28
**operation-transformer Completed**: 2025-10-29
