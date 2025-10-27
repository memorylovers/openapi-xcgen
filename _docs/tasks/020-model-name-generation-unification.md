# Task 020: Model Name Generation Unification with Context

**Status**: 📋 Planning
**Priority**: High
**Complexity**: Medium
**Estimated Effort**: 1.5-2 days
**Prerequisite for**: Task 018 (Visitor Architecture Refactoring)

## 概要

`packages/core/src/transformer/helpers/` 配下に複数のモデル名生成関数が存在するが、Context利用の有無が統一されておらず、`get-model-name.ts` 内に重複ロジックが存在する。

すべてのモデル名生成関数を**Context型ベース**に統一し、単一責任原則を実現することで、Task 018の新アーキテクチャ（Dispatcher/Traverser/Transformer）への移行をスムーズにする。

## 動機

### 現在の問題

#### 1. Context利用の不統一

```typescript
// ❌ Context不使用（文字列のみ）
buildAdditionalPropertiesModelName(parentName: string)
buildInlineModelName(parentName: string, kind: VisitorContextKind, index: number)

// ✅ Context使用
buildParameterSchemaModelName(context: ParameterContext)
getModelName(context: VisitorContext)
```

**問題点**:

- 関数シグネチャの一貫性がない
- 将来的な拡張が困難（例: パスやメタデータの追加）
- 型安全性が不十分

#### 2. `get-model-name.ts` 内の重複ロジック

`get-model-name.ts:68-70` でパラメータ処理が重複:

```typescript
// get-model-name.ts内で直接実装
const methodPascal = pascalCase(context.method ?? "");
const pathBase = pathToComponentBase(context.pathTemplate ?? "");
return `${methodPascal}${pathBase}Params`;
```

これは `build-parameter-schema-model-name.ts` と同じロジック。

**問題点**:

- 単一責任原則に違反
- ロジックが複数箇所に散在
- 保守性の低下

#### 3. AdditionalPropertiesContext が存在しない

`types.ts` には `AdditionalPropertiesContext` 型が定義されていないため、`build-additional-properties-model-name.ts` は文字列だけを受け取っている。

**問題点**:

- 型システムで表現できていない
- 将来的な拡張が困難
- Context階層の不完全性

#### 4. RequestBody/Response の命名ロジックが埋め込まれている

`get-model-name.ts:74-95` で RequestBody/Response の命名ロジックが直接実装されている。

**問題点**:

- `get-model-name.ts` の責務が肥大化
- 個別のビルダー関数が存在しない
- 再利用性が低い

## 現状分析

### モデル名生成関数一覧

| ファイル | 関数名 | 引数 | 命名例 |
|---------|--------|------|--------|
| `get-model-name.ts` | `getModelName` | `context: VisitorContext` | （中央ハブ・ディスパッチャー） |
| `build-additional-properties-model-name.ts` | `buildAdditionalPropertiesModelName` | `parentName: string` | `MetricsDataItem` |
| `build-inline-model-name.ts` | `buildInlineModelName` | `parentName: string, kind, index` | `UserAllOf0` |
| `build-parameter-schema-model-name.ts` | `buildParameterSchemaModelName` | `context: ParameterContext` | `GetUsersIdParamsCategory` |
| `generate-enum-name.ts` | `generateEnumName` | `value: unknown` | `PENDING`, `VALUE_1` |

※ `generate-enum-name.ts` は Enum メンバー名生成のため、モデル名生成とは別の役割。

### `get-model-name.ts` の構造

```typescript
export function getModelName(context: VisitorContext): string {
  // Parameter: 直接実装（重複）
  if (isParameterContext(context)) {
    const methodPascal = pascalCase(context.method ?? "");
    const pathBase = pathToComponentBase(context.pathTemplate ?? "");
    return `${methodPascal}${pathBase}Params`;
  }

  // Response: 直接実装（ビルダー関数なし）
  if (isResponseContext(context)) {
    if (isPathsResponseContext(context)) {
      const methodPascal = pascalCase(context.method ?? "");
      const pathBase = pathToComponentBase(context.pathTemplate ?? "");
      const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
      return `${methodPascal}${pathBase}${context.statusCode}${mediaSuffix}Response`;
    }
    return context.documentPath.at(-1) ?? "";
  }

  // RequestBody: 直接実装（ビルダー関数なし）
  if (isRequestBodyContext(context)) {
    if (isPathsRequestBodyContext(context)) {
      const methodPascal = pascalCase(context.method ?? "");
      const pathBase = pathToComponentBase(context.pathTemplate ?? "");
      const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
      return `${methodPascal}${pathBase}${mediaSuffix}RequestBody`;
    }
    return context.documentPath.at(-1) ?? "";
  }

  // Composition: ビルダー関数呼び出し
  if (isCompositionContext(context)) {
    return buildInlineModelName(context.parentSchemaName, context.kind, context.index);
  }

  // Default: documentPathの最後の要素
  return context.documentPath.at(-1) ?? "";
}
```

