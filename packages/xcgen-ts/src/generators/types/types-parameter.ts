/**
 * TypeScript Parameter型生成
 *
 * IRParameterModelからTypeScriptのinterfaceを生成する
 * {OperationId}Data形式で、path/query/header/bodyを構造化
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import { generateProperty } from "./types-property";

/**
 * IRParameterModelからTypeScript interfaceを生成
 * @param model - IRParameterModel
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "parameter",
 *   name: "GetUserData",
 *   referencePath: "#/paths/~1users~1{id}/get/parameters",
 *   properties: [
 *     { name: "id", type: "int", required: true, in: "path" },
 *     { name: "include", type: "string", required: false, in: "query" }
 *   ],
 * };
 * generateParameterType(model);
 * // => "export interface GetUserData { path: { id: number; }; query: { include?: string; }; }"
 * ```
 */
export function generateParameterType(
  model: IRModel & { kind: "parameter" },
): string {
  const lines: string[] = [];
  const typeName = toTypeName(model.name);

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export interface ${typeName} {`);

  // パラメータをin別にグループ化
  const grouped: Record<string, typeof model.properties> = {};
  for (const param of model.properties) {
    const inType = param.in;
    if (!grouped[inType]) {
      grouped[inType] = [];
    }
    grouped[inType].push(param);
  }

  // 各in typeごとにネストしたオブジェクト型を生成
  for (const [inType, params] of Object.entries(grouped)) {
    lines.push(`  ${inType}: {`);
    for (const param of params) {
      const propertyCode = generateProperty(param);
      lines.push(`    ${propertyCode}`);
    }
    lines.push(`  };`);
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * パラメータとリクエストボディを統合したTypeScript interfaceを生成
 * @param parameterModel - IRParameterModel
 * @param requestBodyTypeName - リクエストボディの型名
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const parameterModel: IRModel = {
 *   kind: "parameter",
 *   name: "PayForBookingParams",
 *   referencePath: "#/paths/~1bookings~1{bookingId}~1payment/post/parameters",
 *   properties: [
 *     { name: "bookingId", type: "string", required: true, in: "path" }
 *   ],
 * };
 * generateUnifiedParameterType(parameterModel, "CardPayment | BankTransferPayment");
 * // => "export interface PayForBookingParams { path: { bookingId: string; }; body: CardPayment | BankTransferPayment; }"
 * ```
 */
export function generateUnifiedParameterType(
  parameterModel: IRModel & { kind: "parameter" },
  requestBodyTypeName: string,
): string {
  const lines: string[] = [];
  const typeName = toTypeName(parameterModel.name);

  if (parameterModel.description) {
    lines.push("/**");
    lines.push(` * ${parameterModel.description}`);
    lines.push(" */");
  }

  lines.push(`export interface ${typeName} {`);

  // パラメータをin別にグループ化
  const grouped: Record<string, typeof parameterModel.properties> = {};
  for (const param of parameterModel.properties) {
    const inType = param.in;
    if (!grouped[inType]) {
      grouped[inType] = [];
    }
    grouped[inType].push(param);
  }

  // 各in typeごとにネストしたオブジェクト型を生成
  for (const [inType, params] of Object.entries(grouped)) {
    lines.push(`  ${inType}: {`);
    for (const param of params) {
      const propertyCode = generateProperty(param);
      lines.push(`    ${propertyCode}`);
    }
    lines.push(`  };`);
  }

  // bodyプロパティを追加
  lines.push(`  body: ${requestBodyTypeName};`);

  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-parameter", () => {
    describe("generateParameterType", () => {
      it("should generate parameter type with path params", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "GetUserData",
          referencePath: "#/paths/~1users~1{id}/get/parameters",
          properties: [
            {
              name: "id",
              type: "int",
              required: true,
              in: "path",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
export interface GetUserData {
  path: {
    id: number;
  };
}
`.trim(),
        );
      });

      it("should generate parameter type with multiple groups", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "SearchData",
          referencePath: "#/paths/~1search/get/parameters",
          properties: [
            {
              name: "q",
              type: "string",
              required: true,
              in: "query",
            },
            {
              name: "limit",
              type: "int",
              in: "query",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
export interface SearchData {
  query: {
    q: string;
    limit?: number | undefined;
  };
}
`.trim(),
        );
      });

      it("should generate parameter type with description", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "UpdateUserData",
          referencePath: "#/paths/~1users~1{id}/put/parameters",
          description: "Parameters for updating a user",
          properties: [
            {
              name: "id",
              type: "int",
              required: true,
              in: "path",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
/**
 * Parameters for updating a user
 */
export interface UpdateUserData {
  path: {
    id: number;
  };
}
`.trim(),
        );
      });
    });

    describe("generateUnifiedParameterType", () => {
      it("should generate unified type with path and body", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "PayForBookingParams",
          referencePath:
            "#/paths/~1bookings~1{bookingId}~1payment/post/parameters",
          properties: [
            {
              name: "bookingId",
              type: "string",
              required: true,
              in: "path",
            },
          ],
        };

        const result = generateUnifiedParameterType(
          model,
          "CardPayment | BankTransferPayment",
        );

        expect(result).toEqual(
          `
export interface PayForBookingParams {
  path: {
    bookingId: string;
  };
  body: CardPayment | BankTransferPayment;
}
`.trim(),
        );
      });

      it("should generate unified type with path, query, and body", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "UpdateItemParams",
          referencePath: "#/paths/~1items~1{itemId}/put/parameters",
          properties: [
            {
              name: "itemId",
              type: "string",
              required: true,
              in: "path",
            },
            {
              name: "async",
              type: "boolean",
              in: "query",
            },
          ],
        };

        const result = generateUnifiedParameterType(model, "ItemUpdateData");

        expect(result).toEqual(
          `
export interface UpdateItemParams {
  path: {
    itemId: string;
  };
  query: {
    async?: boolean | undefined;
  };
  body: ItemUpdateData;
}
`.trim(),
        );
      });

      it("should generate unified type with description", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "CreateOrderParams",
          referencePath: "#/paths/~1orders/post/parameters",
          description: "Parameters for creating an order",
          properties: [
            {
              name: "X-Api-Key",
              type: "string",
              required: true,
              in: "header",
            },
          ],
        };

        const result = generateUnifiedParameterType(model, "OrderData");

        expect(result).toEqual(
          `
/**
 * Parameters for creating an order
 */
export interface CreateOrderParams {
  header: {
    xApiKey: string;
  };
  body: OrderData;
}
`.trim(),
        );
      });
    });
  });
}
