/**
 * additionalPropertiesの値型コンポーネント名を生成
 *
 * 設計方針:
 * - additionalPropertiesの値は常に `{親コンポーネント名}Item` サフィックス
 * - 例: MetricsData → MetricsDataItem
 * - REST APIの文脈で自然な命名（各アイテムを表す）
 */

import { consola } from "consola";
import type { AdditionalPropertiesContext, VisitorContext } from "../../types";
import { isAdditionalPropertiesContext } from "../../../types/guards";

/**
 * additionalPropertiesの値型コンポーネント名を生成
 *
 * @param contextOrParentName - AdditionalPropertiesContext、VisitorContext、または親コンポーネント名
 * @returns コンポーネント名（例: "MetricsDataItem"）
 *
 * @example Context使用
 * ```typescript
 * const context: AdditionalPropertiesContext = {
 *   kind: "additionalProperties",
 *   parentSchemaName: "MetricsData",
 *   ...
 * };
 * buildAdditionalPropertiesComponentName(context)  // => "MetricsDataItem"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildAdditionalPropertiesComponentName("MetricsData")  // => "MetricsDataItem"
 * ```
 */
export function buildAdditionalPropertiesComponentName(
  contextOrParentName: AdditionalPropertiesContext | VisitorContext | string,
): string {
  let parentName: string;

  if (typeof contextOrParentName === "string") {
    // 後方互換性: 文字列を直接受け取る（Visitor構築時に使用）
    parentName = contextOrParentName;
  } else if (isAdditionalPropertiesContext(contextOrParentName)) {
    // AdditionalPropertiesContext（Contextのフィールドから直接取得）
    parentName = contextOrParentName.parentSchemaName;
  } else {
    // その他のVisitorContext（循環依存回避のため、親名を外部から渡す想定）
    consola.warn(
      "buildAdditionalPropertiesComponentName requires AdditionalPropertiesContext or string",
    );
    return "UnknownItem";
  }

  return `${parentName}Item`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildAdditionalPropertiesComponentName", () => {
    describe("Context-based usage", () => {
      it("should generate model name from AdditionalPropertiesContext", () => {
        const context: AdditionalPropertiesContext = {
          kind: "additionalProperties",
          documentPath: [
            "components",
            "schemas",
            "MetricsData",
            "additionalProperties",
          ],
          rootSegment: "components",
          parentSchemaName: "MetricsData",
        };
        expect(buildAdditionalPropertiesComponentName(context)).toBe(
          "MetricsDataItem",
        );
      });
    });

    describe("String-based usage (backward compatibility)", () => {
      it("should generate model name with Item suffix", () => {
        expect(buildAdditionalPropertiesComponentName("MetricsData")).toBe(
          "MetricsDataItem",
        );
        expect(buildAdditionalPropertiesComponentName("Settings")).toBe(
          "SettingsItem",
        );
        expect(buildAdditionalPropertiesComponentName("Config")).toBe(
          "ConfigItem",
        );
      });

      it("should work with single-word names", () => {
        expect(buildAdditionalPropertiesComponentName("User")).toBe("UserItem");
        expect(buildAdditionalPropertiesComponentName("Data")).toBe("DataItem");
      });

      it("should work with PascalCase names", () => {
        expect(buildAdditionalPropertiesComponentName("UserProfile")).toBe(
          "UserProfileItem",
        );
        expect(buildAdditionalPropertiesComponentName("ApiResponse")).toBe(
          "ApiResponseItem",
        );
      });

      it("should handle empty string gracefully", () => {
        expect(buildAdditionalPropertiesComponentName("")).toBe("Item");
      });
    });
  });
}
