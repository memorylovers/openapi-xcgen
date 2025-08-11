import { consola } from "consola";

/**
 * $ref文字列から名前を抽出
 * @param ref - $ref文字列（例: "#/components/schemas/User"）
 * @returns 抽出された名前（例: "User"）、無効な場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * # スキーマ参照
 * pet:
 *   $ref: '#/components/schemas/Pet'
 *   # → "Pet" を返す
 *
 * # レスポンス参照
 * error:
 *   $ref: '#/components/responses/NotFound'
 *   # → "NotFound" を返す
 *
 * # パラメータ参照
 * page:
 *   $ref: '#/components/parameters/PageParam'
 *   # → "PageParam" を返す
 *
 * # 外部ファイル参照
 * user:
 *   $ref: './schemas/User.yaml'
 *   # → "User.yaml" を返す
 *
 * # URL参照
 * address:
 *   $ref: 'https://example.com/schemas/Address'
 *   # → "Address" を返す
 * ```
 */
export function extractRefName(ref: string): string | null {
  // 空文字列や不正な値のチェック
  if (!ref || typeof ref !== "string") {
    consola.warn(`Invalid $ref value: ${ref}`);
    return null;
  }

  const parts = ref.split("/");
  const name = parts[parts.length - 1];

  // 最後の要素が空の場合は無効
  if (!name) {
    consola.warn(`Invalid $ref format: ${ref}`);
    return null;
  }

  return name;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("extractRefName", () => {
    it("should extract name from component refs", () => {
      expect(extractRefName("#/components/schemas/User")).toBe("User");
      expect(extractRefName("#/components/schemas/Pet")).toBe("Pet");
      expect(extractRefName("#/components/parameters/PageParam")).toBe(
        "PageParam",
      );
      expect(extractRefName("#/components/responses/NotFound")).toBe(
        "NotFound",
      );
    });

    it("should handle simple refs", () => {
      expect(extractRefName("User")).toBe("User");
      expect(extractRefName("Pet")).toBe("Pet");
    });

    it("should return null for empty or invalid refs", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      expect(extractRefName("")).toBe(null);
      expect(extractRefName("#/")).toBe(null);
      expect(extractRefName("#/components/schemas/")).toBe(null);

      expect(warnSpy).toHaveBeenCalledWith("Invalid $ref value: ");
      expect(warnSpy).toHaveBeenCalledWith("Invalid $ref format: #/");
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid $ref format: #/components/schemas/",
      );

      warnSpy.mockRestore();
    });

    it("should handle external refs", () => {
      expect(extractRefName("./schemas/User.yaml")).toBe("User.yaml");
      expect(extractRefName("../common/Error.json")).toBe("Error.json");
      expect(extractRefName("https://example.com/schemas/User")).toBe("User");
    });

    it("should handle refs with special characters", () => {
      expect(extractRefName("#/components/schemas/User-Profile")).toBe(
        "User-Profile",
      );
      expect(extractRefName("#/components/schemas/User_Profile")).toBe(
        "User_Profile",
      );
      expect(extractRefName("#/components/schemas/User.Profile")).toBe(
        "User.Profile",
      );
    });
  });
}
