/**
 * インラインスキーマのモデル名を生成
 *
 * コンテキストの種類に応じて適切な命名戦略を適用します。
 * 現在はComposition型（allOf/anyOf/oneOf）に対応しています。
 */

import type { VisitorContextKind } from "../types";

/**
 * インラインスキーマのモデル名を生成
 *
 * コンテキストの種類に応じて適切な命名戦略を適用します。
 * 現在はComposition型（allOf/anyOf/oneOf）に対応しています。
 *
 * @param parentName - 親スキーマ名
 * @param kind - コンテキスト種別
 * @param index - インデックス
 * @returns モデル名（例: "UserAllOf0", "PetAnyOf1"）
 *
 * @example
 * ```typescript
 * buildInlineModelName("User", "allOf", 0)   // => "UserAllOf0"
 * buildInlineModelName("Pet", "anyOf", 1)    // => "PetAnyOf1"
 * buildInlineModelName("Shape", "oneOf", 2)  // => "ShapeOneOf2"
 * ```
 */
export function buildInlineModelName(
  parentName: string,
  kind: VisitorContextKind,
  index: number,
): string {
  // Composition型の処理
  if (kind === "allOf" || kind === "anyOf" || kind === "oneOf") {
    const kindSuffix =
      kind === "allOf" ? "AllOf" : kind === "anyOf" ? "AnyOf" : "OneOf";
    return `${parentName}${kindSuffix}${index}`;
  }

  // 将来的に他のkindが必要になった場合はここに追加
  // 例: if (kind === "schema") { ... }

  throw new Error(`Unsupported kind for inline model name generation: ${kind}`);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildInlineModelName", () => {
    describe("Composition types", () => {
      it("should generate allOf model names", () => {
        expect(buildInlineModelName("User", "allOf", 0)).toBe("UserAllOf0");
        expect(buildInlineModelName("Extended", "allOf", 1)).toBe(
          "ExtendedAllOf1",
        );
        expect(buildInlineModelName("SuperBaby", "allOf", 2)).toBe(
          "SuperBabyAllOf2",
        );
      });

      it("should generate anyOf model names", () => {
        expect(buildInlineModelName("Pet", "anyOf", 0)).toBe("PetAnyOf0");
        expect(buildInlineModelName("Fruit", "anyOf", 1)).toBe("FruitAnyOf1");
        expect(buildInlineModelName("Response", "anyOf", 2)).toBe(
          "ResponseAnyOf2",
        );
      });

      it("should generate oneOf model names", () => {
        expect(buildInlineModelName("Item", "oneOf", 0)).toBe("ItemOneOf0");
        expect(buildInlineModelName("Shape", "oneOf", 1)).toBe("ShapeOneOf1");
        expect(buildInlineModelName("Animal", "oneOf", 2)).toBe("AnimalOneOf2");
      });
    });

    describe("Unsupported kinds", () => {
      it("should throw for schema kind", () => {
        expect(() => buildInlineModelName("Test", "schema", 0)).toThrow(
          "Unsupported kind for inline model name generation: schema",
        );
      });

      it("should throw for parameter kind", () => {
        expect(() => buildInlineModelName("Test", "parameter", 0)).toThrow(
          "Unsupported kind for inline model name generation: parameter",
        );
      });

      it("should throw for requestBody kind", () => {
        expect(() => buildInlineModelName("Test", "requestBody", 0)).toThrow(
          "Unsupported kind for inline model name generation: requestBody",
        );
      });
    });
  });
}
