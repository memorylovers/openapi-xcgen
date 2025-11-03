/**
 * IRモデル解決ヘルパー
 *
 * IRRefからモデル名を逆引きする
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "./naming";

/**
 * IRRefのreferencePathからモデル名を解決
 *
 * @param referencePath - IRRefの参照パス (例: "#/paths/::pets/get/responses/200/content/application::json/schema")
 * @param models - IRモデルリスト
 * @returns モデル名 (例: "GetPets200Response")、見つからない場合は参照パスの最後のセグメント
 *
 * @example
 * ```typescript
 * const models: IRModel[] = [
 *   {
 *     kind: "array",
 *     name: "GetPets200Response",
 *     referencePath: "#/paths/::pets/get/responses/200/content/application::json/schema",
 *     itemType: { kind: "ref", name: "#/components/schemas/Pet" }
 *   }
 * ];
 *
 * resolveModelName("#/paths/::pets/get/responses/200/content/application::json/schema", models);
 * // => "GetPets200Response"
 * ```
 */
export function resolveModelName(
  referencePath: string,
  models: readonly IRModel[],
): string {
  // モデルリストから referencePath が一致するものを探す
  const model = models.find((m) => m.referencePath === referencePath);

  if (model) {
    return toTypeName(model.name);
  }

  // 見つからない場合は、参照パスの最後のセグメントを返す（従来の動作）
  const fallbackName = referencePath.split("/").at(-1) ?? referencePath;
  return toTypeName(fallbackName);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("model-resolver", () => {
    describe("resolveModelName", () => {
      it("should resolve model name from referencePath", () => {
        const models: IRModel[] = [
          {
            kind: "array",
            name: "GetPets200Response",
            referencePath:
              "#/paths/::pets/get/responses/200/content/application::json/schema",
            itemType: { kind: "ref", name: "#/components/schemas/Pet" },
          },
        ];

        const result = resolveModelName(
          "#/paths/::pets/get/responses/200/content/application::json/schema",
          models,
        );

        expect(result).toBe("GetPets200Response");
      });

      it("should return last segment as fallback when model not found", () => {
        const models: IRModel[] = [];

        const result = resolveModelName("#/components/schemas/Pet", models);

        expect(result).toBe("Pet");
      });

      it("should handle snake_case in fallback", () => {
        const models: IRModel[] = [];

        const result = resolveModelName(
          "#/components/schemas/user_profile",
          models,
        );

        expect(result).toBe("UserProfile");
      });

      it("should resolve complex inline schema paths", () => {
        const models: IRModel[] = [
          {
            kind: "object",
            name: "GetUsers200Response",
            referencePath:
              "#/paths/::users/get/responses/200/content/application::json/schema",
            properties: [],
          },
        ];

        const result = resolveModelName(
          "#/paths/::users/get/responses/200/content/application::json/schema",
          models,
        );

        expect(result).toBe("GetUsers200Response");
      });
    });
  });
}
