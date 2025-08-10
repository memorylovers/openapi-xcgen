import { describe, expect, test } from "vitest";
import { parse } from "../../src/parser";
import { transform } from "../../src/transformer";

describe("transform", () => {
  test("should transform OpenAPI document with complete structure", async () => {
    const doc = await parse("./tests/fixtures/petstore.yaml");
    const result = transform(doc);

    // 構造の確認
    expect(result).toBeDefined();

    // メタデータ
    expect(result.metadata).toBeDefined();
    expect(result.metadata.title).toBe("Petstore API");
    expect(result.metadata.version).toBe("1.0.0");
    expect(result.metadata.description).toBe("A simple petstore API");
    expect(result.metadata.openApiVersion).toBe("3.1.0");

    // Contact情報
    expect(result.metadata.contact).toBeDefined();
    expect(result.metadata.contact?.name).toBe("API Support");
    expect(result.metadata.contact?.email).toBe("support@example.com");

    // License情報
    expect(result.metadata.license).toBeDefined();
    expect(result.metadata.license?.name).toBe("MIT");
    expect(result.metadata.license?.url).toBe(
      "https://opensource.org/licenses/MIT",
    );

    // モデルの抽出確認
    expect(result.models).toHaveLength(3);

    // Pet model
    expect(result.models[0]).toEqual({
      name: "Pet",
      description: undefined,
      properties: [
        {
          name: "id",
          type: { kind: "primitive", type: "integer", format: "int64" },
          required: true,
          description: undefined,
        },
        {
          name: "name",
          type: { kind: "primitive", type: "string", format: undefined },
          required: true,
          description: undefined,
        },
        {
          name: "tag",
          type: { kind: "primitive", type: "string", format: undefined },
          required: false,
          description: undefined,
        },
      ],
    });

    // NewPet model
    expect(result.models[1]).toEqual({
      name: "NewPet",
      description: undefined,
      properties: [
        {
          name: "name",
          type: { kind: "primitive", type: "string", format: undefined },
          required: true,
          description: undefined,
        },
        {
          name: "tag",
          type: { kind: "primitive", type: "string", format: undefined },
          required: false,
          description: undefined,
        },
      ],
    });

    // Error model
    expect(result.models[2]).toEqual({
      name: "Error",
      description: undefined,
      properties: [
        {
          name: "code",
          type: { kind: "primitive", type: "integer", format: "int32" },
          required: true,
          description: undefined,
        },
        {
          name: "message",
          type: { kind: "primitive", type: "string", format: undefined },
          required: true,
          description: undefined,
        },
      ],
    });
    expect(result.enums).toEqual([]);
    expect(result.unions).toEqual([]);
    expect(result.services).toEqual([]);
    expect(result.servers).toEqual([]);
  });
});
