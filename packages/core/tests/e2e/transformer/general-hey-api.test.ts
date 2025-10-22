import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Hey API", () => {
  // This test partially works (generates some models but skips oneOf/allOf properties)
  it("should transform hey-api transformers allOf", async () => {
    await compareWithExpected("general/hey-api/transformers-all-of");
  });

  it("should transform hey-api discriminator oneOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-one-of");
  });

  it("should transform hey-api discriminator allOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-all-of");
  });

  it("should transform hey-api discriminator anyOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-any-of");
  });
});
