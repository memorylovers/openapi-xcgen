/**
 * request-body-visitor.ts - RequestBodyObjectをIRRequestBodyに変換
 *
 * OpenAPIのRequestBodyObject（リクエストボディ定義）を処理し、
 * IRRequestBodyに変換する。
 *
 * 責務:
 * - required、descriptionの処理
 * - contentのMIMEタイプごとのスキーマ処理（visitSchemaに委譲）
 * - $ref参照の解決（現時点では未実装）
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards";
import type {
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from "../../types/index";
import type {
  IRContentMap,
  IREnum,
  IRModel,
  IRRef,
  IRRequestBody,
} from "../../types/ir/index";
import { buildReferencePath } from "../helpers/build-reference-path";
import { generateComponentName } from "../helpers/generate-component-name";
import type { VisitorContext } from "../types";
import { visitObject } from "./object-visitor";
import { visitSchema } from "./schema-visitor";

/**
 * RequestBodyの処理結果
 */
export interface RequestBodyResult {
  /** 生成されたリクエストボディ */
  requestBody: IRRequestBody | null;
  /** インラインスキーマから抽出されたモデル */
  models: IRModel[];
  /** インラインスキーマから抽出された列挙型 */
  enums: IREnum[];
}

/**
 * RequestBodyの処理用コンテキスト
 */
export interface RequestBodyContext extends VisitorContext {
  /** HTTPメソッド */
  method: string;
  /** パステンプレート */
  pathTemplate: string;
}

/**
 * RequestBodyObjectをIRRequestBodyに変換し、インラインモデルを抽出
 *
 * @param requestBody - OpenAPIのRequestBodyObjectまたはReferenceObject
 * @param operationId - エンドポイントのoperationId（命名に使用）
 * @param context - RequestBody用コンテキスト
 * @returns RequestBodyResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * requestBody:
 *   description: User data
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *             format: email
 *         required: [name, email]
 *     application/xml:
 *       schema:
 *         type: object
 *         xml:
 *           name: user
 * ```
 */
export function visitRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  operationId: string,
  context: RequestBodyContext,
): RequestBodyResult | null {
  const models: IRModel[] = [];
  const enums: IREnum[] = [];

  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(requestBody)) {
    consola.warn(
      `Reference requestBody not supported yet: ${requestBody.$ref}`,
    );
    return null;
  }

  // contentが必須
  if (!requestBody.content || Object.keys(requestBody.content).length === 0) {
    consola.warn(`RequestBody without content for operation: ${operationId}`);
    return null;
  }

  // contentの処理
  const content: IRContentMap = {};
  for (const [mimeType, mediaType] of Object.entries(requestBody.content)) {
    if (mediaType.schema) {
      // インラインのobjectスキーマを検出
      if (
        !isReferenceObject(mediaType.schema) &&
        mediaType.schema.type === "object"
      ) {
        // コンポーネント名を生成
        const componentName = generateComponentName(
          context.pathTemplate,
          context.method,
          "requestBody",
        );

        // オブジェクトvisitorで処理してIRModelを生成
        const objectResult = visitObject(mediaType.schema as SchemaObject, {
          documentPath: [
            ...context.documentPath,
            "content",
            mimeType,
            "schema",
          ],
        });

        if (objectResult && objectResult.models.length > 0) {
          // ObjectVisitorResultから最初のモデルを取得し、名前とreferencePathを更新
          const model: IRModel = {
            name: componentName,
            description: mediaType.schema.description,
            properties: objectResult.models[0].properties,
            referencePath: buildReferencePath([
              ...context.documentPath,
              "content",
              mimeType,
              "schema",
            ]),
          };
          models.push(model);

          // ネストしたモデルとEnumも追加
          if (objectResult.models.length > 1) {
            models.push(...objectResult.models.slice(1));
          }
          if (objectResult.enums) {
            enums.push(...objectResult.enums);
          }

          // contentには$refを設定
          const ref: IRRef = {
            kind: "ref",
            name: `#/components/schemas/${componentName}`,
          };
          content[mimeType] = ref;
        }
      } else {
        // それ以外のスキーマは通常通り処理
        const schemaResult = visitSchema(mediaType.schema, {
          documentPath: [
            ...context.documentPath,
            "content",
            mimeType,
            "schema",
          ],
        });
        if (schemaResult.type) {
          content[mimeType] = schemaResult.type;
          // ネストしたモデルとEnumを収集
          if (schemaResult.models) {
            models.push(...schemaResult.models);
          }
          if (schemaResult.enums) {
            enums.push(...schemaResult.enums);
          }
        }
      }
    }
  }

  // 空のcontentは返さない
  if (Object.keys(content).length === 0) {
    consola.warn(
      `No valid schemas in requestBody content for operation: ${operationId}`,
    );
    return null;
  }

  const irRequestBody: IRRequestBody = {
    description: requestBody.description,
    required: requestBody.required || false,
    content,
  };

  return { requestBody: irRequestBody, models, enums };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitRequestBody", () => {
    it("should handle basic requestBody with JSON content", () => {
      const requestBody: RequestBodyObject = {
        description: "User data",
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "createUser", {
        documentPath: ["paths", "/users", "post", "requestBody"],
        method: "post",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody).not.toBeNull();
      expect(result!.requestBody?.description).toBe("User data");
      expect(result!.requestBody?.required).toBe(true);
      expect(result!.requestBody?.content).toBeDefined();
      expect(result!.requestBody?.content?.["application/json"]).toBeDefined();
      // インラインobjectスキーマはモデルとして抽出される
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0].name).toBe("PostUsersRequestBody");
    });

    it("should handle requestBody with multiple content types", () => {
      const requestBody: RequestBodyObject = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "application/xml": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "uploadFile", {
        documentPath: ["paths", "/files", "post", "requestBody"],
        method: "post",
        pathTemplate: "/files",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody?.required).toBe(false);
      expect(result!.requestBody?.content).toBeDefined();
      expect(Object.keys(result!.requestBody?.content || {})).toHaveLength(3);
      expect(
        result!.requestBody?.content?.["multipart/form-data"],
      ).toBeDefined();
      // 複数のインラインobjectスキーマがモデルとして抽出される
      expect(result!.models).toHaveLength(3);
    });

    it("should warn and return null for requestBody without content", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        description: "Empty body",
        required: true,
        // No content
      } as RequestBodyObject;

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for empty content object", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {},
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for reference requestBody", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: ReferenceObject = {
        $ref: "#/components/requestBodies/UserInput",
      };

      const result = visitRequestBody(requestBody, "updateUser", {
        documentPath: ["paths", "/users/{id}", "put", "requestBody"],
        method: "put",
        pathTemplate: "/users/{id}",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference requestBody not supported yet: #/components/requestBodies/UserInput",
      );

      warnSpy.mockRestore();
    });

    it("should handle content with media types that have no schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {
          "application/json": {
            // No schema
          },
          "text/plain": {
            schema: { type: "string" },
          },
        } as RequestBodyObject["content"],
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody).not.toBeNull();
      expect(result!.requestBody?.content?.["text/plain"]).toBeDefined();
      expect(
        result!.requestBody?.content?.["application/json"],
      ).toBeUndefined();

      warnSpy.mockRestore();
    });

    it("should default required to false when not specified", () => {
      const requestBody: RequestBodyObject = {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody?.required).toBe(false);
    });
  });
}