**問題点**:

- Parameter/Response/RequestBody の命名ロジックが直接埋め込まれている
- Composition のみビルダー関数を呼び出している
- 一貫性がない

## 改善提案

### 設計方針

#### 1. 2層構造の採用

```
┌─────────────────────────────────────┐
│  Dispatcher Layer                   │
│  - getModelName()                   │
│    (Context → 適切なビルダーへ)      │
└────────────┬────────────────────────┘
             │ 委譲
┌────────────▼────────────────────────┐
│  Builder Layer                      │
│  - buildParameterModelName()        │
│  - buildResponseModelName()         │
│  - buildRequestBodyModelName()      │
│  - buildAdditionalPropertiesModelName() │
│  - buildInlineModelName()           │
└─────────────────────────────────────┘
```

**メリット**:

- 単一責任原則の実現
- テストが容易
- Task 018の Dispatcher/Transformer パターンと親和性が高い

#### 2. Context型の完全化

`AdditionalPropertiesContext` を追加し、すべてのモデル名生成がContext型ベースになるようにする。

#### 3. 命名規約の統一

| 層 | プレフィックス | 例 | 責務 |
|----|--------------|-----|------|
| Dispatcher | `get*` | `getModelName` | Context判定とルーティング |
| Builder | `build*` | `buildParameterModelName` | 具体的な命名ロジック |

## 実装計画

### Phase 1: Context型の拡張とguard関数の追加（0.5日）

#### Step 1: `packages/core/src/transformer/types.ts` に `AdditionalPropertiesContext` を追加

```typescript
/**
 * AdditionalProperties処理用のコンテキスト
 */
export interface AdditionalPropertiesContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "additionalProperties";
  /** ルートセグメント */
  rootSegment: "components" | "paths";
  /** 親スキーマ名 */
  parentSchemaName: string;
}
```

#### Step 2: `VisitorContextKind` に追加

```typescript
export type VisitorContextKind =
  | "schema"
  | "allOf"
  | "oneOf"
  | "anyOf"
  | "additionalProperties"  // ← 追加
  | "parameter"
  // ...
```

#### Step 3: `packages/core/src/types/guards.ts` にguard関数を追加

```typescript
/**
 * VisitorContextがAdditionalPropertiesContextかどうかを判定
 */
export function isAdditionalPropertiesContext(
  context: VisitorContext,
): context is AdditionalPropertiesContext {
  return context.kind === "additionalProperties";
}
```

#### Step 4: in-sourceテストの追加

```typescript
describe("isAdditionalPropertiesContext", () => {
  it("should identify additionalProperties contexts", () => {
    const context: AdditionalPropertiesContext = {
      kind: "additionalProperties",
      documentPath: ["components", "schemas", "Test", "additionalProperties"],
      rootSegment: "components",
      parentSchemaName: "Test",
    };
    expect(isAdditionalPropertiesContext(context)).toBe(true);
  });

  it("should return false for non-additionalProperties contexts", () => {
    const baseContext: VisitorContext = {
      documentPath: ["components", "schemas", "User"],
      rootSegment: "components",
    };
    expect(isAdditionalPropertiesContext(baseContext)).toBe(false);
  });
});
```

### Phase 2: 個別ビルダー関数の追加と更新（0.5日）

#### Step 1: 新規ビルダー関数の作成

**`build-parameter-model-name.ts`（新規）**

```typescript
import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../types";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * パラメータのモデル名を生成
 *
 * @param context - ParameterContext
 * @returns モデル名（例: "GetUsersIdParams"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users/{id}", ... }
 * buildParameterModelName(context)  // => "GetUsersIdParams"
 * ```
 */
