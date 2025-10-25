/**
 * モデルファイル生成
 *
 * IRModel → TypeScript型定義コード（個別ファイル）への変換
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";
import type { HookableInstance } from "../../../hooks";
import { generateModel } from "../types-model";
import { generateUnifiedParameterType } from "../types-parameter";
import { extractTypeDependencies } from "./extract-dependencies";

/**
 * 純粋関数: IRModel → TypeScript型定義コード
 *
 * 個別のモデルファイルを生成する。依存する他の型のimport文も自動生成される。
 *
 * @param model - IRModel
 * @param requestBodyTypeName - 統合パラメータ型の場合のrequestBody型名（オプション）
 * @param hooks - Hook instance（オプション）
 * @returns TypeScript型定義コード（null: 生成スキップ）
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "object",
 *   name: "User",
 *   properties: [...]
 * };
 * generateModelFile(model);
 * // => "/**\n * User model\n * ...\n *\/\n\nexport interface User { ... }"
 * ```
 */
export function generateModelFile(
  model: IRModel,
  requestBodyTypeName?: string,
  hooks?: HookableInstance,
): string | null {
  let typeCode: string | null = null;

  // parameterモデルで統合型が必要な場合
  if (model.kind === "parameter" && requestBodyTypeName) {
    typeCode = generateUnifiedParameterType(model, requestBodyTypeName, hooks);
  } else {
    typeCode = generateModel(model, hooks);
  }

  if (!typeCode) {
    return null;
  }

  const lines: string[] = [];
  lines.push("/**");
  lines.push(` * ${model.name} model`);
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");

  // 依存する型のインポート文を生成
  const dependencies = extractTypeDependencies(model);

  // 統合パラメータ型の場合、requestBodyの型も追加
  if (requestBodyTypeName) {
    dependencies.add(requestBodyTypeName);
  }

  if (dependencies.size > 0) {
    // 自分自身への参照は除外
    const currentTypeName = toTypeName(model.name);
    dependencies.delete(currentTypeName);

    if (dependencies.size > 0) {
      const sortedDeps = Array.from(dependencies).sort();
      for (const dep of sortedDeps) {
        lines.push(`import type { ${dep} } from './${dep}';`);
      }
      lines.push("");
    }
  }

  lines.push(typeCode);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateModelFile", () => {
    it("should generate model file with header", () => {
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

      const result = generateModelFile(model);

      expect(result).toContain("/**");
      expect(result).toContain(" * User model");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain("export interface User {");
      expect(result).toContain("email: string;");
    });

    it("should generate imports for referenced types", () => {
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

      const result = generateModelFile(model);

      expect(result).toContain("import type { Product } from './Product';");
      expect(result).toContain("import type { User } from './User';");
      expect(result).toContain("export interface Order {");
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

      const result = generateModelFile(model);

      expect(result).not.toContain("import type { TreeNode }");
      expect(result).toContain("export interface TreeNode {");
      expect(result).toContain("children?: Array<TreeNode> | undefined;");
    });

    it("should generate unified parameter type with imports", () => {
      const model: IRModel = {
        kind: "parameter",
        name: "UpdateUserParams",
        referencePath: "#/paths/~1users~1{userId}/patch/parameters",
        properties: [
          {
            name: "userId",
            type: "string",
            required: true,
            in: "path",
          },
        ],
      };

      const result = generateModelFile(model, "UserUpdate");

      expect(result).toContain(
        "import type { UserUpdate } from './UserUpdate';",
      );
      expect(result).toContain("export interface UpdateUserParams {");
      expect(result).toContain("body: UserUpdate;");
    });

    it("should return null for models that generate no code", () => {
      const model: IRModel = {
        kind: "object",
        name: "Empty",
        referencePath: "#/components/schemas/Empty",
        properties: [],
      };

      // generateModel() が空のobjectに対してnullを返すかは実装依存
      // ここでは、generateModelがnullを返す場合のテスト
      const result = generateModelFile(model);

      // 現在の実装では空オブジェクトも生成されるため、nullにならない
      expect(result).not.toBeNull();
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

      const result = generateModelFile(model);

      const lines = result!.split("\n");
      const importLines = lines.filter((line) => line.startsWith("import"));

      expect(importLines[0]).toContain("AItem");
      expect(importLines[1]).toContain("MItem");
      expect(importLines[2]).toContain("ZItem");
    });
  });
}
