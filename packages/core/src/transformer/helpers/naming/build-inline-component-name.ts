/**
 * インラインスキーマのコンポーネント名を生成
 *
 * コンテキストの種類に応じて適切な命名戦略を適用します。
 * 現在はComposition型（allOf/anyOf/oneOf）に対応しています。
 */

import { consola } from "consola";
import { isCompositionContext } from "../../../types/guards";
import type { CompositionContext, VisitorContextKind } from "../../types";

/**
 * インラインスキーマのコンポーネント名を生成（Composition型専用）
 *
 * @param contextOrParentName - CompositionContextまたは親コンポーネント名
 * @param kind - コンテキスト種別（文字列使用時のみ）
 * @param index - インデックス（文字列使用時のみ）
 * @returns コンポーネント名（例: "UserAllOf0"）
 *
 * @example Context使用
 * ```typescript
 * const context: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "User",
 *   index: 0,
 *   ...
 * };
 * buildInlineComponentName(context)  // => "UserAllOf0"
 * ```
 *
 * @example 文字列使用（後方互換性）
 * ```typescript
 * buildInlineComponentName("User", "allOf", 0)  // => "UserAllOf0"
 * ```
 */

export function buildInlineComponentName(context: CompositionContext): string;
// eslint-disable-next-line no-redeclare
export function buildInlineComponentName(
  parentName: string,
  kind: VisitorContextKind,
  index: number,
): string;
// eslint-disable-next-line no-redeclare
export function buildInlineComponentName(
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
        `Unsupported kind for inline component name generation: ${kind}; using allOf`,
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
        `Invalid context for inline component name generation: expected CompositionContext, got ${ctx.kind}`,
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

  describe("buildInlineComponentName", () => {
    describe("Context-based usage", () => {
      it("should generate allOf component names from context", () => {
        const context: CompositionContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "User", "allOf", "0"],
          rootSegment: "components",
          parentSchemaName: "User",
          index: 0,
        };
        expect(buildInlineComponentName(context)).toBe("UserAllOf0");
      });

      it("should generate oneOf component names from context", () => {
        const context: CompositionContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Shape", "oneOf", "1"],
          rootSegment: "components",
          parentSchemaName: "Shape",
          index: 1,
        };
        expect(buildInlineComponentName(context)).toBe("ShapeOneOf1");
      });

      it("should generate anyOf component names from context", () => {
        const context: CompositionContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Animal", "anyOf", "2"],
          rootSegment: "components",
          parentSchemaName: "Animal",
          index: 2,
        };
        expect(buildInlineComponentName(context)).toBe("AnimalAnyOf2");
      });
    });

    describe("String-based usage (backward compatibility)", () => {
      it("should generate allOf component names", () => {
        expect(buildInlineComponentName("User", "allOf", 0)).toBe("UserAllOf0");
        expect(buildInlineComponentName("Extended", "allOf", 1)).toBe(
          "ExtendedAllOf1",
        );
        expect(buildInlineComponentName("SuperBaby", "allOf", 2)).toBe(
          "SuperBabyAllOf2",
        );
      });

      it("should generate anyOf component names", () => {
        expect(buildInlineComponentName("Pet", "anyOf", 0)).toBe("PetAnyOf0");
        expect(buildInlineComponentName("Fruit", "anyOf", 1)).toBe(
          "FruitAnyOf1",
        );
        expect(buildInlineComponentName("Response", "anyOf", 2)).toBe(
          "ResponseAnyOf2",
        );
      });

      it("should generate oneOf component names", () => {
        expect(buildInlineComponentName("Item", "oneOf", 0)).toBe("ItemOneOf0");
        expect(buildInlineComponentName("Shape", "oneOf", 1)).toBe(
          "ShapeOneOf1",
        );
        expect(buildInlineComponentName("Animal", "oneOf", 2)).toBe(
          "AnimalOneOf2",
        );
      });

      it("should warn and use fallback for unsupported kinds", () => {
        const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

        expect(
          buildInlineComponentName("Test", "schema" as VisitorContextKind, 0),
        ).toBe("TestAllOf0");
        expect(warnSpy).toHaveBeenCalledWith(
          "Unsupported kind for inline component name generation: schema; using allOf",
        );

        warnSpy.mockClear();
        expect(
          buildInlineComponentName(
            "Test",
            "parameter" as VisitorContextKind,
            0,
          ),
        ).toBe("TestAllOf0");
        expect(warnSpy).toHaveBeenCalledWith(
          "Unsupported kind for inline component name generation: parameter; using allOf",
        );

        warnSpy.mockRestore();
      });
    });
  });
}
