# Task 019: Type-Safe Schema Definitions

**Status**: 📋 Planning
**Priority**: High
**Complexity**: Low
**Estimated Effort**: 0.5 day (45分程度)
**Prerequisite for**: Task 018 (Visitor Architecture Refactoring)

## 概要

現在、すべてのvisitor関数が`SchemaObjectWithNullable`という汎用的な型を受け取っているため、各transformerが実際に期待している型（array、object、enumなど）を型システムで表現できていない。

`openapi-types`ライブラリはすでに判別共用体(`ArraySchemaObject`, `NonArraySchemaObject`)を提供しているため、これを活用して厳密な型定義を導入する。

## 動機

### 現在の問題

```typescript
// すべて同じ型シグネチャ
function visitObject(schema: SchemaObjectWithNullable, ...): ObjectVisitorResult
function visitEnum(schema: SchemaObjectWithNullable, ...): EnumVisitorResult
function visitArray(schema: SchemaObjectWithNullable, ...): ArrayVisitorResult
```

**問題点**:

- 各関数が期待する型が不明確
- コンパイル時の型チェックが不十分
- IDEの補完が不正確
- 実行時エラーの可能性

### 期待される改善

```typescript
// 厳密な型定義
function transformObject(schema: ObjectSchemaObject, ...): TransformResult
function transformEnum(schema: EnumSchemaObject, ...): TransformResult
function transformArray(schema: ArraySchemaObject, ...): TransformResult
```

**改善点**:

- 各関数の期待する型が明確
- コンパイル時に型の誤りを検出
- IDEの補完が正確（`ArraySchemaObject`は必ず`items`を持つ）
- Type Guardによる型絞り込み

## 技術的背景

### openapi-typesの判別共用体

```typescript
// OpenAPIV3_1の定義
export type SchemaObject =
  | ArraySchemaObject      // type: "array"
  | NonArraySchemaObject   // type: "string" | "number" | "integer" | "boolean" | "object" | "null"
  | MixedSchemaObject;     // type?: ("array" | "string" | ...)[]

export interface ArraySchemaObject extends BaseSchemaObject {
  type: ArraySchemaObjectType;  // "array"
  items: ReferenceObject | SchemaObject;
}

export interface NonArraySchemaObject extends BaseSchemaObject {
  type?: NonArraySchemaObjectType;  // "string" | "number" | "integer" | "boolean" | "object" | "null"
}

interface MixedSchemaObject extends BaseSchemaObject {
  type?: (ArraySchemaObjectType | NonArraySchemaObjectType)[];
  items?: ReferenceObject | SchemaObject;
}
```

### OpenAPIV3とOpenAPIV3_1の統合

```typescript
// プロジェクトの型定義（両バージョンをサポート）
export type ArraySchemaObject =
  | OpenAPIV3.ArraySchemaObject
  | OpenAPIV3_1.ArraySchemaObject;
```

## ファイル構造の改善

Task 019の実装に先立ち、型定義ファイルの構造を改善します。
これは`ir/index.ts`と同じre-exportパターンを採用し、プロジェクト全体の一貫性を保つためです。

### 改善前の構造

```
packages/core/src/types/
├── guards.ts
├── index.ts          # OpenAPI型エイリアス + re-export（84行）
└── ir/
    └── index.ts      # IR型のre-export
```

### 改善後の構造

```
packages/core/src/types/
├── guards.ts         # Type Guard関数
├── openapi-types.ts  # OpenAPI型エイリアス（新規）
├── index.ts          # メインエントリポイント（re-exportのみ）
└── ir/
    └── index.ts      # IR型のre-export
```

### メリット

- **関心の分離**: OpenAPI型、Guard関数、IR型が明確に分離
- **保守性向上**: 各ファイルの責務が明確
- **一貫性**: `ir/index.ts`と同じパターン
- **拡張性**: 将来的な型追加が容易

## 実装内容

### 0. `packages/core/src/types/openapi-types.ts` の新規作成（前提作業）

