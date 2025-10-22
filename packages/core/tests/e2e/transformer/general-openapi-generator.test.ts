import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: Transformer - OpenAPI Generator", () => {
  it("should transform openapi-generator petstore", async () => {
    await compareWithExpected("general/openapi-generator/petstore");
  });

  it("should transform openapi-generator allOf composition", async () => {
    await compareWithExpected("general/openapi-generator/allof-composition");
  });

  it("should transform openapi-generator anyOf", async () => {
    await compareWithExpected("general/openapi-generator/anyof");
  });

  it("should transform openapi-generator oneOf", async () => {
    await compareWithExpected("general/openapi-generator/oneof");
  });

  it("should transform openapi-generator webhooks", async () => {
    await compareWithExpected("general/openapi-generator/webhooks");
  });

  it("should transform openapi-generator null types", async () => {
    await compareWithExpected("general/openapi-generator/null-types");
  });
});
