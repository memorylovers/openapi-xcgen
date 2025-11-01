import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Metadata Preservation", () => {
  it("should preserve all metadata in request/response/parameters (validation, extensions, readOnly, etc.)", async () => {
    await compareWithExpected("metadata/validation-metadata");
  });
});
