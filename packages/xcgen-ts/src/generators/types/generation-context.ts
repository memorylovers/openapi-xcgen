/**
 * 型生成時のコンテキスト
 *
 * IR全体、Hook、設定などを保持し、生成関数間で共有する
 */

import type { IRComponent, XcgenIR } from "@openapi-xcgen/core";
import type { HookableInstance } from "../../hooks/create-hooks";

/**
 * 型生成時のコンテキスト
 * IR全体、Hook、設定などを保持し、生成関数間で共有する
 */
export interface TypeGenerationContext {
  /**
   * IR全体
   */
  ir: XcgenIR;

  /**
   * Hook instance（オプション）
   */
  hooks?: HookableInstance;
}

/**
 * IRから参照パスでコンポーネントを検索
 *
 * @param ctx - TypeGenerationContext
 * @param referencePath - コンポーネントの参照パス（例: "#/components/schemas/User"）
 * @returns 見つかったコンポーネント、見つからない場合は undefined
 *
 * @example
 * ```typescript
 * const component = resolveComponent(ctx, "#/components/schemas/User");
 * if (component?.kind === "array") {
 *   console.log("Array component found:", component.name);
 * }
 * ```
 */
export function resolveComponent(
  ctx: TypeGenerationContext,
  referencePath: string,
): IRComponent | undefined {
  return ctx.ir.components.find((c) => c.referencePath === referencePath);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generation-context", () => {
    describe("resolveComponent", () => {
      it("should resolve component by referencePath", () => {
        const ctx: TypeGenerationContext = {
          ir: {
            metadata: {
              title: "Test API",
              version: "1.0.0",
            },
            components: [
              {
                kind: "object",
                name: "User",
                referencePath: "#/components/schemas/User",
                properties: [],
              },
              {
                kind: "array",
                name: "UserList",
                referencePath: "#/components/schemas/UserList",
                itemType: {
                  kind: "ref",
                  referencePath: "#/components/schemas/User",
                },
              },
            ],
            tags: [],
            endpoints: [],
          },
        };

        const component = resolveComponent(ctx, "#/components/schemas/User");
        expect(component).toBeDefined();
        expect(component?.kind).toBe("object");
        expect(component?.name).toBe("User");
      });

      it("should return undefined for non-existent referencePath", () => {
        const ctx: TypeGenerationContext = {
          ir: {
            metadata: {
              title: "Test API",
              version: "1.0.0",
            },
            components: [],
            tags: [],
            endpoints: [],
          },
        };

        const component = resolveComponent(
          ctx,
          "#/components/schemas/NonExistent",
        );
        expect(component).toBeUndefined();
      });

      it("should resolve array component", () => {
        const ctx: TypeGenerationContext = {
          ir: {
            metadata: {
              title: "Test API",
              version: "1.0.0",
            },
            components: [
              {
                kind: "array",
                name: "UserIds",
                referencePath: "#/components/schemas/UserIds",
                itemType: "string",
              },
            ],
            tags: [],
            endpoints: [],
          },
        };

        const component = resolveComponent(ctx, "#/components/schemas/UserIds");
        expect(component).toBeDefined();
        expect(component?.kind).toBe("array");
        expect(component?.name).toBe("UserIds");
      });
    });
  });
}
