/**
 * documentPathから情報を抽出するパーサー関数群
 *
 * 設計原則:
 * - documentPathはYAMLのパスを正確に表現する唯一の真実のソース
 * - Contextはこれらのパーサー関数を使って情報を導出する
 * - パース失敗時はnullを返す（エラーを投げない）
 */

import type { IRHttpMethod } from "../../../types";

/**
 * Composition型（allOf/anyOf/oneOf）のdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseCompositionPath(["components", "schemas", "Extended", "allOf", "0"])
 * // => { parentSchemaName: "Extended", kind: "allOf", index: 0 }
 *
 * parseCompositionPath(["components", "schemas", "Pet", "oneOf", "1"])
 * // => { parentSchemaName: "Pet", kind: "oneOf", index: 1 }
 * ```
 */
export function parseCompositionPath(documentPath: string[]): {
  parentSchemaName: string;
  kind: "allOf" | "anyOf" | "oneOf";
  index: number;
} | null {
  if (documentPath.length < 5) {
    return null;
  }

  const kind = documentPath.at(-2);
  if (kind !== "allOf" && kind !== "anyOf" && kind !== "oneOf") {
    return null;
  }

  const indexStr = documentPath.at(-1);
  const index = Number(indexStr);
  if (isNaN(index) || index < 0) {
    return null;
  }

  const parentSchemaName = documentPath.at(-3);
  if (!parentSchemaName) {
    return null;
  }

  return { parentSchemaName, kind, index };
}

/**
 * Parameterのpaths配下のdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseParameterPath(["paths", "/users", "get", "limit"])
 * // => { method: "get", pathTemplate: "/users" }
 *
 * parseParameterPath(["paths", "/users/{id}", "get", "id"])
 * // => { method: "get", pathTemplate: "/users/{id}" }
 * ```
 */
export function parseParameterPath(documentPath: string[]): {
  method: IRHttpMethod;
  pathTemplate: string;
} | null {
  // ParametersContext: ["paths", pathTemplate, method] - 3要素
  // ParameterContext: ["paths", pathTemplate, method, parameterName] - 4要素
  if (documentPath.length < 3) {
    return null;
  }

  if (documentPath[0] !== "paths") {
    return null;
  }

  const pathTemplate = documentPath[1];
  const method = documentPath[2] as IRHttpMethod;

  return { method, pathTemplate };
}

/**
 * Responsesのpaths配下のdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseResponsePath(["paths", "/users", "get", "responses", "200"])
 * // => { method: "get", pathTemplate: "/users", statusCode: "200" }
 *
 * parseResponsePath(["paths", "/users/{id}", "get", "responses", "404"])
 * // => { method: "get", pathTemplate: "/users/{id}", statusCode: "404" }
 * ```
 */
export function parseResponsePath(documentPath: string[]): {
  method: IRHttpMethod;
  pathTemplate: string;
  statusCode: string;
} | null {
  if (documentPath.length < 5) {
    return null;
  }

  if (documentPath[0] !== "paths") {
    return null;
  }

  const responsesIndex = documentPath.indexOf("responses");
  if (responsesIndex === -1 || responsesIndex < 3) {
    return null;
  }

  const pathTemplate = documentPath[1];
  const method = documentPath[2] as IRHttpMethod;
  const statusCode = documentPath[responsesIndex + 1];

  if (!statusCode) {
    return null;
  }

  return { method, pathTemplate, statusCode };
}

/**
 * RequestBodyのpaths配下のdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseRequestBodyPath(["paths", "/users", "post", "requestBody"])
 * // => { method: "post", pathTemplate: "/users" }
 *
 * parseRequestBodyPath(["paths", "/users/{id}", "put", "requestBody"])
 * // => { method: "put", pathTemplate: "/users/{id}" }
 * ```
 */
