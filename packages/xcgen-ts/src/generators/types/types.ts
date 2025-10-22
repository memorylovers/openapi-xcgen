/**
 * TypeScript型定義生成器
 *
 * IRModelからTypeScriptの型定義（interface, type, enum）を生成する
 */

import type { IRModel, XcgenIR } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { generateObjectType } from "./types-object.js";
import { generateEnumType } from "./types-enum.js";
import { generateArrayType } from "./types-array.js";
import { generateMapType } from "./types-map.js";
import { generateAllOfType } from "./types-allof.js";
import { generateAnyOfType } from "./types-anyof.js";
import { generateUnionType } from "./types-union.js";
import {
  generateParameterType,
  generateUnifiedParameterType,
} from "./types-parameter.js";

/**
 * 生成されたTypeScriptコード
 */
export interface GeneratedTypes {
  /** 生成されたTypeScriptコード */
  code: string;
  /** 生成された型定義の数 */
  count: number;
}

/**
 * XcgenIRからTypeScript型定義を生成
 * @param ir - 中間表現
 * @returns 生成されたTypeScriptコード
 *
 * @example
 * ```typescript
 * const ir: XcgenIR = { ... };
 * const result = generateTypes(ir);
 * console.log(result.code); // TypeScript型定義
 * console.log(result.count); // 5 (型の数)
 * ```
 */
export function generateTypes(ir: XcgenIR): GeneratedTypes {
  const lines: string[] = [];

  // ファイルヘッダー
  lines.push("/**");
  lines.push(" * TypeScript type definitions");
  lines.push(` * Generated from: ${ir.metadata.title} ${ir.metadata.version}`);
  lines.push(" * DO NOT EDIT - This file is auto-generated");
  lines.push(" */");
  lines.push("");

  let count = 0;

  // endpointsを走査して、統合型が必要なparameterモデルを検出
  // Map<parameterReferencePath, requestBodyTypeName>
  const unifiedParameterTypes = new Map<string, string>();

  for (const endpoint of ir.endpoints) {
    // parametersとrequestBodyの両方がある場合
    if (
      !Array.isArray(endpoint.parameters) &&
      typeof endpoint.parameters !== "string" &&
      endpoint.parameters?.kind === "ref" &&
      endpoint.requestBody?.kind === "content"
    ) {
      const parameterPath = endpoint.parameters.name;

      // requestBodyの型名を抽出
      for (const content of endpoint.requestBody.content) {
        if (
          typeof content.schema !== "string" &&
          content.schema.kind === "ref"
        ) {
          const requestBodyModelName =
            content.schema.name.split("/").at(-1) ?? content.schema.name;
          const requestBodyTypeName = toTypeName(requestBodyModelName);
          unifiedParameterTypes.set(parameterPath, requestBodyTypeName);
          break; // 最初のスキーマのみ使用
        }
      }
    }
  }

  // 各モデルを変換
  for (const model of ir.models) {
    let typeCode: string | null = null;

    // parameterモデルで統合型が必要な場合
    if (
      model.kind === "parameter" &&
      unifiedParameterTypes.has(model.referencePath)
    ) {
      const requestBodyTypeName = unifiedParameterTypes.get(
        model.referencePath,
      )!;
      typeCode = generateUnifiedParameterType(model, requestBodyTypeName);
    } else {
      typeCode = generateModel(model);
    }

    if (typeCode) {
      lines.push(typeCode);
      lines.push("");
      count++;
    }
  }

  return {
    code: lines.join("\n"),
    count,
  };
}

/**
 * IRModelをTypeScript型定義に変換
 * @param model - IRモデル
 * @returns TypeScript型定義コード
 */
export function generateModel(model: IRModel): string | null {
  switch (model.kind) {
    case "object":
    case "requestBody":
    case "response":
      return generateObjectType(model);

    case "enum":
      return generateEnumType(model);

    case "array":
      return generateArrayType(model);

    case "map":
      return generateMapType(model);

    case "allOf":
      return generateAllOfType(model);

    case "anyOf":
      return generateAnyOfType(model);

    case "union":
      return generateUnionType(model);

    case "parameter":
      return generateParameterType(model);

    default: {
      // Exhaustive check
      const _: never = model;
      void _;
      return null;
    }
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types generator", () => {
    describe("generateTypes", () => {
      it("should generate types from XcgenIR", () => {
        const ir: XcgenIR = {
          metadata: {
            title: "Pet Store API",
            version: "1.0.0",
          },
          models: [
            {
              kind: "object",
              name: "Pet",
              referencePath: "#/components/schemas/Pet",
              properties: [
                {
                  name: "id",
                  type: "int",
                  required: true,
                },
                {
                  name: "name",
                  type: "string",
                  required: true,
                },
              ],
            },
          ],
          tags: [],
          endpoints: [],
        };

        const result = generateTypes(ir);

        expect(result.count).toBe(1);
        expect(result.code.trim()).toEqual(
          `
/**
 * TypeScript type definitions
 * Generated from: Pet Store API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Pet {
  id: number;
  name: string;
}
`.trim(),
        );
      });
    });

    describe("generateModel", () => {
      it("should generate object type", () => {
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

        const result = generateModel(model);

        expect(result).toEqual(
          `
export interface User {
  email: string;
}
`.trim(),
        );
      });

      it("should generate enum type", () => {
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

        const result = generateModel(model);

        expect(result).toEqual('export type Status = "active" | "inactive";');
      });
    });
  });
}
