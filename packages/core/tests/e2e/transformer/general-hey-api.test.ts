import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Hey API", () => {
  // This test partially works (generates some models but skips oneOf/allOf properties)
  it("should transform hey-api transformers allOf", async () => {
    await compareWithExpected("general/hey-api/transformers-all-of");
  });

  // TODO: Task 6.6 - Enable these tests after implementing Hey API discriminator support
  // Currently fails due to allOf + parent discriminator reference pattern
  // See: _docs/_tasks/010_generator_typescript_implementation.md#タスク66-hey-api-discriminator対応
  it.skip("should transform hey-api discriminator oneOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-one-of");
  });

  it.skip("should transform hey-api discriminator allOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-all-of");
  });

  it.skip("should transform hey-api discriminator anyOf", async () => {
    await compareWithExpected("general/hey-api/discriminator-any-of");
  });
});
