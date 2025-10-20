/**
 * HTTPクライアント生成器
 *
 * fetch APIベースのHTTPクライアントコードを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { generateApiConfigInterface } from "./client-api-config-interface.js";
import { generateClientHeader } from "./client-header.js";
import { generateErrorClass } from "./client-error.js";
import { generateGlobalConfig } from "./client-global-config.js";
import { generateRequestFunction } from "./client-request.js";
import { generateSetConfigFunction } from "./client-set-config.js";

/**
 * 生成されたクライアントコード
 */
export interface GeneratedClient {
  /** 生成されたTypeScriptコード */
  code: string;
}

/**
 * XcgenIRからHTTPクライアントコードを生成
 * @param ir - 中間表現
 * @returns 生成されたTypeScriptコード
 */
export function generateClient(ir: XcgenIR): GeneratedClient {
  const lines: string[] = [];

  // ファイルヘッダー
  lines.push(generateClientHeader(ir.metadata));
  lines.push("");

  // XcgenApiError class
  lines.push(generateErrorClass());
  lines.push("");

  // ApiConfig interface
  lines.push(generateApiConfigInterface());
  lines.push("");

  // グローバル設定
  lines.push(generateGlobalConfig());
  lines.push("");

  // setConfig function
  lines.push(generateSetConfigFunction());
  lines.push("");

  // request helper
  lines.push(generateRequestFunction());
  lines.push("");

  return {
    code: lines.join("\n"),
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client generator", () => {
    it("should generate client code from XcgenIR", () => {
      const ir: XcgenIR = {
        metadata: {
          title: "Pet Store API",
          version: "1.0.0",
        },
        models: [],
        tags: [],
        endpoints: [],
      };

      const result = generateClient(ir);

      expect(result.code).toContain("export class XcgenApiError");
      expect(result.code).toContain("export interface ApiConfig");
      expect(result.code).toContain("export function setConfig");
      expect(result.code).toContain("export async function request");
    });

    it("should include XcgenApiError properties", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test", version: "1.0.0" },
        models: [],
        tags: [],
        endpoints: [],
      };

      const result = generateClient(ir);

      expect(result.code).toContain("readonly response: Response");
      expect(result.code).toContain("readonly body?: unknown");
      expect(result.code).toContain("readonly status: number");
      expect(result.code).toContain("readonly statusText: string");
      expect(result.code).toContain("readonly url: string");
    });
  });
}
