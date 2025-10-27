/**
 * additionalPropertiesの値型モデル名を生成
 *
 * 設計方針:
 * - additionalPropertiesの値は常に `{親モデル名}Item` サフィックス
 * - 例: MetricsData → MetricsDataItem
 * - REST APIの文脈で自然な命名（各アイテムを表す）
 */

/**
 * additionalPropertiesの値型モデル名を生成
 *
 * @param parentName - 親モデル名
 * @returns モデル名（例: "MetricsDataItem"）
 *
 * @example
 * ```typescript
 * buildAdditionalPropertiesModelName("MetricsData")  // => "MetricsDataItem"
 * buildAdditionalPropertiesModelName("Settings")     // => "SettingsItem"
 * buildAdditionalPropertiesModelName("Config")       // => "ConfigItem"
 * ```
 */
export function buildAdditionalPropertiesModelName(parentName: string): string {
  return `${parentName}Item`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildAdditionalPropertiesModelName", () => {
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
}
