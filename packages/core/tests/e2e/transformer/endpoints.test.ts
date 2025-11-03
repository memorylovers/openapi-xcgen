import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Endpoints", () => {
  describe("Operation ID Optional Field", () => {
    it("should handle operationId as optional field per OpenAPI specification", async () => {
      await compareWithExpected("endpoints/operation-id");
    });
  });

  describe("Path Structure Processing", () => {
    it("should parse and normalize path structures correctly", async () => {
      await compareWithExpected("endpoints/path-structure");
    });
  });

  describe("Endpoint Metadata Preservation", () => {
    it("should preserve summary and description metadata from endpoints", async () => {
      await compareWithExpected("endpoints/endpoint-metadata");
    });
  });

  describe("Parameter Override", () => {
    it("should override PathItem-level parameters with Operation-level parameters", async () => {
      await compareWithExpected("endpoints/parameter-override");
    });
  });
});
