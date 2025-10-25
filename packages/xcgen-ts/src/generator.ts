/**
 * メインジェネレーター
 *
 * OpenAPI仕様書からTypeScriptコードを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { parse, transform } from "@openapi-xcgen/core";
import { consola } from "consola";
import { join } from "node:path";
import { loadGeneratorConfig } from "./config";
import { generateClient } from "./generators/client/client";
import { generateSchemas } from "./generators/schemas/schemas";
import { generateServices } from "./generators/services/services";
import { generateTypes } from "./generators/types/types";
import { FileWriter } from "./helpers/file-writer";
import { createHooks } from "./hooks";
import type { GenerationResult, GeneratorOptions } from "./types";

/**
 * TypeScriptコードを生成する
 * @param options - 生成器オプション
 * @returns 生成結果
 *
 * @example
 * ```typescript
 * await generate({
 *   input: './openapi.yaml',
 *   output: './src/generated',
 *   validator: 'valibot',
 * });
 * ```
 */
export async function generate(
  options: GeneratorOptions,
): Promise<GenerationResult> {
  // 0. 設定ファイルを読み込み
  const config = await loadGeneratorConfig(options);

  // 1. Hook システムを初期化
  const hooks = createHooks(config.hooks);

  consola.start(`Generating TypeScript code from ${config.input}...`);

  // 2. Parse OpenAPI document
  consola.info("Parsing OpenAPI document...");
  const document = await parse(config.input);

  // 3. Transform to IR
  consola.info("Transforming to intermediate representation...");
  const ir: XcgenIR = transform(document);

  consola.info(
    `Found ${ir.models.length} models, ${ir.endpoints.length} endpoints`,
  );

  // 4. Generate code with directory-based structure
  consola.info("Generating code...");
  const writer = new FileWriter(config.output);
  const allFiles: string[] = [];

  // 4.1 Types生成（Hookインスタンスを渡す）
  consola.info("Generating types...");
  const typesResult = await generateTypes(ir, writer, hooks);
  allFiles.push(...typesResult.files);
  consola.success(`Generated ${typesResult.count} types → models/ directory`);

  // 4.2 Schemas生成（Hookインスタンスを渡す）
  let schemasResult;
  if (config.validator === "valibot") {
    consola.info("Generating Valibot schemas...");
    schemasResult = await generateSchemas(ir, writer, hooks);
    allFiles.push(...schemasResult.files);
    consola.success(
      `Generated ${schemasResult.count} schemas → schemas/ directory`,
    );
  }

  // 4.3 Services生成（Hookインスタンスを渡す）
  consola.info("Generating services...");
  const servicesResult = await generateServices(ir, writer, hooks);
  allFiles.push(...servicesResult.files);
  consola.success(
    `Generated ${servicesResult.count} services → services/ directory`,
  );

  // 4.4 client.ts と index.ts を並列書き込み
  consola.info("Generating client and index...");
  const clientCode = generateClient(ir);
  const indexCode = generateTopLevelIndex(ir, config);

  await Promise.all([
    writer.write("client.ts", clientCode.code),
    writer.write("index.ts", indexCode),
  ]);

  allFiles.push("client.ts", "index.ts");
  consola.success("Generated client.ts and index.ts");

  consola.success(
    `✅ Successfully generated ${allFiles.length} files in ${config.output}`,
  );

  return {
    files: allFiles.map((f) => join(config.output, f)),
    typesCount: typesResult.count,
    schemasCount: schemasResult?.count,
    servicesCount: servicesResult.count,
  };
}

/**
 * 純粋関数: トップレベルindex.ts コード生成
 */
function generateTopLevelIndex(ir: XcgenIR, options: GeneratorOptions): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * API Client");
  lines.push(` * Generated from: ${ir.metadata.title} ${ir.metadata.version}`);
  lines.push(" * DO NOT EDIT - This file is auto-generated");
  lines.push(" */");
  lines.push("");

  lines.push("export * from './models/index';");

  if (options.validator === "valibot") {
    lines.push("export * from './schemas/index';");
  }

  lines.push("export * from './services/index';");
  lines.push(
    "export { setConfig, XcgenApiError, type ApiConfig } from './client';",
  );

  return lines.join("\n");
}
