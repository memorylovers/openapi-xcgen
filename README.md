# openapi-xcgen

[English](./README.md) | [日本語](./README.ja.md)

A cross-language code generator that transforms OpenAPI specifications into type-safe TypeScript client code.

## Features

- ✅ **Cross-language support** - TypeScript, Dart (planned)
- ✅ **OpenAPI 3.0/3.1** - Full specification support
- ✅ **Type-safe code generation** - Leverages native type systems
- ✅ **Advanced features** - oneOf/anyOf/allOf, discriminator support
- ✅ **Inline schema extraction** - Converts to reusable models
- ✅ **Validation integration** - Supports major validation libraries

## TypeScript (xcgen-ts)

Currently available:

- **Zero runtime dependencies** - fetch-based lightweight HTTP client
- **Valibot integration** - Optional runtime validation
- **Tree-shakeable** - Function-based architecture

## Quick Start

### Installation

```bash
# Install globally
npm install -g @openapi-xcgen/xcgen-ts

# Or install as dev dependency
npm install --save-dev @openapi-xcgen/xcgen-ts
```

### Generate Client

```bash
# Basic generation
xcgen-ts -i openapi.yaml -o ./generated

# With Valibot validation
xcgen-ts -i openapi.yaml -o ./generated --validator=valibot
```

### Use Generated Client

```typescript
import { listUsers } from "./generated/services";
import { setConfig } from "./generated/client";

setConfig({ baseUrl: "https://api.example.com" });

const users = await listUsers();
```

## CLI Usage

### Basic Command

```bash
xcgen-ts -i <input> -o <output> [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-i, --input <path>` | Input OpenAPI file (YAML/JSON) | `-i openapi.yaml` |
| `-o, --output <path>` | Output directory | `-o ./generated` |
| `--validator <lib>` | Validation library (valibot) | `--validator=valibot` |
| `-c, --config <path>` | Config file path | `-c ./xcgen.config.ts` |

### Generated Files

The generator creates the following files:

- **`types.ts`** - TypeScript type definitions
- **`client.ts`** - HTTP client and error handling
- **`services.ts`** - API service functions
- **`schemas.ts`** - Validation schemas (when `--validator` is specified)

### Configuration File

Create `xcgen.config.ts` in your project root:

```typescript
import { defineConfig } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./src/generated",
  validator: "valibot",
});
```

Then run: `xcgen-ts` (uses config file automatically)

## Documentation

- **[Specification](./_guides/spec.md)** - Type system and limitations
- **[Examples](./examples/)** - Working code examples

## Packages

- **[@openapi-xcgen/core](./packages/core/)** - OpenAPI parser and IR transformer
- **[@openapi-xcgen/xcgen-ts](./packages/xcgen-ts/)** - TypeScript code generator
- **@openapi-xcgen/xcgen-dart** - Dart generator (planned)

## Development

### Prerequisites

- Node.js v20+
- pnpm 10.13.1

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Check code quality (lint + typecheck + test)
pnpm check
```

### Commands

```bash
# Development
pnpm dev              # Watch mode
pnpm build            # Build packages

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Quality
pnpm check            # Run all checks
pnpm lint             # Lint code
pnpm lint:fix         # Fix lint issues
pnpm typecheck        # TypeScript check

# Version management and release
pnpm lerna:version    # Bump package versions (using Conventional Commits)
pnpm lerna:publish    # Publish to npm
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## Common Issues

### "xcgen-ts: command not found"

If you installed locally (not globally), you have several options:

1. **Use npx**:

   ```bash
   npx xcgen-ts -i openapi.yaml -o generated
   ```

2. **Add to package.json scripts** (recommended):

   ```json
   {
     "scripts": {
       "generate": "xcgen-ts -i openapi.yaml -o generated"
     }
   }
   ```

   Then run: `npm run generate`

3. **Install globally**:

   ```bash
   npm install -g @openapi-xcgen/xcgen-ts
   ```

### Generated code has type errors

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

See `examples/petstore/tsconfig.json` for a complete working configuration.

## License

[MIT License](/LICENSE) / [©Memory Lovers, LLC](https://memory-lovers.com)

## Author

- [GitHub(@memory-lovers)](https://github.com/memory-lovers)
- [Blog(くらげになりたい。)](https://memory-lovers.blog/)  
- [Twitter/X(@kira_puka)](https://twitter.com/kira_puka)
