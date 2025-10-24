/**
 * 期待値ファイル生成スクリプト
 *
 * 現在の実装からTypeScriptコードを生成し、expected/*.tsファイルとして保存します。
 * テストケースの初期セットアップや、実装変更後の期待値更新に使用します。
 *
 * 使用方法:
 * ```bash
 * # すべてのfixtureの期待値を生成
 * pnpm jiti tests/e2e/generate-expected.ts
 * ```
 *
 * 注意:
 * - 生成後は必ず内容を確認してください（バグのある出力も期待値として保存されます）
 * - Gitで変更履歴を追跡し、レビューを行ってください
 */

import { consola } from "consola";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { generate } from "../../src/generator";
import type { GeneratorOptions } from "../../src/types";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/generator-typescript directory
const packageDir = join(__dirname, "..", "..");

/**
 * Recursively copy a directory
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function generateExpectedForFixture(
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

  // expected/ディレクトリを作成 (validator指定時は expected-valibot/)
  const expectedDirName =
    options?.validator === "valibot" ? "expected-valibot" : "expected";
  const expectedDir = join(fixtureDir, expectedDirName);
  await mkdir(expectedDir, { recursive: true });

  // Copy generated directories and files
  // 1. Copy models/ directory (replaces old types.ts)
  const modelsSourceDir = join(outputDir, "models");
  const modelsTargetDir = join(expectedDir, "models");
  await copyDir(modelsSourceDir, modelsTargetDir);
  consola.success(`Generated: models/ directory`);

  // 2. Copy schemas/ directory if validator is enabled (replaces old schemas.ts)
  if (options?.validator === "valibot") {
    const schemasSourceDir = join(outputDir, "schemas");
    const schemasTargetDir = join(expectedDir, "schemas");
    await copyDir(schemasSourceDir, schemasTargetDir);
    consola.success(`Generated: schemas/ directory`);
  }

  // 3. Copy services/ directory (replaces old services.ts)
  const servicesSourceDir = join(outputDir, "services");
  const servicesTargetDir = join(expectedDir, "services");
  await copyDir(servicesSourceDir, servicesTargetDir);
  consola.success(`Generated: services/ directory`);

  // 4. Copy individual files (client.ts, index.ts)
  const individualFiles = ["client.ts", "index.ts"];
  for (const fileName of individualFiles) {
    const sourcePath = join(outputDir, fileName);
    const targetPath = join(expectedDir, fileName);
    const content = await readFile(sourcePath, "utf-8");
    await writeFile(targetPath, content, "utf-8");
    consola.success(`Generated: ${fileName}`);
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

async function main() {
  consola.start("Generating expected files for all fixtures...");

  try {
    // Define all fixtures
    const fixtures = [
      // General fixtures
      "general/petstore",
      "general/readonly-writeonly",
      "general/allof",
      "general/complex-schema",
      // General - Hey API
      "general/hey-api/discriminator-one-of",
      "general/hey-api/discriminator-all-of",
      "general/hey-api/discriminator-any-of",
      // Models fixtures
      "models/data-types",
      "models/complex-structures",
      "models/ref-model",
      "models/nullable-model",
      "models/validation-model",
      "models/metadata-model",
      "models/inline-schemas",
      // Validation fixture
      "validation",
    ];

    // Generate without validator
    consola.info("Generating fixtures (without validator)...");
    for (const fixture of fixtures) {
      consola.info(`  - ${fixture}`);
      await generateExpectedForFixture(fixture);
    }

    // Generate with valibot
    consola.info("Generating fixtures (with valibot)...");
    for (const fixture of fixtures) {
      consola.info(`  - ${fixture}`);
      await generateExpectedForFixture(fixture, { validator: "valibot" });
    }

    consola.success(
      `✅ All expected files generated successfully! (${fixtures.length} fixtures × 2 modes = ${fixtures.length * 2} runs)\n` +
        "⚠️  Please review the generated files before committing.",
    );
  } catch (error) {
    consola.error("Failed to generate expected files:", error);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

main();
