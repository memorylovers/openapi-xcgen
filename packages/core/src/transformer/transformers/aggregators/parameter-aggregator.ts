/**
 * Parameter Aggregator - v2 Transformer Architecture
 *
 * 複数のパラメータを1つの統合モデル（IRParameterComponent）に集約します。
 * Aggregatorレイヤーは、Transformerで生成されたIRParameterを受け取り、
 * それらをまとめてパラメータ統合モデルを生成する責務を持ちます。
 */

import { pascalCase } from "es-toolkit/string";
import type {
  IRParameter,
  IRParameterComponent,
  IRParameterProperty,
  IRRef,
} from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { ParameterAggregationResult } from "../types";

/**
 * パラメータを統合モデルに集約
 *
 * @param parameters - IRParameter配列（parameters-traverserの出力）
 * @param context - Visitorコンテキスト（operationコンテキスト）
 * @param pathTemplate - パステンプレート（例: "/users/{id}"）
 * @param method - HTTPメソッド（例: "get"）
 * @returns パラメータ集約結果（参照とモデル）
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /users/{id}:
 *     get:
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *         - name: limit
 *           in: query
 *           schema:
 *             type: integer
 *             default: 10
 * # → GetUsersIdParams model with 2 properties
 * ```
 */
export function aggregateParameters(
  parameters: IRParameter[],
  context: VisitorContext,
  pathTemplate: string,
  method: string,
): ParameterAggregationResult {
  // パラメータがない場合は null を返す
  if (parameters.length === 0) {
    return {
      reference: null,
      model: null,
    };
  }

  // 統合モデル名を生成
  const modelName = generateParameterModelName(pathTemplate, method);
  const referencePath = buildReferencePath([
    ...context.documentPath,
    modelName,
  ]);

  // IRParameter を IRParameterProperty に変換
  const properties: IRParameterProperty[] = parameters.map(
    convertToParameterProperty,
  );

  // パラメータの説明を生成
  const description = generateDescription(parameters, pathTemplate, method);

  // 統合モデルを生成
  const model: IRParameterComponent = {
    kind: "parameter",
    name: modelName,
    referencePath,
    properties,
    ...(description && { description }),
  };

  // 参照を生成
  const reference: IRRef = {
    kind: "ref",
    name: referencePath,
  };

  return {
    reference,
    model,
  };
}

/**
 * パラメータ統合モデル名を生成
 *
 * パステンプレートとHTTPメソッドから、一意のモデル名を生成します。
 * パスパラメータ（{id}など）も名前に含めて一意性を確保します。
 *
 * @param pathTemplate - パステンプレート（例: "/users/{id}/posts"）
 * @param method - HTTPメソッド（例: "get"）
 * @returns パラメータモデル名（例: "GetUsersIdPostsParams"）
 *
 * @example
 * ```typescript
 * generateParameterModelName("/pets", "get")
 * // => "GetPetsParams"
 *
 * generateParameterModelName("/pets/{petId}", "get")
 * // => "GetPetsPetIdParams"
 *
 * generateParameterModelName("/users/{id}/posts", "get")
 * // => "GetUsersIdPostsParams"
 * ```
 */
function generateParameterModelName(
  pathTemplate: string,
  method: string,
): string {
  const methodPascal = pascalCase(method);

  // パステンプレートからセグメントを抽出（パスパラメータも含める）
  const segments = pathTemplate
    .replace(/^\//g, "") // 先頭のスラッシュを除去
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      // パスパラメータの場合は中身を抽出してPascalCaseに
      if (segment.startsWith("{") && segment.endsWith("}")) {
        const paramName = segment.slice(1, -1); // {} を除去
        return pascalCase(paramName);
      }
      return pascalCase(segment);
    });

  const pathBase = segments.join("");
  return `${methodPascal}${pathBase}Params`;
}

