/**
 * create-parameter-model.ts - パラメータの統合モデル生成
 *
 * 複数のパラメータを1つのIRModelにまとめる。
 * パラメータがある場合に、GetUsersParamsのような統合モデルを生成する。
 *
 * 責務:
 * - IRParameterからIRPropertyへの変換
 * - 統合モデルの命名（generateComponentNameを使用）
 * - referencePathの適切な設定
 */

import { pascalCase } from "es-toolkit/string";
import type {
  IRParameter,
  IRParameterModel,
  IRParameterProperty,
} from "../../types";
import { buildReferencePath } from "./build-reference-path";

/**
 * 複数のパラメータから統合モデルを生成
 *
 * @param parameters - 統合対象のパラメータ配列
 * @param pathTemplate - APIのパステンプレート（例: "/users/{id}"）
 * @param method - HTTPメソッド（例: "get"）
 * @param documentPath - 現在のドキュメントパス
 * @returns 生成された統合パラメータモデル、パラメータがない場合はnull
 *
 * @example
 * ```typescript
 * const parameters = [
 *   { name: "id", in: "path", required: true, type: "string" },
 *   { name: "limit", in: "query", required: false, type: "int" }
 * ];
 *
 * const model = createParameterModel(
 *   parameters,
 *   "/users/{id}",
 *   "get",
 *   ["paths", "/users/{id}", "get", "parameters"]
 * );
 * // => { name: "GetUsersParams", properties: [...], referencePath: "..." }
 * ```
 */
export function createParameterModel(
  parameters: IRParameter[],
  pathTemplate: string,
  method: string,
  documentPath: string[],
): IRParameterModel | null {
  // パラメータがない場合はnull
  if (parameters.length === 0) {
    return null;
  }

  // 統合モデル名を生成（パスパラメータを除外）
  const componentName = generateParameterModelName(pathTemplate, method);

  // IRParameterをIRParameterPropertyに変換
  const properties: IRParameterProperty[] = parameters.map(
    parameterToParameterProperty,
  );

  // パラメータの説明をまとめる（すべてのパラメータの説明を結合）
  const descriptions = parameters
    .filter((p) => p.description)
    .map((p) => `${p.name}: ${p.description}`);
  const description =
    descriptions.length > 0
      ? `Parameters for ${method.toUpperCase()} ${pathTemplate}\n${descriptions.join("\n")}`
      : `Parameters for ${method.toUpperCase()} ${pathTemplate}`;

  // 統合モデルを生成
  const model: IRParameterModel = {
    kind: "parameter",
    name: componentName,
    description,
    properties,
    referencePath: buildReferencePath([...documentPath, componentName]),
  };

  return model;
}

/**
 * パラメータ統合モデル用のコンポーネント名を生成
 * パスパラメータ（{id}など）も名前に含めて一意性を確保する
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
 * IRParameterをIRParameterPropertyに変換
 * `in`フィールドを保持してパラメータ情報を完全に保存
 *
 * @param parameter - 変換対象のパラメータ
 * @returns 変換されたパラメータプロパティ
 *
 * @example
 * ```typescript
 * const param = { name: "id", in: "path", required: true, type: "string" };
 * const prop = parameterToParameterProperty(param);
 * // => { name: "id", in: "path", required: true, type: "string", ... }
 * ```
 */