OpenAPI型エイリアスを専用ファイルに分離し、既存の`index.ts`からOpenAPI型を移動します。

```typescript
/**
 * OpenAPI型エイリアス
 *
 * openapi-typesライブラリの型定義を、OpenAPIV3とV3_1の両方をサポートする
 * Union型として再エクスポート。
 */
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

// 既存の型エイリアスをすべて移動
export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;
// ... 他の既存の型エイリアス ...
```

### 1. `packages/core/src/types/openapi-types.ts` への型エイリアス追加

既存の`openapi-types.ts`にSchema関連の判別共用体型を追加します。

```typescript
// Schema判別共用体（Task 019で追加）
export type ArraySchemaObject =
  | OpenAPIV3.ArraySchemaObject
  | OpenAPIV3_1.ArraySchemaObject;

export type NonArraySchemaObject =
  | OpenAPIV3.NonArraySchemaObject
  | OpenAPIV3_1.NonArraySchemaObject;

export type BaseSchemaObject =
  | OpenAPIV3.BaseSchemaObject
  | OpenAPIV3_1.BaseSchemaObject;

// 型判定用
export type ArraySchemaObjectType =
  | OpenAPIV3.ArraySchemaObjectType
  | OpenAPIV3_1.ArraySchemaObjectType;

export type NonArraySchemaObjectType =
  | OpenAPIV3.NonArraySchemaObjectType
  | OpenAPIV3_1.NonArraySchemaObjectType;
```

### 2. `packages/core/src/types/guards.ts` への Type Guard 追加

```typescript
import type {
  ArraySchemaObject,
  NonArraySchemaObject,
  SchemaObject,
  ReferenceObject,
} from "./index";

/**
 * SchemaObjectがArraySchemaObjectかどうかを判定
 *
 * @example
 * if (isArraySchemaObject(schema)) {
 *   // schemaはArraySchemaObject型に絞り込まれる
 *   console.log(schema.items); // OK: itemsプロパティが存在
 * }
 */
export function isArraySchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is ArraySchemaObject {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema.type === "array"
  );
}

/**
 * SchemaObjectがNonArraySchemaObjectかどうかを判定
 */
export function isNonArraySchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema.type !== "array"
  );
}

/**
 * SchemaObjectがObject型かどうかを判定
 *
 * @example
 * if (isObjectSchemaObject(schema)) {
 *   // schemaはobject型として扱える
 *   console.log(schema.properties); // propertiesがある可能性
 * }
 */
export function isObjectSchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject & { type: "object" } {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema.type === "object"
  );
}

/**
 * SchemaObjectがEnum定義を持つかどうかを判定
 *
 * @example
 * if (isEnumSchema(schema)) {
 *   // schemaはenum配列を持つ
 *   console.log(schema.enum); // OK: enumプロパティが存在
 * }
 */
export function isEnumSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject & { enum: any[] } {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    "enum" in schema &&
    Array.isArray(schema.enum) &&
    schema.enum.length > 0
  );
}

/**
 * SchemaObjectがComposition（allOf/oneOf/anyOf）を持つかどうかを判定
 */
export function isCompositionSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject & (
  | { allOf: (ReferenceObject | SchemaObject)[] }
  | { oneOf: (ReferenceObject | SchemaObject)[] }
  | { anyOf: (ReferenceObject | SchemaObject)[] }
) {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    ("allOf" in schema || "oneOf" in schema || "anyOf" in schema)
  );
}

/**
 * SchemaObjectがadditionalPropertiesのみ（Map型）かどうかを判定
 */
export function isMapSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject & { additionalProperties: boolean | ReferenceObject | SchemaObject } {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    (!schema.properties || Object.keys(schema.properties).length === 0)
  );
}

/**
 * SchemaObjectがPrimitive型かどうかを判定
 */
export function isPrimitiveSchema(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject & {
  type: "string" | "number" | "integer" | "boolean";
} {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    typeof schema.type === "string" &&
    ["string", "number", "integer", "boolean"].includes(schema.type)
  );
}
```

