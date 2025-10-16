/**
 * Train Travel API Usage Examples
 *
 * This file demonstrates advanced usage patterns for the generated TypeScript client,
 * including complex query parameters, nested types, and discriminated unions.
 *
 * Note: This example uses mock data and won't make real API calls.
 */

import { setConfig, type XcgenApiError } from "../generated/client.js";
import {
  getStations,
  getTrips,
  createBooking,
  getBookings,
  getBooking,
  payForBooking,
} from "../generated/services.js";
import type {
  Station,
  Trip,
  BookingRequest,
  Booking,
  CardPayment,
  BankTransferPayment,
} from "../generated/types.js";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configure the API client with base URL and authentication
 */
function configureClient() {
  console.log("📝 Configuring API client...\n");

  setConfig({
    baseUrl: "https://api.example.com",
    headers: {
      "Content-Type": "application/json",
      // OAuth2 authentication would go here
      // "Authorization": "Bearer your-oauth-token",
    },
  });
}

// ============================================================================
// Example 1: Search Stations by Coordinates
// ============================================================================

/**
 * Search for stations near a specific location
 * Demonstrates complex query parameters with pattern validation
 */
async function exampleSearchStationsByCoordinates() {
  console.log("🚉 Example 1: Search stations by coordinates");
  console.log("─".repeat(50));

  try {
    // Search for stations near London
    // Coordinates must match pattern: "lat,lon"
    const result = await getStations({
      query: {
        coordinates: "51.5074,-0.1278",
        limit: 5,
      },
    });

    console.log(`✅ Found ${result.data.length} stations near London:`);
    result.data.forEach((station: Station) => {
      console.log(`  • ${station.name} (${station.country_code})`);
      console.log(`    Address: ${station.address}`);
      if (station.coordinates) {
        console.log(
          `    Location: ${station.coordinates.latitude}, ${station.coordinates.longitude}`,
        );
      }
    });
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 2: Search Stations by Country
// ============================================================================

/**
 * Search for stations in a specific country
 * Demonstrates pattern validation for country codes (ISO 3166-1 alpha-2)
 */
async function exampleSearchStationsByCountry() {
  console.log("🚉 Example 2: Search stations by country");
  console.log("─".repeat(50));

  try {
    // Country code must match pattern: ^[A-Z]{2}$
    const result = await getStations({
      query: {
        country: "GB",
        search: "King",
        limit: 3,
      },
    });

    console.log(`✅ Found ${result.data.length} stations in GB matching "King":`);
    result.data.forEach((station: Station) => {
      console.log(`  • ${station.name}`);
    });

    // Pagination links
    if (result.links.next) {
      console.log(`\n  Next page: ${result.links.next}`);
    }
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 3: Find Available Trips
// ============================================================================

/**
 * Search for available trips between two stations
 * Demonstrates UUID format validation and multiple query parameters
 */
async function exampleFindTrips() {
  console.log("🚄 Example 3: Find available trips");
  console.log("─".repeat(50));

  try {
    const result = await getTrips({
      query: {
        // UUID format validation
        origin: "a8f7e8d0-1234-5678-9abc-def012345678",
        destination: "b9e8f9e1-2345-6789-abcd-ef0123456789",
        date: "2024-12-25", // ISO 8601 date format
        bicycles: true,
        dogs: false,
      },
    });

    console.log(`✅ Found ${result.data.length} trips:`);
    result.data.forEach((trip: Trip) => {
      console.log(`\n  Trip ${trip.id}:`);
      console.log(`    ${trip.origin.name} → ${trip.destination.name}`);
      console.log(`    Departure: ${trip.departure_time}`);
      console.log(`    Arrival: ${trip.arrival_time}`);
      console.log(`    Operator: ${trip.operator}`);
      console.log(
        `    Price: ${trip.price.amount} ${trip.price.currency}`,
      );
      console.log(`    Bicycles: ${trip.bicycles_allowed ? "✓" : "✗"}`);
      console.log(`    Dogs: ${trip.dogs_allowed ? "✓" : "✗"}`);
    });
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 4: Create a Booking
// ============================================================================

/**
 * Create a new booking for a trip
 * Demonstrates nested objects and array validation (1-10 passengers)
 */
async function exampleCreateBooking() {
  console.log("📋 Example 4: Create a booking");
  console.log("─".repeat(50));

  try {
    const bookingRequest: BookingRequest = {
      // writeOnly property - only used in requests
      trip_id: "c0f8a9b2-3456-7890-bcde-f01234567890",
      passengers: [
        {
          name: "Alice Johnson",
          email: "alice@example.com",
          date_of_birth: "1990-05-15",
          passport_number: "AB1234567",
        },
        {
          name: "Bob Smith",
          email: "bob@example.com",
          date_of_birth: "1985-08-22",
        },
      ],
      seat_preferences: "window", // Enum: window | aisle | table | quiet
    };

    const booking: Booking = await createBooking({
      body: bookingRequest,
    });

    console.log("✅ Booking created successfully!");
    console.log(`  Booking ID: ${booking.id}`); // readOnly property
    console.log(`  Status: ${booking.status}`); // readOnly: pending | confirmed | cancelled
    console.log(`  Payment Status: ${booking.payment_status}`); // readOnly
    console.log(
      `  Total Price: ${booking.total_price.amount} ${booking.total_price.currency}`,
    );
    console.log(`  Created: ${booking.created_at}`);
    console.log(`  Passengers: ${booking.passengers.length}`);
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 5: Pay with Card (Discriminated Union)
// ============================================================================

/**
 * Pay for a booking using a credit card
 * Demonstrates oneOf with discriminator (method: "card")
 */
async function examplePayWithCard(bookingId: string) {
  console.log("💳 Example 5: Pay with card");
  console.log("─".repeat(50));

  try {
    // CardPayment type with discriminator property "method"
    const cardPayment: CardPayment = {
      method: "card", // Discriminator - must be "card" for CardPayment
      card_number: "4111111111111111", // Pattern: 13-19 digits
      card_holder: "Alice Johnson",
      expiry_month: 12, // 1-12
      expiry_year: 2025, // >= 2024
      cvv: "123", // Pattern: 3-4 digits
    };

    const confirmation = await payForBooking({
      path: {
        bookingId,
      },
      body: cardPayment,
    });

    console.log("✅ Payment processed successfully!");
    console.log(`  Payment ID: ${confirmation.payment_id}`);
    console.log(`  Status: ${confirmation.status}`); // success | pending | failed
    console.log(
      `  Amount: ${confirmation.amount.amount} ${confirmation.amount.currency}`,
    );
    console.log(`  Timestamp: ${confirmation.timestamp}`);
    if (confirmation.receipt_url) {
      console.log(`  Receipt: ${confirmation.receipt_url}`);
    }
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 6: Pay with Bank Transfer (Discriminated Union)
// ============================================================================

/**
 * Pay for a booking using bank transfer
 * Demonstrates oneOf with discriminator (method: "bank_transfer")
 */
async function examplePayWithBankTransfer(bookingId: string) {
  console.log("🏦 Example 6: Pay with bank transfer");
  console.log("─".repeat(50));

  try {
    // BankTransferPayment type with discriminator property "method"
    const bankPayment: BankTransferPayment = {
      method: "bank_transfer", // Discriminator - must be "bank_transfer"
      account_number: "12345678",
      routing_number: "987654321",
      account_holder: "Alice Johnson",
    };

    const confirmation = await payForBooking({
      path: {
        bookingId,
      },
      body: bankPayment,
    });

    console.log("✅ Payment processed successfully!");
    console.log(`  Payment ID: ${confirmation.payment_id}`);
    console.log(`  Status: ${confirmation.status}`);
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 7: List User Bookings
// ============================================================================

/**
 * List all bookings for the authenticated user
 * Demonstrates pagination
 */
async function exampleListBookings() {
  console.log("📚 Example 7: List user bookings");
  console.log("─".repeat(50));

  try {
    const result = await getBookings();

    console.log(`✅ Found ${result.data.length} bookings:`);
    result.data.forEach((booking: Booking) => {
      console.log(`\n  Booking ${booking.id}:`);
      console.log(`    Trip: ${booking.trip.origin.name} → ${booking.trip.destination.name}`);
      console.log(`    Status: ${booking.status}`);
      console.log(`    Payment: ${booking.payment_status}`);
    });

    // Pagination links
    if (result.links) {
      console.log("\n  Pagination:");
      if (result.links.next) console.log(`    Next: ${result.links.next}`);
      if (result.links.prev) console.log(`    Previous: ${result.links.prev}`);
    }
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Example 8: Get Booking Details
// ============================================================================

/**
 * Get details of a specific booking
 * Demonstrates path parameter with UUID format
 */
async function exampleGetBookingDetails(bookingId: string) {
  console.log("🔍 Example 8: Get booking details");
  console.log("─".repeat(50));

  try {
    const booking = await getBooking({
      path: {
        bookingId, // Must be a valid UUID
      },
    });

    console.log("✅ Booking details:");
    console.log(`  ID: ${booking.id}`);
    console.log(`  Status: ${booking.status}`);
    console.log(`  Payment Status: ${booking.payment_status}`);
    console.log(`  Trip: ${booking.trip.origin.name} → ${booking.trip.destination.name}`);
    console.log(`  Departure: ${booking.trip.departure_time}`);
    console.log(`  Total: ${booking.total_price.amount} ${booking.total_price.currency}`);
    console.log(`  Passengers:`);
    booking.passengers.forEach((passenger, index) => {
      console.log(`    ${index + 1}. ${passenger.name} (${passenger.email})`);
    });
  } catch (error) {
    handleApiError(error);
  }

  console.log();
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle API errors with RFC 7807 Problem Details format
 */
function handleApiError(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as XcgenApiError;
    console.error("❌ API Error:");
    console.error("  Status:", apiError.status);
    console.error("  Status Text:", apiError.statusText);
    console.error("  URL:", apiError.url);

    // The API uses RFC 7807 Problem Details format
    if (apiError.body && typeof apiError.body === "object") {
      const problem = apiError.body as {
        type?: string;
        title?: string;
        status?: number;
        detail?: string;
        instance?: string;
      };

      if (problem.type) {
        console.error("\n  Problem Details:");
        console.error("    Type:", problem.type);
        console.error("    Title:", problem.title);
        console.error("    Status:", problem.status);
        if (problem.detail) {
          console.error("    Detail:", problem.detail);
        }
        if (problem.instance) {
          console.error("    Instance:", problem.instance);
        }
      }
    }
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
  console.log("  🚂 Train Travel API Examples 🎫");
  console.log("═".repeat(50));
  console.log("\n");

  // Configure the client
  configureClient();

  // Note: These examples will fail because there's no real API server running.
  // Uncomment the examples below when you have a real API to test against.

  /*
  await exampleSearchStationsByCoordinates();
  await exampleSearchStationsByCountry();
  await exampleFindTrips();
  await exampleCreateBooking();

  // Use a real booking ID from the createBooking response
  const bookingId = "d1e9f0c3-4567-8901-cdef-012345678901";
  await examplePayWithCard(bookingId);
  await examplePayWithBankTransfer(bookingId);
  await exampleListBookings();
  await exampleGetBookingDetails(bookingId);
  */

  console.log("💡 Tip: Uncomment the example calls in main() to run them");
  console.log("💡 Tip: Make sure to generate the client first:");
  console.log("   pnpm generate\n");
  console.log("💡 Advanced: Generate with Valibot validation:");
  console.log("   pnpm generate:valibot\n");
}

// Run the examples
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
