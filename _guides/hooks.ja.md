# Hooks ガイド

[English](./hooks.md) | [日本語](./hooks.ja.md)

Hooks を使ったコード生成のカスタマイズ包括的ガイド。

## 概要

Hooks を使用すると、特定のポイントでコード生成プロセスに介入し、生成されるコードを変更できます。これにより以下が可能になります：

- カスタム型の使用（ブランド型、カスタムクラス）
- ユーザー定義モジュールや外部パッケージからのインポート追加
- 関数名と実装のカスタマイズ
- カスタムバリデーションロジックの追加
- ファイルレベルでのコード生成制御

## 基本的な使い方

`xcgen.config.ts` で Hook を定義します：

```typescript
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "property:generate": (ctx: HookContext<"property:generate">) => {
      // プロパティ型のカスタマイズ
      if (ctx.extensions?.["x-type"]) {
        ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
      }
    },
  },
});
```

## Hookの種類

| Hook名 | タイミング | 用途 |
|--------|-----------|------|
| property:generate | プロパティ生成時 | カスタム型への変換 |
| parameter:generate | パラメータ生成時 | パラメータ型のカスタマイズ |
| modelFile:generate | モデルファイル生成時 | カスタムインポート追加 |
| endpoint:generate | エンドポイント生成時 | 関数名のカスタマイズ |
| validation:transform | バリデーション変換時 | カスタムバリデーション追加 |

## Hook別の基本例

### property:generate - カスタム型への変換

OpenAPIの`x-type`拡張を使用してカスタム型を指定：

```typescript
"property:generate": (ctx) => {
  if (ctx.extensions?.["x-type"]) {
    ctx.tsCode.typeName = ctx.extensions["x-type"];
  }
}
```

### parameter:generate - パラメータ型のカスタマイズ

エンドポイントのパラメータ型を変換：

```typescript
"parameter:generate": (ctx) => {
  if (ctx.extensions?.["x-type"]) {
    ctx.tsCode.typeName = ctx.extensions["x-type"];
  }
}
```

### modelFile:generate - グループ化インポート

モデル内のカスタム型を収集してインポート文を追加：

```typescript
"modelFile:generate": (ctx) => {
  const customTypes: string[] = [];
  const properties = 'properties' in ctx.model ? ctx.model.properties : [];

  for (const prop of properties) {
    const xType = prop.extensions?.["x-type"];
    if (xType) customTypes.push(xType as string);
  }

  if (customTypes.length > 0) {
    const sorted = [...new Set(customTypes)].sort();
    ctx.tsCode.imports.push(
      `import type { ${sorted.join(", ")} } from "../_userdefs"`
    );
  }
}
```

### endpoint:generate - 関数名のカスタマイズ

`x-function-name`拡張でAPI関数名を変更：

```typescript
"endpoint:generate": (ctx) => {
  if (ctx.extensions?.["x-function-name"]) {
    ctx.tsCode.functionName = ctx.extensions["x-function-name"];
  }
}
```

### validation:transform - カスタムバリデーション

`x-validation`拡張でカスタムバリデーション関数を追加：

```typescript
"validation:transform": (ctx) => {
  if (ctx.extensions?.["x-validation"]) {
    const customFn = ctx.extensions["x-validation"];
    ctx.tsCode.validationPipes.push(`v.custom(${customFn})`);
  }
}
```

## 実践的なユースケース

### ユースケース1: 独自のブランド型を使う

UserId、EmailAddressなどのドメイン固有の値にブランド型（nominal typing）を使用します。

**OpenAPI:**

```yaml
User:
  type: object
  properties:
    phoneNumber:
      type: string
      x-type: PhoneNumber
```

**Hook設定:**

```typescript
// xcgen.config.ts
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "property:generate": (ctx: HookContext<"property:generate">) => {
      if (ctx.extensions?.["x-type"]) {
        ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
      }
    },
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      const properties = 'properties' in ctx.model ? ctx.model.properties : [];
      const customTypes = properties
        .map(prop => prop.extensions?.["x-type"])
        .filter((type): type is string => !!type);

      if (customTypes.length > 0) {
        const sorted = [...new Set(customTypes)].sort();
        ctx.tsCode.imports.push(
          `import type { ${sorted.join(", ")} } from "../_userdefs"`
        );
      }
    },
  },
});
```

**ユーザー定義型:**

```typescript
// _userdefs/index.ts
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };
```

