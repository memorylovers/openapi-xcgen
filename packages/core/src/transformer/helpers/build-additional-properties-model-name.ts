/**
 * additionalPropertiesの値型モデル名を生成
 *
 * 設計方針:
 * - additionalPropertiesの値は常に `{親モデル名}Item` サフィックス
 * - 例: MetricsData → MetricsDataItem
 * - REST APIの文脈で自然な命名（各アイテムを表す）
 */

import type { AdditionalPropertiesContext, VisitorContext } from "../types";
import { isAdditionalPropertiesContext } from "../../types/guards";

/**
 * additionalPropertiesの値型モデル名を生成
 *
 * @param contextOrParentName - AdditionalPropertiesContext、VisitorContext、または親モデル名
 * @returns モデル名（例: "MetricsDataItem"）
 *
 * @example Context使用
 * ```typescript
 * const context: AdditionalPropertiesContext = {
 *   kind: "additionalProperties",
 *   parentSchemaName: "MetricsData",
 *   ...
 * };
 * buildAdditionalPropertiesModelName(context)  // => "MetricsDataItem"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildAdditionalPropertiesModelName("MetricsData")  // => "MetricsDataItem"
 * ```
 */
export function buildAdditionalPropertiesModelName(
  contextOrParentName: AdditionalPropertiesContext | VisitorContext | string,
): string {
  let parentName: string;

  if (typeof contextOrParentName === "string") {
    // 後方互換性: 文字列を直接受け取る
    parentName = contextOrParentName;
  } else if (isAdditionalPropertiesContext(contextOrParentName)) {
    // AdditionalPropertiesContext
    parentName = contextOrParentName.parentSchemaName;
  } else {
    // その他のVisitorContext（循環依存回避のため、親名を外部から渡す想定）
    throw new Error(
      "buildAdditionalPropertiesModelName requires AdditionalPropertiesContext or string",
    );
  }

  return `${parentName}Item`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildAdditionalPropertiesModelName", () => {
    describe("Context-based usage", () => {
      it("should generate model name from AdditionalPropertiesContext", () => {
        const context: AdditionalPropertiesContext = {
          kind: "additionalProperties",
          documentPath: [
            "components",
            "schemas",
            "Test",
            "additionalProperties",
          ],
          rootSegment: "components",
          parentSchemaName: "MetricsData",
        };
        expect(buildAdditionalPropertiesModelName(context)).toBe(
          "MetricsDataItem",
        );
      });
    });

    describe("String-based usage (backward compatibility)", () => {
      it("should generate model name with Item suffix", () => {
        expect(buildAdditionalPropertiesModelName("MetricsData")).toBe(
          "MetricsDataItem",
        );
        expect(buildAdditionalPropertiesModelName("Settings")).toBe(
          "SettingsItem",
        );
        expect(buildAdditionalPropertiesModelName("Config")).toBe("ConfigItem");
      });

      it("should work with single-word names", () => {
        expect(buildAdditionalPropertiesModelName("User")).toBe("UserItem");
        expect(buildAdditionalPropertiesModelName("Data")).toBe("DataItem");
      });

      it("should work with PascalCase names", () => {
        expect(buildAdditionalPropertiesModelName("UserProfile")).toBe(
          "UserProfileItem",
        );
        expect(buildAdditionalPropertiesModelName("ApiResponse")).toBe(
          "ApiResponseItem",
        );
      });

      it("should handle empty string gracefully", () => {
        expect(buildAdditionalPropertiesModelName("")).toBe("Item");
      });
    });
  });
}
