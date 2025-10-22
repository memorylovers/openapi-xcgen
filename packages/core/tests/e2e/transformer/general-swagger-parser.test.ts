import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - Swagger Parser", () => {
  it("should transform swagger-parser anyOf", async () => {
    await compareWithExpected("general/swagger-parser/anyof");
  });

  it("should transform swagger-parser anyOf with discriminator", async () => {
    await compareWithExpected("general/swagger-parser/anyof-discriminator");
  });

  it("should transform swagger-parser webhooks", async () => {
    await compareWithExpected("general/swagger-parser/webhooks");
  });
});
