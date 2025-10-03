import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - General", () => {
  describe("Basic API", () => {
    it("should transform petstore API correctly", async () => {
      await compareWithExpected("general/petstore");
    });
  });

  describe("Complex Schemas", () => {
    it("should transform complex nested schemas correctly", async () => {
      await compareWithExpected("general/complex-schema");
    });
  });

  describe("Multi-Service API", () => {
    it("should transform multi-service API with tags correctly", async () => {
      await compareWithExpected("general/multi-service");
    });
  });

  describe("Servers Configuration", () => {
    it("should transform servers with variables correctly", async () => {
      await compareWithExpected("general/servers");
    });
  });

  describe("Modern OpenAPI 3.1 Examples", () => {
    it("should transform Train Travel API correctly", async () => {
      await compareWithExpected("general/train-travel-api");
    });

    it("should transform Museum API correctly", async () => {
      await compareWithExpected("general/museum-api");
    });
  });
});