export function buildParameterModelName(context: ParameterContext): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  return `${methodPascal}${pathBase}Params`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildParameterModelName", () => {
    it("should build model name for path parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters"],
        parameterName: "id",
        in: "path",
        method: "get",
        pathTemplate: "/users/{id}",
        rootSegment: "paths",
      };
      expect(buildParameterModelName(context)).toBe("GetUsersIdParams");
    });

    it("should build model name for query parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters"],
        parameterName: "limit",
        in: "query",
        method: "get",
        pathTemplate: "/users",
        rootSegment: "paths",
      };
      expect(buildParameterModelName(context)).toBe("GetUsersParams");
    });
  });
}
```

**`build-response-model-name.ts`（新規）**

```typescript
import { pascalCase } from "es-toolkit/string";
import type { PathsResponseContext } from "../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * Responseのモデル名を生成（paths配下）
 *
 * @param context - PathsResponseContext
 * @returns モデル名（例: "GetUsers200Response"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users", statusCode: "200", ... }
 * buildResponseModelName(context)  // => "GetUsers200Response"
 * ```
 */
export function buildResponseModelName(
  context: PathsResponseContext,
): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${context.statusCode}${mediaSuffix}Response`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildResponseModelName", () => {
    it("should build model name for 200 response", () => {
      const context: PathsResponseContext = {
        kind: "response",
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildResponseModelName(context)).toBe("GetUsers200Response");
    });

    it("should build model name for 404 response", () => {
      const context: PathsResponseContext = {
        kind: "response",
        documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users/{id}",
        statusCode: "404",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildResponseModelName(context)).toBe("GetUsersId404Response");
    });
  });
}
```

**`build-request-body-model-name.ts`（新規）**

```typescript
import { pascalCase } from "es-toolkit/string";
import type { PathsRequestBodyContext } from "../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * RequestBodyのモデル名を生成（paths配下）
 *
 * @param context - PathsRequestBodyContext
 * @returns モデル名（例: "PostUsersRequestBody"）
 *
 * @example
 * ```typescript
 * // context = { method: "post", pathTemplate: "/users", ... }
 * buildRequestBodyModelName(context)  // => "PostUsersRequestBody"
 * ```
 */
export function buildRequestBodyModelName(
  context: PathsRequestBodyContext,
): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${mediaSuffix}RequestBody`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildRequestBodyModelName", () => {
    it("should build model name for request body", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/users",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildRequestBodyModelName(context)).toBe("PostUsersRequestBody");
    });

    it("should build model name with media type suffix", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/files", "post", "requestBody"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/files",
        contentType: "multipart/form-data",
        schemaPath: ["content", "multipart/form-data", "schema"],
      };
      expect(buildRequestBodyModelName(context)).toBe(
        "PostFilesMultipartFormDataRequestBody",
      );
    });
  });
}
```

#### Step 2: 既存ビルダー関数の更新

**`build-additional-properties-model-name.ts`（Context対応）**

