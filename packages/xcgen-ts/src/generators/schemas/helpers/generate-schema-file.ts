/**
 * スキーマファイル生成
 *
 * IRComponent → Valibotスキーマコード（個別ファイル）への変換
 */

import type { IRComponent } from "@openapi-xcgen/core";
import {
  generateTypeImports,
  processImports,
} from "../../../helpers/import-handler";
import { escapeJSDocComment } from "../../../helpers/jsdoc-comment";
import { toTypeName } from "../../../helpers/naming";
import type { TypeGenerationContext } from "../../types/generation-context";
import { generateSchemaModel } from "../schemas-model";
import { extractSchemaDependencies } from "./extract-dependencies";

/**
 * 純粋関数: IRComponent → Valibotスキーマコード
 *
 * 個別のスキーマファイルを生成する。依存する他のスキーマのimport文も自動生成される。
 *
 * @param model - IRComponent
 * @param ctx - Type generation context
 * @returns Valibotスキーマコード（null: 生成スキップ）
 *
 * @example
 * ```typescript
 * const model: IRComponent = {
 *   kind: "object",
 *   name: "User",
 *   properties: [...]
 * };
 * generateSchemaFile(model, ctx);
 * // => "/**\n * Valibot validation schema for User\n * ...\n *\/\n\nimport * as v from "valibot";\n\nexport const UserSchema = ..."
 * ```
 */
export function generateSchemaFile(
  model: IRComponent,
  ctx: TypeGenerationContext,
): string | null {
  const schemaCode = generateSchemaModel(model, ctx);

  if (!schemaCode) {
    return null;
  }

  // schemaFile:generate Hook を呼び出して追加インポートを取得
  let customImports: string[] = [];
  let finalSchemaCode = schemaCode;
  let finalComment = `Valibot validation schema for ${model.name}\nAuto-generated from OpenAPI specification`;

  if (ctx.hooks) {
    const tsCode = {
      name: toTypeName(model.name),
      code: schemaCode,
      imports: [],
      comment: `Valibot validation schema for ${model.name}\nAuto-generated from OpenAPI specification`,
    };
    ctx.hooks.callHook("schemaFile:generate", {
      model,
      tsCode,
      extensions: "extensions" in model ? model.extensions : undefined,
    });
    customImports = tsCode.imports;
    finalSchemaCode = tsCode.code;
    finalComment = tsCode.comment ?? finalComment;
  }

  const lines: string[] = [];
  lines.push("/**");
  const commentLines = finalComment.split("\n");
  for (const line of commentLines) {
    lines.push(` * ${escapeJSDocComment(line)}`);
  }
  lines.push(" */");
  lines.push("");
  lines.push('import * as v from "valibot";');

  // Hookで追加されたインポートを処理
  let rawImports: string[] = [];
  let typeNames: string[] = [];
  if (customImports.length > 0) {
    const processed = processImports(customImports);
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
  lines.push(finalSchemaCode);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const mockCtx: TypeGenerationContext = {
    ir: {
      metadata: { title: "Test API", version: "1.0.0" },
      components: [],
      tags: [],
      endpoints: [],
    },
  };
  const { describe, it, expect } = import.meta.vitest;

  describe("generateSchemaFile", () => {
    it("should generate schema file with header", () => {
      const model: IRComponent = {
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

      const result = generateSchemaFile(model, mockCtx);

      expect(result).toContain("/**");
      expect(result).toContain(" * Valibot validation schema for User");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain('import * as v from "valibot";');
      expect(result).toContain("export const UserSchema = v.object({");
    });

    it("should generate imports for referenced schemas", () => {
      const model: IRComponent = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "user",
            type: { kind: "ref", referencePath: "#/components/schemas/User" },
            required: true,
          },
          {
            name: "product",
            type: {
              kind: "ref",
              referencePath: "#/components/schemas/Product",
            },
            required: true,
          },
        ],
      };

      const result = generateSchemaFile(model, mockCtx);

      expect(result).toContain(
        "import { ProductSchema } from './ProductSchema';",
      );
      expect(result).toContain("import { UserSchema } from './UserSchema';");
      expect(result).toContain("export const OrderSchema = v.object({");
    });

    it("should not import self-reference", () => {
      const model: IRComponent = {
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
              kind: "ref",
              referencePath: "#/components/schemas/TreeNodeChildren", // 配列は独立したモデルとして抽出される
            },
          },
        ],
      };

      const result = generateSchemaFile(model, mockCtx);

      expect(result).not.toContain("import { TreeNodeSchema }");
      expect(result).toContain("export const TreeNodeSchema = v.object({");
    });

    it("should return null for parameter models", () => {
      const model: IRComponent = {
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

      const result = generateSchemaFile(model, mockCtx);

      // generateSchemaModel() がparameterモデルに対してnullを返す
      expect(result).toBeNull();
    });

    it("should sort imports alphabetically", () => {
      const model: IRComponent = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "zzzItem",
            type: { kind: "ref", referencePath: "#/components/schemas/ZItem" },
            required: true,
          },
          {
            name: "aaaItem",
            type: { kind: "ref", referencePath: "#/components/schemas/AItem" },
            required: true,
          },
          {
            name: "mmmItem",
            type: { kind: "ref", referencePath: "#/components/schemas/MItem" },
            required: true,
          },
        ],
      };

      const result = generateSchemaFile(model, mockCtx);

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
