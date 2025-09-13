import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Services", () => {
  describe("Single Tag Classification", () => {
    it("should group endpoints with single tags into corresponding services", async () => {
      await compareWithExpected("services/single-tag");
    });
  });

  describe("Multiple Tags Classification", () => {
    it("should handle endpoints with multiple tags and classify them appropriately", async () => {
      await compareWithExpected("services/multi-tags");
    });
  });

  describe("No Tags Classification", () => {
    it("should group endpoints without tags into default service", async () => {
      await compareWithExpected("services/no-tags");
    });
  });
});
