/**
 * スキーマファイル生成
 *
 * IRModel → Valibotスキーマコード（個別ファイル）への変換
 */

import type { IRModel } from "@openapi-xcgen/core";
import {
  generateTypeImports,
  processImports,
} from "../../../helpers/import-handler";
import { toTypeName } from "../../../helpers/naming";
import type { HookableInstance } from "../../../hooks";
import { generateSchemaModel } from "../schemas-model";
import { extractSchemaDependencies } from "./extract-dependencies";

/**
 * 純粋関数: IRModel → Valibotスキーマコード
 *
 * 個別のスキーマファイルを生成する。依存する他のスキーマのimport文も自動生成される。
 *
 * @param model - IRModel
 * @param hooks - Hook instance（オプション）
 * @param schemaImports - Hook経由で追加されたimport（オプション）
 * @returns Valibotスキーマコード（null: 生成スキップ）
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "object",
 *   name: "User",
 *   properties: [...]
 * };
 * generateSchemaFile(model);
 * // => "/**\n * Valibot validation schema for User\n * ...\n *\/\n\nimport * as v from "valibot";\n\nexport const UserSchema = ..."
 * ```
 */
export function generateSchemaFile(
  model: IRModel,
  hooks?: HookableInstance,
  schemaImports?: string[],
): string | null {
  const schemaCode = generateSchemaModel(model, hooks);

  if (!schemaCode) {
    return null;
  }

  const lines: string[] = [];
  lines.push("/**");
  lines.push(` * Valibot validation schema for ${model.name}`);
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");
  lines.push('import * as v from "valibot";');

  // Hookで追加されたインポートを処理
  let rawImports: string[] = [];
  let typeNames: string[] = [];
  if (schemaImports && schemaImports.length > 0) {
    const processed = processImports(schemaImports);
    rawImports = processed.rawImports;
    typeNames = processed.typeNames;
  }

  // 完全なimport文を先に出力
  if (rawImports.length > 0) {
    for (const rawImport of rawImports) {
      lines.push(rawImport);
    }
  }

  // 依存する他のスキーマのインポート文を生成
  const dependencies = extractSchemaDependencies(model);
  // 自分自身への参照は除外
  const currentSchemaName = `${toTypeName(model.name)}Schema`;
  dependencies.delete(currentSchemaName);

  // 型名インポート（依存スキーマ + Hook追加型名）をマージ
  const allTypeImports = new Set([...dependencies, ...typeNames]);
  if (allTypeImports.size > 0) {
    // スキーマは値として使用されるため、'import type' ではなく 'import' を使用
    const importLines = generateTypeImports(
      Array.from(allTypeImports),
      ".",
      false,
    );
    for (const importLine of importLines) {
      lines.push(importLine);
    }
  }

  // import文があれば空行を追加
  // if (rawImports.length > 0 || allTypeImports.size > 0) {
  lines.push("");
  // }
  lines.push(schemaCode);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateSchemaFile", () => {
    it("should generate schema file with header", () => {
      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const result = generateSchemaFile(model);

      expect(result).toContain("/**");
      expect(result).toContain(" * Valibot validation schema for User");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain('import * as v from "valibot";');
      expect(result).toContain("export const UserSchema = v.object({");
    });

    it("should generate imports for referenced schemas", () => {
      const model: IRModel = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "user",
            type: { kind: "ref", name: "#/components/schemas/User" },
            required: true,
          },
          {
            name: "product",
            type: { kind: "ref", name: "#/components/schemas/Product" },
            required: true,
          },
        ],
      };

      const result = generateSchemaFile(model);

      expect(result).toContain(
        "import { ProductSchema } from './ProductSchema';",
      );
      expect(result).toContain("import { UserSchema } from './UserSchema';");
      expect(result).toContain("export const OrderSchema = v.object({");
    });

    it("should not import self-reference", () => {
      const model: IRModel = {
        kind: "object",
        name: "TreeNode",
        referencePath: "#/components/schemas/TreeNode",
        properties: [
          {
            name: "value",
            type: "string",
            required: true,
          },
          {
            name: "children",
            type: {
              kind: "array",
              itemType: { kind: "ref", name: "#/components/schemas/TreeNode" },
            },
          },
        ],
      };

      const result = generateSchemaFile(model);

      expect(result).not.toContain("import { TreeNodeSchema }");
      expect(result).toContain("export const TreeNodeSchema = v.object({");
    });

    it("should return null for parameter models", () => {
      const model: IRModel = {
        kind: "parameter",
        name: "GetUserParams",
        referencePath: "#/paths/~1users~1{userId}/get/parameters",
        properties: [
          {
            name: "userId",
            type: "string",
            required: true,
            in: "path",
          },
        ],
      };

      const result = generateSchemaFile(model);

      // generateSchemaModel() がparameterモデルに対してnullを返す
      expect(result).toBeNull();
    });

    it("should sort imports alphabetically", () => {
      const model: IRModel = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "zzzItem",
            type: { kind: "ref", name: "#/components/schemas/ZItem" },
            required: true,
          },
          {
            name: "aaaItem",
            type: { kind: "ref", name: "#/components/schemas/AItem" },
            required: true,
          },
          {
            name: "mmmItem",
            type: { kind: "ref", name: "#/components/schemas/MItem" },
            required: true,
          },
        ],
      };

      const result = generateSchemaFile(model);

      const lines = result!.split("\n");
      const importLines = lines.filter(
        (line) => line.startsWith("import") && !line.includes("valibot"),
      );

      expect(importLines[0]).toContain("AItemSchema");
      expect(importLines[1]).toContain("MItemSchema");
      expect(importLines[2]).toContain("ZItemSchema");
    });
  });
}
