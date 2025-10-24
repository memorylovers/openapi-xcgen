/**
 * E2Eテスト: TypeScriptコード生成
 *
 * OpenAPI仕様書からTypeScriptコードを生成し、期待値ファイルと比較して検証します。
 * Coreパッケージのテストパターンを踏襲し、統一的なテスト構造を実現します。
 */

import { describe, it } from "vitest";
import { compareWithExpected } from "./test-helper";

describe("E2E: TypeScript Generator", () => {
  describe("General - Basic Code Generation", () => {
    it("should generate code from petstore spec", async () => {
      await compareWithExpected("general/petstore");
    });

    it("should generate code from petstore spec (with valibot)", async () => {
      await compareWithExpected("general/petstore", { validator: "valibot" });
    });

    it("should handle readOnly and writeOnly properties", async () => {
      await compareWithExpected("general/readonly-writeonly");
    });

    it("should handle readOnly and writeOnly properties (with valibot)", async () => {
      await compareWithExpected("general/readonly-writeonly", {
        validator: "valibot",
      });
    });

    it("should handle allOf composition", async () => {
      await compareWithExpected("general/allof");
    });

    it("should handle allOf composition (with valibot)", async () => {
      await compareWithExpected("general/allof", { validator: "valibot" });
    });

    it("should handle complex nested schemas", async () => {
      await compareWithExpected("general/complex-schema");
    });

    it("should handle complex nested schemas (with valibot)", async () => {
      await compareWithExpected("general/complex-schema", {
        validator: "valibot",
      });
    });
  });

  describe("Models - Type Generation", () => {
    it("should generate all data types correctly", async () => {
      await compareWithExpected("models/data-types");
    });

    it("should generate all data types correctly (with valibot)", async () => {
      await compareWithExpected("models/data-types", { validator: "valibot" });
    });

    it("should handle complex structures", async () => {
      await compareWithExpected("models/complex-structures");
    });

    it("should handle complex structures (with valibot)", async () => {
      await compareWithExpected("models/complex-structures", {
        validator: "valibot",
      });
    });

    it("should handle $ref references", async () => {
      await compareWithExpected("models/ref-model");
    });

    it("should handle $ref references (with valibot)", async () => {
      await compareWithExpected("models/ref-model", { validator: "valibot" });
    });

    it("should handle nullable properties", async () => {
      await compareWithExpected("models/nullable-model");
    });

    it("should handle nullable properties (with valibot)", async () => {
      await compareWithExpected("models/nullable-model", {
        validator: "valibot",
      });
    });

    it("should handle validation constraints", async () => {
      await compareWithExpected("models/validation-model");
    });

    it("should handle validation constraints (with valibot)", async () => {
      await compareWithExpected("models/validation-model", {
        validator: "valibot",
      });
    });

    it("should handle metadata attributes", async () => {
      await compareWithExpected("models/metadata-model");
    });

    it("should handle metadata attributes (with valibot)", async () => {
      await compareWithExpected("models/metadata-model", {
        validator: "valibot",
      });
    });

    it("should extract inline schemas correctly", async () => {
      await compareWithExpected("models/inline-schemas");
    });

    it("should extract inline schemas correctly (with valibot)", async () => {
      await compareWithExpected("models/inline-schemas", {
        validator: "valibot",
      });
    });
  });

  describe("General - Hey API", () => {
    it("should handle discriminator with oneOf", async () => {
      await compareWithExpected("general/hey-api/discriminator-one-of");
    });

    it("should handle discriminator with oneOf (with valibot)", async () => {
      await compareWithExpected("general/hey-api/discriminator-one-of", {
        validator: "valibot",
      });
    });

    it("should handle discriminator with allOf", async () => {
      await compareWithExpected("general/hey-api/discriminator-all-of");
    });

    it("should handle discriminator with allOf (with valibot)", async () => {
      await compareWithExpected("general/hey-api/discriminator-all-of", {
        validator: "valibot",
      });
    });

    it("should handle discriminator with anyOf", async () => {
      await compareWithExpected("general/hey-api/discriminator-any-of");
    });

    it("should handle discriminator with anyOf (with valibot)", async () => {
      await compareWithExpected("general/hey-api/discriminator-any-of", {
        validator: "valibot",
      });
    });
  });

  describe("Validation - Special Test Cases", () => {
    it("should generate code from validation spec", async () => {
      await compareWithExpected("validation");
    });

    it("should generate code from validation spec (with valibot)", async () => {
      await compareWithExpected("validation", { validator: "valibot" });
    });
  });
});
