/**
 * IRModelからValibotスキーマ定義への変換
 *
 * 各IRModel型に応じたValibotスキーマ定義を生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { generateAllOfSchema } from "./schemas-allof.js";
import { generateAnyOfSchema } from "./schemas-anyof.js";
import { generateArraySchema } from "./schemas-array.js";
import { generateEnumSchema } from "./schemas-enum.js";
import { generateObjectSchema, type PropertySchema } from "./schemas-object.js";
import { irTypeToValibotSchema } from "./schemas-type-mapper.js";
import { irTypeToValibotSchemaRef } from "./schemas-type-ref.js";
import { generateUnionSchema } from "./schemas-union.js";

/**
 * IRModelをValibotスキーマ定義に変換
 * @param model - IRモデル
 * @returns Valibotスキーマ定義コード
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "object",
 *   name: "Pet",
 *   referencePath: "#/components/schemas/Pet",
 *   properties: [
 *     { name: "id", type: "int", required: true },
 *     { name: "name", type: "string", required: true },
 *   ],
 * };
 *
 * const result = generateSchemaModel(model);
 * // =>
 * // /**
 * //  * Schema for Pet
 * //  *\/
 * // export const PetSchema = v.object({
 * //   id: v.number(),
 * //   name: v.string(),
 * // });
 * ```
 */
export function generateSchemaModel(model: IRModel): string | null {
  // スキーマ名: {ModelName}Schema
  const schemaName = `${toTypeName(model.name)}Schema`;

  // JSDocコメント
  const jsdoc: string[] = [];
  jsdoc.push("/**");
  jsdoc.push(` * Schema for ${toTypeName(model.name)}`);
  if (model.description) {
    jsdoc.push(` * ${model.description}`);
  }
  jsdoc.push(" */");

  let schemaExpression: string | null = null;

  switch (model.kind) {
    case "object":
    case "requestBody":
    case "response": {
      // IRObjectModel → PropertySchema[] → v.object()
      const propertySchemas: PropertySchema[] = model.properties.map(
        (prop) => ({
          name: prop.name,
          schema: irTypeToValibotSchema(prop.type, prop.validation),
          optional: !prop.required,
          nullable: !!prop.nullable,
          readOnly: prop.readOnly,
        }),
      );
      schemaExpression = generateObjectSchema(propertySchemas);
      break;
    }

    case "enum": {
      schemaExpression = generateEnumSchema(model);
      break;
    }

    case "array": {
      const itemSchema = irTypeToValibotSchema(model.itemType);
      // IRArrayModelにはvalidationプロパティがないため、undefinedを渡す
      schemaExpression = generateArraySchema(itemSchema, undefined);
      break;
    }

    case "map": {
      // Record<string, T> → v.record(v.string(), valueSchema)
      const valueSchema = irTypeToValibotSchema(model.valueType);
      schemaExpression = `v.record(v.string(), ${valueSchema})`;
      break;
    }

    case "allOf": {
      const schemaRefs = model.schemas.map((schema) =>
        irTypeToValibotSchemaRef(schema),
      );
      schemaExpression = generateAllOfSchema(schemaRefs);
      break;
    }

    case "anyOf": {
      const schemaRefs = model.schemas.map((schema) =>
        irTypeToValibotSchemaRef(schema),
      );
      schemaExpression = generateAnyOfSchema(schemaRefs);
      break;
    }

    case "union": {
      // discriminatorがある場合のみvariantを使用
      if (model.discriminator) {
        const options = model.types
          .filter((type) => typeof type !== "string" && type.kind === "ref")
          .map((type) => {
            if (typeof type !== "string" && type.kind === "ref") {
              // Core packageはreference path全体を保存: "#/components/schemas/Cat"
              // 最後のセグメントを抽出: "Cat"
              const modelName = type.name.split("/").at(-1) ?? type.name;
              return {
                key: modelName, // discriminatorValueとしてtype名を使用
                schemaRef: `${toTypeName(modelName)}Schema`,
              };
            }
            return null;
          })
          .filter(
            (opt): opt is { key: string; schemaRef: string } => opt !== null,
          );

        schemaExpression = generateUnionSchema(
          model.discriminator.propertyName,
          options,
        );
      } else {
        // discriminatorがない場合は通常のunion
        const schemaRefs = model.types.map((type) =>
          irTypeToValibotSchemaRef(type),
        );
        schemaExpression = generateAnyOfSchema(schemaRefs);
      }
      break;
    }

    case "parameter": {
      // ParameterはAPI関数用なので、スキーマ生成は不要
      return null;
    }

    default: {
      // Exhaustive check
      const _: never = model;
      void _;
      return null;
    }
  }

  if (!schemaExpression) {
    return null;
  }

  // 完全なスキーマ定義を生成
  return `${jsdoc.join("\n")}\nexport const ${schemaName} = ${schemaExpression};`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-model", () => {
    describe("generateSchemaModel", () => {
      it("should generate object schema", () => {
        const model: IRModel = {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [
            {
              name: "email",
              type: "string",
              required: true,
            },
          ],
        };

        const result = generateSchemaModel(model);

        expect(result).toEqual(
          `
/**
 * Schema for User
 */
export const UserSchema = v.object({
  email: v.string(),
});
`.trim(),
        );
      });

      it("should generate enum schema", () => {
        const model: IRModel = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [
            { value: "active", name: "ACTIVE" },
            { value: "inactive", name: "INACTIVE" },
          ],
        };

        const result = generateSchemaModel(model);

        expect(result).toEqual(
          `
/**
 * Schema for Status
 */
export const StatusSchema = v.picklist(["active", "inactive"]);
`.trim(),
        );
      });

      it("should return null for parameter model", () => {
        const model: IRModel = {
          kind: "parameter",
          name: "GetPetData",
          referencePath: "#/paths/~1pets~1{petId}/get/parameters",
          properties: [
            {
              name: "petId",
              in: "path",
              type: "string",
              required: true,
            },
          ],
        };

        const result = generateSchemaModel(model);

        expect(result).toBeNull();
      });
    });
  });
}
