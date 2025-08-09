import type {
  IRContact,
  IRLicense,
  IRMetadata,
  OpenAPIDocument,
} from "../../types";

/**
 * Extract contact information from OpenAPI document
 */
function extractContact(doc: OpenAPIDocument): IRContact | undefined {
  if (!doc.info.contact) return undefined;

  return {
    name: doc.info.contact.name,
    url: doc.info.contact.url,
    email: doc.info.contact.email,
  };
}

/**
 * Extract license information from OpenAPI document
 */
function extractLicense(doc: OpenAPIDocument): IRLicense | undefined {
  if (!doc.info.license) return undefined;

  return {
    name: doc.info.license.name,
    url: doc.info.license.url,
  };
}

/**
 * Extract metadata from OpenAPI document
 * @param doc - OpenAPI document to extract metadata from
 * @returns IRMetadata object containing API metadata
 */
export function extractMetadata(doc: OpenAPIDocument): IRMetadata {
  return {
    title: doc.info.title,
    version: doc.info.version,
    description: doc.info.description,
    openApiVersion: "openapi" in doc ? doc.openapi : "3.0.0",
    contact: extractContact(doc),
    license: extractLicense(doc),
  };
}
