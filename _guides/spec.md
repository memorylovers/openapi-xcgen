# Specification

[English](./spec.md) | [日本語](./spec.ja.md)

Technical specification for openapi-xcgen's type system and limitations.

## Type System

### Scalar Type Mapping

The following table shows the mapping between OpenAPI types and TypeScript types:

| OpenAPI `type` | OpenAPI `format` | TypeScript type | Notes |
|----------------|------------------|-----------------|-------|
| `integer` | - or `int32` | `number` | 32-bit integer |
| `integer` | `int64` | `number` | 64-bit integer |
| `number` | - or `double` | `number` | Double precision |
| `number` | `float` | `number` | Single precision |
| `string` | - | `string` | String |
| `string` | `date` | `string` | ISO 8601 date |
| `string` | `date-time` | `string` | ISO 8601 date-time |
| `string` | `binary` | `Blob` | Binary data |
| `string` | `byte` | `string` | Base64 encoded |
| `boolean` | - | `boolean` | Boolean |

### Complex Types

- **Object**: `type: object` with properties → TypeScript interface
- **Array**: `type: array` with items → `T[]`
- **Enum**: `enum` array → TypeScript union type
- **Map**: `additionalProperties` → `Record<string, T>`
- **Union**: `oneOf` → Discriminated union with `kind` property
- **Intersection**: `allOf` → Type intersection (`A & B`)
- **Inclusive Union**: `anyOf` → Type union (`A | B`)

### Type Modifiers

- **Required**: Specified in `required` array → Non-optional property
- **Nullable**: `nullable: true` (OpenAPI 3.0) or `type: [T, "null"]` (OpenAPI 3.1) → `T | null`
- **ReadOnly**: `readOnly: true` → `readonly` property
- **WriteOnly**: `writeOnly: true` → Omitted from response types

## Unsupported Features

The following OpenAPI features are currently not supported:

### Schema Features

- ❌ **not**: Negation schema
- ❌ **if/then/else**: Conditional schemas
- ❌ **Empty schemas `{}`**: Schema that accepts any type

### Validation Features

- ❌ **multipleOf**: Number multiple constraint
- ❌ **contentMediaType/contentEncoding**: Content encoding
- ❌ **patternProperties**: Pattern-based properties
- ❌ **$id/$anchor**: Schema identifiers

### Operation Features

- ❌ **Response headers**: Rate-Limit information, etc.
- ❌ **Common parameters**: Path-level common parameters
- ❌ **Security definitions**: security/securitySchemes
- ❌ **Callbacks**: Asynchronous callbacks
- ❌ **Links**: Hypermedia links

These features represent a small portion (<10%) of typical API usage. Basic type handling (object, array, primitive, enum, $ref, oneOf/anyOf/allOf) covers 90%+ of APIs.

## Related Documentation

- **[README](../README.md)** - Project overview, CLI usage, and getting started
- **[Examples](../examples/)** - Working code examples
