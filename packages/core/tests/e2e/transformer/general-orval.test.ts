import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Orval", () => {
  it("should transform orval petstore basic", async () => {
    await compareWithExpected("general/orval/petstore-basic");
  });

  it("should transform orval petstore react", async () => {
    await compareWithExpected("general/orval/petstore-react");
  });
});