/**
 * IRParameter を IRParameterProperty に変換
 *
 * @param parameter - 変換対象のパラメータ
 * @returns 変換されたパラメータプロパティ
 */
function convertToParameterProperty(
  parameter: IRParameter,
): IRParameterProperty {
  const property: IRParameterProperty = {
    name: parameter.name,
    type: parameter.type,
    in: parameter.in, // 重要: in情報を保持
    ...(parameter.required && { required: parameter.required }),
    ...(parameter.description && { description: parameter.description }),
    ...(parameter.nullable && { nullable: parameter.nullable }),
    ...(parameter.defaultValue !== undefined && {
      defaultValue: parameter.defaultValue,
    }),
    ...(parameter.deprecated && { deprecated: parameter.deprecated }),
    ...(parameter.validation && { validation: parameter.validation }),
    ...(parameter.extensions && { extensions: parameter.extensions }),
  };

  return property;
}

/**
 * パラメータ統合モデルの説明を生成
 *
 * @param parameters - パラメータ配列
 * @param pathTemplate - パステンプレート
 * @param method - HTTPメソッド
 * @returns 説明文字列（パラメータがdescriptionを持たない場合はundefined）
 */
function generateDescription(
  parameters: IRParameter[],
  pathTemplate: string,
  method: string,
): string | undefined {
  const descriptions = parameters
    .filter((p) => p.description)
    .map((p) => `${p.name}: ${p.description}`);

  if (descriptions.length === 0) {
    return `Parameters for ${method.toUpperCase()} ${pathTemplate}`;
  }

  return `Parameters for ${method.toUpperCase()} ${pathTemplate}\n${descriptions.join("\n")}`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("aggregateParameters", () => {
    it("should return null for empty parameters", () => {
      const context = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters([], context, "/users", "get");

      expect(result.reference).toBeNull();
      expect(result.model).toBeNull();
    });

    it("should create unified model for single parameter", () => {
      const parameters: IRParameter[] = [
        {
          name: "id",
          in: "path",
          description: "User ID",
          required: true,
          type: "string",
        },
      ];

      const context = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters(
        parameters,
        context,
        "/users/{id}",
        "get",
      );

      expect(result.reference).toEqual({
        kind: "ref",
        name: "#/paths/::users::{id}/get/GetUsersIdParams",
      });

      expect(result.model).not.toBeNull();
      if (result.model && result.model.kind === "parameter") {
        expect(result.model.kind).toBe("parameter");
        expect(result.model.name).toBe("GetUsersIdParams");
        expect(result.model.properties).toHaveLength(1);
        expect(result.model.properties[0]).toEqual({
          name: "id",
          description: "User ID",
          type: "string",
          required: true,
          in: "path",
        });
        expect(result.model.description).toContain("Parameters for GET");
        expect(result.model.description).toContain("id: User ID");
      }
    });

    it("should create unified model for multiple parameters", () => {
      const parameters: IRParameter[] = [
        {
          name: "id",
          in: "path",
          description: "User ID",
          required: true,
          type: "string",
        },
        {
          name: "limit",
          in: "query",
          description: "Maximum number of results",
          type: "int",
          defaultValue: 10,
        },
        {
          name: "offset",
          in: "query",
          type: "int",
          defaultValue: 0,
        },
      ];

      const context = {
        documentPath: ["paths", "/users/{id}/posts", "get"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters(
        parameters,
        context,
        "/users/{id}/posts",
        "get",
      );

      expect(result.model).not.toBeNull();
      if (result.model && result.model.kind === "parameter") {
        expect(result.model.kind).toBe("parameter");
        expect(result.model.name).toBe("GetUsersIdPostsParams");
        expect(result.model.properties).toHaveLength(3);

        // Path parameter
        expect(result.model.properties[0]).toEqual({
          name: "id",
          description: "User ID",
          type: "string",
          required: true,
          in: "path",
        });

        // Query parameters
        expect(result.model.properties[1]).toEqual({
          name: "limit",
          description: "Maximum number of results",
          type: "int",
          in: "query",
          defaultValue: 10,
        });

        expect(result.model.properties[2]).toEqual({
          name: "offset",
          type: "int",
          in: "query",
          defaultValue: 0,
        });

        // Description should include parameter descriptions
        expect(result.model.description).toContain(
          "Parameters for GET /users/{id}/posts",
        );
        expect(result.model.description).toContain("id: User ID");
        expect(result.model.description).toContain(
          "limit: Maximum number of results",
        );
      }
    });

    it("should handle parameters without descriptions", () => {
      const parameters: IRParameter[] = [
        {
          name: "id",
          in: "path",
          required: true,
          type: "string",
        },
        {
          name: "format",
          in: "query",
          type: "string",
        },
      ];

      const context = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters(
        parameters,
        context,
        "/users/{id}",
        "get",
      );

      expect(result.model).not.toBeNull();
      if (result.model && result.model.kind === "parameter") {
        expect(result.model.description).toBe("Parameters for GET /users/{id}");
        expect(result.model.properties).toHaveLength(2);
      }
    });

    it("should handle deprecated parameters", () => {
      const parameters: IRParameter[] = [
        {
          name: "oldParam",
          in: "query",
          description: "This parameter is deprecated",
          type: "string",
          deprecated: true,
        },
      ];

      const context = {
        documentPath: ["paths", "/api/v1/legacy", "post"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters(
        parameters,
        context,
        "/api/v1/legacy",
        "post",
      );

      expect(result.model).not.toBeNull();
      if (result.model && result.model.kind === "parameter") {
        expect(result.model.kind).toBe("parameter");
        expect(result.model.properties[0].deprecated).toBe(true);
        expect(result.model.name).toBe("PostApiV1LegacyParams");
      }
    });

    it("should handle nullable parameters", () => {
      const parameters: IRParameter[] = [
        {
          name: "optionalId",
          in: "query",
          type: "string",
          nullable: true,
        },
      ];

      const context = {
        documentPath: ["paths", "/search", "get"],
        rootSegment: "paths" as const,
      };

      const result = aggregateParameters(parameters, context, "/search", "get");

      expect(result.model).not.toBeNull();
      if (result.model && result.model.kind === "parameter") {
        expect(result.model.properties[0].nullable).toBe(true);
      }
    });
  });

  describe("generateParameterModelName", () => {
    it("should generate unique parameter model names including path parameters", () => {
      // /pets と /pets/{petId} で異なる名前になることを確認
      expect(generateParameterModelName("/pets", "get")).toBe("GetPetsParams");
      expect(generateParameterModelName("/pets/{petId}", "get")).toBe(
        "GetPetsPetIdParams",
      );
    });

    it("should generate parameter model name including path parameters", () => {
      expect(generateParameterModelName("/users/{id}", "get")).toBe(
        "GetUsersIdParams",
      );
      expect(generateParameterModelName("/users/{id}/posts", "get")).toBe(
        "GetUsersIdPostsParams",
      );
      expect(
        generateParameterModelName(
          "/api/v1/users/{userId}/posts/{postId}",
          "patch",
        ),
      ).toBe("PatchApiV1UsersUserIdPostsPostIdParams");
    });

    it("should handle paths without parameters", () => {
      expect(generateParameterModelName("/users", "get")).toBe(
        "GetUsersParams",
      );
      expect(generateParameterModelName("/api/v1/search", "post")).toBe(
        "PostApiV1SearchParams",
      );
    });

    it("should handle root path", () => {
      expect(generateParameterModelName("/", "get")).toBe("GetParams");
    });

    it("should handle paths with only parameters", () => {
      expect(generateParameterModelName("/{id}", "get")).toBe("GetIdParams");
      expect(generateParameterModelName("/{category}/{id}", "delete")).toBe(
        "DeleteCategoryIdParams",
      );
    });
  });
}
