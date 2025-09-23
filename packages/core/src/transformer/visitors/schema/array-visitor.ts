import { consola } from "consola";
import type {
  IRArrayModel,
  ReferenceObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import { visitSchema } from "./schema-visitor";
import type { SchemaTransformationResult } from "../../types";

type ArraySchemaInput = SchemaObjectWithNullable & {
  items?: SchemaObjectWithNullable | ReferenceObject;
};

/**
 * 配列スキーマをIRArrayModelに変換し、参照可能な型として返却する。
 *
 * 子要素の命名は `{配列名}Item` を付与して `visitSchema` に委譲し、
 * 配列モデル本体とネストしたモデルの識別を容易にしている。
 */
export function visitArray(
  schema: ArraySchemaInput,
  context: VisitorContext,
): SchemaTransformationResult {
  const result: SchemaTransformationResult = {
    type: null,
    models: [],
  };

  if (!schema.items) {
    consola.warn(
      `Array schema without items: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  const referencePath = buildReferencePath(context.documentPath);
  const name = context.documentPath.at(-1) ?? "";

  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return result;
  }
  const itemContext: VisitorContext = {
    documentPath: [...context.documentPath.slice(0, -1), `${name}Item`],
    rootSegment: context.rootSegment,
  };

  // 配列要素を再帰的にvisitし、必要に応じて追加モデルを収集する。
  const itemResult = visitSchema(
    schema.items as SchemaObjectWithNullable,
    itemContext,
  );

  if (!itemResult.type) {
    consola.warn(`Failed to resolve array item type: ${referencePath}`);
    return result;
  }

  const arrayModel: IRArrayModel = {
    kind: "array",
    name,
    referencePath,
    itemType: itemResult.type,
    ...(schema.description && { description: schema.description }),
  };

  result.models.push(arrayModel, ...itemResult.models);
  result.type = {
    kind: "ref",
    name: referencePath,
  };

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitArray", () => {
    it("should create array model and reference", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Items"],
        rootSegment: "components",
      };

      const result = visitArray(
        {
          type: "array",
          items: { type: "string" },
        },
        context,
      );

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Items" },
        models: [
          {
            kind: "array",
            name: "Items",
            referencePath: "#/components/schemas/Items",
            itemType: "string",
          },
        ],
      });
    });

    it("should reuse nested models from item schema", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "BlogPosts"],
        rootSegment: "components",
      };

      const result = visitArray(
        {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
            },
          },
        },
        context,
      );

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/BlogPosts" },
        models: [
          {
            kind: "array",
            name: "BlogPosts",
            referencePath: "#/components/schemas/BlogPosts",
            itemType: {
              kind: "ref",
              name: "#/components/schemas/BlogPostsItem",
            },
          },
          {
            kind: "object",
            name: "BlogPostsItem",
            referencePath: "#/components/schemas/BlogPostsItem",
            properties: [
              {
                name: "title",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should warn when items are missing", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Missing"],
        rootSegment: "components",
      };

      const schemaWithoutItems = {
        type: "array",
      } as unknown as ArraySchemaInput;
      const result = visitArray(schemaWithoutItems, context);

      expect(result).toEqual({
        type: null,
        models: [],
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
}