export function parseRequestBodyPath(documentPath: string[]): {
  method: IRHttpMethod;
  pathTemplate: string;
} | null {
  if (documentPath.length < 4) {
    return null;
  }

  if (documentPath[0] !== "paths") {
    return null;
  }

  if (!documentPath.includes("requestBody")) {
    return null;
  }

  const pathTemplate = documentPath[1];
  const method = documentPath[2] as IRHttpMethod;

  return { method, pathTemplate };
}

/**
 * AdditionalPropertiesのdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseAdditionalPropertiesPath(["components", "schemas", "MetricsData", "additionalProperties"])
 * // => { parentSchemaName: "MetricsData" }
 *
 * parseAdditionalPropertiesPath(["paths", "/users", "get", "responses", "200", "content", "application/json", "schema", "GetUsers200Response", "additionalProperties"])
 * // => { parentSchemaName: "GetUsers200Response" }
 * ```
 */
export function parseAdditionalPropertiesPath(documentPath: string[]): {
  parentSchemaName: string;
} | null {
  const additionalPropertiesIndex = documentPath.indexOf(
    "additionalProperties",
  );
  if (additionalPropertiesIndex === -1) {
    return null;
  }

  // components配下のシンプルなケースのみサポート
  if (
    documentPath[0] === "components" &&
    documentPath[1] === "schemas" &&
    additionalPropertiesIndex === 3
  ) {
    const parentSchemaName = documentPath[2];
    return { parentSchemaName };
  }

  // paths配下: 親スキーマ名は additionalProperties の直前の要素
  // 例: ["paths", "/users", "get", "responses", "200", "content", "application/json", "schema", "GetUsers200Response", "additionalProperties"]
  // → parentSchemaName = "GetUsers200Response"
  if (documentPath[0] === "paths" && additionalPropertiesIndex > 0) {
    const parentSchemaName = documentPath[additionalPropertiesIndex - 1];
    return { parentSchemaName };
  }

  // ネストしたケースは将来拡張可能
  return null;
}

/**
 * Schemaのcomponents配下のdocumentPathをパース
 *
 * @param documentPath - パース対象のdocumentPath
 * @returns パース結果、失敗時はnull
 *
 * @example
 * ```typescript
 * parseSchemaPath(["components", "schemas", "User"])
 * // => { schemaName: "User" }
 *
 * parseSchemaPath(["components", "schemas", "Product"])
 * // => { schemaName: "Product" }
 * ```
 */
