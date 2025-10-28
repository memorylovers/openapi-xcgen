/**
 * インラインスキーマのモデル名を生成
 *
 * コンテキストの種類に応じて適切な命名戦略を適用します。
 * 現在はComposition型（allOf/anyOf/oneOf）に対応しています。
 */

import { consola } from "consola";
import { isCompositionContext } from "../../../types/guards";
import type { CompositionContext, VisitorContextKind } from "../../types";

/**
 * インラインスキーマのモデル名を生成（Composition型専用）
 *
 * @param contextOrParentName - CompositionContextまたは親モデル名
 * @param kind - コンテキスト種別（文字列使用時のみ）
 * @param index - インデックス（文字列使用時のみ）
 * @returns モデル名（例: "UserAllOf0"）
 *
 * @example Context使用
 * ```typescript
 * const context: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "User",
 *   index: 0,
 *   ...
 * };
 * buildInlineModelName(context)  // => "UserAllOf0"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildInlineModelName("User", "allOf", 0)  // => "UserAllOf0"
 * ```
 */

export function buildInlineModelName(context: CompositionContext): string;
// eslint-disable-next-line no-redeclare
export function buildInlineModelName(
  parentName: string,
  kind: VisitorContextKind,
  index: number,
): string;
// eslint-disable-next-line no-redeclare
export function buildInlineModelName(
  contextOrParentName: CompositionContext | string,
  kind?: VisitorContextKind,
  index?: number,
): string {
  let parentSchemaName: string;
  let contextKind: "allOf" | "anyOf" | "oneOf";
  let contextIndex: number;

  if (typeof contextOrParentName === "string") {
    // 後方互換性: 旧シグネチャ（Visitor構築時に使用）
    if (!kind || index === undefined) {
      consola.warn(
        "kind and index are required when using string parentName; using defaults (allOf, 0)",
      );
      // Fallback: use default values
      parentSchemaName = contextOrParentName;
      contextKind = "allOf";
      contextIndex = 0;
    } else if (kind !== "allOf" && kind !== "anyOf" && kind !== "oneOf") {
      consola.warn(
        `Unsupported kind for inline model name generation: ${kind}; using allOf`,
      );
      // Fallback: use allOf
      parentSchemaName = contextOrParentName;
      contextKind = "allOf";
      contextIndex = index;
    } else {
      parentSchemaName = contextOrParentName;
      contextKind = kind;
      contextIndex = index;
    }
  } else {
    // 新シグネチャ: Context対応（Contextのフィールドから直接取得）
    if (!isCompositionContext(contextOrParentName)) {
      const ctx = contextOrParentName as {
        kind?: string;
        documentPath: string[];
      };
      consola.warn(
        `Invalid context for inline model name generation: expected CompositionContext, got ${ctx.kind}`,
      );
      // Fallback: use documentPath last element or "Unknown"
      return ctx.documentPath.at(-1) ?? "Unknown";
    }

    parentSchemaName = contextOrParentName.parentSchemaName;
    contextKind = contextOrParentName.kind;
    contextIndex = contextOrParentName.index;
  }

  const kindSuffix =
    contextKind === "allOf"
      ? "AllOf"
      : contextKind === "anyOf"
        ? "AnyOf"
        : "OneOf";

  return `${parentSchemaName}${kindSuffix}${contextIndex}`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("buildInlineModelName", () => {
    describe("Context-based usage", () => {
      it("should generate allOf model names from context", () => {
        const context: CompositionContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "User", "allOf", "0"],
          rootSegment: "components",
          parentSchemaName: "User",
          index: 0,
        };
        expect(buildInlineModelName(context)).toBe("UserAllOf0");
      });

      it("should generate oneOf model names from context", () => {
        const context: CompositionContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Shape", "oneOf", "1"],
          rootSegment: "components",
          parentSchemaName: "Shape",
          index: 1,
        };
        expect(buildInlineModelName(context)).toBe("ShapeOneOf1");
      });

      it("should generate anyOf model names from context", () => {
        const context: CompositionContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Animal", "anyOf", "2"],
          rootSegment: "components",
          parentSchemaName: "Animal",
          index: 2,
        };
        expect(buildInlineModelName(context)).toBe("AnimalAnyOf2");
      });
    });

    describe("String-based usage (backward compatibility)", () => {
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

      it("should warn and use fallback for unsupported kinds", () => {
        const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

        expect(buildInlineModelName("Test", "schema" as any, 0)).toBe(
          "TestAllOf0",
        );
        expect(warnSpy).toHaveBeenCalledWith(
          "Unsupported kind for inline model name generation: schema; using allOf",
        );

        warnSpy.mockClear();
        expect(buildInlineModelName("Test", "parameter" as any, 0)).toBe(
          "TestAllOf0",
        );
        expect(warnSpy).toHaveBeenCalledWith(
          "Unsupported kind for inline model name generation: parameter; using allOf",
        );

        warnSpy.mockRestore();
      });
    });
  });
}
