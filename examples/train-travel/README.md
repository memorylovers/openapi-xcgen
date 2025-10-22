# Train Travel API Example

An advanced example demonstrating complex features of the TypeScript generator with a train booking API.

## Overview

This example shows how to:

- Work with complex nested object structures
- Handle multiple query parameters with validation
- Use oneOf discriminator for polymorphic types
- Implement request body validation with Valibot
- Manage pagination with links
- Handle various HTTP status codes
- Work with date and UUID formats

## API Endpoints

The Train Travel API provides several endpoints:

### Stations

- `GET /stations` - Search stations by coordinates, name, or country

### Trips

- `GET /trips` - Find available trips between stations with filters

### Bookings

- `POST /bookings` - Create a new booking
- `GET /bookings` - List user's bookings
- `GET /bookings/{bookingId}` - Get booking details
- `DELETE /bookings/{bookingId}` - Cancel a booking

### Payments

- `POST /bookings/{bookingId}/payment` - Pay for a booking (card or bank transfer)

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

Or with Valibot validation:

```bash
pnpm generate:valibot
```

This will generate four files in the `generated/` directory:

- `types.ts` - Complex type definitions
- `client.ts` - HTTP client and error handling
- `services.ts` - API service functions
- `schemas.ts` - Valibot validation schemas (if using --validator valibot)

### 3. Run the Example

```bash
pnpm start
```

## Usage Examples

### 1. Search Stations

```typescript
import { getStations } from "./generated/services.js";

// Search by coordinates (London)
const stations = await getStations({
  query: {
    coordinates: "51.5074,-0.1278",
    limit: 10,
  },
});

// Search by country code
const ukStations = await getStations({
  query: {
    country: "GB",
    search: "London",
  },
});
```

### 2. Find Trips

```typescript
import { getTrips } from "./generated/services.js";

const trips = await getTrips({
  query: {
    origin: "a8f7e8d0-1234-5678-9abc-def012345678",
    destination: "b9e8f9e1-2345-6789-abcd-ef0123456789",
    date: "2024-12-25",
    bicycles: true,
    dogs: false,
  },
});

console.log(`Found ${trips.data.length} trips`);
trips.data.forEach((trip) => {
  console.log(`${trip.origin.name} → ${trip.destination.name}`);
  console.log(`Departure: ${trip.departure_time}`);
  console.log(`Price: ${trip.price.amount} ${trip.price.currency}`);
});
```

### 3. Create a Booking

```typescript
import { createBooking } from "./generated/services.js";
import type { BookingRequest } from "./generated/types.js";

const bookingRequest: BookingRequest = {
  trip_id: "c0f8a9b2-3456-7890-bcde-f01234567890",
  passengers: [
    {
      name: "John Doe",
      email: "john@example.com",
      date_of_birth: "1990-01-15",
    },
  ],
  seat_preferences: "window",
};

const booking = await createBooking({
  body: bookingRequest,
});

console.log("Booking created:", booking.id);
console.log("Status:", booking.status);
console.log("Total price:", booking.total_price);
```

### 4. Pay for Booking (oneOf Discriminator)

```typescript
import { payForBooking } from "./generated/services.js";
import type { CardPayment, BankTransferPayment } from "./generated/types.js";

// Option 1: Card payment
const cardPayment: CardPayment = {
  method: "card", // Discriminator property
  card_number: "4111111111111111",
  card_holder: "John Doe",
  expiry_month: 12,
  expiry_year: 2025,
  cvv: "123",
};

const confirmation = await payForBooking({
  path: { bookingId: booking.id },
  body: cardPayment,
});

// Option 2: Bank transfer payment
const bankPayment: BankTransferPayment = {
  method: "bank_transfer", // Discriminator property
  account_number: "12345678",
  routing_number: "987654321",
  account_holder: "John Doe",
};

const confirmation2 = await payForBooking({
  path: { bookingId: booking.id },
  body: bankPayment,
});
```

### 5. Valibot Validation (Optional)

```typescript
import { parse } from "valibot";
import { StationSchema, TripSchema } from "./generated/schemas.js";

// Validate API response at runtime
const validatedStation = parse(StationSchema, responseData);

// Validate before sending request
const validatedBooking = parse(BookingRequestSchema, {
  trip_id: "...",
  passengers: [...],
});
```

## Key Features

### Nested Object Structures

The API uses complex nested structures:

```typescript
interface Trip {
  id: string;
  origin: Station; // Nested object
  destination: Station; // Nested object
  departure_time: string;
  arrival_time: string;
  operator: string;
  price: Price; // Nested object
  bicycles_allowed?: boolean;
  dogs_allowed?: boolean;
}
```

### Type-Safe Query Parameters

All query parameters are validated by TypeScript:

```typescript
// coordinates must match pattern: "lat,lon"
// country must match pattern: "XX" (ISO 3166-1 alpha-2)
// limit must be between 1 and 100
await getStations({
  query: {
    coordinates: "51.5074,-0.1278", // Valid
    country: "GB", // Valid
    limit: 50, // Valid
  },
});
```

### Discriminated Unions (oneOf)

Payment methods use discriminated unions:

```typescript
type Payment = CardPayment | BankTransferPayment;

// TypeScript narrows the type based on 'method'
if (payment.method === "card") {
  // payment is CardPayment
  console.log(payment.card_number);
} else {
  // payment is BankTransferPayment
  console.log(payment.account_number);
}
```

### Pagination Support

List endpoints return pagination links:

```typescript
interface PaginationLinks {
  self?: string;
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

const result = await getBookings();
console.log("Current page:", result.links.self);
console.log("Next page:", result.links.next);
```

### ReadOnly and WriteOnly Properties

Some properties are only for reading or writing:

```typescript
interface BookingRequest {
  trip_id: string; // writeOnly - only in requests
  passengers: Passenger[];
}

interface Booking {
  id: string; // readOnly - only in responses
  status: string; // readOnly
  // ... other properties
}
```

## Error Handling

The API uses RFC 7807 Problem Details format:

```typescript
import { XcgenApiError } from "./generated/client.js";

try {
  await createBooking({ body: invalidData });
} catch (error) {
  if (error instanceof XcgenApiError) {
    const problem = error.body as Problem;
    console.error("Problem type:", problem.type);
    console.error("Title:", problem.title);
    console.error("Status:", problem.status);
    console.error("Detail:", problem.detail);
  }
}
```

## OpenAPI Specification

The `openapi.yaml` file demonstrates:

- Complex query parameters with patterns and validation
- Nested object schemas
- oneOf with discriminator
- readOnly and writeOnly properties
- UUID and date-time formats
- Array min/max items
- Pattern validation (email, country codes, etc.)
- Enum types
- Reusable components (responses, schemas)

## Next Steps

- Explore the generated types in `generated/types.ts`
- Try different query parameter combinations
- Implement booking flow with payments
- Add Valibot validation for extra safety
- Modify the OpenAPI spec and regenerate
