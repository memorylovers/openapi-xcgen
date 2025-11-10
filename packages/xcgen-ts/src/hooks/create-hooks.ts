/**
 * Hook インスタンスの作成
 *
 * シンプルな同期 Hook システム（純粋関数のみ）
 */

import type { IRComponent, IRProperty } from "@openapi-xcgen/core";
import type {
  HookableInstance,
  HookContext,
  HookHandler,
  Hooks,
  PropertyGenerateContext,
} from "./types";

// Re-export for external use
export type { HookableInstance };

/**
 * 各Hook名に対応するHandlerの配列を管理する型
 */
type HookHandlersRecord = {
  [K in keyof Hooks]?: HookHandler<HookContext<K>>[];
};

/**
 * 単一のHookを登録するヘルパー関数
 *
 * ジェネリック型パラメータ K により、Hook名に対応する正確なContext型を推論
 *
 * @param hookHandlers - Hook ハンドラの Record
 * @param name - Hook 名
 * @param handlers - Hook ハンドラ（単一または配列）
 *
 * @remarks
 * Hook ハンドラ内で例外が発生した場合、例外は捕捉されず呼び出し元に伝播します。
 * 複数のハンドラが登録されている場合、最初の例外で処理が中断され、後続のハンドラは実行されません。
 */
function registerHook<K extends keyof Hooks>(
  hookHandlers: HookHandlersRecord,
  name: K,
  handlers: Hooks[K],
): void {
  if (handlers) {
    const handlerArray = Array.isArray(handlers) ? handlers : [handlers];
    hookHandlers[name] = handlerArray;
  }
}

/**
 * Hook システムを初期化
 *
 * @param userHooks - ユーザー定義の Hook（xcgen.config.ts から読み込まれる）
 * @returns Hook インスタンス
 *
 * @remarks
 * **例外処理について**:
 * - Hook ハンドラ内で例外が発生した場合、例外は捕捉されず `callHook` の呼び出し元に伝播します
 * - 複数のハンドラが登録されている場合、最初の例外で処理が中断され、後続のハンドラは実行されません
 * - Fail-fast 原則に従い、ユーザーのバグを早期に検出します
 *
 * @example
 * ```typescript
 * const hooks = createHooks({
 *   'property:generate': (ctx) => {
 *     // カスタム処理（純粋関数、同期のみ）
 *     ctx.tsCode.typeName = "CustomType";
 *   }
 * });
 *
 * // Hook呼び出し（同期）
 * hooks.callHook('property:generate', context);
 * ```
 */
export function createHooks(userHooks?: Hooks): HookableInstance {
  // Hook ハンドラを Record で管理
  const hookHandlers: HookHandlersRecord = {};

  // ユーザー定義 Hook を登録
  if (userHooks) {
    for (const name of Object.keys(userHooks) as Array<keyof Hooks>) {
      registerHook(hookHandlers, name, userHooks[name]);
    }
  }

  return {
    callHook(name, context) {
      const handlers = hookHandlers[name];
      if (!handlers) return;

      for (const handler of handlers) {
        handler(context);
      }
    },
  };
}

// === in-source testing ===

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const dummyProperty: IRProperty = {
    name: "test",
    type: "string",
    required: true,
  };
  const dummyModel: IRComponent = {
    kind: "object",
    name: "TestModel",
    referencePath: "#/components/schemas/TestModel",
    properties: [],
  };

  describe("createHooks", () => {
    it("should create hook instance without user hooks", () => {
      const hooks = createHooks();
      expect(hooks).toBeDefined();
      expect(typeof hooks.callHook).toBe("function");
    });

    it("should register user hooks", () => {
      let called = false;
      const hooks = createHooks({
        "property:generate": () => {
          called = true;
        },
      });

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      hooks.callHook("property:generate", context);

      expect(called).toBe(true);
    });

    it("should register multiple hooks for same event", () => {
      const calls: string[] = [];
      const hooks = createHooks({
        "property:generate": [
          () => {
            calls.push("hook1");
          },
          () => {
            calls.push("hook2");
          },
        ],
      });

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      hooks.callHook("property:generate", context);

      expect(calls).toEqual(["hook1", "hook2"]);
    });

    it("should allow hooks to modify context tsCode", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          ctx.tsCode.typeName = "CustomType";
        },
      });

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      hooks.callHook("property:generate", context);

      expect(context.tsCode.typeName).toBe("CustomType");
    });

    it("should handle hooks without user hooks gracefully", () => {
      const hooks = createHooks();

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      // Hook呼び出しはエラーを投げない
      expect(() => {
        hooks.callHook("property:generate", context);
      }).not.toThrow();
    });

    it("should propagate exceptions thrown in hook handlers", () => {
      const hooks = createHooks({
        "property:generate": () => {
          throw new Error("Hook error");
        },
      });

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      // Hook内の例外が呼び出し元に伝播する
      expect(() => {
        hooks.callHook("property:generate", context);
      }).toThrow("Hook error");
    });

    it("should stop executing subsequent hooks when exception is thrown", () => {
      const calls: string[] = [];
      const hooks = createHooks({
        "property:generate": [
          () => {
            calls.push("hook1");
          },
          () => {
            calls.push("hook2");
            throw new Error("Hook2 error");
          },
          () => {
            calls.push("hook3"); // このhookは実行されない
          },
        ],
      });

      const context: PropertyGenerateContext = {
        property: dummyProperty,
        model: dummyModel,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      // 例外が発生する
      expect(() => {
        hooks.callHook("property:generate", context);
      }).toThrow("Hook2 error");

      // hook1とhook2は実行されたが、hook3は実行されていない
      expect(calls).toEqual(["hook1", "hook2"]);
    });
  });
}
