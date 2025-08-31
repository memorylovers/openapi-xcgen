import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Models", () => {
  describe("Basic Types", () => {
    it("should transform all data types correctly", async () => {
      await compareWithExpected("models/data-types");
    });
  });

  describe("Complex Structures", () => {
    it("should transform complex structures correctly", async () => {
      await compareWithExpected("models/complex-structures");
    });

    it("should transform $ref references correctly", async () => {
      await compareWithExpected("models/ref-model");
    });
  });

  describe("Extended Properties", () => {
    it("should handle nullable properties", async () => {
      await compareWithExpected("models/nullable-model");
    });

    it("should handle validation constraints", async () => {
      await compareWithExpected("models/validation-model");
    });

    it("should handle metadata attributes", async () => {
      await compareWithExpected("models/metadata-model");
    });
  });
});
