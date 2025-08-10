import type { OpenAPIDocument, XcgenIR } from "../types";
import { extractMetadata, extractModels } from "./extractors";

/**
 * Transform OpenAPI document to XcgenIR
 * @param doc - OpenAPI document to transform
 * @returns XcgenIR representation
 */
export function transform(doc: OpenAPIDocument): XcgenIR {
  return {
    metadata: extractMetadata(doc),
    models: extractModels(doc),
    enums: [],
    unions: [],
    services: [],
    servers: [],
  };
}
