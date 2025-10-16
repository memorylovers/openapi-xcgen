# Examples

This directory contains example projects demonstrating how to use `@openapi-xcgen/generator-typescript` to generate type-safe TypeScript clients from OpenAPI specifications.

## Available Examples

### 1. Petstore (Simple Example)

**Directory**: `petstore/`

A simple pet store API demonstrating basic CRUD operations:

- List all pets with pagination
- Create a new pet
- Get a specific pet by ID

**Best for learning**:

- Basic API calls
- Type-safe request/response handling
- Error handling with `XcgenApiError`
- Client configuration

### 2. Train Travel API (Advanced Example)

**Directory**: `train-travel/`

A comprehensive train booking API demonstrating advanced features:

- Station search with complex query parameters
- Trip searching with multiple filters
- Booking creation and management
- Payment processing with oneOf discriminator
- Nested object structures
- Valibot schema validation

**Best for learning**:

- Complex parameter handling
- Nested type definitions
- Request body validation
- Advanced error handling
- Real-world API patterns

## Quick Start

### Prerequisites

From the repository root:

```bash
# Install all dependencies (including examples)
pnpm install

# Build the generator
pnpm build
```

Examples are included in the pnpm workspace and use `workspace:*` to reference the local generator package.

### Generate Client Code

Each example has its OpenAPI specification. Generate the TypeScript client:

```bash
# Generate Petstore client
cd examples/petstore
pnpm generate

# Generate Train Travel client
cd examples/train-travel
pnpm generate
```

### Run Examples

```bash
# Run Petstore example (requires uncommenting code in src/index.ts)
cd examples/petstore
pnpm start

# Run Train Travel example (requires uncommenting code in src/index.ts)
cd examples/train-travel
pnpm start
```

**Note**: The example code in `src/index.ts` is commented out by default since there's no real API server. Uncomment the function calls in `main()` when you have an API to test against.

## Generated Files

After running the generator, each example will have a `generated/` directory containing:

- `types.ts` - TypeScript type definitions
- `client.ts` - HTTP client utilities and error handling
- `services.ts` - API service functions
- `schemas.ts` - Valibot validation schemas (optional)

## Example Structure

```
examples/
├── README.md              # This file
├── petstore/
│   ├── README.md         # Petstore-specific guide
│   ├── openapi.yaml      # OpenAPI specification
│   ├── generated/        # Generated client code (gitignored)
│   ├── src/
│   │   └── index.ts     # Usage examples
│   ├── package.json
│   └── tsconfig.json
└── train-travel/
    ├── README.md         # Train Travel-specific guide
    ├── openapi.yaml      # OpenAPI specification
    ├── generated/        # Generated client code (gitignored)
    ├── src/
    │   └── index.ts     # Usage examples
    ├── package.json
    └── tsconfig.json
```

## Key Features Demonstrated

### Type Safety

All API calls are fully type-safe with TypeScript:

```typescript
import { listPets, type Pet } from "./generated/services.js";

// Response is typed as Pet[]
const pets: Pet[] = await listPets();
```

### Error Handling

Comprehensive error handling with detailed response information:

```typescript
import { XcgenApiError } from "./generated/client.js";

try {
  const pet = await getPetById({ path: { petId: "123" } });
} catch (error) {
  if (error instanceof XcgenApiError) {
    console.error(`API Error: ${error.status} ${error.statusText}`);
    console.error(`Response body:`, error.body);
  }
}
```

### Client Configuration

Configure base URL, headers, and custom fetch:

```typescript
import { setConfig } from "./generated/client.js";

setConfig({
  baseUrl: "https://api.example.com",
  headers: {
    Authorization: "Bearer your-token",
  },
});
```

### Schema Validation (Optional)

Use Valibot schemas for runtime validation:

```typescript
import { parse } from "valibot";
import { PetSchema } from "./generated/schemas.js";

// Validate response data at runtime
const validatedPet = parse(PetSchema, responseData);
```

## Next Steps

1. Explore the individual example directories
2. Read the example-specific README files
3. Examine the generated code structure
4. Modify the OpenAPI specs and regenerate
5. Try building your own API client

## Resources

- [OpenAPI Specification](https://spec.openapis.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Valibot Documentation](https://valibot.dev/)

## Contributing

If you have ideas for additional examples or improvements, please open an issue or pull request!
