/**
 * metadata-transformer.ts - InfoObjectをIRMetadataに変換
 *
 * 責務:
 * - OpenAPI InfoObjectの変換処理
 * - IRMetadataの生成
 */

import type { InfoObject, IRMetadata } from "../../../types";

/**
 * InfoObjectをIRMetadataに変換
 *
 * @param info - OpenAPI InfoObject
 * @returns IRMetadata
 *
 * @example OpenAPI YAML
 * ```yaml
 * info:
 *   title: "Pet Store API"
 *   version: "1.0.0"
 *   description: "This is a sample Pet Store Server"
 * ```
 */
export function transformMetadata(info: InfoObject): IRMetadata {
  return {
    title: info.title,
    version: info.version,
    ...(info.description && { description: info.description }),
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformMetadata", () => {
    it("should convert minimal info to IRMetadata", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
      };

      const result = transformMetadata(info);

      expect(result).toEqual({
        title: "My API",
        version: "1.0.0",
      });
    });

    it("should convert full info to IRMetadata", () => {
      const info: InfoObject = {
        title: "Pet Store API",
        version: "1.0.0",
        description: "This is a sample Pet Store Server",
      };

      const result = transformMetadata(info);

      expect(result).toEqual({
        title: "Pet Store API",
        version: "1.0.0",
        description: "This is a sample Pet Store Server",
      });
    });

    it("should handle undefined optional fields", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
      };

      const result = transformMetadata(info);

      expect(result).toEqual({
        title: "My API",
        version: "1.0.0",
      });
    });
  });
}
