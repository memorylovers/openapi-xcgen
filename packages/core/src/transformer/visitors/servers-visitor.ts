/**
 * servers-visitor.ts - ServersをIRServerに変換
 *
 * OpenAPIのServersオブジェクトを処理し、IRServerに変換する。
 *
 * 責務:
 * - ルートレベルのserversの処理
 * - URLテンプレートと変数定義の保持
 */

import type { IRServer, ServerObject } from "../../types";

/**
 * ServerObject配列をIRServer配列に変換
 *
 * @param servers - OpenAPIのServerObject配列
 * @returns IRServer配列、または undefined
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
export function visitServers(
  servers: ServerObject[] | undefined,
): IRServer[] | undefined {
  if (!servers || servers.length === 0) {
    return undefined;
  }

  return servers.map((server) => {
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
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitServers", () => {
    it("should return undefined for undefined servers", () => {
      const result = visitServers(undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty servers array", () => {
      const result = visitServers([]);
      expect(result).toBeUndefined();
    });

    it("should handle simple server without variables", () => {
      const servers: ServerObject[] = [
        {
          url: "https://api.example.com/v1",
          description: "Production server",
        },
      ];

      const result = visitServers(servers);

      expect(result).toEqual([
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

      const result = visitServers(servers);

      expect(result).toEqual([
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

      const result = visitServers(servers);

      expect(result).toEqual([
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

      const result = visitServers(servers);

      expect(result).toEqual([
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

      const result = visitServers(servers);

      expect(result).toEqual([
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
