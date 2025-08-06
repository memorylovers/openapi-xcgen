import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type ReferenceObject = OpenAPIV3_1.ReferenceObject;
export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

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
 * ドキュメントがOpenAPI 3.0.x形式かどうかを判定
 */
export function isOpenAPIV3Document(doc: unknown): doc is OpenAPIV3.Document {
  return (
    doc !== null &&
    doc !== undefined &&
    typeof doc === "object" &&
    "openapi" in doc &&
    typeof doc.openapi === "string" &&
    doc.openapi.startsWith("3.0")
  );
}

/**
 * ドキュメントがOpenAPI 3.1.x形式かどうかを判定
 */
export function isOpenAPIV3_1Document(
  doc: unknown,
): doc is OpenAPIV3_1.Document {
  return (
    doc !== null &&
    doc !== undefined &&
    typeof doc === "object" &&
    "openapi" in doc &&
    typeof doc.openapi === "string" &&
    doc.openapi.startsWith("3.1")
  );
}
