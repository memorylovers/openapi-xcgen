/**
 * security-schemes-visitor.ts - SecuritySchemeObjectを処理してIRSecuritySchemeに変換
 *
 * OpenAPIのcomponents.securitySchemesセクションを処理し、
 * 各セキュリティスキームをIRSecuritySchemeに変換する。
 *
 * 責務:
 * - ApiKey、HTTP、OAuth2、OpenID Connectの各認証タイプの処理
 * - OAuth2フローの変換（implicit、password、clientCredentials、authorizationCode）
 * - $ref参照の解決（将来的な対応）
 */

import { consola } from "consola";
import type {
  IROAuthFlow,
  IROAuthFlows,
  IROAuth2SecurityScheme,
  IRSecurityScheme,
  ReferenceObject,
  SecuritySchemeObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";

/**
 * OAuth2フローセクションを変換
 */
function convertOAuthFlows(flows: Record<string, unknown>): IROAuthFlows {
  const result: IROAuthFlows = {};

  // implicit flow
  if (flows.implicit && typeof flows.implicit === "object") {
    const flow = flows.implicit as Record<string, unknown>;
    const implicitFlow: IROAuthFlow = {
      authorizationUrl: flow.authorizationUrl as string,
      scopes: {},
    };
    if (flow.refreshUrl) {
      implicitFlow.refreshUrl = flow.refreshUrl as string;
    }
    if (flow.scopes) {
      implicitFlow.scopes = flow.scopes as Record<string, string>;
    }
    result.implicit = implicitFlow;
  }

  // password flow
  if (flows.password && typeof flows.password === "object") {
    const flow = flows.password as Record<string, unknown>;
    const passwordFlow: IROAuthFlow = {
      tokenUrl: flow.tokenUrl as string,
      scopes: {},
    };
    if (flow.refreshUrl) {
      passwordFlow.refreshUrl = flow.refreshUrl as string;
    }
    if (flow.scopes) {
      passwordFlow.scopes = flow.scopes as Record<string, string>;
    }
    result.password = passwordFlow;
  }

  // clientCredentials flow
  if (flows.clientCredentials && typeof flows.clientCredentials === "object") {
    const flow = flows.clientCredentials as Record<string, unknown>;
    const clientCredentialsFlow: IROAuthFlow = {
      tokenUrl: flow.tokenUrl as string,
      scopes: {},
    };
    if (flow.refreshUrl) {
      clientCredentialsFlow.refreshUrl = flow.refreshUrl as string;
    }
    if (flow.scopes) {
      clientCredentialsFlow.scopes = flow.scopes as Record<string, string>;
    }
    result.clientCredentials = clientCredentialsFlow;
  }

  // authorizationCode flow
  if (flows.authorizationCode && typeof flows.authorizationCode === "object") {
    const flow = flows.authorizationCode as Record<string, unknown>;
    const authCodeFlow: IROAuthFlow = {
      authorizationUrl: flow.authorizationUrl as string,
      tokenUrl: flow.tokenUrl as string,
      scopes: {},
    };
    if (flow.refreshUrl) {
      authCodeFlow.refreshUrl = flow.refreshUrl as string;
    }
    if (flow.scopes) {
      authCodeFlow.scopes = flow.scopes as Record<string, string>;
    }
    result.authorizationCode = authCodeFlow;
  }

  return result;
}

/**
 * SecuritySchemeObjectをIRSecuritySchemeに変換
 *
 * @param securityScheme - OpenAPIのSecuritySchemeObject
 * @returns IRSecurityScheme、または変換不可の場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   securitySchemes:
 *     ApiKey:
 *       type: apiKey
 *       name: X-API-Key
 *       in: header
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     OAuth2:
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: https://example.com/oauth/authorize
 *           tokenUrl: https://example.com/oauth/token
 *           scopes:
 *             read: Read access
 *             write: Write access
 * ```
 */
export function visitSecurityScheme(
  securityScheme: SecuritySchemeObject | ReferenceObject,
): IRSecurityScheme | null {
  // $ref参照のチェック
  if (isReferenceObject(securityScheme)) {
    // $refはまだサポートしていない
    consola.warn(
      `Reference security scheme not supported yet: ${securityScheme.$ref}`,
    );
    return null;
  }

  const scheme = securityScheme as SecuritySchemeObject;

  // 共通フィールドの抽出
  const baseFields = {
    ...(scheme.description && { description: scheme.description }),
  };

  // 認証タイプごとの処理
  switch (scheme.type) {
    case "apiKey":
      return {
        type: "apiKey",
        name: scheme.name as string,
        in: scheme.in as "header" | "query" | "cookie",
        ...baseFields,
      };

    case "http":
      return {
        type: "http",
        scheme: scheme.scheme as string,
        ...(scheme.bearerFormat && {
          bearerFormat: scheme.bearerFormat as string,
        }),
        ...baseFields,
      };

    case "oauth2": {
      if (!scheme.flows) {
        consola.warn("OAuth2 security scheme without flows");
        return null;
      }

      const flows = convertOAuthFlows(scheme.flows as Record<string, unknown>);

      // 少なくとも1つのフローが必要
      if (
        !flows.implicit &&
        !flows.password &&
        !flows.clientCredentials &&
        !flows.authorizationCode
      ) {
        consola.warn("OAuth2 security scheme without valid flows");
        return null;
      }

      const oauth2Scheme: IROAuth2SecurityScheme = {
        type: "oauth2",
        flows,
        ...baseFields,
      };

      return oauth2Scheme;
    }

    case "openIdConnect":
      return {
        type: "openIdConnect",
        openIdConnectUrl: scheme.openIdConnectUrl as string,
        ...baseFields,
      };

    default: {
      // This should never happen if the types are correct, but we handle it anyway
      const unknownScheme = scheme as { type?: string };
      consola.warn(
        `Unsupported security scheme type: ${unknownScheme.type || "unknown"}`,
      );
      return null;
    }
  }
}

/**
 * components.securitySchemesセクション全体を処理
 *
 * @param securitySchemes - OpenAPIのsecuritySchemesオブジェクト
 * @returns スキーム名をキーとするIRSecuritySchemeのマップ
 */
export function visitSecuritySchemes(
  securitySchemes: Record<string, SecuritySchemeObject | ReferenceObject>,
): Record<string, IRSecurityScheme> {
  const result: Record<string, IRSecurityScheme> = {};

  for (const [name, scheme] of Object.entries(securitySchemes)) {
    if (!scheme) {
      consola.warn(`Invalid security scheme for "${name}": scheme is null`);
      continue;
    }

    const irScheme = visitSecurityScheme(scheme);
    if (irScheme) {
      result[name] = irScheme;
    }
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitSecurityScheme", () => {
    it("should convert API key security scheme", () => {
      const apiKeyScheme = {
        type: "apiKey" as const,
        name: "X-API-Key",
        in: "header" as const,
        description: "API key authentication",
      };

      const result = visitSecurityScheme(apiKeyScheme);

      expect(result).toEqual({
        type: "apiKey",
        name: "X-API-Key",
        in: "header",
        description: "API key authentication",
      });
    });

    it("should convert HTTP Bearer security scheme", () => {
      const bearerScheme = {
        type: "http" as const,
        scheme: "bearer",
        bearerFormat: "JWT",
      };

      const result = visitSecurityScheme(bearerScheme);

      expect(result).toEqual({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      });
    });

    it("should convert OAuth2 with authorization code flow", () => {
      const oauth2Scheme = {
        type: "oauth2" as const,
        flows: {
          authorizationCode: {
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            refreshUrl: "https://example.com/oauth/refresh",
            scopes: {
              read: "Read access",
              write: "Write access",
            },
          },
        },
      };

      const result = visitSecurityScheme(oauth2Scheme);

      expect(result).toEqual({
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://example.com/oauth/authorize",
            tokenUrl: "https://example.com/oauth/token",
            refreshUrl: "https://example.com/oauth/refresh",
            scopes: {
              read: "Read access",
              write: "Write access",
            },
          },
        },
      });
    });

    it("should convert OpenID Connect security scheme", () => {
      const openIdScheme = {
        type: "openIdConnect" as const,
        openIdConnectUrl:
          "https://example.com/.well-known/openid-configuration",
        description: "OpenID Connect authentication",
      };

      const result = visitSecurityScheme(openIdScheme);

      expect(result).toEqual({
        type: "openIdConnect",
        openIdConnectUrl:
          "https://example.com/.well-known/openid-configuration",
        description: "OpenID Connect authentication",
      });
    });

    it("should handle $ref reference", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const refScheme = {
        $ref: "#/components/securitySchemes/ApiKey",
      };

      const result = visitSecurityScheme(refScheme);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference security scheme not supported yet: #/components/securitySchemes/ApiKey",
      );

      warnSpy.mockRestore();
    });

    it("should handle unsupported type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const invalidScheme = {
        type: "invalid",
      } as unknown as SecuritySchemeObject;

      const result = visitSecurityScheme(invalidScheme);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Unsupported security scheme type: invalid",
      );

      warnSpy.mockRestore();
    });
  });

  describe("visitSecuritySchemes", () => {
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

      const result = visitSecuritySchemes(schemes);

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

      const result = visitSecuritySchemes(schemes);

      expect(Object.keys(result)).toEqual(["ValidScheme"]);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      warnSpy.mockRestore();
    });
  });
}
