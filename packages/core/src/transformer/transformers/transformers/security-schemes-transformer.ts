/**
 * security-schemes-transformer.ts - components.securitySchemesセクション全体を処理
 *
 * 責務:
 * - 複数のSecuritySchemeObjectの一括変換
 * - スキーム名をキーとするマップの生成
 */

import { consola } from "consola";
import type {
  IRSecurityScheme,
  ReferenceObject,
  SecuritySchemeObject,
} from "../../../types";
import { transformSecurityScheme } from "./security-scheme-transformer";

/**
 * components.securitySchemesセクション全体を処理
 *
 * @param securitySchemes - OpenAPIのsecuritySchemesオブジェクト
 * @returns スキーム名をキーとするIRSecuritySchemeのマップ
 */
export function transformSecuritySchemes(
  securitySchemes: Record<string, SecuritySchemeObject | ReferenceObject>,
): Record<string, IRSecurityScheme> {
  const result: Record<string, IRSecurityScheme> = {};

  for (const [name, scheme] of Object.entries(securitySchemes)) {
    if (!scheme) {
      consola.warn(`Invalid security scheme for "${name}": scheme is null`);
      continue;
    }

    const irScheme = transformSecurityScheme(scheme);
    if (irScheme) {
      result[name] = irScheme;
    }
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transformSecuritySchemes", () => {
    it("should process multiple security schemes", () => {
      const schemes = {
        ApiKey: {
          type: "apiKey" as const,
          name: "X-API-Key",
          in: "header" as const,
        },
        BearerAuth: {
          type: "http" as const,
          scheme: "bearer",
        },
      };

      const result = transformSecuritySchemes(schemes);

      expect(Object.keys(result)).toEqual(["ApiKey", "BearerAuth"]);
      expect(result.ApiKey.type).toBe("apiKey");
      expect(result.BearerAuth.type).toBe("http");
    });

    it("should skip invalid schemes", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schemes = {
        ValidScheme: {
          type: "apiKey" as const,
          name: "X-API-Key",
          in: "header" as const,
        },
        NullScheme: null as unknown as SecuritySchemeObject,
        InvalidScheme: {
          type: "invalid",
        } as unknown as SecuritySchemeObject,
      };

      const result = transformSecuritySchemes(schemes);

      expect(Object.keys(result)).toEqual(["ValidScheme"]);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      warnSpy.mockRestore();
    });
  });
}