function parameterToParameterProperty(
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
    // validation は未対応
  };

  return property;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("createParameterModel", () => {
    it("should return null for empty parameters", () => {
      const result = createParameterModel([], "/users", "get", [
        "paths",
        "/users",
        "get",
        "parameters",
      ]);

      expect(result).toBeNull();
    });

    it("should create unified model for single parameter", () => {
      const parameters = [
        {
          name: "id",
          in: "path" as const,
          description: "User ID",
          required: true as const,
          type: "string" as const,
        },
      ];

      const result = createParameterModel(parameters, "/users/{id}", "get", [
        "paths",
        "/users/{id}",
        "get",
        "parameters",
      ]);

      expect(result).not.toBeNull();
      expect(result!.kind).toBe("parameter");
      expect(result!.name).toBe("GetUsersIdParams");
      expect(result!.properties).toHaveLength(1);
      expect(result!.properties[0]).toEqual({
        name: "id",
        description: "User ID",
        type: "string",
        required: true as const,
        in: "path",
      });
      expect(result!.description).toContain("Parameters for GET /users/{id}");
      expect(result!.description).toContain("id: User ID");
    });

    it("should create unified model for multiple parameters", () => {
      const parameters = [
        {
          name: "id",
          in: "path" as const,
          description: "User ID",
          required: true as const,
          type: "string" as const,
        },
        {
          name: "limit",
          in: "query" as const,
          description: "Maximum number of results",
          type: "int" as const,
          defaultValue: 10,
        },
        {
          name: "offset",
          in: "query" as const,
          type: "int" as const,
          defaultValue: 0,
        },
      ];

      const result = createParameterModel(
        parameters,
        "/users/{id}/posts",
        "get",
        ["paths", "/users/{id}/posts", "get", "parameters"],
      );

      expect(result).not.toBeNull();
      expect(result!.kind).toBe("parameter");
      expect(result!.name).toBe("GetUsersIdPostsParams");
      expect(result!.properties).toHaveLength(3);

      // Path parameter
      expect(result!.properties[0]).toEqual({
        name: "id",
        description: "User ID",
        type: "string",
        required: true as const,
        in: "path",
      });

      // Query parameters
      expect(result!.properties[1]).toEqual({
        name: "limit",
        description: "Maximum number of results",
        type: "int",
        in: "query",
        defaultValue: 10,
      });

      expect(result!.properties[2]).toEqual({
        name: "offset",
        type: "int",
        in: "query",
        defaultValue: 0,
      });

      // Description should include parameter descriptions
      expect(result!.description).toContain(
        "Parameters for GET /users/{id}/posts",
      );
      expect(result!.description).toContain("id: User ID");
      expect(result!.description).toContain("limit: Maximum number of results");
    });

    it("should handle parameters without descriptions", () => {
      const parameters = [
        {
          name: "id",
          in: "path" as const,
          required: true as const,
          type: "string" as const,
        },
        {
          name: "format",
          in: "query" as const,
          type: "string" as const,
        },
      ];

      const result = createParameterModel(parameters, "/users/{id}", "get", [
        "paths",
        "/users/{id}",
        "get",
        "parameters",
      ]);

      expect(result).not.toBeNull();
      expect(result!.description).toBe("Parameters for GET /users/{id}");
      expect(result!.properties).toHaveLength(2);
    });

    it("should handle deprecated parameters", () => {
      const parameters = [
        {
          name: "oldParam",
          in: "query" as const,
          description: "This parameter is deprecated",
          type: "string" as const,
          deprecated: true as const,
        },
      ];

      const result = createParameterModel(
        parameters,
        "/api/v1/legacy",
        "post",
        ["paths", "/api/v1/legacy", "post", "parameters"],
      );

      expect(result).not.toBeNull();
      expect(result!.kind).toBe("parameter");
      expect(result!.properties[0].deprecated).toBe(true);
      expect(result!.name).toBe("PostApiV1LegacyParams");
    });
  });

  describe("parameterToParameterProperty", () => {
    it("should convert parameter to parameter property correctly", () => {
      const parameter = {
        name: "testParam",
        in: "query" as const,
        description: "A test parameter",
        required: true as const,
        type: "string" as const,
        nullable: true as const,
        defaultValue: "default",
        // deprecatedを省略（falseの場合はプロパティ自体を省略）
      } satisfies IRParameter;

      const result = parameterToParameterProperty(parameter);

      expect(result).toEqual({
        name: "testParam",
        type: "string",
        required: true as const,
        in: "query",
        description: "A test parameter",
        nullable: true,
        defaultValue: "default",
        // deprecatedとvalidationは省略（undefined）
      });
    });

    it("should handle minimal parameter", () => {
      const parameter = {
        name: "minimal",
        in: "path" as const,
        required: true as const,
        type: "string" as const,
      };

      const result = parameterToParameterProperty(parameter);

      expect(result).toEqual({
        name: "minimal",
        type: "string",
        required: true as const,
        in: "path",
      });
    });
  });

  describe("generateParameterModelName", () => {
    // 重要: このテストは期待値に合わせて修正
    // パスパラメータを含めて一意の名前を生成する
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
