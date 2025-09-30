/**
 * requestBodies-components-visitor.ts - components.requestBodiesを処理
 *
 * OpenAPIのcomponents.requestBodiesセクションを処理し、
 * 各リクエストボディ定義をIRRequestBodyに変換する。
 *
 * 責務:
 * - RequestBodyObjectをIRRequestBodyに変換
 * - $ref参照を保持（入れ子$refは未対応）
 * - referencePath設定によるトレーサビリティ確保
 */

import { consola } from "consola";
import type {
  IRModel,
  IRRequestBody,
  ReferenceObject,
  RequestBodyObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { isIRRequestBodyWithContent } from "../../../types/ir/endpoints/request";
import type { RequestBodyContext } from "../../types";
import { visitRequestBody } from "../operations/request-body-visitor";

/**
 * components.requestBodiesを処理してIRRequestBodyマップに変換
 *
 * @param requestBodies - components.requestBodiesオブジェクト
 * @returns IRRequestBodyマップ
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   requestBodies:
 *     UserInput:
 *       description: User registration data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *         application/xml:
 *           schema:
 *             $ref: '#/components/schemas/User'
 * ```
 */
export function visitComponentsRequestBodies(
  requestBodies: Record<string, RequestBodyObject | ReferenceObject>,
): Record<string, IRRequestBody> {
  const irRequestBodies: Record<string, IRRequestBody> = {};
  const allModels: IRModel[] = []; // 後で統合が必要な場合のため

  for (const [name, requestBody] of Object.entries(requestBodies)) {
    // null/undefinedチェック
    if (!requestBody) {
      consola.warn(
        `Invalid request body for "${name}": request body is null or undefined`,
      );
      continue;
    }

    try {
      // $ref参照の場合は警告を出してスキップ
      if (isReferenceObject(requestBody)) {
        consola.warn(
          `Nested $ref in components.requestBodies["${name}"] is not supported: ${requestBody.$ref}`,
        );
        continue;
      }

      // visitRequestBodyを使用してIRRequestBodyに変換
      const context: RequestBodyContext = {
        documentPath: ["components", "requestBodies", name],
        rootSegment: "components",
        pathTemplate: "/", // components.requestBodiesでは具体的なパスは不明
        method: "post", // components.requestBodiesでは具体的なメソッドは不明
        contentType: null, // components.requestBodiesでは具体的なcontentTypeは不明
        schemaPath: null, // components.requestBodiesでは具体的なschemaPathは不明
      };

      const result = visitRequestBody(requestBody, null, context);

      if (result && result.requestBody) {
        irRequestBodies[name] = {
          ...result.requestBody,
        };

        // モデルは現時点では統合しない（将来の拡張ポイント）
        allModels.push(...result.models);
      }
    } catch (error) {
      consola.warn(`Failed to process request body "${name}":`, error);
    }
  }

  return irRequestBodies;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitComponentsRequestBodies", () => {
    it("should process basic request body definition", () => {
      const requestBodies = {
        UserInput: {
          description: "User registration data",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
      } as Record<string, RequestBodyObject>;

      const result = visitComponentsRequestBodies(requestBodies);

      expect(result).toHaveProperty("UserInput");
      const userInput = result.UserInput;
      expect(userInput.kind).toBe("content");

      if (isIRRequestBodyWithContent(userInput)) {
        expect(userInput.description).toBe("User registration data");
        expect(userInput.required).toBe(true);
        expect(userInput.content).toHaveLength(1);
        expect(userInput.content[0].mimeType).toBe("application/json");
      }
    });

    it("should handle request body with $ref schema", () => {
      const requestBodies = {
        PetInput: {
          description: "Pet data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
            },
          },
        },
      } as Record<string, RequestBodyObject>;

      const result = visitComponentsRequestBodies(requestBodies);

      expect(result).toHaveProperty("PetInput");
      const petInput = result.PetInput;
      expect(petInput.kind).toBe("content");

      if (isIRRequestBodyWithContent(petInput)) {
        expect(petInput.content[0].schema).toEqual({
          kind: "ref",
          name: "#/components/schemas/Pet",
        });
      }
    });

    it("should warn and skip nested $ref request bodies", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBodies = {
        RefRequestBody: {
          $ref: "#/components/requestBodies/BaseRequestBody",
        },
      } as Record<string, ReferenceObject>;

      const result = visitComponentsRequestBodies(requestBodies);

      expect(result).not.toHaveProperty("RefRequestBody");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Nested $ref in components.requestBodies["RefRequestBody"] is not supported',
        ),
      );

      warnSpy.mockRestore();
    });

    it("should warn and skip null request bodies", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBodies = {
        Invalid: null,
        Valid: {
          description: "Valid request body",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      } as unknown as Record<string, RequestBodyObject>;

      const result = visitComponentsRequestBodies(requestBodies);

      expect(result).not.toHaveProperty("Invalid");
      expect(result).toHaveProperty("Valid");
      expect(warnSpy).toHaveBeenCalledWith(
        'Invalid request body for "Invalid": request body is null or undefined',
      );

      warnSpy.mockRestore();
    });

    it("should handle multiple request bodies", () => {
      const requestBodies = {
        UserArray: {
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
            },
          },
          description: "List of user objects",
          required: true,
        },
        Pet: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Pet" },
            },
          },
        },
      } as Record<string, RequestBodyObject>;

      const result = visitComponentsRequestBodies(requestBodies);

      expect(Object.keys(result)).toEqual(["UserArray", "Pet"]);

      const userArray = result.UserArray;
      expect(userArray.kind).toBe("content");
      if (isIRRequestBodyWithContent(userArray)) {
        expect(userArray.description).toBe("List of user objects");
        expect(userArray.required).toBe(true);
      }

      const pet = result.Pet;
      expect(pet.kind).toBe("content");
      if (isIRRequestBodyWithContent(pet)) {
        expect(pet.content[0].schema).toEqual({
          kind: "ref",
          name: "#/components/schemas/Pet",
        });
      }
    });
  });
}
