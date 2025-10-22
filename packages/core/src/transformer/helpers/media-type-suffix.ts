import { pascalCase } from "es-toolkit/string";

const MEDIA_TYPE_SUFFIX_MAP: Record<string, string> = {
  "application/xml": "Xml",
  "text/xml": "TextXml",
  "application/xhtml+xml": "XhtmlXml",
  "application/x-www-form-urlencoded": "WwwFormUrlencoded",
  "multipart/form-data": "MultipartFormData",
  "text/plain": "TextPlain",
  "text/html": "Html",
  "application/octet-stream": "OctetStream",
  "application/pdf": "Pdf",
  "image/png": "Png",
  "image/jpeg": "Jpeg",
  "image/gif": "Gif",
};

/**
 * Get the suffix to append to component names for a given media type.
 * Defaults to PascalCasing the subtype when no explicit mapping exists.
 */
export function getMediaTypeSuffix(mediaType?: string): string {
  if (!mediaType) return "";

  const normalized = mediaType.toLowerCase();
  if (normalized === "application/json") return "";

  const mapped = MEDIA_TYPE_SUFFIX_MAP[normalized];
  if (mapped) return mapped;

  return pascalCase(
    normalized
      .replace(/^[^/]+\//, "")
      .replace(/[+.-]/g, " ")
      .replace(/\//g, " "),
  ).replace(/[^a-zA-Z0-9]/g, "");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getMediaTypeSuffix", () => {
    it("should return empty string for JSON", () => {
      expect(getMediaTypeSuffix("application/json")).toBe("");
    });

    it("should return mapped suffix for known media types", () => {
      expect(getMediaTypeSuffix("multipart/form-data")).toBe(
        "MultipartFormData",
      );
      expect(getMediaTypeSuffix("image/png")).toBe("Png");
      expect(getMediaTypeSuffix("text/xml")).toBe("TextXml");
    });

    it("should pascal case unknown media subtypes", () => {
      expect(
        getMediaTypeSuffix("application/vnd.example.custom-type+json"),
      ).toBe("VndExampleCustomTypeJson");
    });

    it("should handle undefined media type", () => {
      expect(getMediaTypeSuffix(undefined)).toBe("");
    });
  });
}
