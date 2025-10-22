# Technology Stack

## Core Technologies

- **Language**: TypeScript (ES modules)
- **Runtime**: Node.js (>= 20)
- **Package Manager**: pnpm (10.13.1)
- **Build Tool**: unbuild (for building packages)
- **Task Runner**: Turborepo (for monorepo management)

## Development Tools

- **Testing**: Vitest (with coverage)
- **Linting**: ESLint 9 with TypeScript support
- **Formatting**: Prettier
- **Markdown Linting**: markdownlint-cli2
- **Type Checking**: TypeScript strict mode

## Core Dependencies

- **OpenAPI Parsing**: @apidevtools/swagger-parser
- **CLI Framework**: citty
- **Logging**: consola
- **Path Utilities**: pathe
- **Configuration**: defu
- **JSON Schema Types**: @types/json-schema

## Generator-Specific Dependencies

### TypeScript Generator

- Runtime validation: Valibot (planned)
- Fetch API for HTTP client

### Dart Generator

- Serialization: json_serializable/freezed (planned)
- HTTP clients: http/dio (planned)

## Configuration Files

- TypeScript: tsconfig.base.json (strict mode, ESNext target)
- ESLint: eslint.config.base.mjs (TypeScript + Prettier)
- Vitest: vitest.config.mts
- Turbo: turbo.json (task orchestration)
- Editor: .editorconfig, .prettierrc
