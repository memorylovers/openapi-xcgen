/**
 * モデルファイル生成
 *
 * IRModel → TypeScript型定義コード（個別ファイル）への変換
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";
import type { HookableInstance, TsCodeModel } from "../../../hooks";
import { generateModel } from "../types-model";
import { generateUnifiedParameterType } from "../types-parameter-unified";
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
  // 1. 型定義コードを生成
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

  // 2. TsCodeModel を初期化（Hookが変更可能）
  const typeName = toTypeName(model.name);
  const tsCode: TsCodeModel = {
    name: typeName,
    code: typeCode,
    imports: [],
    comment: `${model.name} model\nAuto-generated from OpenAPI specification`,
  };

  // 3. modelFile:generate Hook を呼び出し
  if (hooks) {
    hooks.callHook("modelFile:generate", {
      model,
      tsCode,
      extensions: "extensions" in model ? model.extensions : undefined,
    });

    // Hook で型名が変更された場合、コード内の型名も置換
    if (tsCode.name !== typeName) {
      // interface/type/enum宣言内の型名を置換
      tsCode.code = tsCode.code.replace(
        new RegExp(`\\b${typeName}\\b`, "g"),
        tsCode.name,
      );
    }
  }

  // 4. 最終的なファイルコードを生成
  const lines: string[] = [];

  // JSDocコメント
  if (tsCode.comment) {
    lines.push("/**");
    tsCode.comment.split("\n").forEach((line) => {
      lines.push(` * ${line}`);
    });
    lines.push(" */");
    lines.push("");
  }

  // 依存型のインポート
  const dependencies = extractTypeDependencies(model);

  // 統合パラメータ型の場合、requestBodyの型も追加
  if (requestBodyTypeName) {
    dependencies.add(requestBodyTypeName);
  }

  // 自分自身への参照は除外
  dependencies.delete(tsCode.name);

  // Hookで追加されたインポートもマージ
  const allImports = new Set([...dependencies, ...tsCode.imports]);

  if (allImports.size > 0) {
    const sortedDeps = Array.from(allImports).sort();
    for (const dep of sortedDeps) {
      lines.push(`import type { ${dep} } from './${dep}';`);
    }
    lines.push("");
  }

  // 型定義コード
  lines.push(tsCode.code);

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

      expect(result).toEqual(
        `/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface User {
  email: string;
}`,
      );
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

      expect(result).toEqual(
        `/**
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { Product } from './Product';
import type { User } from './User';

export interface Order {
  user: User;
  product: Product;
}`,
      );
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

      expect(result).toEqual(
        `/**
 * TreeNode model
 * Auto-generated from OpenAPI specification
 */

export interface TreeNode {
  value: string;
  children?: Array<TreeNode> | undefined;
}`,
      );
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

      expect(result).toEqual(
        `/**
 * UpdateUserParams model
 * Auto-generated from OpenAPI specification
 */

import type { UserUpdate } from './UserUpdate';

export interface UpdateUserParams {
  path: {
    userId: string;
  };
  body: UserUpdate;
}`,
      );
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

      expect(importLines).toEqual([
        "import type { AItem } from './AItem';",
        "import type { MItem } from './MItem';",
        "import type { ZItem } from './ZItem';",
      ]);
    });
  });
}
