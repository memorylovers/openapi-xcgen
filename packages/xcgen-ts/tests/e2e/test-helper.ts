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
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { generate } from "../../src/generator.js";
import type { GeneratorOptions } from "../../src/types.js";
import { tmpdir } from "node:os";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/generator-typescript directory
const packageDir = join(__dirname, "..", "..");

/**
 * デバッグ用定数: trueに設定すると実際の生成結果を.actual.tsファイルに出力
 * テスト失敗時のデバッグに使用（通常はfalse）
 *
 * 使い方:
 * 1. この定数をtrueに変更
 * 2. テストを実行（pnpm test）
 * 3. 生成された.actual.tsと.expected.tsを比較
 * 4. デバッグ完了後、falseに戻す
 */
const WRITE_ACTUAL_FILES = false;

/**
 * 生成ファイルの種類
 */
type GeneratedFileType = "types" | "schemas" | "services" | "client";

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

    // 生成されたファイルを検証
    const fileTypes: GeneratedFileType[] = ["types", "services", "client"];
    if (options?.validator === "valibot") {
      // validator指定時はschemas.tsも検証
      fileTypes.splice(1, 0, "schemas");
    }

    for (const fileType of fileTypes) {
      await compareFile(fixtureDir, outputDir, fileType);
    }

    consola.success(`✅ ${testCase}: All files match expected output`);
  } finally {
    // クリーンアップ（一時ディレクトリは自動削除される）
  }
}

/**
 * 単一ファイルの比較
 */
async function compareFile(
  fixtureDir: string,
  outputDir: string,
  fileType: GeneratedFileType,
): Promise<void> {
  const fileName = `${fileType}.ts`;
  const expectedPath = join(fixtureDir, "expected", fileName);
  const actualPath = join(outputDir, fileName);

  // 生成されたファイルを読み込み
  const actual = await readFile(actualPath, "utf-8");

  // デバッグ用: 実際の生成結果をファイルに出力
  if (WRITE_ACTUAL_FILES) {
    const actualOutputPath = join(fixtureDir, `${fileType}.actual.ts`);
    await writeFile(actualOutputPath, actual, "utf-8");
    consola.info(
      `✍️  Wrote actual output to: ${actualOutputPath.replace(packageDir, ".")}`,
    );
  }

  // 期待値ファイルの読み込み
  const expected = await readFile(expectedPath, "utf-8");

  // 実際の生成結果と期待値を比較
  expect(actual.trim()).toEqual(expected.trim());
}

/**
 * 現在の生成実装から期待値ファイルを生成する関数
 *
 * 使用場面:
 * 1. 新しいテストケースの初期セットアップ時
 * 2. 生成ロジックの意図的な変更後の期待値更新
 * 3. TDDのGreenフェーズで実装が完成した時点での期待値記録
 *
 * 注意事項:
 * - この関数は現在の実装の出力をそのまま期待値として保存します
 * - バグのある出力も期待値として保存されるため、生成後は必ず内容を確認してください
 * - 生成された期待値はGitで管理され、変更履歴が追跡されます
 *
 * @param testCase - fixturesディレクトリからの相対パス（例: "petstore"）
 * @param options - 生成オプション（validator等）
 *
 * @example
 * ```typescript
 * // generate-expected.tsスクリプトで使用
 * await generateExpected("petstore", { validator: "valibot" });
 * // → fixtures/petstore/openapi.yaml を生成し、
 * //   fixtures/petstore/expected/*.ts に保存
 * ```
 */
export async function generateExpected(
  testCase: string,
  options?: Partial<Omit<GeneratorOptions, "input" | "output">>,
): Promise<void> {
  const fixtureDir = join(packageDir, "tests", "e2e", "fixtures", testCase);
  const inputPath = join(fixtureDir, "openapi.yaml");

  // 一時ディレクトリに生成
  const outputDir = join(tmpdir(), `xcgen-expected-${Date.now()}`);
  await mkdir(outputDir, { recursive: true });

  // 現在の実装で生成処理を実行
  await generate({
    input: inputPath,
    output: outputDir,
    ...options,
  });

  // 生成されたファイルを期待値として保存
  const fileTypes: GeneratedFileType[] = ["types", "services", "client"];
  if (options?.validator === "valibot") {
    fileTypes.splice(1, 0, "schemas");
  }

  // expected/ディレクトリを作成
  const expectedDir = join(fixtureDir, "expected");
  await mkdir(expectedDir, { recursive: true });

  // Copy generated TypeScript files
  for (const fileType of fileTypes) {
    const fileName = `${fileType}.ts`;
    const sourcePath = join(outputDir, fileName);
    const targetPath = join(expectedDir, fileName);

    const content = await readFile(sourcePath, "utf-8");
    await writeFile(targetPath, content, "utf-8");
    consola.success(`Generated: ${targetPath.replace(packageDir, ".")}`);
  }

  // Copy configuration files
  const fixturesDir = join(packageDir, "tests", "e2e", "fixtures");

  // Copy tsconfig.json
  const tsconfigTemplate = join(fixturesDir, "tsconfig.template.json");
  const tsconfigTarget = join(expectedDir, "tsconfig.json");
  const tsconfigContent = await readFile(tsconfigTemplate, "utf-8");
  await writeFile(tsconfigTarget, tsconfigContent, "utf-8");

  // Copy package.json (only when schemas.ts is generated)
  if (options?.validator === "valibot") {
    const packageTemplate = join(fixturesDir, "package.template.json");
    const packageTarget = join(expectedDir, "package.json");
    const packageContent = await readFile(packageTemplate, "utf-8");
    await writeFile(packageTarget, packageContent, "utf-8");
  }
}