```typescript
import type { AdditionalPropertiesContext, VisitorContext } from "../types";
import { isAdditionalPropertiesContext } from "../../types/guards";

/**
 * additionalPropertiesの値型モデル名を生成
 *
 * @param contextOrParentName - AdditionalPropertiesContext、VisitorContext、または親モデル名
 * @returns モデル名（例: "MetricsDataItem"）
 *
 * @example Context使用
 * ```typescript
 * const context: AdditionalPropertiesContext = {
 *   kind: "additionalProperties",
 *   parentSchemaName: "MetricsData",
 *   ...
 * };
 * buildAdditionalPropertiesModelName(context)  // => "MetricsDataItem"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildAdditionalPropertiesModelName("MetricsData")  // => "MetricsDataItem"
 * ```
 */
export function buildAdditionalPropertiesModelName(
  contextOrParentName: AdditionalPropertiesContext | VisitorContext | string,
): string {
  let parentName: string;

  if (typeof contextOrParentName === "string") {
    // 後方互換性: 文字列を直接受け取る
    parentName = contextOrParentName;
  } else if (isAdditionalPropertiesContext(contextOrParentName)) {
    // AdditionalPropertiesContext
    parentName = contextOrParentName.parentSchemaName;
  } else {
    // その他のVisitorContext（循環依存回避のため、親名を外部から渡す想定）
    throw new Error(
      "buildAdditionalPropertiesModelName requires AdditionalPropertiesContext or string",
    );
  }

  return `${parentName}Item`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildAdditionalPropertiesModelName", () => {
    describe("Context-based usage", () => {
      it("should generate model name from AdditionalPropertiesContext", () => {
        const context: AdditionalPropertiesContext = {
          kind: "additionalProperties",
          documentPath: ["components", "schemas", "Test", "additionalProperties"],
          rootSegment: "components",
          parentSchemaName: "MetricsData",
        };
        expect(buildAdditionalPropertiesModelName(context)).toBe("MetricsDataItem");
      });
    });

    describe("String-based usage (backward compatibility)", () => {
      it("should generate model name with Item suffix", () => {
        expect(buildAdditionalPropertiesModelName("MetricsData")).toBe(
          "MetricsDataItem",
        );
        expect(buildAdditionalPropertiesModelName("Settings")).toBe(
          "SettingsItem",
        );
        expect(buildAdditionalPropertiesModelName("Config")).toBe("ConfigItem");
      });

      it("should work with single-word names", () => {
        expect(buildAdditionalPropertiesModelName("User")).toBe("UserItem");
        expect(buildAdditionalPropertiesModelName("Data")).toBe("DataItem");
      });

      it("should work with PascalCase names", () => {
        expect(buildAdditionalPropertiesModelName("UserProfile")).toBe(
          "UserProfileItem",
        );
        expect(buildAdditionalPropertiesModelName("ApiResponse")).toBe(
          "ApiResponseItem",
        );
      });

      it("should handle empty string gracefully", () => {
        expect(buildAdditionalPropertiesModelName("")).toBe("Item");
      });
    });
  });
}
```

**`build-inline-model-name.ts`（Context対応）**

```typescript
import type { CompositionContext, VisitorContextKind } from "../types";
import { isCompositionContext } from "../../types/guards";

/**
 * インラインスキーマのモデル名を生成（Composition型専用）
 *
 * @param contextOrParentName - CompositionContextまたは親モデル名
 * @param kind - コンテキスト種別（文字列使用時のみ）
 * @param index - インデックス（文字列使用時のみ）
 * @returns モデル名（例: "UserAllOf0"）
 *
 * @example Context使用
 * ```typescript
 * const context: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "User",
 *   index: 0,
 *   ...
 * };
 * buildInlineModelName(context)  // => "UserAllOf0"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildInlineModelName("User", "allOf", 0)  // => "UserAllOf0"
 * ```
 */
export function buildInlineModelName(context: CompositionContext): string;
export function buildInlineModelName(
  parentName: string,
  kind: VisitorContextKind,
  index: number,
): string;
export function buildInlineModelName(
  contextOrParentName: CompositionContext | string,
  kind?: VisitorContextKind,
  index?: number,
): string {
  let parentSchemaName: string;
  let contextKind: "allOf" | "anyOf" | "oneOf";
  let contextIndex: number;

  if (typeof contextOrParentName === "string") {
    // 後方互換性: 旧シグネチャ
    if (!kind || index === undefined) {
      throw new Error("kind and index are required when using string parentName");
    }
    if (kind !== "allOf" && kind !== "anyOf" && kind !== "oneOf") {
      throw new Error(`Unsupported kind for inline model name generation: ${kind}`);
    }
    parentSchemaName = contextOrParentName;
    contextKind = kind;
    contextIndex = index;
  } else {
    // 新シグネチャ: Context対応
    if (!isCompositionContext(contextOrParentName)) {
      throw new Error("Invalid context: not a CompositionContext");
    }
    parentSchemaName = contextOrParentName.parentSchemaName;
    contextKind = contextOrParentName.kind;
    contextIndex = contextOrParentName.index;
  }

  const kindSuffix =
    contextKind === "allOf" ? "AllOf" :
    contextKind === "anyOf" ? "AnyOf" : "OneOf";

  return `${parentSchemaName}${kindSuffix}${contextIndex}`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildInlineModelName", () => {
    describe("Context-based usage", () => {
      it("should generate allOf model names from context", () => {
        const context: CompositionContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "Extended", "allOf", "0"],
          rootSegment: "components",
          parentSchemaName: "User",
          index: 0,
        };
        expect(buildInlineModelName(context)).toBe("UserAllOf0");
      });

      it("should generate oneOf model names from context", () => {
        const context: CompositionContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Item", "oneOf", "1"],
          rootSegment: "components",
          parentSchemaName: "Shape",
          index: 1,
        };
        expect(buildInlineModelName(context)).toBe("ShapeOneOf1");
      });

      it("should generate anyOf model names from context", () => {
        const context: CompositionContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Pet", "anyOf", "2"],
          rootSegment: "components",
          parentSchemaName: "Animal",
          index: 2,
        };
        expect(buildInlineModelName(context)).toBe("AnimalAnyOf2");
      });
    });

    describe("String-based usage (backward compatibility)", () => {
      it("should generate allOf model names", () => {
        expect(buildInlineModelName("User", "allOf", 0)).toBe("UserAllOf0");
        expect(buildInlineModelName("Extended", "allOf", 1)).toBe("ExtendedAllOf1");
        expect(buildInlineModelName("SuperBaby", "allOf", 2)).toBe("SuperBabyAllOf2");
      });

      it("should generate anyOf model names", () => {
        expect(buildInlineModelName("Pet", "anyOf", 0)).toBe("PetAnyOf0");
        expect(buildInlineModelName("Fruit", "anyOf", 1)).toBe("FruitAnyOf1");
        expect(buildInlineModelName("Response", "anyOf", 2)).toBe("ResponseAnyOf2");
      });

      it("should generate oneOf model names", () => {
        expect(buildInlineModelName("Item", "oneOf", 0)).toBe("ItemOneOf0");
        expect(buildInlineModelName("Shape", "oneOf", 1)).toBe("ShapeOneOf1");
        expect(buildInlineModelName("Animal", "oneOf", 2)).toBe("AnimalOneOf2");
      });

      it("should throw for unsupported kinds", () => {
        expect(() => buildInlineModelName("Test", "schema", 0)).toThrow(
          "Unsupported kind for inline model name generation: schema",
        );
        expect(() => buildInlineModelName("Test", "parameter", 0)).toThrow(
          "Unsupported kind for inline model name generation: parameter",
        );
      });
    });
  });
}
```

