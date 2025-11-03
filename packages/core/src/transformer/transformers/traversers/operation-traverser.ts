/**
 * Operation Traverser - v2 Transformer Architecture
 *
 * OperationObjectを訪問し、parameters、requestBody、responsesを処理します。
 * 各フィールドの処理は対応するtraverserに委譲します。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRType,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { OperationTraversalResult } from "../types";
import { traverseContent } from "./content-traverser";
import { traverseParameters } from "./parameters-traverser";
import { traverseResponses } from "./responses-traverser";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: IRType | null; models: IRModel[] };

/**
 * OperationObjectを訪問し、parameters、requestBody、responsesを処理
 *
 * @param operation - OperationObject
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @param pathItemParameters - PathItemレベルのパラメータ（オプション）
 * @returns OperationTraversalResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * get:
 *   summary: Get user by ID
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     '200':
 *       description: Success
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 * ```
 */
export function traverseOperation(
  operation: OperationObject,
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
  pathItemParameters?: ParameterObject[],
): OperationTraversalResult {
  consola.debug(
    `Traversing operation at: ${buildReferencePath(context.documentPath)}`,
  );

  const allChildModels: IRModel[] = [];

  // 1. parametersを処理（PathItemとOperationレベルをマージ）
  // PathItem レベルのパラメータ（$ref は警告してスキップ）
  const filteredPathParams = (pathItemParameters || []).filter(
    (p): p is ParameterObject => {
      if ("$ref" in p) {
        consola.warn(
          `Parameter reference not supported yet: ${(p as ReferenceObject).$ref}`,
        );
        return false;
      }
      return true;
    },
  );

  // Operation レベルのパラメータ（$ref は警告してスキップ）
  const filteredOpParams = (operation.parameters || []).filter(
    (p): p is ParameterObject => {
      if ("$ref" in p) {
        consola.warn(
          `Parameter reference not supported yet: ${(p as ReferenceObject).$ref}`,
        );
        return false;
      }
      return true;
    },
  );

  // name+inの組み合わせでMap化し、operation側を優先（OpenAPI仕様準拠）
  const paramMap = new Map<string, ParameterObject>();
  filteredPathParams.forEach((p) => {
    const key = `${p.name}:${p.in}`;
    paramMap.set(key, p);
  });
  filteredOpParams.forEach((p) => {
    const key = `${p.name}:${p.in}`;
    paramMap.set(key, p); // 同じキーの場合は上書き（operation優先）
  });
  const mergedParameters = Array.from(paramMap.values());

  let parametersResult = undefined;
  if (mergedParameters.length > 0) {
    parametersResult = traverseParameters(mergedParameters, context);
    allChildModels.push(...parametersResult.childModels);
  }

  // 2. requestBodyを処理
  let requestBodyResult = undefined;
  if (operation.requestBody) {
    const requestBodyContext: VisitorContext = {
      documentPath: [...context.documentPath, "requestBody"],
      rootSegment: context.rootSegment,
    };

    // ReferenceObjectの場合もサポート（transformRequestBodyが$refを処理）
    if (isReferenceObject(operation.requestBody)) {
      // $ref の場合はcontent traversalなしで空の結果を設定
      // transformRequestBody が operation.requestBody の $ref を参照して IRRequestBody を生成
      requestBodyResult = {
        content: { content: [], childModels: [], requiresSpecialModel: false },
      };
    } else {
      const requestBodyObj = operation.requestBody as RequestBodyObject;

      const contentResult = traverseContent(
        requestBodyObj.content,
        {
          ...requestBodyContext,
          ...(requestBodyObj.required !== undefined && {
            required: requestBodyObj.required,
          }),
        },
        visitSchema,
      );

      requestBodyResult = {
        ...(requestBodyObj.required && { required: true }),
        ...(requestBodyObj.description && {
          description: requestBodyObj.description,
        }),
        content: contentResult,
      };

      allChildModels.push(...contentResult.childModels);
    }
  }

  // 3. responsesを処理
  let responsesResult = undefined;
  if (operation.responses) {
    responsesResult = traverseResponses(
      operation.responses,
      context,
      visitSchema,
    );
    allChildModels.push(...responsesResult.childModels);
  }

  return {
    ...(parametersResult && { parametersResult }),
    ...(requestBodyResult && { requestBodyResult }),
    ...(responsesResult && { responsesResult }),
    childModels: allChildModels,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseOperation", () => {
    it("should handle minimal operation", () => {
      const operation: OperationObject = {
        responses: {},
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      expect(result.parametersResult).toBeUndefined();
      expect(result.requestBodyResult).toBeUndefined();
      expect(result.responsesResult).toBeDefined();
      expect(result.childModels).toEqual([]);
    });

    it("should process operation with parameters", () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {},
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      expect(result.parametersResult).toBeDefined();
      expect(result.parametersResult?.parameters).toHaveLength(1);
      expect(result.parametersResult?.parameters[0].name).toBe("id");
    });

    it("should merge pathItem and operation level parameters", () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: {},
      };

      const pathItemParameters: ParameterObject[] = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ];

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseOperation(
        operation,
        context,
        mockVisitSchema,
        pathItemParameters,
      );

      expect(result.parametersResult).toBeDefined();
      expect(result.parametersResult?.parameters).toHaveLength(2);
      expect(result.parametersResult?.parameters[0].name).toBe("id");
      expect(result.parametersResult?.parameters[1].name).toBe("limit");
    });

    it("should override pathItem parameters with operation parameters (same name+in)", async () => {
      // PathItemとOperationで同じname+inのパラメータがある場合
      // OpenAPI仕様ではoperation側が優先される
      const operation: OperationObject = {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" as const }, // ← operation側はinteger
          },
        ],
        responses: {},
      };

      const pathItemParameters: ParameterObject[] = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" as const }, // ← pathItem側はstring
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/pets/{id}", "get"],
        rootSegment: "paths",
      };

      // 実際のdispatchSchemaを使用してテスト
      const { dispatchSchema } = await import(
        "../dispatchers/schema-dispatcher"
      );

      const result = traverseOperation(
        operation,
        context,
        dispatchSchema,
        pathItemParameters,
      );

      expect(result.parametersResult).toBeDefined();
      // 重複除去されて1件のみ
      expect(result.parametersResult?.parameters).toHaveLength(1);
      expect(result.parametersResult?.parameters[0].name).toBe("id");
      expect(result.parametersResult?.parameters[0].in).toBe("path");
      // operation側の型（integer）が優先される
      // IRTypeは"int"に変換される
      expect(result.parametersResult?.parameters[0].type).toBe("int");
    });

    it("should process operation with requestBody", () => {
      const operation: OperationObject = {
        requestBody: {
          required: true,
          description: "User data",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {},
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/test" },
        models: [],
      });

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      expect(result.requestBodyResult).toBeDefined();
      expect(result.requestBodyResult?.required).toBe(true);
      expect(result.requestBodyResult?.description).toBe("User data");
      expect(result.requestBodyResult?.content.content).toHaveLength(1);
    });

    it("should process operation with $ref requestBody", () => {
      const operation: OperationObject = {
        requestBody: {
          $ref: "#/components/requestBodies/UserCreateBody",
        },
        responses: {},
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      // $ref requestBody の場合もresultが設定される
      expect(result.requestBodyResult).toBeDefined();
      // contentは空だが、transformRequestBodyが$refを処理する
      expect(result.requestBodyResult?.content.content).toEqual([]);
      // visitSchemaは呼ばれない（$refなのでcontent traversalが不要）
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should process operation with responses", () => {
      const operation: OperationObject = {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: { type: "string" },
              },
            },
          },
        },
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      expect(result.responsesResult).toBeDefined();
      expect(result.responsesResult?.responses).toHaveLength(1);
      expect(result.responsesResult?.responses[0].statusCode).toBe("200");
    });

    it("should collect child models from all fields", async () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: "tags",
            in: "query",
            schema: {
              type: "array",
              items: { type: "string" },
            },
          },
        ],
        requestBody: {
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
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object" as const,
                  properties: {
                    result: { type: "string" as const },
                  },
                },
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/posts", "post"],
        rootSegment: "paths",
      };

      // Use real dispatchSchema from schema-dispatcher
      const { dispatchSchema } = await import(
        "../dispatchers/schema-dispatcher"
      );
      const result = traverseOperation(operation, context, dispatchSchema);

      // Should collect models from:
      // 1. parameter array (Tags model)
      // 2. requestBody object (PostPostsRequestBody model)
      // 3. response object (PostPosts200Response model)
      expect(result.childModels.length).toBeGreaterThanOrEqual(3);

      // Verify model kinds
      const modelKinds = result.childModels.map((m) => m.kind);
      expect(modelKinds).toContain("array"); // from parameter
      expect(modelKinds).toContain("requestBody"); // from requestBody
      expect(modelKinds).toContain("response"); // from response
    });

    it("should handle operation without optional fields", () => {
      const operation: OperationObject = {
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/ping", "get"],
        rootSegment: "paths",
      };

      const result = traverseOperation(operation, context, mockVisitSchema);

      expect(result.parametersResult).toBeUndefined();
      expect(result.requestBodyResult).toBeUndefined();
      expect(result.responsesResult).toBeDefined();
      expect(result.childModels).toEqual([]);
    });
  });
}
