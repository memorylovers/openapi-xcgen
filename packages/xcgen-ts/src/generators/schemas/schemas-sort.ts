/**
 * スキーマの依存関係解析とトポロジカルソート
 */

import type { IRModel, IRType } from "@openapi-xcgen/core";

/**
 * IRTypeから参照されている型名を抽出
 * @param type - IR型
 * @returns 参照されている型名の配列
 */
function extractTypeReferences(type: IRType): string[] {
  const references: string[] = [];

  // プリミティブ型（文字列リテラル）は参照を持たない
  if (typeof type === "string") {
    return references;
  }

  switch (type.kind) {
    case "ref": {
      // 参照パスから型名を抽出
      const modelName = type.name.split("/").at(-1) ?? type.name;
      references.push(modelName);
      break;
    }
  }

  return references;
}

/**
 * IRModelが依存している他のモデル名を抽出
 * @param model - IRモデル
 * @returns 依存しているモデル名の配列
 */
export function extractModelDependencies(model: IRModel): string[] {
  const dependencies = new Set<string>();

  switch (model.kind) {
    case "allOf":
    case "anyOf":
      // Composition型: schemas配列内の各スキーマが依存先
      for (const schema of model.schemas) {
        const refs = extractTypeReferences(schema);
        refs.forEach((ref) => dependencies.add(ref));
      }
      break;

    case "object":
    case "requestBody":
    case "response":
      // Object型: プロパティの型が依存先
      for (const prop of model.properties) {
        // プロパティの型情報がIRTypeの場合
        if (typeof prop.type === "object" && "kind" in prop.type) {
          const refs = extractTypeReferences(prop.type as IRType);
          refs.forEach((ref) => dependencies.add(ref));
        }
      }
      break;

    case "array":
      // Array型: itemTypeが依存先
      if (typeof model.itemType === "object" && "kind" in model.itemType) {
        const refs = extractTypeReferences(model.itemType as IRType);
        refs.forEach((ref) => dependencies.add(ref));
      }
      break;

    case "map":
      // Map型: valueTypeが依存先
      if (typeof model.valueType === "object" && "kind" in model.valueType) {
        const refs = extractTypeReferences(model.valueType as IRType);
        refs.forEach((ref) => dependencies.add(ref));
      }
      break;

    case "union":
      // Union型: types配列内の各型が依存先
      for (const type of model.types) {
        // プリミティブ型をスキップ
        if (typeof type === "string") {
          continue;
        }
        if (type.kind === "ref") {
          const modelName = type.name.split("/").at(-1) ?? type.name;
          dependencies.add(modelName);
        }
      }
      break;

    case "enum":
    case "parameter":
      // Enum型とParameter型: 他のモデルに依存しない
      break;

    default: {
      // Exhaustive check
      const _: never = model;
      void _;
      break;
    }
  }

  return Array.from(dependencies);
}

/**
 * モデルをトポロジカルソート（依存先が先に来るように並べ替え）
 * @param models - IRモデル配列
 * @returns ソート済みモデル配列
 *
 * @example
 * ```typescript
 * // Before sort:
 * // - User: depends on Base, UserAllOf1
 * // - Base: no dependencies
 * // - UserAllOf1: no dependencies
 *
 * const sorted = sortModelsByDependencies([userModel, baseModel, userAllOf1Model]);
 *
 * // After sort:
 * // - Base (no dependencies, comes first)
 * // - UserAllOf1 (no dependencies, comes first)
 * // - User (depends on Base and UserAllOf1, comes last)
 * ```
 */
