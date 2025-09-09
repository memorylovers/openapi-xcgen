# openapi-xcgen

A cross-language code generator that transforms OpenAPI specifications into TypeScript and Dart client code.

## Overview

openapi-xcgen takes OpenAPI specification files (YAML/JSON) generated from TypeSpec and produces type-safe client code for multiple languages. The library uses an intermediate representation (IR) to ensure consistent code generation across different target languages.

## Packages

- **@openapi-xcgen/core**: Parser and transformer for OpenAPI to IR conversion
- **@openapi-xcgen/generator-typescript**: TypeScript code generator (planned)
- **@openapi-xcgen/generator-dart**: Dart code generator (planned)

## Type System

### IR Scalar Types

The following table shows the mapping between OpenAPI types and IR scalar types:

| IR Type | Description | OpenAPI `type` | OpenAPI `format` |
|---------|-------------|----------------|------------------|
| `int` | 32-bit integer | `integer` | - or `int32` |
| `long` | 64-bit integer | `integer` | `int64` |
| `float` | Single precision float | `number` | `float` |
| `double` | Double precision float | `number` | - or `double` |
| `string` | String | `string` | - |
| `boolean` | Boolean | `boolean` | - |
| `date` | Date only | `string` | `date` |
| `datetime` | Date and time | `string` | `date-time` |
| `binary` | Binary data | `string` | `binary` |
| `byte` | Base64 encoded | `string` | `byte` |

### IR Model Structure

openapi-xcgen uses a unified model structure with discriminated unions for type safety:

```typescript
type IRModel = IRObjectModel | IREnumModel | IRArrayModel | IRMapModel;

interface IRObjectModel {
  kind: "object";
  name: string;
  referencePath: string;
  properties: IRProperty[];
  // ... other properties
}

interface IREnumModel {
  kind: "enum";
  name: string; 
  referencePath: string;
  type: string;
  values: IREnumValue[];
  // ... other properties
}
```

### Complex Types

- **Array**: Represented as `IRArray` with element type
- **Object**: Represented as `IRMap` for additional properties or `IRObjectModel` for defined structures
- **Reference**: Represented as `IRRef` pointing to components or inline models

### Type Modifiers

- **Nullable**: Handled at usage level (`IRProperty`, `IRParameter`) rather than type definition
- **Required**: Specified in model's required array or parameter's required flag

## Model References

Every IR model includes a `referencePath` field that preserves the original location in the OpenAPI specification. This enables accurate source tracking and debugging.

### Reference Path Formats

#### Components References

Models defined in `components/schemas` use the standard JSON Pointer format:

```
#/components/schemas/User
#/components/schemas/UserProfile
```

#### Inline Schema References  

Inline schemas are automatically extracted and assigned reference paths using `::` notation:

```
#/paths/::users/get/responses/200/content/application/json/schema
#/paths/::users::{userId}/post/requestBody/content/application/json/schema
```

#### Parameter Model References

Parameters are consolidated into unified models with descriptive reference paths:

```
#/paths/::users::{userId}/get/parameters/GetUsersUserIdParams
```

### Inline Schema Processing

openapi-xcgen automatically extracts inline schemas into independent models:

- **Request Body Schemas**: Converted to `{Method}{Path}RequestBody` models
- **Response Schemas**: Converted to `{Method}{Path}{Status}Response` models  
- **Parameter Groups**: Consolidated into `{Method}{Path}Params` models
- **Nested Objects**: Recursively extracted with appropriate naming

Example transformations:

```yaml
# OpenAPI inline schema
/users/{id}:
  get:
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
```

Becomes:

```typescript
{
  kind: "object",
  name: "GetUsersId200Response", 
  referencePath: "#/paths/::users::{id}/get/responses/200/content/application/json/schema",
  properties: [
    { name: "name", type: "string", required: false }
  ]
}
```

## Development

### Prerequisites

- Node.js v20+
- pnpm 10.13.1

### Architecture

openapi-xcgen follows functional programming principles with:

- **Tree-shaking Support**: Function-based architecture avoids classes
- **Type Safety**: Discriminated unions with TypeScript strict mode
- **Visitor Pattern**: Each OpenAPI construct has dedicated visitor functions
- **Test Coverage**: 308+ comprehensive tests including unit and E2E tests
- **In-source Testing**: Tests co-located with implementation using `import.meta.vitest`

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Check code quality
pnpm check
```

### Commands

```bash
# Development
pnpm dev          # Watch mode
pnpm build        # Build packages

# Testing
pnpm test         # Run tests
pnpm test:watch   # Watch mode testing
pnpm test:coverage # Coverage report

# Quality
pnpm check        # Run all checks
pnpm lint         # Lint code
pnpm lint:fix     # Fix lint issues
pnpm typecheck    # TypeScript check
```

## Currently Unsupported Features

The following OpenAPI features are not yet supported:

- `oneOf`, `anyOf`, `allOf` (union types and schema composition)
- `discriminator` (polymorphism)
- `not` (negation schema)
- `additionalProperties` (dynamic properties)
- `if`/`then`/`else` (conditional schemas)
- Empty schemas `{}`

## License

[MIT License](/LICENSE) / [©Memory Lovers, LLC](https://memory-lovers.com)

## Author

- [GitHub(@memory-lovers)](https://github.com/memory-lovers)
- [Blog(くらげになりたい。)](https://memory-lovers.blog/)  
- [Twitter/X(@kira_puka)](https://twitter.com/kira_puka)
