/**
 * TypeScript Unified Parameter型生成
 *
 * IRParameterComponentとリクエストボディを統合したTypeScriptのinterfaceを生成する
 */

import type { IRParameterComponent } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import type { TypeGenerationContext } from "./generation-context";
import { generateParameterProperty } from "./types-parameter-property";

/**
 * パラメータとリクエストボディを統合したTypeScript interfaceを生成
 * @param parameterModel - IRParameterComponent
 * @param requestBodyTypeName - リクエストボディの型名
 * @param ctx - Type generation context
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const parameterModel: IRParameterComponent = {
 *   kind: "parameter", mockCtx,
 *   name: "PayForBookingParams", mockCtx,
 *   referencePath: "#/paths/~1bookings~1{bookingId}~1payment/post/parameters", mockCtx,
 *   properties: [
 *     { name: "bookingId", type: "string", required: true, in: "path" }
 *   ],
 * };
 * generateUnifiedParameterType(parameterModel, "CardPayment | BankTransferPayment", ctx);
 * // => "export interface PayForBookingParams { path: { bookingId: string; }; body: CardPayment | BankTransferPayment; }"
 * ```
 */
export function generateUnifiedParameterType(
  parameterModel: IRParameterComponent,
  requestBodyTypeName: string,
  ctx: TypeGenerationContext,
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
      const propertyCode = generateParameterProperty(param, undefined, ctx);
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

  const mockCtx: TypeGenerationContext = {
    ir: {
      metadata: { title: "Test API", version: "1.0.0" },
      components: [],
      tags: [],
      endpoints: [],
    },
  };

  describe("types-parameter-unified", () => {
    describe("generateUnifiedParameterType", () => {
      it("should generate unified type with path and body", () => {
        const model: IRParameterComponent = {
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
          mockCtx,
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
        const model: IRParameterComponent = {
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

        const result = generateUnifiedParameterType(
          model,
          "ItemUpdateData",
          mockCtx,
        );

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
        const model: IRParameterComponent = {
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

        const result = generateUnifiedParameterType(
          model,
          "OrderData",
          mockCtx,
        );

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