**`build-parameter-schema-model-name.ts`（リファクタリング）**

```typescript
import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../types";
import { buildParameterModelName } from "./build-parameter-model-name";

/**
 * パラメータのインラインスキーマのモデル名を生成
 *
 * @param context - ParameterContext
 * @returns モデル名（例: "GetUsersIdParamsCategory"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users/{id}", parameterName: "category", ... }
 * buildParameterSchemaModelName(context)  // => "GetUsersIdParamsCategory"
 * ```
 */
export function buildParameterSchemaModelName(
  context: ParameterContext,
): string {
  const paramBase = buildParameterModelName(context);
  const paramNamePascal = pascalCase(context.parameterName);
  return `${paramBase}${paramNamePascal}`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildParameterSchemaModelName", () => {
    it("should build model name for path parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters"],
        parameterName: "id",
        in: "path",
        method: "get",
        pathTemplate: "/users/{id}",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaModelName(context)).toBe("GetUsersIdParamsId");
    });

    it("should build model name for query parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters"],
        parameterName: "category",
        in: "query",
        method: "get",
        pathTemplate: "/users",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaModelName(context)).toBe(
        "GetUsersParamsCategory",
      );
    });

    it("should build model name for complex path template", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: [
          "paths",
          "/api/v2/users/{userId}/posts",
          "post",
          "parameters",
        ],
        parameterName: "limit",
        in: "query",
        method: "post",
        pathTemplate: "/api/v2/users/{userId}/posts",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaModelName(context)).toBe(
        "PostApiV2UsersUserIdPostsParamsLimit",
      );
    });

    it("should handle header parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/posts", "get", "parameters"],
        parameterName: "x-api-key",
        in: "header",
        method: "get",
        pathTemplate: "/posts",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaModelName(context)).toBe(
        "GetPostsParamsXApiKey",
      );
    });

    it("should handle cookie parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/session", "get", "parameters"],
        parameterName: "session_id",
        in: "cookie",
        method: "get",
        pathTemplate: "/session",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaModelName(context)).toBe(
        "GetSessionParamsSessionId",
      );
    });
  });
}
```

### Phase 3: `get-model-name.ts` のリファクタリング（0.3日）

重複ロジックを個別ビルダーに委譲し、ディスパッチャーとしての役割を明確化：

```typescript
import {
  isAdditionalPropertiesContext,
  isCompositionContext,
  isParameterContext,
  isPathsRequestBodyContext,
  isPathsResponseContext,
  isRequestBodyContext,
  isResponseContext,
} from "../../types/guards";
import type { VisitorContext } from "../types";
import { buildAdditionalPropertiesModelName } from "./build-additional-properties-model-name";
import { buildInlineModelName } from "./build-inline-model-name";
import { buildParameterModelName } from "./build-parameter-model-name";
import { buildRequestBodyModelName } from "./build-request-body-model-name";
import { buildResponseModelName } from "./build-response-model-name";