export function parseSchemaPath(documentPath: string[]): {
  schemaName: string;
} | null {
  if (documentPath.length < 3) {
    return null;
  }

  if (documentPath[0] !== "components" || documentPath[1] !== "schemas") {
    return null;
  }

  const schemaName = documentPath[2];
  if (!schemaName) {
    return null;
  }

  return { schemaName };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("parseCompositionPath", () => {
    it("should parse allOf path", () => {
      const result = parseCompositionPath([
        "components",
        "schemas",
        "Extended",
        "allOf",
        "0",
      ]);
      expect(result).toEqual({
        parentSchemaName: "Extended",
        kind: "allOf",
        index: 0,
      });
    });

    it("should parse oneOf path", () => {
      const result = parseCompositionPath([
        "components",
        "schemas",
        "Pet",
        "oneOf",
        "1",
      ]);
      expect(result).toEqual({
        parentSchemaName: "Pet",
        kind: "oneOf",
        index: 1,
      });
    });

    it("should parse anyOf path", () => {
      const result = parseCompositionPath([
        "components",
        "schemas",
        "Item",
        "anyOf",
        "2",
      ]);
      expect(result).toEqual({
        parentSchemaName: "Item",
        kind: "anyOf",
        index: 2,
      });
    });

    it("should return null for invalid path", () => {
      expect(
        parseCompositionPath(["components", "schemas", "User"]),
      ).toBeNull();
      expect(
        parseCompositionPath([
          "components",
          "schemas",
          "User",
          "properties",
          "0",
        ]),
      ).toBeNull();
    });

    it("should return null for non-numeric index", () => {
      expect(
        parseCompositionPath([
          "components",
          "schemas",
          "Extended",
          "allOf",
          "abc",
        ]),
      ).toBeNull();
    });
  });

  describe("parseParameterPath", () => {
    it("should parse parameter path", () => {
      const result = parseParameterPath([
        "paths",
        "/users",
        "get",
        "parameters",
      ]);
      expect(result).toEqual({
        method: "get",
        pathTemplate: "/users",
      });
    });

    it("should parse parameter path with path params", () => {
      const result = parseParameterPath([
        "paths",
        "/users/{id}",
        "get",
        "parameters",
      ]);
      expect(result).toEqual({
        method: "get",
        pathTemplate: "/users/{id}",
      });
    });

    it("should return null for invalid path", () => {
      expect(parseParameterPath(["components", "schemas", "User"])).toBeNull();
      expect(parseParameterPath(["paths", "/users"])).toBeNull();
    });
  });

  describe("parseResponsePath", () => {
    it("should parse response path", () => {
      const result = parseResponsePath([
        "paths",
        "/users",
        "get",
        "responses",
        "200",
      ]);
      expect(result).toEqual({
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
      });
    });

    it("should parse response path with different status code", () => {
      const result = parseResponsePath([
        "paths",
        "/users/{id}",
        "get",
        "responses",
        "404",
      ]);
      expect(result).toEqual({
        method: "get",
        pathTemplate: "/users/{id}",
        statusCode: "404",
      });
    });

    it("should return null for invalid path", () => {
      expect(parseResponsePath(["components", "schemas", "User"])).toBeNull();
      expect(parseResponsePath(["paths", "/users", "get"])).toBeNull();
    });
  });

  describe("parseRequestBodyPath", () => {
    it("should parse request body path", () => {
      const result = parseRequestBodyPath([
        "paths",
        "/users",
        "post",
        "requestBody",
      ]);
      expect(result).toEqual({
        method: "post",
        pathTemplate: "/users",
      });
    });

    it("should parse request body path with path params", () => {
      const result = parseRequestBodyPath([
        "paths",
        "/users/{id}",
        "put",
        "requestBody",
      ]);
      expect(result).toEqual({
        method: "put",
        pathTemplate: "/users/{id}",
      });
    });

    it("should return null for invalid path", () => {
      expect(
        parseRequestBodyPath(["components", "schemas", "User"]),
      ).toBeNull();
      expect(parseRequestBodyPath(["paths", "/users", "get"])).toBeNull();
    });
  });

  describe("parseAdditionalPropertiesPath", () => {
    it("should parse additional properties path in components", () => {
      const result = parseAdditionalPropertiesPath([
        "components",
        "schemas",
        "MetricsData",
        "additionalProperties",
      ]);
      expect(result).toEqual({
        parentSchemaName: "MetricsData",
      });
    });

    it("should parse paths-based additional properties", () => {
      const result = parseAdditionalPropertiesPath([
        "paths",
        "/users",
        "get",
        "responses",
        "200",
        "content",
        "application/json",
        "schema",
        "GetUsers200Response",
        "additionalProperties",
      ]);
      expect(result).toEqual({ parentSchemaName: "GetUsers200Response" });
    });

    it("should return null for invalid path", () => {
      expect(
        parseAdditionalPropertiesPath(["components", "schemas", "User"]),
      ).toBeNull();
    });
  });

  describe("parseSchemaPath", () => {
    it("should parse schema path", () => {
      const result = parseSchemaPath(["components", "schemas", "User"]);
      expect(result).toEqual({
        schemaName: "User",
      });
    });

    it("should parse schema path with different name", () => {
      const result = parseSchemaPath(["components", "schemas", "Product"]);
      expect(result).toEqual({
        schemaName: "Product",
      });
    });

    it("should return null for invalid path", () => {
      expect(parseSchemaPath(["paths", "/users", "get"])).toBeNull();
      expect(parseSchemaPath(["components", "schemas"])).toBeNull();
    });
  });
}
