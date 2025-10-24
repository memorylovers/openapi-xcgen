/**
 * E2Eテスト用ヘルパーモジュール
 *
 * このモジュールはOpenAPI仕様書からTypeScriptコード生成をテストするための共通ロジックを提供します。
 * Coreパッケージのtest-helperパターンを踏襲し、統一的な方法でテストを実行できるようにします。
 *
 * 主な機能:
 * 1. OpenAPI仕様書（YAML）の読み込み
 * 2. TypeScriptコード生成処理（types, schemas, services, client）
 * 3. 期待値ファイル（.expected.ts）との比較検証
 *
 * 使用例:
 * ```typescript
 * // テストファイル内で
 * import { compareWithExpected } from "./test-helper";
 *
 * it("should generate petstore code correctly", async () => {
 *   await compareWithExpected("petstore", { validator: "valibot" });
 * });
 * ```
 *
 * ディレクトリ構造:
 * ```
 * tests/e2e/fixtures/
 * ├── petstore/
 * │   ├── openapi.yaml              # 入力ファイル
 * │   └── expected/                 # 期待値ディレクトリ
 * │       ├── types.ts              # 期待値ファイル
 * │       ├── schemas.ts            # 期待値ファイル
 * │       ├── services.ts           # 期待値ファイル
 * │       └── client.ts             # 期待値ファイル
 * └── validation/
 *     ├── openapi.yaml
 *     └── expected/
 *         └── ...
 * ```
 */

import { consola } from "consola";
import { readFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { generate } from "../../src/generator";
import type { GeneratorOptions } from "../../src/types";
import { tmpdir } from "node:os";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/generator-typescript directory
const packageDir = join(__dirname, "..", "..");

/**
 * Recursively compare two directories
 */
async function compareDirectories(
  expectedDir: string,
  actualDir: string,
  relativePath: string = "",
): Promise<void> {
  const expectedEntries = await readdir(expectedDir, { withFileTypes: true });

  for (const entry of expectedEntries) {
    const expectedPath = join(expectedDir, entry.name);
    const actualPath = join(actualDir, entry.name);
    const currentRelativePath = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      // Recursively compare subdirectories
      await compareDirectories(expectedPath, actualPath, currentRelativePath);
    } else {
      // Compare files
      const expected = await readFile(expectedPath, "utf-8");
      const actual = await readFile(actualPath, "utf-8");
      expect(actual.trim()).toEqual(expected.trim());
    }
  }
}

/**
 * OpenAPI仕様書からTypeScriptコードを生成し、期待値と比較するテスト実行関数
 *
 * 処理フロー:
 * 1. fixturesディレクトリから入力ファイル（openapi.yaml）を読み込み
 * 2. generate() でTypeScriptコードを生成
 * 3. 対応する.expected.tsファイルと比較
 *
 * @param testCase - fixturesディレクトリからの相対パス（例: "petstore", "validation"）
 * @param options - 生成オプション（validator等）
 * @throws テスト失敗時（期待値と実際の値が一致しない場合）
 *
 * @example
 * ```typescript
 * // generator.test.ts
 * await compareWithExpected("petstore", { validator: "valibot" });
 * // → fixtures/petstore/openapi.yaml から生成し、
 * //   fixtures/petstore/expected/*.ts と比較
 * ```
 */
export async function compareWithExpected(
  testCase: string,
  options?: Partial<Omit<GeneratorOptions, "input" | "output">>,
): Promise<void> {
  const fixtureDir = join(packageDir, "tests", "e2e", "fixtures", testCase);
  const inputPath = join(fixtureDir, "openapi.yaml");

  // 一時ディレクトリに生成
  const outputDir = join(tmpdir(), `xcgen-test-${Date.now()}`);
  await mkdir(outputDir, { recursive: true });

  try {
    // TypeScriptコード生成
    await generate({
      input: inputPath,
      output: outputDir,
      ...options,
    });

    // Use expected-valibot/ directory when validator is specified
    const expectedDirName =
      options?.validator === "valibot" ? "expected-valibot" : "expected";
    const expectedDir = join(fixtureDir, expectedDirName);

    // 1. Compare models/ directory (replaces old types.ts)
    await compareDirectories(
      join(expectedDir, "models"),
      join(outputDir, "models"),
      "models",
    );

    // 2. Compare schemas/ directory if validator is enabled (replaces old schemas.ts)
    if (options?.validator === "valibot") {
      await compareDirectories(
        join(expectedDir, "schemas"),
        join(outputDir, "schemas"),
        "schemas",
      );
    }

    // 3. Compare services/ directory (replaces old services.ts)
    await compareDirectories(
      join(expectedDir, "services"),
      join(outputDir, "services"),
      "services",
    );

    // 4. Compare individual files (client.ts, index.ts)
    const individualFiles = ["client.ts", "index.ts"];
    for (const fileName of individualFiles) {
      const expectedPath = join(expectedDir, fileName);
      const actualPath = join(outputDir, fileName);
      const expected = await readFile(expectedPath, "utf-8");
      const actual = await readFile(actualPath, "utf-8");
      expect(actual.trim()).toEqual(expected.trim());
    }

    consola.success(`✅ ${testCase}: All files match expected output`);
  } finally {
    // クリーンアップ（一時ディレクトリは自動削除される）
  }
}