/**
 * VisitorContextからモデル名を取得（中央ディスパッチャー）
 *
 * コンテキストの種類に応じて適切なビルダー関数を呼び出します。
 *
 * @param context - Visitorコンテキスト
 * @returns モデル名
 *
 * @example
 * ```typescript
 * // ParameterContext
 * const paramCtx: ParameterContext = {
 *   method: "get",
 *   pathTemplate: "/users",
 *   parameterName: "limit",
 *   ...
 * };
 * getModelName(paramCtx); // => "GetUsersParams"
 *
 * // AllOfContext
 * const allOfCtx: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "Extended",
 *   index: 0,
 *   ...
 * };
 * getModelName(allOfCtx); // => "ExtendedAllOf0"
 *
 * // 通常のコンテキスト
 * const ctx: VisitorContext = {
 *   documentPath: ["components", "schemas", "User"],
 *   rootSegment: "components",
 * };
 * getModelName(ctx); // => "User"
 * ```
 */
export function getModelName(context: VisitorContext): string {
  // paths配下のParameter
  if (isParameterContext(context)) {
    return buildParameterModelName(context);
  }

  // paths配下のResponse
  if (isResponseContext(context)) {
    if (isPathsResponseContext(context)) {
      return buildResponseModelName(context);
    }
    // components.responsesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
  }

  // paths配下のRequestBody
  if (isRequestBodyContext(context)) {
    if (isPathsRequestBodyContext(context)) {
      return buildRequestBodyModelName(context);
    }
    // components.requestBodiesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
  }

  // Composition型（allOf/oneOf/anyOf）
  if (isCompositionContext(context)) {
    return buildInlineModelName(context);
  }

  // AdditionalProperties
  if (isAdditionalPropertiesContext(context)) {
    return buildAdditionalPropertiesModelName(context);
  }

  // components配下の通常スキーマ
  return context.documentPath.at(-1) ?? "";
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getModelName", () => {
    describe("Paths contexts", () => {
      it("should generate name for ParameterContext", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
          method: "get",
          pathTemplate: "/users",
        };
        expect(getModelName(context)).toBe("GetUsersParams");
      });

      it("should generate name for ParameterContext with path params", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users/{id}", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "id",
          in: "path",
          method: "get",
          pathTemplate: "/users/{id}",
        };
        expect(getModelName(context)).toBe("GetUsersIdParams");
      });

      it("should generate name for RequestBodyContext", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
          method: "post",
          pathTemplate: "/users",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("PostUsersRequestBody");
      });

      it("should generate name for RequestBodyContext with media type suffix", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/files", "post", "requestBody"],
          rootSegment: "paths",
          method: "post",
          pathTemplate: "/files",
          contentType: "multipart/form-data",
          schemaPath: ["content", "multipart/form-data", "schema"],
        };
        expect(getModelName(context)).toBe(
          "PostFilesMultipartFormDataRequestBody",
        );
      });

      it("should generate name for ResponseContext", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users", "get", "responses", "200"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/users",
          statusCode: "200",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("GetUsers200Response");
      });

      it("should generate name for ResponseContext with different status code", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/users/{id}",
          statusCode: "404",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("GetUsersId404Response");
      });
    });

    describe("Composition contexts", () => {
      it("should generate name for AllOfContext", () => {
        const context: AllOfContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "Extended", "allOf", "0"],
          rootSegment: "components",
          parentSchemaName: "Extended",
          index: 0,
        };
        expect(getModelName(context)).toBe("ExtendedAllOf0");
      });

      it("should generate name for OneOfContext", () => {
        const context: OneOfContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Pet", "oneOf", "1"],
          rootSegment: "components",
          parentSchemaName: "Pet",
          index: 1,
        };
        expect(getModelName(context)).toBe("PetOneOf1");
      });

      it("should generate name for AnyOfContext", () => {
        const context: AnyOfContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Item", "anyOf", "2"],
          rootSegment: "components",
          parentSchemaName: "Item",
          index: 2,
        };
        expect(getModelName(context)).toBe("ItemAnyOf2");
      });
    });

    describe("AdditionalProperties context", () => {
      it("should generate name for AdditionalPropertiesContext", () => {
        const context: AdditionalPropertiesContext = {
          kind: "additionalProperties",
          documentPath: ["components", "schemas", "Test", "additionalProperties"],
          rootSegment: "components",
          parentSchemaName: "MetricsData",
        };
        expect(getModelName(context)).toBe("MetricsDataItem");
      });
    });

    describe("Default contexts", () => {
      it("should extract name from documentPath for base context", () => {
        const context: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("User");
      });

      it("should extract name from documentPath for schema context", () => {
        const context: VisitorContext = {
          kind: "schema",
          documentPath: ["components", "schemas", "Product"],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("Product");
      });

      it("should handle empty documentPath", () => {
        const context: VisitorContext = {
          documentPath: [],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("");
      });

      it("should handle nested paths", () => {
        const context: VisitorContext = {
          documentPath: [
            "components",
            "schemas",
            "User",
            "properties",
            "address",
          ],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("address");
      });
    });
  });
}
```

### Phase 4: visitor の更新（0.2日）

**`additional-properties-visitor.ts` の更新**

```typescript
export function visitAdditionalProperties(
  additionalProperties: SchemaObject | ReferenceObject | boolean,
  context: VisitorContext,
): AdditionalPropertiesResult {
  // boolean値の処理
  if (typeof additionalProperties === "boolean") {
    if (additionalProperties === true) {
      consola.warn(
        "additionalProperties: true (any type) is not supported; specify a schema for map values",
      );
    }
    return { type: null, models: [] };
  }

  // SchemaObject | ReferenceObjectの処理
  const schemaObj = additionalProperties as SchemaObjectWithNullable;

  // additionalProperties専用のコンテキストを構築
  const parentName = getModelName(context);

  const inlineContext: AdditionalPropertiesContext = {
    kind: "additionalProperties",
    documentPath: buildInlineSchemaPath(context, `${parentName}Item`),
    rootSegment: context.rootSegment,
    parentSchemaName: parentName,
  };

  const result = visitSchema(schemaObj, inlineContext);

  if (!result.type) {
    consola.warn(`Failed to convert additionalProperties to IRType`);
  }

  return { type: result.type, models: result.models };
}
```

### Phase 5: テストとドキュメント（0.2日）

#### Step 1: 全テストの実行と確認

```bash
pnpm test
pnpm typecheck
pnpm lint
```

#### Step 2: E2Eテストの確認

```bash
cd packages/core && pnpm regenerate:expected
cd packages/xcgen-ts && pnpm regenerate:expected
```

#### Step 3: ドキュメント更新

**`CLAUDE.md` の更新（命名規約セクション）**

```markdown
#### 関数命名