### 3. in-sourceテストの追加

```typescript
// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("Schema Type Guards", () => {
    describe("isArraySchemaObject", () => {
      it("should identify array schema", () => {
        const arraySchema: SchemaObject = {
          type: "array",
          items: { type: "string" },
        };
        expect(isArraySchemaObject(arraySchema)).toBe(true);
      });

      it("should return false for non-array schema", () => {
        const objectSchema: SchemaObject = {
          type: "object",
        };
        expect(isArraySchemaObject(objectSchema)).toBe(false);
      });

      it("should return false for reference", () => {
        const ref: ReferenceObject = {
          $ref: "#/components/schemas/User",
        };
        expect(isArraySchemaObject(ref)).toBe(false);
      });
    });

    describe("isObjectSchemaObject", () => {
      it("should identify object schema", () => {
        const objectSchema: SchemaObject = {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        };
        expect(isObjectSchemaObject(objectSchema)).toBe(true);
      });

      it("should return false for array schema", () => {
        const arraySchema: SchemaObject = {
          type: "array",
          items: { type: "string" },
        };
        expect(isObjectSchemaObject(arraySchema)).toBe(false);
      });
    });

    describe("isEnumSchema", () => {
      it("should identify enum schema", () => {
        const enumSchema: SchemaObject = {
          type: "string",
          enum: ["a", "b", "c"],
        };
        expect(isEnumSchema(enumSchema)).toBe(true);
      });

      it("should return false for empty enum", () => {
        const emptyEnum: SchemaObject = {
          type: "string",
          enum: [],
        };
        expect(isEnumSchema(emptyEnum)).toBe(false);
      });

      it("should return false for schema without enum", () => {
        const stringSchema: SchemaObject = {
          type: "string",
        };
        expect(isEnumSchema(stringSchema)).toBe(false);
      });
    });

    describe("isPrimitiveSchema", () => {
      it("should identify primitive types", () => {
        expect(isPrimitiveSchema({ type: "string" })).toBe(true);
        expect(isPrimitiveSchema({ type: "number" })).toBe(true);
        expect(isPrimitiveSchema({ type: "integer" })).toBe(true);
        expect(isPrimitiveSchema({ type: "boolean" })).toBe(true);
      });

      it("should return false for non-primitive types", () => {
        expect(isPrimitiveSchema({ type: "object" })).toBe(false);
        expect(isPrimitiveSchema({ type: "array", items: {} })).toBe(false);
      });
    });
  });
}
```

### 4. `packages/core/src/types/index.ts` でエクスポート

```typescript
// Re-export guard functions
export {
  isReferenceObject,
  isArraySchemaObject,
  isNonArraySchemaObject,
  isObjectSchemaObject,
  isEnumSchema,
  isCompositionSchema,
  isMapSchema,
  isPrimitiveSchema,
} from "./guards";
```

## 利用例（Task 018での使用イメージ）

### Dispatcherでの型絞り込み

```typescript
export function dispatchSchema(
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: TransformContext,
): TransformResult {
  // $ref参照
  if (isReferenceObject(schema)) {
    return transformReference(schema, context);
  }

  // enum
  if (isEnumSchema(schema)) {
    // ここでschemaは SchemaObject & { enum: any[] } 型に絞り込まれる
    return transformEnum(schema, context);
  }

  // object
  if (isObjectSchemaObject(schema)) {
    // ここでschemaは NonArraySchemaObject & { type: "object" } 型
    return transformObject(schema, context);
  }

  // array
  if (isArraySchemaObject(schema)) {
    // ここでschemaは ArraySchemaObject 型（必ずitemsを持つ）
    return transformArray(schema, context);
  }

  // map (additionalPropertiesのみ)
  if (isMapSchema(schema)) {
    return transformMap(schema, context);
  }

  // composition
  if (isCompositionSchema(schema)) {
    return transformComposition(schema, context);
  }

  // primitive
  if (isPrimitiveSchema(schema)) {
    return transformPrimitive(schema, context);
  }

  return createErrorResult("Unsupported schema type");
}
```

