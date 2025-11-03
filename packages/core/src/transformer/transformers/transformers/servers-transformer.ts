/**
 * Servers Transformer - v2 Transformer Architecture
 *
 * ServersをIRServerに変換します。
 * 既存のvisitors/servers-visitor.tsを統一インターフェースに準拠させた実装です。
 *
 * NOTE: servers変換はschema変換と異なり、modelsを抽出しません。
 * しかし、統一インターフェースに準拠することで、将来の拡張性を確保します。
 */

import type { IRServer, ServerObject } from "../../../types";

/**
 * Servers変換の結果
 *
 * 統一インターフェースとは異なり、serversはIRServerの配列を直接返します。
 * （IRTypeやIRModelとは性質が異なるため）
 */
export interface ServersTransformResult {
  /** 変換されたサーバー定義の配列 */
  servers: IRServer[] | undefined;
}

/**
 * ServerObject配列をIRServer配列に変換
 *
 * @param servers - OpenAPIのServerObject配列
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * servers:
 *   - url: https://{environment}.example.com/{version}
 *     description: Production server
 *     variables:
 *       environment:
 *         default: api
 *         enum: [api, staging]
 *       version:
 *         default: v1
 * ```
 */
export function transformServers(
  servers: ServerObject[] | undefined,
): ServersTransformResult {
  if (!servers || servers.length === 0) {
    return { servers: undefined };
  }

  const transformedServers = servers.map((server) => {
    const irServer: IRServer = {
      url: server.url,
      ...(server.description && { description: server.description }),
    };

    // variablesの処理
    if (server.variables) {
      irServer.variables = {};
      for (const [name, variable] of Object.entries(server.variables)) {
        irServer.variables[name] = {
          default: variable.default,
          ...(variable.enum && { enum: variable.enum }),
          ...(variable.description && { description: variable.description }),
        };
      }
    }

    return irServer;
  });

  return { servers: transformedServers };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformServers", () => {
    it("should return undefined servers for undefined input", () => {
      const result = transformServers(undefined);
      expect(result.servers).toBeUndefined();
    });

    it("should return undefined servers for empty array", () => {
      const result = transformServers([]);
      expect(result.servers).toBeUndefined();
    });

    it("should handle simple server without variables", () => {
      const servers: ServerObject[] = [
        {
          url: "https://api.example.com/v1",
          description: "Production server",
        },
      ];

      const result = transformServers(servers);

      expect(result.servers).toEqual([
        {
          url: "https://api.example.com/v1",
          description: "Production server",
        },
      ]);
    });

    it("should handle server with variables", () => {
      const servers: ServerObject[] = [
        {
          url: "https://{environment}.example.com/{version}",
          description: "Production server",
          variables: {
            environment: {
              default: "api",
              enum: ["api", "staging"],
            },
            version: {
              default: "v1",
            },
          },
        },
      ];

      const result = transformServers(servers);

      expect(result.servers).toEqual([
        {
          url: "https://{environment}.example.com/{version}",
          description: "Production server",
          variables: {
            environment: {
              default: "api",
              enum: ["api", "staging"],
            },
            version: {
              default: "v1",
            },
          },
        },
      ]);
    });

    it("should handle multiple servers", () => {
      const servers: ServerObject[] = [
        {
          url: "https://api.example.com/v1",
          description: "Production",
        },
        {
          url: "https://staging.example.com/v1",
          description: "Staging",
        },
      ];

      const result = transformServers(servers);

      expect(result.servers).toEqual([
        {
          url: "https://api.example.com/v1",
          description: "Production",
        },
        {
          url: "https://staging.example.com/v1",
          description: "Staging",
        },
      ]);
    });

    it("should handle server without description", () => {
      const servers: ServerObject[] = [
        {
          url: "https://api.example.com",
        },
      ];

      const result = transformServers(servers);

      expect(result.servers).toEqual([
        {
          url: "https://api.example.com",
        },
      ]);
    });

    it("should handle variable with description but no enum", () => {
      const servers: ServerObject[] = [
        {
          url: "https://api.example.com/{path}",
          variables: {
            path: {
              default: "v1",
              description: "API version",
            },
          },
        },
      ];

      const result = transformServers(servers);

      expect(result.servers).toEqual([
        {
          url: "https://api.example.com/{path}",
          variables: {
            path: {
              default: "v1",
              description: "API version",
            },
          },
        },
      ]);
    });
  });
}
