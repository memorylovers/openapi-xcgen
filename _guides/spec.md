# Specification

[English](./spec.md) | [日本語](./spec.ja.md)

Technical specification for openapi-xcgen's type system and limitations.

## Type System

### Scalar Type Mapping

The following table shows the mapping between OpenAPI types, IR types, and TypeScript types:

| Type | OpenAPI `type` | OpenAPI `format` | IR Type | TypeScript Type |
|------|----------------|------------------|---------|-----------------|
| 32-bit integer | `integer` | - or `int32` | `int` | `number` |
| 64-bit integer | `integer` | `int64` | `long` | `number` |
| Double precision | `number` | - or `double` | `double` | `number` |
| Single precision | `number` | `float` | `float` | `number` |
| String | `string` | - | `string` | `string` |
| Date | `string` | `date` | `date` | `Date` |
| Date-Time | `string` | `date-time` | `datetime` | `Date` |
| Binary data | `string` | `binary` | `binary` | `Blob` |
| Base64 encoded | `string` | `byte` | `byte` | `string` |
| Boolean | `boolean` | - | `boolean` | `boolean` |

### Complex Types

| Type | OpenAPI Definition | IR Representation | TypeScript Representation |
|------|-------------------|-------------------|---------------------------|
| Object | `type: object` + properties | `IRObjectModel` | `interface` |
| Array | `type: array` + items | `IRArray` | `T[]` |
| Enum | `enum: [...]` | `IREnumModel` | union type |
| Map | `additionalProperties` | `IRMap` | `Record<string, T>` |
| Union | `oneOf` | `IRUnionModel` | discriminated union |
| Intersection | `allOf` | `IRAllOfModel` | `A & B` |
| Inclusive Union | `anyOf` | `IRAnyOfModel` | `A \| B` |

### Type Modifiers

| Modifier | OpenAPI Definition | IR Representation | TypeScript Representation |
|----------|-------------------|-------------------|---------------------------|
| Required | `required: [...]` | `IRProperty.required: true` | non-optional |
| Nullable | `nullable: true` / `type: [..., "null"]` | `IRProperty.nullable: true` | `T \| null` |
| ReadOnly | `readOnly: true` | `IRProperty.readOnly: true` | `readonly` |
| WriteOnly | `writeOnly: true` | `IRProperty.writeOnly: true` | (omitted) |

### Scalar Type Validation

| IR Type | Valibot Schema | Notes |
|---------|----------------|-------|
| `int` | `v.number()` | 32-bit integer |
| `long` | `v.number()` | 64-bit integer |
| `float` | `v.number()` | Single precision float |
| `double` | `v.number()` | Double precision float |
| `string` | `v.string()` | String |
| `boolean` | `v.boolean()` | Boolean |
| `null` | `v.null()` | Null value |
| `date` | `v.pipe(v.string(), v.isoDate(), v.transform(...))` | Date |
| `datetime` | `v.pipe(v.string(), v.isoDateTime(), v.transform(...))` | Date-Time |
| `byte` | `v.pipe(v.string(), v.base64())` | Base64 encoded |
| `binary` | `v.instance(Blob)` | Binary data |

### Complex Type Validation

| IR Type | Valibot Schema | Example |
|---------|----------------|---------|
| `IRObjectModel` | `v.object({...})` | `v.object({ id: v.string() })` |
| `IRArray` | `v.array(itemSchema)` | `v.array(v.string())` |
| `IREnumModel` | `v.picklist([...])` | `v.picklist(["a", "b"])` |
| `IRMap` | `v.record(v.string(), valueSchema)` | `v.record(v.string(), v.number())` |
| `IRUnionModel` (oneOf) | `v.variant(discriminator, [...])` | `v.variant("type", [CatSchema, DogSchema])` |
| `IRAllOfModel` (allOf) | `v.intersect([...])` | `v.intersect([BaseSchema, MixinSchema])` |
| `IRAnyOfModel` (anyOf) | `v.union([...])` | `v.union([StringSchema, NumberSchema])` |

### Type Modifier Validation

| Modifier | IR Representation | Valibot Schema | Example |
|----------|-------------------|----------------|---------|
| Required | `IRProperty.required: true` | (default) | `v.string()` |
| Optional | `IRProperty.required: false` | `v.optional(schema)` | `v.optional(v.string())` |
| Nullable | `IRProperty.nullable: true` | `v.nullable(schema)` | `v.nullable(v.string())` |
| ReadOnly | `IRProperty.readOnly: true` | (comment only) | `v.string() // readOnly` |
| WriteOnly | `IRProperty.writeOnly: true` | (not generated) | - |

### Validation Constraints

| Category | Validation | OpenAPI Definition | IR Representation | Valibot Representation |
|----------|------------|-------------------|-------------------|----------------------|
| String | Min Length | `minLength: 3` | `IRValidation.minLength: 3` | `v.minLength(3)` |
| String | Max Length | `maxLength: 50` | `IRValidation.maxLength: 50` | `v.maxLength(50)` |
| String | Pattern | `pattern: "^[a-z]+$"` | `IRValidation.pattern: "^[a-z]+$"` | `v.regex(/^[a-z]+$/)` |
| Number | Minimum | `minimum: 0` | `IRValidation.minimum: 0` | `v.minValue(0)` |
| Number | Maximum | `maximum: 100` | `IRValidation.maximum: 100` | `v.maxValue(100)` |
| Format | Email | `format: email` | `IRValidation.format: "email"` | `v.email()` |
| Format | UUID | `format: uuid` | `IRValidation.format: "uuid"` | `v.uuid()` |
| Format | URL | `format: url` / `uri` | `IRValidation.format: "url"` | `v.url()` |

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
