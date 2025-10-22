/**
 * Petstore API Usage Examples
 *
 * This file demonstrates basic usage patterns for the generated TypeScript client.
 * Note: This example uses mock data and won't make real API calls.
 */

import { setConfig, type XcgenApiError } from "../generated/client.js";
import { listPets, createPet, getPetById } from "../generated/services.js";
import type { Pet, NewPet } from "../generated/types.js";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure the API client with base URL and default headers
 */
function configureClient() {
  console.log("📝 Configuring API client...\n");

  setConfig({
    baseUrl: "https://api.petstore.com/v1",
    headers: {
      "Content-Type": "application/json",
      // Add authentication headers if needed
      // "Authorization": "Bearer your-token-here",
    },
  });
}

// ============================================================================
// Example 1: List All Pets
// ============================================================================

/**
 * List all pets without any filters
 */

async function exampleListAllPets() {
  console.log("🐾 Example 1: List all pets");
  console.log("─".repeat(50));

  try {
    const pets = await listPets({ query: {} });
    console.log(`✅ Found ${pets.length} pets`);
    console.log("Response type:", typeof pets); // "object" (array)
    console.log("Sample:", pets[0]);
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 2: List Pets with Limit
// ============================================================================

/**
 * List pets with a limit parameter
 * Demonstrates query parameter usage
 */

async function exampleListPetsWithLimit() {
  console.log("🐾 Example 2: List pets with limit");
  console.log("─".repeat(50));

  try {
    // TypeScript ensures query parameters match the API spec
    const pets = await listPets({
      query: {
        limit: 5, // Must be between 1 and 100 (defined in OpenAPI spec)
      },
    });

    console.log(`✅ Retrieved ${pets.length} pets (max 5)`);
    pets.forEach((pet, index) => {
      console.log(`  ${index + 1}. ${pet.name} (ID: ${pet.id})`);
    });
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 3: Create a New Pet
// ============================================================================

/**
 * Create a new pet
 * Demonstrates request body and type safety
 */

async function exampleCreatePet() {
  console.log("🐾 Example 3: Create a new pet");
  console.log("─".repeat(50));

  // TypeScript enforces the NewPet type
  const newPetData: NewPet = {
    name: "Fluffy",
    tag: "cat",
  };

  try {
    const createdPet: Pet = await createPet(newPetData);

    console.log("✅ Pet created successfully!");
    console.log("  ID:", createdPet.id);
    console.log("  Name:", createdPet.name);
    console.log("  Tag:", createdPet.tag ?? "(no tag)");
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 4: Get Pet by ID
// ============================================================================

/**
 * Get a specific pet by ID
 * Demonstrates path parameter usage
 */

async function exampleGetPetById() {
  console.log("🐾 Example 4: Get pet by ID");
  console.log("─".repeat(50));

  try {
    // TypeScript ensures path parameters match the API spec
    const pet = await getPetById({
      path: {
        petId: "1",
      },
    });

    console.log("✅ Pet found:");
    console.log("  ID:", pet.id);
    console.log("  Name:", pet.name);
    console.log("  Tag:", pet.tag ?? "(no tag)");
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 5: Error Handling
// ============================================================================

/**
 * Demonstrate error handling for non-existent pet
 */

async function exampleErrorHandling() {
  console.log("🐾 Example 5: Error handling");
  console.log("─".repeat(50));

  try {
    // Try to get a pet that doesn't exist
    await getPetById({
      path: {
        petId: "nonexistent",
      },
    });
  } catch (error) {
    console.log("✅ Error caught and handled properly");
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle API errors with detailed information
 */
function handleApiError(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as XcgenApiError;
    console.error("❌ API Error:");
    console.error("  Status:", apiError.status);
    console.error("  Status Text:", apiError.statusText);
    console.error("  URL:", apiError.url);
    console.error("  Body:", apiError.body);
  } else {
    console.error("❌ Unexpected error:", error);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Run all examples
 */
async function main() {
  console.log("\n");
  console.log("═".repeat(50));
  console.log("  🐕 Petstore API Examples 🐈");
  console.log("═".repeat(50));
  console.log("\n");

  // Configure the client
  configureClient();

  // Note: These examples will fail because there's no real API server running.
  // They are here to demonstrate the usage patterns and verify type safety.

  await exampleListAllPets();
  await exampleListPetsWithLimit();
  await exampleCreatePet();
  await exampleGetPetById();
  await exampleErrorHandling();
}

// Run the examples
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