- **Visitor関数**: `visit〇〇` (例: `visitPrimitive`, `visitType`)
- **Dispatcher関数**: `get〇〇` (例: `getModelName`)
- **Builder関数**: `build〇〇` (例: `buildParameterModelName`, `buildResponseModelName`)
- **Helper関数**: 動詞で始まる (例: `isPrimitiveType`, `extractRefName`)
- **変換関数**: `〇〇To△△` (例: `schemaToIR`)
```

#### Step 4: Task 018への影響を記録

Task 018のドキュメントに、モデル名生成の新構造を追記する。

## 期待される効果

### 1. 一貫性の向上

- すべてのビルダー関数がContext型を受け取る
- 型安全性が向上
- 命名戦略が明確

### 2. 保守性の向上

- 重複コードの削減（`get-model-name.ts` の70行削減）
- 単一責任原則の実現
- テストが容易（各ビルダーを独立してテスト可能）
- `get-model-name.ts` がディスパッチャーとしての役割に専念

### 3. 拡張性の向上

- 新しいContext型の追加が容易
- ビルダー関数の再利用性が高い
- 将来的なメタデータ追加が容易

### 4. Task 018との統合準備

- Context型が整備されているため、新アーキテクチャへの移行がスムーズ
- ディスパッチャーパターンが明確になっている
- `helpers/naming/` ディレクトリへの移行が容易

### 5. コード量の変化

- **削減**: `get-model-name.ts` の70行（重複ロジック）
- **追加**: 3つの新規ビルダー関数（各60行程度）
- **更新**: 2つの既存ビルダー関数（Context対応）
- **正味**: +120行程度（ただしテストとドキュメント含む）

## ディレクトリ構造の変化

### 現在

```
packages/core/src/transformer/helpers/
├── build-additional-properties-model-name.ts
├── build-inline-model-name.ts
├── build-parameter-schema-model-name.ts
├── generate-enum-name.ts
├── get-model-name.ts
└── ...
```

### Task 020完了後

```
packages/core/src/transformer/helpers/
├── build-additional-properties-model-name.ts  # Context対応
├── build-inline-model-name.ts                 # Context対応
├── build-parameter-model-name.ts              # 新規
├── build-parameter-schema-model-name.ts       # リファクタ
├── build-request-body-model-name.ts           # 新規
├── build-response-model-name.ts               # 新規
├── generate-enum-name.ts                      # 変更なし
├── get-model-name.ts                          # ディスパッチャー化
└── ...
```

### Task 018実施時（最終形）

```
packages/core/src/transformer/
├── dispatchers/
│   ├── schema-dispatcher.ts    # getModelName的な機能を統合
│   └── ...
├── transformers/
│   ├── object-transformer.ts
│   └── ...
├── helpers/
│   ├── naming/                 # ← モデル名生成関数を集約
│   │   ├── build-parameter-model-name.ts
│   │   ├── build-response-model-name.ts
│   │   ├── build-request-body-model-name.ts
│   │   ├── build-additional-properties-model-name.ts
│   │   ├── build-inline-model-name.ts
│   │   └── index.ts
│   ├── path-to-component-base.ts
│   └── ...
└── types.ts
```

## リスクと対策

### リスク1: 既存テストの破壊

**対策**:

- 後方互換性のあるオーバーロードを提供
- 段階的な移行（Phase 2で旧シグネチャをサポート）
- 各Phaseでテストを実行

### リスク2: 循環依存の発生

**問題**: `get-model-name.ts` が `build-additional-properties-model-name.ts` を呼び出し、`build-additional-properties-model-name.ts` が `get-model-name.ts` を呼び出す可能性。

**対策**:

- `build-additional-properties-model-name.ts` は `AdditionalPropertiesContext` から直接 `parentSchemaName` を受け取る設計
- Context から親名を取得するのは呼び出し側（visitor）の責務とする
- 循環参照を避けるため、ビルダー関数は他のビルダー関数を呼び出さない原則

### リスク3: 実装期間の超過

**対策**:

- Phase 1-3を優先（Core機能）
- Phase 4-5は必要に応じて調整
- Task 018への統合は別タスクとして管理

### リスク4: インポートパスの変更によるコンパイルエラー

**対策**:

- 新規ファイル追加時に既存の `index.ts` から確実にエクスポート
- `pnpm typecheck` を各Phase後に実行
- エラーが出た場合は即座に修正

## 成功基準

- [ ] `AdditionalPropertiesContext` 型が追加されている
- [ ] guard関数 `isAdditionalPropertiesContext` が実装されている
- [ ] 新規ビルダー関数が3つ追加されている
  - [ ] `build-parameter-model-name.ts`
  - [ ] `build-response-model-name.ts`
  - [ ] `build-request-body-model-name.ts`
- [ ] 既存ビルダー関数が2つ更新されている
  - [ ] `build-additional-properties-model-name.ts`（Context対応）
  - [ ] `build-inline-model-name.ts`（Context対応）
- [ ] `build-parameter-schema-model-name.ts` がリファクタリングされている
- [ ] `get-model-name.ts` がディスパッチャーとしてリファクタリングされている
- [ ] `additional-properties-visitor.ts` が更新されている
- [ ] すべての既存テストが通る
- [ ] 新しいin-sourceテストが追加されている
- [ ] `pnpm typecheck` でエラーがない
- [ ] `pnpm lint` でエラーがない
- [ ] E2E生成結果が既存と一致

## 関連タスク

- **Task 018**: Visitor Architecture Refactoring（このタスク完了後に実施）
- **Task 019**: Type-Safe Schema Definitions（並行して実施可能）

---

**Created**: 2025-10-27
**Author**: AI Analysis
**Last Updated**: 2025-10-27