export function sortModelsByDependencies(models: IRModel[]): IRModel[] {
  // モデル名からモデルへのマップを作成
  const modelMap = new Map<string, IRModel>();
  for (const model of models) {
    modelMap.set(model.name, model);
  }

  // 各モデルの依存関係マップを作成
  const dependenciesMap = new Map<string, string[]>();
  for (const model of models) {
    const deps = extractModelDependencies(model);
    // 存在するモデルへの依存のみをフィルタ
    const validDeps = deps.filter((dep) => modelMap.has(dep));
    dependenciesMap.set(model.name, validDeps);
  }

  // トポロジカルソート（Kahn's algorithm）
  const sorted: IRModel[] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  function visit(modelName: string): void {
    // 既に訪問済み
    if (visited.has(modelName)) {
      return;
    }

    // 循環依存の検出
    if (inProgress.has(modelName)) {
      // 循環依存がある場合、警告して処理続行
      // console.warn(`Circular dependency detected: ${modelName}`);
      return;
    }

    const model = modelMap.get(modelName);
    if (!model) {
      // モデルが存在しない（外部参照の可能性）
      return;
    }

    inProgress.add(modelName);

    // 依存先を先に訪問
    const deps = dependenciesMap.get(modelName) || [];
    for (const dep of deps) {
      visit(dep);
    }

    inProgress.delete(modelName);
    visited.add(modelName);
    sorted.push(model);
  }

  // 全モデルを訪問
  for (const model of models) {
    visit(model.name);
  }

  return sorted;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-sort", () => {
    describe("extractModelDependencies", () => {
      it("should extract dependencies from allOf model", () => {
        const model: IRModel = {
          kind: "allOf",
          name: "User",
          referencePath: "#/components/schemas/User",
          schemas: [
            { kind: "ref", name: "#/components/schemas/Base" },
            { kind: "ref", name: "#/components/schemas/UserAllOf1" },
          ],
        };

        const deps = extractModelDependencies(model);

        expect(deps).toEqual(["Base", "UserAllOf1"]);
      });

      it("should extract dependencies from object with ref properties", () => {
        const model: IRModel = {
          kind: "object",
          name: "Post",
          referencePath: "#/components/schemas/Post",
          properties: [
            {
              name: "author",
              type: { kind: "ref", name: "#/components/schemas/User" },
              required: true,
            },
            {
              name: "title",
              type: "string",
              required: true,
            },
          ],
        };

        const deps = extractModelDependencies(model);

        expect(deps).toEqual(["User"]);
      });

      it("should return empty array for enum model", () => {
        const model: IRModel = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [
            { value: "active", name: "ACTIVE" },
            { value: "inactive", name: "INACTIVE" },
          ],
        };

        const deps = extractModelDependencies(model);

        expect(deps).toEqual([]);
      });
    });

    describe("sortModelsByDependencies", () => {
      it("should sort models by dependencies", () => {
        const baseModel: IRModel = {
          kind: "object",
          name: "Base",
          referencePath: "#/components/schemas/Base",
          properties: [],
        };

        const userAllOf1Model: IRModel = {
          kind: "object",
          name: "UserAllOf1",
          referencePath: "#/components/schemas/UserAllOf1",
          properties: [],
        };

        const userModel: IRModel = {
          kind: "allOf",
          name: "User",
          referencePath: "#/components/schemas/User",
          schemas: [
            { kind: "ref", name: "#/components/schemas/Base" },
            { kind: "ref", name: "#/components/schemas/UserAllOf1" },
          ],
        };

        const sorted = sortModelsByDependencies([
          userModel,
          baseModel,
          userAllOf1Model,
        ]);

        // Base and UserAllOf1 should come before User
        const userIndex = sorted.findIndex((m) => m.name === "User");
        const baseIndex = sorted.findIndex((m) => m.name === "Base");
        const userAllOf1Index = sorted.findIndex(
          (m) => m.name === "UserAllOf1",
        );

        expect(baseIndex).toBeLessThan(userIndex);
        expect(userAllOf1Index).toBeLessThan(userIndex);
      });

      it("should handle models without dependencies", () => {
        const model1: IRModel = {
          kind: "object",
          name: "Model1",
          referencePath: "#/components/schemas/Model1",
          properties: [],
        };

        const model2: IRModel = {
          kind: "object",
          name: "Model2",
          referencePath: "#/components/schemas/Model2",
          properties: [],
        };

        const sorted = sortModelsByDependencies([model1, model2]);

        expect(sorted).toHaveLength(2);
        expect(sorted.map((m) => m.name)).toEqual(
          expect.arrayContaining(["Model1", "Model2"]),
        );
      });
    });
  });
}
