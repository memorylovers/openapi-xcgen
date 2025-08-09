# Project Architecture

## Overall Structure

Monorepo architecture with independent language generators sharing a common core.

```
openapi-xcgen/
├── packages/
│   ├── core/                    # Shared functionality
│   ├── generator-typescript/    # TypeScript generator
│   └── generator-dart/          # Dart generator
├── _docs/                       # Documentation
│   ├── design/                  # Design documents
│   └── _tasks/                  # Task tracking
└── [config files]               # Root configuration
```

## Package Dependencies

```
@openapi-xcgen/generator-typescript → @openapi-xcgen/core
@openapi-xcgen/generator-dart → @openapi-xcgen/core
@openapi-xcgen/core (standalone)
```

## Core Package Architecture

### Key Components

1. **Parser Module** (`parser/`)
   - `OpenAPIParser`: Handles OpenAPI document parsing using swagger-parser
   - Uses `bundle()` method to preserve $refs as internal references
   - Error handling with custom error classes

2. **Transformer Module** (`transformer/`)
   - `OpenAPITransformer`: Converts OpenAPI to Intermediate Representation (IR)
   - Handles schema resolution and component extraction
   - Manages inline schema processing

3. **IR Types** (`types/ir/`)
   - `XcgenIR`: Main IR structure
   - Discriminated unions for type safety
   - Comprehensive type definitions for all OpenAPI constructs

4. **CLI Module** (`cli/`)
   - Reusable command definitions
   - Shared utilities for file generation
   - Package info helpers

5. **Utilities** (`utils/`)
   - String case conversions
   - File I/O helpers
   - Common transformations

### Intermediate Representation (IR)

```typescript
interface XcgenIR {
  metadata: IRMetadata;        // API metadata
  models: IRModel[];           // Data models
  enums: IREnum[];            // Enumerations
  unions: IRUnion[];          // Union types
  services: IRService[];      // API services (grouped by tags)
  servers: IRServer[];        // Server configurations
  security?: IRSecurityScheme[]; // Security definitions
}
```

## Generator Architecture

### TypeScript Generator

- Generates type-safe TypeScript client code
- Features:
  - Model interfaces with proper typing
  - Valibot schemas for runtime validation
  - Tree-shakeable function-based API
  - Fetch API-based HTTP client
  - Full TypeScript type inference

### Dart Generator

- Generates Dart client code with null safety
- Features:
  - Model classes with json_serializable/freezed
  - Service classes for API operations
  - Configurable HTTP client (http/dio)
  - pubspec.yaml generation

## Data Flow

1. **Input**: OpenAPI specification (YAML/JSON)
2. **Parsing**: Convert to OpenAPI document object (with bundled $refs)
3. **Transformation**: Convert to XcgenIR
4. **Generation**: Language-specific code generation from IR
5. **Output**: Generated client code files

## Extension Points

- New languages: Create `generator-[language]` package
- Custom transformations: Extend transformer classes
- Additional validations: Add to parser module
- New IR types: Extend IR type definitions

## Design Principles

1. **Separation of Concerns**: Parser, transformer, and generators are independent
2. **Type Safety**: Strict TypeScript with discriminated unions
3. **Reusability**: Common functionality in core package
4. **Extensibility**: Easy to add new language generators
5. **YAGNI**: Keep implementations simple until complexity is needed
