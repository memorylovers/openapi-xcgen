# Hooks Guide

[English](./hooks.md) | [日本語](./hooks.ja.md)

Comprehensive guide for customizing code generation with Hooks.

## Overview

Hooks allow you to customize the code generation process by intercepting and modifying the generated code at specific points. This enables you to:

- Use custom types (branded types, custom classes)
- Add custom imports from user-defined modules or external packages
- Customize function names and implementations
- Add custom validation logic
- Control code generation at file level

## Basic Usage

Define hooks in your `xcgen.config.ts`:

```typescript
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "property:generate": (ctx: HookContext<"property:generate">) => {
      // Customize property type
      if (ctx.extensions?.["x-type"]) {
        ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
      }
    },
  },
});
```

## Hook Types

| Hook Name | Timing | Purpose |
|-----------|--------|---------|
| property:generate | When generating each property | Convert to custom types |
| parameter:generate | When generating each parameter | Customize parameter types |
| modelFile:generate | When generating each model file | Add custom imports |
| endpoint:generate | When generating each endpoint | Customize function names |
| validation:transform | When transforming validation | Add custom validation |

## Hook Examples

### property:generate - Custom Type Conversion

Use `x-type` extension in OpenAPI to specify custom types:

```typescript
"property:generate": (ctx) => {
  if (ctx.extensions?.["x-type"]) {
    ctx.tsCode.typeName = ctx.extensions["x-type"];
  }
}
```

### parameter:generate - Parameter Type Customization

Convert endpoint parameter types:

```typescript
"parameter:generate": (ctx) => {
  if (ctx.extensions?.["x-type"]) {
    ctx.tsCode.typeName = ctx.extensions["x-type"];
  }
}
```

### modelFile:generate - Grouped Imports

Collect custom types from model and add import statement:

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

### endpoint:generate - Function Name Customization

Change API function name with `x-function-name` extension:

```typescript
"endpoint:generate": (ctx) => {
  if (ctx.extensions?.["x-function-name"]) {
    ctx.tsCode.functionName = ctx.extensions["x-function-name"];
  }
}
```

### validation:transform - Custom Validation

Add custom validation function with `x-validation` extension:

```typescript
"validation:transform": (ctx) => {
  if (ctx.extensions?.["x-validation"]) {
    const customFn = ctx.extensions["x-validation"];
    ctx.tsCode.validationPipes.push(`v.custom(${customFn})`);
  }
}
```

## Practical Use Cases

### Use Case 1: Custom Branded Types

Use branded types (nominal typing) for domain-specific values like PhoneNumber.

**OpenAPI:**

```yaml
User:
  type: object
  properties:
    phoneNumber:
      type: string
      x-type: PhoneNumber
```

**Hook Configuration:**

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

**User-defined Types:**

```typescript
// _userdefs/index.ts
export type PhoneNumber = string & { readonly __brand: "PhoneNumber" };
```

**Generated Code:**

```typescript
// generated/types.ts
import type { PhoneNumber } from "../_userdefs"

export interface User {
  phoneNumber: PhoneNumber;
}
```

### Use Case 2: Custom Validation Functions

Add custom validation logic using Valibot custom validators.

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

**Hook Configuration:**

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

**User-defined Validation:**

```typescript
// _userdefs/index.ts
export function validateBusinessEmail(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return !input.endsWith("@gmail.com") && !input.endsWith("@yahoo.com");
}
```

**Generated Code:**

```typescript
// generated/schemas/ProductSchema.ts
import * as v from "valibot";
import * as validators from "../_userdefs"

export const ProductSchema = v.object({
  contactEmail: v.pipe(v.string(), v.email(), v.custom(validators.validateBusinessEmail)),
});
```

### Use Case 3: Dayjs Integration

Replace native Date type with Dayjs for better date manipulation. Just specify `x-type: Dayjs` and validation + transform are added automatically.

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

**Hook Configuration:**

```typescript
// xcgen.config.ts
import { defineConfig } from "@openapi-xcgen/xcgen-ts";
import type { HookContext } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  validator: "valibot",
  hooks: {
    // 1. Convert type from string to Dayjs
    "property:generate": (ctx: HookContext<"property:generate">) => {
      if (ctx.extensions?.["x-type"] === "Dayjs") {
        ctx.tsCode.typeName = "Dayjs";
      }
    },
    // 2. Automatically add validation and transform for Dayjs type
    "validation:transform": (ctx: HookContext<"validation:transform">) => {
      if (ctx.property.extensions?.["x-type"] === "Dayjs") {
        ctx.tsCode.validationPipes.push("v.isoDateTime()");
        ctx.tsCode.validationPipes.push("v.transform(transformDayjs)");
      }
    },
    // 3. Add imports for Dayjs type and transform function
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      const properties = 'properties' in ctx.model ? ctx.model.properties : [];
      const hasDayjs = properties.some(prop => prop.extensions?.["x-type"] === "Dayjs");

      if (hasDayjs) {
        // Import Dayjs type for model files
        ctx.tsCode.imports.push(
          `import type { Dayjs } from "../_userdefs"`
        );

        // Import transform function for schema files
        if (!ctx.tsCode.schemaImports) ctx.tsCode.schemaImports = [];
        ctx.tsCode.schemaImports.push(
          `import { transformDayjs } from "../_userdefs"`
        );
      }
    },
  },
});
```

**User-defined Code:**

```typescript
// _userdefs/index.ts
import dayjs from "dayjs";

export type Dayjs = dayjs.Dayjs;

export function transformDayjs(input: string): dayjs.Dayjs {
  return dayjs(input);
}
```

**Generated Code:**

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