**生成されるコード:**

```typescript
// generated/types.ts
import type { PhoneNumber } from "../_userdefs"

export interface User {
  phoneNumber: PhoneNumber;
}
```

### ユースケース2: 独自のバリデーション関数を使う

Valibotのカスタムバリデータを使用して独自のバリデーションロジックを追加します。

**OpenAPI:**

```yaml
Product:
  type: object
  properties:
    contactEmail:
      type: string
      format: email
      x-validation: validateBusinessEmail
```

**Hook設定:**

```typescript
// xcgen.config.ts
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  validator: "valibot",
  hooks: {
    "validation:transform": (ctx: HookContext<"validation:transform">) => {
      if (ctx.extensions?.["x-validation"]) {
        const customFn = ctx.extensions["x-validation"];
        ctx.tsCode.validationPipes.push(`v.custom(${customFn})`);
      }
    },
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      const properties = 'properties' in ctx.model ? ctx.model.properties : [];
      const hasValidation = properties.some(prop => prop.extensions?.["x-validation"]);

      if (hasValidation) {
        if (!ctx.tsCode.schemaImports) ctx.tsCode.schemaImports = [];
        ctx.tsCode.schemaImports.push(
          `import * as validators from "../_userdefs"`
        );
      }
    },
  },
});
```

**ユーザー定義バリデーション:**

```typescript
// _userdefs/index.ts
export function validateBusinessEmail(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return !input.endsWith("@gmail.com") && !input.endsWith("@yahoo.com");
}
```

**生成されるコード:**

```typescript
// generated/schemas/ProductSchema.ts
import * as v from "valibot";
import * as validators from "../_userdefs"

export const ProductSchema = v.object({
  contactEmail: v.pipe(v.string(), v.email(), v.custom(validators.validateBusinessEmail)),
});
```

### ユースケース3: Date型をDayjsに変換する

より優れた日付操作のために、ネイティブのDate型をDayjsに置き換えます。`x-type: Dayjs`と書くだけで、validationとtransformが自動的に追加されます。

**OpenAPI:**

```yaml
Event:
  type: object
  properties:
    createdAt:
      type: string
      format: date-time
      x-type: Dayjs
```

**Hook設定:**

```typescript
// xcgen.config.ts
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  validator: "valibot",
  hooks: {
    // 1. 型をstringからDayjsに変換
    "property:generate": (ctx: HookContext<"property:generate">) => {
      if (ctx.extensions?.["x-type"] === "Dayjs") {
        ctx.tsCode.typeName = "Dayjs";
      }
    },
    // 2. Dayjs型の場合、自動的にバリデーションとtransformを追加
    "validation:transform": (ctx: HookContext<"validation:transform">) => {
      if (ctx.property.extensions?.["x-type"] === "Dayjs") {
        ctx.tsCode.validationPipes.push("v.isoDateTime()");
        ctx.tsCode.validationPipes.push("v.transform(transformDayjs)");
      }
    },
    // 3. Dayjs型とtransform関数のインポート追加
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      const properties = 'properties' in ctx.model ? ctx.model.properties : [];
      const hasDayjs = properties.some(prop => prop.extensions?.["x-type"] === "Dayjs");

      if (hasDayjs) {
        // モデルファイル用にDayjs型をインポート
        ctx.tsCode.imports.push(
          `import type { Dayjs } from "../_userdefs"`
        );

        // スキーマファイル用にtransform関数をインポート
        if (!ctx.tsCode.schemaImports) ctx.tsCode.schemaImports = [];
        ctx.tsCode.schemaImports.push(
          `import { transformDayjs } from "../_userdefs"`
        );
      }
    },
  },
});
```

**ユーザー定義コード:**

```typescript
// _userdefs/index.ts
import dayjs from "dayjs";

export type Dayjs = dayjs.Dayjs;

export function transformDayjs(input: string): dayjs.Dayjs {
  return dayjs(input);
}
```

**生成されるコード:**

```typescript
// generated/types.ts
import type { Dayjs } from "../_userdefs"

export interface Event {
  createdAt: Dayjs;
}
```

```typescript
// generated/schemas/EventSchema.ts
import * as v from "valibot";
import { transformDayjs } from "../_userdefs"

export const EventSchema = v.object({
  createdAt: v.pipe(v.string(), v.isoDateTime(), v.transform(transformDayjs)),
});
```
