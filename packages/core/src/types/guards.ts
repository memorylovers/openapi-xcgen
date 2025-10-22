import type {
  AllOfContext,
  AnyOfContext,
  OneOfContext,
  ParameterContext,
  PathsRequestBodyContext,
  PathsResponseContext,
  RequestBodyContext,
  ResponseContext,
  VisitorContext,
} from "../transformer/types.js";
import type { IRAllOfModel, IRModel, ReferenceObject } from "./index";

/**
 * オブジェクトが$ref参照オブジェクトかどうかを判定
 */
export function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "$ref" in obj
  );
}

/**
 * IRModelがIRAllOfModelかどうかを判定
 */
export function isIRAllOfModel(model: IRModel): model is IRAllOfModel {
  return model.kind === "allOf";
}

/**
 * 文字列がComposition型（allOf/oneOf/anyOf）かどうかを判定
 */
export function isCompositionType(
  value: string,
): value is "allOf" | "oneOf" | "anyOf" {
  return value === "allOf" || value === "oneOf" || value === "anyOf";
}

/**
 * VisitorContextがCompositionContext（AllOf/OneOf/AnyOf）かどうかを判定
 */
export function isCompositionContext(
  context: VisitorContext,
): context is AllOfContext | OneOfContext | AnyOfContext {
  return (
    context.kind === "allOf" ||
    context.kind === "oneOf" ||
    context.kind === "anyOf"
  );
}

/**
 * VisitorContextがParameterContextかどうかを判定
 */
export function isParameterContext(
  context: VisitorContext,
): context is ParameterContext {
  return context.kind === "parameter";
}

/**
 * VisitorContextがRequestBodyContextかどうかを判定
 */
export function isRequestBodyContext(
  context: VisitorContext,
): context is RequestBodyContext {
  return (
    context.kind === "requestBody" || context.kind === "componentsRequestBody"
  );
}

/**
 * VisitorContextがResponseContextかどうかを判定
 */
export function isResponseContext(
  context: VisitorContext,
): context is ResponseContext {
  return context.kind === "response" || context.kind === "componentsResponse";
}

/**
 * RequestBodyContextがPathsRequestBodyContextかどうかを判定
 */
export function isPathsRequestBodyContext(
  context: RequestBodyContext,
): context is PathsRequestBodyContext {
  return context.kind === "requestBody";
}

/**
 * ResponseContextがPathsResponseContextかどうかを判定
 */
export function isPathsResponseContext(
  context: ResponseContext,
): context is PathsResponseContext {
  return context.kind === "response";
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("Type Guards", () => {
    describe("isReferenceObject", () => {
      it("should identify reference object", () => {
        expect(isReferenceObject({ $ref: "#/components/schemas/User" })).toBe(
          true,
        );
        expect(isReferenceObject({ type: "string" })).toBe(false);
        expect(isReferenceObject(null)).toBe(false);
        expect(isReferenceObject(undefined)).toBe(false);
        expect(isReferenceObject("")).toBe(false);
        expect(isReferenceObject(123)).toBe(false);
        expect(isReferenceObject([])).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(isReferenceObject({ $ref: "" })).toBe(true); // 空文字列でも$refがあればtrue
        expect(isReferenceObject({ $ref: null })).toBe(true); // nullでも$refキーがあればtrue
        expect(isReferenceObject({ ref: "#/components/schemas/User" })).toBe(
          false,
        ); // $なしはfalse
      });
    });

    describe("isIRAllOfModel", () => {
      it("should identify allOf model", () => {
        const allOfModel: IRModel = {
          kind: "allOf",
          name: "Extended",
          referencePath: "#/components/schemas/Extended",
          schemas: [],
        };
        expect(isIRAllOfModel(allOfModel)).toBe(true);
      });

      it("should return false for other model types", () => {
        const objectModel: IRModel = {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [],
        };
        expect(isIRAllOfModel(objectModel)).toBe(false);

        const enumModel: IRModel = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [],
        };
        expect(isIRAllOfModel(enumModel)).toBe(false);
      });
    });

    describe("isCompositionType", () => {
      it("should identify composition types", () => {
        expect(isCompositionType("allOf")).toBe(true);
        expect(isCompositionType("oneOf")).toBe(true);
        expect(isCompositionType("anyOf")).toBe(true);
      });

      it("should return false for non-composition types", () => {
        expect(isCompositionType("object")).toBe(false);
        expect(isCompositionType("array")).toBe(false);
        expect(isCompositionType("string")).toBe(false);
        expect(isCompositionType("")).toBe(false);
      });
    });

    describe("isCompositionContext", () => {
      it("should identify composition contexts", () => {
        const allOfContext: VisitorContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "Extended", "allOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(allOfContext)).toBe(true);

        const oneOfContext: VisitorContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Pet", "oneOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(oneOfContext)).toBe(true);

        const anyOfContext: VisitorContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Item", "anyOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(anyOfContext)).toBe(true);
      });

      it("should return false for non-composition contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isCompositionContext(baseContext)).toBe(false);

        const schemaContext: VisitorContext = {
          kind: "schema",
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isCompositionContext(schemaContext)).toBe(false);
      });
    });

    describe("isParameterContext", () => {
      it("should identify parameter contexts", () => {
        const parameterContext: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
          method: "get",
          pathTemplate: "/users",
        };
        expect(isParameterContext(parameterContext)).toBe(true);
      });

      it("should return false for non-parameter contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isParameterContext(baseContext)).toBe(false);
      });
    });

    describe("isRequestBodyContext", () => {
      it("should identify request body contexts", () => {
        const requestBodyContext: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
          method: "post",
          pathTemplate: "/users",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(isRequestBodyContext(requestBodyContext)).toBe(true);
      });

      it("should return false for non-request-body contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isRequestBodyContext(baseContext)).toBe(false);
      });
    });

    describe("isResponseContext", () => {
      it("should identify response contexts", () => {
        const responseContext: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users", "get", "responses", "200"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/users",
          statusCode: "200",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(isResponseContext(responseContext)).toBe(true);
      });

      it("should return false for non-response contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isResponseContext(baseContext)).toBe(false);
      });
    });
  });
}
