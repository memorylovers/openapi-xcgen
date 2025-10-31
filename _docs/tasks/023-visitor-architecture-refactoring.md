# Task 023: Visitor Architecture Refactoring

**Status**: ✅ 完了（残存課題あり）
**Priority**: Low（残タスク）
**Last Updated**: 2025-10-30

## タスク概要

従来の`visitors/`実装は、トラバーサル（子要素訪問）と変換処理が混在し、単一責任原則に違反していました。このタスクでは、**3層アーキテクチャ（Dispatcher/Traverser/Transformer）**を導入し、責務を明確に分離しました。

**✅ v2移行完了**: Schema系とOperation系のv2移行が完了し、427件のテストが全て成功しています。

**最近の修正** (2025-10-30):

- 配列レスポンス型名生成バグ修正（`resolveModelName()` ヘルパー導入）
- IRModelリストからreferencePathで型名を逆引きする仕組みを実装
- services生成器全体にmodelsパラメータを追加し型名解決を統一

---

## v2アーキテクチャ設計

### 設計方針: 3層アーキテクチャの導入

```
┌─────────────────────────────────────────┐
│  Dispatcher Layer (型判定とルーティング)  │
│  - dispatchSchema()                     │
│  - dispatchOperation()                  │
└─────────────────┬───────────────────────┘
                  │ 委譲
┌─────────────────▼───────────────────────┐
│  Traverser Layer (子要素の訪問)          │
│  - traverseObject()                     │
│  - traverseArray()                      │
│  - traverseOperation()                  │
└─────────────────┬───────────────────────┘
                  │ 再帰呼び出し
┌─────────────────▼───────────────────────┐
│  Transformer Layer (変換処理)            │
│  - transformObject()                    │
│  - transformEnum()                      │
│  - transformOperation()                 │
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
  context: VisitorContext,
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
  context: VisitorContext,
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
  context: VisitorContext,
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
  context: VisitorContext,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // 子要素の訪問はtraverserに委譲
  const propertiesResult = traverseObjectProperties(schema, context);
  const additionalResult = traverseAdditionalProperties(schema, context);

  // 自身の変換のみを行う
  const model: IRObjectModel = {
    kind: "object",
    name,
    referencePath,
    properties: propertiesResult.properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalResult.type && { additionalProperties: additionalResult.type }),
  };

  // 結果を返す（メインモデル + 子モデル）
  return {
    type: { kind: "ref", name: referencePath },
    models: [model, ...propertiesResult.childModels, ...additionalResult.models],
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
```

### 5. 命名規約

| 層 | プレフィックス | 例 | 責務 |
|----|--------------|-----|------|
| Dispatcher | `dispatch*` | `dispatchSchema` | 型判定とルーティング |
| Traverser | `traverse*` | `traverseObjectProperties` | 子要素の訪問 |
| Transformer | `transform*` | `transformObject` | 変換処理 |
| Helper | なし | `buildPropertyContext` | ユーティリティ |

### 6. 設計原則

**型安全性とパーサー保証**:

- swagger-parserが入力データを検証・保証
- TypeScriptの型システムで不正な値を排除
- **Trust the types**: 型が安全を保証している場合は追加チェック不要
- **型が `undefined` の可能性を示す場合はチェックが必要** - TypeScriptの型システムを無視しない
- YAGNI原則: 型システムが保証する範囲では追加チェック不要（型システムが保証しない範囲は必要）
- **非null assertion (`!`) の禁止**: 型システムを無視する危険な回避策

**責務分離**:

- Dispatcher: 型判定のみ
- Traverser: 子要素訪問のみ
- Transformer: 変換処理のみ

---

## 残存課題

### 🟡 優先度: 中

- 1. ドキュメント更新
