/**
 * request関数生成
 */

import { generateRequestSignature } from "./client-request-signature";
import { generateUrlBuildingCode } from "./client-request-url";
import { generateHeaderBuildingCode } from "./client-request-headers";
import { generateFetchCode } from "./client-request-fetch";
import { generateErrorHandlingCode } from "./client-request-error";
import { generateResponseParseCode } from "./client-request-response";

/**
 * request関数のTypeScriptコードを生成
 * @returns request関数定義文字列
 */
export function generateRequestFunction(): string {
  const parts: string[] = [];

  // Function signature and parameter destructuring
  parts.push(generateRequestSignature());
  parts.push("");

  // URL building
  parts.push(generateUrlBuildingCode());
  parts.push("");

  // Headers
  parts.push(generateHeaderBuildingCode());
  parts.push("");

  // Fetch
  parts.push(generateFetchCode());
  parts.push("");

  // Error handling
  parts.push(generateErrorHandlingCode());
  parts.push("");

  // Response parsing
  parts.push(generateResponseParseCode());

  return parts.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request", () => {
    describe("generateRequestFunction", () => {
      it("should generate request function signature", () => {
        const result = generateRequestFunction();

        expect(result).toContain("export async function request<T>");
        expect(result).toContain("method: string");
        expect(result).toContain("path: string");
        expect(result).toContain("options: any");
        expect(result).toContain("init?: RequestInit");
        expect(result).toContain("Promise<T>");
      });

      it("should include URL building logic", () => {
        const result = generateRequestFunction();

        expect(result).toContain("Build URL with path parameters");
        expect(result).toContain("config.baseUrl");
        expect(result).toContain("Replace path parameters");
        expect(result).toContain("Add query parameters");
      });

      it("should include error handling", () => {
        const result = generateRequestFunction();

        expect(result).toContain("if (!response.ok)");
        expect(result).toContain("throw new XcgenApiError");
      });

      it("should handle different content types", () => {
        const result = generateRequestFunction();

        expect(result).toContain("Handle binary responses");
        expect(result).toContain("Handle JSON responses");
        expect(result).toContain("application/json");
        expect(result).toContain("response.blob()");
        expect(result).toContain("response.json()");
        expect(result).toContain("response.text()");
      });
    });
  });
}
