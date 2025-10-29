# Task 023: Visitor Architecture Refactoring

**Status**: ✅ v2移行完了、残存課題あり
**Priority**: Medium（残タスク）
**Last Updated**: 2025-10-29

## タスク概要

従来の`visitors/`実装は、トラバーサル（子要素訪問）と変換処理が混在し、単一責任原則に違反していました。このタスクでは、**3層アーキテクチャ（Dispatcher/Traverser/Transformer）**を導入し、責務を明確に分離しました。

**✅ v2移行完了**: Schema系とOperation系のv2移行が完了し、694件のテストが全て成功しています。

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
- YAGNI原則: 実行されないエラーハンドリングは実装しない
- Trust the types: 型が正しいと言えば正しい

**責務分離**:

- Dispatcher: 型判定のみ
- Traverser: 子要素訪問のみ
- Transformer: 変換処理のみ

---

## 残存課題

### 🟡 優先度: 中

#### 1. グレーゾーンの判断（15箇所）← **保持決定**

**判断**: 以下のチェックは**削除せず保持**

**理由**:

- これらは「事前の型チェック」ではなく「実際の変換失敗のエラーハンドリング」
- swagger-parserは**入力**を保証するが、**変換ロジックのバグ**は保証しない
- 実行時エラーを防ぐための防御的プログラミングとして適切

**保持箇所**:

1. `array-traverser.ts` - itemsフィールドの存在チェック
2. `composition-traverser.ts` - allOf/oneOf/anyOfの空配列チェック
3. traverser系のnullチェック（子要素の変換失敗ハンドリング）

**例**:

```typescript
// 変換失敗のエラーハンドリング（保持）
if (!itemResult.type) {
  consola.warn(`Failed to resolve array item type: ...`);
  return { itemType: null, models: [] };
}
```

#### 2. 古いvisitors/ディレクトリの削除

**現状**:

- 32ファイルが残存
- v2への移行は完了済み

**作業内容**:

1. `transformer.ts` と `index.ts` の依存関係を確認
2. 古いvisitors/を削除
3. インポートパスを全てv2に更新

**推定時間**: 1-2時間

#### 3. ドキュメント更新

**対象**:

- `CLAUDE.md`: v2アーキテクチャの反映
- アーキテクチャ図の追加

**推定時間**: 1-2時間

### ⚪ 優先度: 低

#### 4. エラーハンドリングの統一（任意）

traverser系の `consola.warn` を `createErrorResult` に統一し、エラー情報を構造化。

#### 5. v2/ → transformers/ リネーム

**タイミング**: v2が正式版になった時点で実施

**作業内容**:

- `v2/` ディレクトリを `transformers/` にリネーム
- 全インポートパスの更新

**推定時間**: 30分-1時間

---

**Created**: 2025-10-27
**Author**: AI Analysis
**v2 Migration Completed**: 2025-10-29
