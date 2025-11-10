/**
 * Parameters Traverser - v2 Transformer Architecture
 *
 * Operationのparametersフィールドを訪問し、
 * 各パラメータを処理します。
 * 各パラメータの変換はparameter-transformerに委譲します。
 */

import { consola } from "consola";
import type {
  IRComponent,
  IRParameter,
  ParameterObject,
  ReferenceObject,
} from "../../../types";
import type { VisitorContext } from "../../types";
import { transformParameter } from "../transformers/parameter-transformer";
import type { ParametersTraversalResult } from "../types";

/**
 * parametersフィールド（ParameterObjectの配列）を訪問
 *
 * @param parameters - parametersオブジェクト配列
 * @param context - 親コンテキスト
 * @returns ParametersTraversalResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query
 *     schema:
 *       type: integer
 *       default: 10
 * ```
 */
export function traverseParameters(
  parameters: ParameterObject[] | undefined,
  context: VisitorContext,
): ParametersTraversalResult {
  // parametersが未定義または空の場合
  if (!parameters || parameters.length === 0) {
    return {
      parameters: [],
      childModels: [],
    };
  }

  const visitedParameters: ParametersTraversalResult["parameters"] = [];
  const allChildModels: IRComponent[] = [];

  // 各パラメータを訪問
  parameters.forEach((param, index) => {
    // ReferenceObjectの場合は現時点でスキップ
    if ("$ref" in param) {
      consola.warn(
        `Parameter reference not supported yet: ${(param as ReferenceObject).$ref}`,
      );
      return;
    }

    const paramContext: VisitorContext = {
      documentPath: [...context.documentPath, "parameters", String(index)],
      rootSegment: context.rootSegment,
    };

    // parameter-transformerを使用
    const result = transformParameter(param, paramContext);

    if (!result.parameter) {
      // パラメータ変換に失敗した場合はスキップ
      // エラーはtransformParameter内で既に報告済み
      return;
    }

    const irParam = result.parameter as IRParameter;

    visitedParameters.push({
      name: irParam.name,
      in: irParam.in,
      type: irParam.type,
      ...(irParam.required && { required: true }),
      ...(irParam.nullable && { nullable: true }),
      ...(irParam.description && { description: irParam.description }),
      ...(irParam.defaultValue !== undefined && {
        defaultValue: irParam.defaultValue,
      }),
      ...(irParam.deprecated && { deprecated: true }),
      ...(irParam.validation && { validation: irParam.validation }),
      ...(irParam.extensions && { extensions: irParam.extensions }),
    });

    allChildModels.push(...result.components);
  });

  return {
    parameters: visitedParameters,
    childModels: allChildModels,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("traverseParameters", () => {
    it("should handle empty parameters array", () => {
      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters([], context);

      expect(result.parameters).toEqual([]);
      expect(result.childModels).toEqual([]);
    });

    it("should handle undefined parameters", () => {
      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(undefined, context);

      expect(result.parameters).toEqual([]);
      expect(result.childModels).toEqual([]);
    });

    it("should process single path parameter", () => {
      const parameters: ParameterObject[] = [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID",
          schema: { type: "string" },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toEqual({
        name: "id",
        in: "path",
        type: "string",
        required: true,
        description: "User ID",
      });
      expect(result.childModels).toEqual([]);
    });

    it("should process multiple parameters", () => {
      const parameters: ParameterObject[] = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(2);
      expect(result.parameters[0]).toEqual({
        name: "id",
        in: "path",
        type: "string",
        required: true,
      });
      expect(result.parameters[1]).toEqual({
        name: "limit",
        in: "query",
        type: "int",
        defaultValue: 10,
      });
    });

    it("should handle query parameter with validation", () => {
      const parameters: ParameterObject[] = [
        {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toEqual({
        name: "limit",
        in: "query",
        type: "int",
        defaultValue: 10,
        validation: {
          minimum: 1,
          maximum: 100,
        },
      });
    });

    it("should handle deprecated parameter", () => {
      const parameters: ParameterObject[] = [
        {
          name: "oldParam",
          in: "query",
          deprecated: true,
          schema: { type: "string" },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toEqual({
        name: "oldParam",
        in: "query",
        type: "string",
        deprecated: true,
      });
    });

    it("should handle nullable parameter", () => {
      const parameters: ParameterObject[] = [
        {
          name: "filter",
          in: "query",
          schema: { type: "string", nullable: true },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toEqual({
        name: "filter",
        in: "query",
        type: "string",
        nullable: true,
      });
    });

    it("should collect child models from array parameter", () => {
      const parameters: ParameterObject[] = [
        {
          name: "tags",
          in: "query",
          schema: {
            type: "array",
            items: { type: "string" },
          },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/posts", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("tags");
      expect(result.parameters[0].type).toEqual({
        kind: "ref",
        referencePath: expect.stringMatching(/Tags$/),
      });
      // Array parameters create child models
      expect(result.childModels).toHaveLength(1);
      expect(result.childModels[0].kind).toBe("array");
    });

    it("should preserve validation constraints from parameters", () => {
      const parameters: ParameterObject[] = [
        {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toMatchObject({
        name: "limit",
        in: "query",
        type: "int",
        defaultValue: 10,
        validation: {
          minimum: 1,
          maximum: 100,
        },
      });
    });

    it("should preserve x-extensions from parameters", () => {
      const parameters: ParameterObject[] = [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          "x-custom-field": "custom-value",
          "x-validation-message": "Invalid user ID",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{userId}", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toMatchObject({
        name: "userId",
        in: "path",
        type: "string",
        required: true,
        extensions: {
          "x-custom-field": "custom-value",
          "x-validation-message": "Invalid user ID",
        },
      });
    });

    it("should preserve all metadata from parameters", () => {
      const parameters: ParameterObject[] = [
        {
          name: "status",
          in: "query",
          description: "Filter by status",
          deprecated: true,
          schema: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            default: "active",
          },
          "x-deprecated-reason": "Use statusCode instead",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toMatchObject({
        name: "status",
        in: "query",
        type: "string",
        description: "Filter by status",
        defaultValue: "active",
        deprecated: true,
        validation: {
          minLength: 1,
          maxLength: 50,
        },
        extensions: {
          "x-deprecated-reason": "Use statusCode instead",
        },
      });
    });

    it("should preserve validation and extensions when converting to IRParameter", () => {
      const parameters: ParameterObject[] = [
        {
          name: "email",
          in: "query",
          schema: {
            type: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          },
          "x-validation-message": "Invalid email format",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseParameters(parameters, context);

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toMatchObject({
        name: "email",
        in: "query",
        type: "string",
        validation: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
        extensions: {
          "x-validation-message": "Invalid email format",
        },
      });
    });
  });
}
