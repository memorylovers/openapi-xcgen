# Petstore Example

A simple example demonstrating basic usage of the TypeScript generator with a pet store API.

## Overview

This example shows how to:

- Generate a type-safe TypeScript client from an OpenAPI specification
- Make basic CRUD API calls (List, Create, Get)
- Handle errors with `XcgenApiError`
- Configure the client with custom settings
- Work with path parameters and query parameters

## API Endpoints

The Petstore API provides three endpoints:

1. `GET /pets` - List all pets with optional limit parameter
2. `POST /pets` - Create a new pet
3. `GET /pets/{petId}` - Get a specific pet by ID

## Setup

### 1. Install Dependencies and Build

From the repository root:

```bash
pnpm install
pnpm build
```

This example is part of the pnpm workspace and uses `workspace:*` to reference the local generator package.

### 2. Generate Client Code

```bash
pnpm generate
```

This will generate four files in the `generated/` directory:

- `types.ts` - Type definitions (Pet, NewPet, Error)
- `client.ts` - HTTP client and error handling
- `services.ts` - API service functions
- `schemas.ts` - Valibot validation schemas

### 3. Run the Example

```bash
pnpm start
```

## Usage Examples

### Basic API Calls

```typescript
import { listPets, createPet, getPetById } from "./generated/services.js";
import { setConfig } from "./generated/client.js";

// Configure the client
setConfig({
  baseUrl: "https://api.petstore.com/v1",
});

// List all pets
const pets = await listPets();
console.log("All pets:", pets);

// List pets with limit
const limitedPets = await listPets({
  query: { limit: 10 },
});

// Create a new pet
const newPet = await createPet({
  body: {
    name: "Fluffy",
    tag: "cat",
  },
});
console.log("Created pet:", newPet);

// Get a specific pet
const pet = await getPetById({
  path: { petId: "123" },
});
console.log("Pet details:", pet);
```

### Error Handling

```typescript
import { XcgenApiError } from "./generated/client.js";

try {
  const pet = await getPetById({
    path: { petId: "nonexistent" },
  });
} catch (error) {
  if (error instanceof XcgenApiError) {
    console.error(`HTTP ${error.status}: ${error.statusText}`);
    console.error("Response:", error.body);
    console.error("URL:", error.url);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Client Configuration

```typescript
import { setConfig } from "./generated/client.js";

// Set base URL and headers
setConfig({
  baseUrl: "https://api.petstore.com/v1",
  headers: {
    "X-API-Key": "your-api-key",
    "Accept-Language": "en-US",
  },
});

// Use custom fetch (e.g., for interceptors)
setConfig({
  fetch: async (url, init) => {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, init);
    console.log(`Response status: ${response.status}`);
    return response;
  },
});
```

### Type Safety

All requests and responses are fully type-safe:

```typescript
import type { Pet, NewPet } from "./generated/types.js";

// TypeScript knows the exact shape of the request
const newPetData: NewPet = {
  name: "Buddy", // Required
  tag: "dog", // Optional
  // TypeScript will error if you add unknown fields
};

// TypeScript knows the exact shape of the response
const pet: Pet = await createPet({ body: newPetData });
console.log(pet.id); // number
console.log(pet.name); // string
console.log(pet.tag); // string | undefined
```

## Generated Types

### Pet

```typescript
interface Pet {
  id: number;
  name: string;
  tag?: string | undefined;
}
```

### NewPet

```typescript
interface NewPet {
  name: string;
  tag?: string | undefined;
}
```

### Error

```typescript
interface Error {
  code: number;
  message: string;
}
```

## OpenAPI Specification

The `openapi.yaml` file defines:

- API metadata (title, version, servers)
- Three endpoints with parameters and responses
- Three schemas (Pet, NewPet, Error)
- Validation rules (minimum, maximum, required fields)

You can modify the OpenAPI specification and regenerate the client to see how changes affect the generated code.

## Next Steps

- Modify the OpenAPI spec and regenerate
- Add custom headers or authentication
- Implement request/response interceptors
- Try the Train Travel example for more advanced features
