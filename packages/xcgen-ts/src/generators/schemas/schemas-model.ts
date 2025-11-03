/**
 * IRComponentからValibotスキーマ定義への変換
 *
 * 各IRComponent型に応じたValibotスキーマ定義を生成する
 */

import type { IRExtensions, IRComponent } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import { generateAllOfSchema } from "./schemas-allof";
import { generateAnyOfSchema } from "./schemas-anyof";
import { generateArraySchema } from "./schemas-array";
import { generateEnumSchema } from "./schemas-enum";
import { generateObjectSchema, type PropertySchema } from "./schemas-object";
import { irTypeToValibotSchema } from "./schemas-type-mapper";
import { irTypeToValibotSchemaRef } from "./schemas-type-ref";
import { generateUnionSchema } from "./schemas-union";
import type { HookableInstance } from "../../hooks";

/**
 * IRComponentをValibotスキーマ定義に変換
 * @param model - IRモデル
 * @param hooks - Hook instance（オプション）
 * @returns Valibotスキーマ定義コード
 *
 * @example
 * ```typescript
 * const model: IRComponent = {
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
export function generateSchemaModel(
  model: IRComponent,
  hooks?: HookableInstance,
): string | null {
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
      // IRObjectSchema → PropertySchema[] → v.object()
      const propertySchemas: PropertySchema[] = model.properties.map(
        (prop) => ({
          name: prop.name,
          schema: irTypeToValibotSchema(
            prop.type,
            prop.validation,
            hooks,
            prop.extensions,
          ),
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
      const modelExtensions = (
        "extensions" in model ? model.extensions : undefined
      ) as IRExtensions | undefined;
      const itemSchema = irTypeToValibotSchema(
        model.itemType,
        undefined,
        hooks,
        modelExtensions,
      );
      // IRArraySchemaにはvalidationプロパティがないため、undefinedを渡す
      schemaExpression = generateArraySchema(
        itemSchema,
        undefined,
        hooks,
        modelExtensions,
      );
      break;
    }

    case "map": {
      const modelExtensions = (
        "extensions" in model ? model.extensions : undefined
      ) as IRExtensions | undefined;
      // Record<string, T> → v.record(v.string(), valueSchema)
      const valueSchema = irTypeToValibotSchema(
        model.valueType,
        undefined,
        hooks,
        modelExtensions,
      );
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
        const discriminator = model.discriminator;
        const options = model.types
          .filter((type) => typeof type !== "string" && type.kind === "ref")
          .map((type) => {
            if (typeof type !== "string" && type.kind === "ref") {
              // Core packageはreference path全体を保存: "#/components/schemas/Cat"
              // 最後のセグメントを抽出: "Cat"
              const modelName = type.name.split("/").at(-1) ?? type.name;

              // Phase 2で自動生成されたmappingから正しいdiscriminator値を取得
              let discriminatorValue = modelName;
              if (discriminator.mapping) {
                // mappingの中からtype.nameに一致するエントリを探す
                for (const [key, refPath] of Object.entries(
                  discriminator.mapping,
                )) {
                  if (refPath === type.name) {
                    discriminatorValue = key;
                    break;
                  }
                }
              }

              return {
                key: discriminatorValue, // 実際のdiscriminator値を使用
                schemaRef: `${toTypeName(modelName)}Schema`,
              };
            }
            return null;
          })
          .filter(
            (opt): opt is { key: string; schemaRef: string } => opt !== null,
          );

        schemaExpression = generateUnionSchema(
          discriminator.propertyName,
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
        const model: IRComponent = {
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
        const model: IRComponent = {
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
        const model: IRComponent = {
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