### Transformerでの型安全な実装

```typescript
/**
 * Array型スキーマをIRArrayModelに変換
 */
export function transformArray(
  schema: ArraySchemaObject,  // 厳密な型！
  context: TransformContext,
): TransformResult {
  // schema.itemsは必ず存在するため、型チェックが不要
  const itemsResult = dispatchSchema(schema.items, buildItemsContext(context));

  const model: IRArrayModel = {
    kind: "array",
    name: extractModelName(context),
    referencePath: buildReferencePath(context.documentPath),
    itemType: itemsResult.type,
  };

  return {
    type: { kind: "ref", name: model.referencePath },
    models: [model, ...itemsResult.models],
  };
}

/**
 * Enum型スキーマをIREnumModelに変換
 */
export function transformEnum(
  schema: SchemaObject & { enum: any[] },  // enumが必ず存在
  context: TransformContext,
): TransformResult {
  // schema.enumは必ず配列
  const model: IREnumModel = {
    kind: "enum",
    name: extractModelName(context),
    referencePath: buildReferencePath(context.documentPath),
    type: mapEnumType(schema.type),
    values: schema.enum.map(value => ({
      value,
      name: generateEnumMemberName(value, schema.type),
    })),
  };

  return {
    type: { kind: "ref", name: model.referencePath },
    models: [model],
  };
}
```

## 実装計画

### Step 0: openapi-types.tsの作成（10分）

- `packages/core/src/types/openapi-types.ts`を新規作成
- 既存の`index.ts`からOpenAPI型エイリアスを移動
- `index.ts`を更新（re-exportパターンに変更）
- プロジェクト全体の一貫性を確保

### Step 1: Schema型エイリアスの追加（5分）

- `packages/core/src/types/openapi-types.ts`にSchema関連の型エイリアスを追加
- `ArraySchemaObject`, `NonArraySchemaObject`, `BaseSchemaObject`等を追加

### Step 2: Type Guardの実装（15分）

- `packages/core/src/types/guards.ts`にType Guard関数を追加
- in-sourceテストを追加

### Step 3: エクスポートの更新（5分）

- `packages/core/src/types/index.ts`でType Guardをエクスポート

### Step 4: テストとドキュメント（10分）

- `pnpm test`で動作確認
- `pnpm typecheck`で型チェック
- Task 018のドキュメントに型定義セクションを追加

### 合計推定時間

- Step 0: 10分
- Step 1: 5分
- Step 2: 15分
- Step 3: 5分
- Step 4: 10分
- **合計**: 45分

## 期待される効果

### 1. 型安全性の向上

- コンパイル時に型の誤りを検出
- 実行時エラーの削減

### 2. 開発体験の向上

- IDEの補完が正確になる
- コードの意図が明確になる

### 3. Task 018の実装を容易に

- Dispatcherでの型絞り込みがスムーズ
- Transformerの実装が簡潔になる

### 4. ドキュメントとしての価値

- Type Guardの名前から意図が明確
- 新しい開発者がコードを理解しやすい

## リスクと対策

### リスク1: OpenAPIV3とV3_1の互換性

**対策**:

- Union型で両方をサポート
- 共通部分のみを使用

### リスク2: テストの追加工数

**対策**:

- in-sourceテストで最小限のテストを実装
- Task 018実装時に追加でテストを拡充

## 成功基準

- [ ] 型エイリアスがすべて追加されている
- [ ] Type Guard関数がすべて実装されている
- [ ] in-sourceテストがすべて通る
- [ ] `pnpm typecheck`でエラーがない
- [ ] Task 018のドキュメントに型定義セクションが追加されている

## 関連タスク

- **Task 018**: Visitor Architecture Refactoring（この成果物を使用）

---

**Created**: 2025-10-27
**Author**: AI Analysis
**Last Updated**: 2025-10-27
