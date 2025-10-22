# Code Style and Conventions

## TypeScript Conventions

- **Module System**: ES modules (ESM) with .js extensions in imports
- **Type Safety**: Strict mode enabled
- **Type Definitions**: Explicit type annotations for all public APIs
- **Interfaces**: Use `interface` for object types, prefix with `I` for IR types (e.g., `IRModel`)

## Code Organization

- **Class-based OOP**: Services and major components as classes
- **Method Organization**: Public methods first, private methods last
- **File Naming**: kebab-case for files (e.g., `openapi-parser.ts`)
- **Export Style**: Named exports preferred, with index files for re-exports

## Documentation

- **JSDoc Comments**: Required for all public classes, methods, and interfaces
- **Format**: Include `@param`, `@returns`, `@throws` tags where applicable
- **Examples**: Provide usage examples in complex APIs

## Error Handling

- **Custom Error Classes**: Extend base error classes (e.g., `XcgenParserError`)
- **Error Helpers**: Use helper functions for consistent error creation
- **Async/Await**: Preferred over promise chains
- **Try-Catch**: Explicit error handling with meaningful error messages

## Code Formatting

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Line Length**: Managed by Prettier
- **Trailing Commas**: Yes (configured in Prettier)

## Naming Conventions

- **Classes**: PascalCase (e.g., `OpenAPIParser`)
- **Methods/Functions**: camelCase (e.g., `extractMetadata`)
- **Constants**: UPPER_SNAKE_CASE
- **Private Members**: Prefix with underscore or use `private` keyword
- **Type Parameters**: Single letter or descriptive PascalCase

## Testing Conventions

- **Test Files**: `*.test.ts` in `tests/` directory
- **Test Structure**: Use `describe` and `it` blocks
- **Test Data**: Keep fixtures in separate files
- **Coverage**: Aim for high coverage, especially for core functionality

## Git Conventions

- **Branch Naming**: `feat/`, `fix/`, `docs/`, `refactor/` prefixes
- **Commit Messages**: Follow conventional commits format
- **Main Branch**: `main`
- **Feature Branches**: Create from `main`, merge via PR
