/**
 * メインジェネレーター
 *
 * OpenAPI仕様書からTypeScriptコードを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { parse, transform } from "@openapi-xcgen/core";
import { consola } from "consola";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateClient } from "./generators/client/client";
import { generateSchemas } from "./generators/schemas/schemas";
import { generateServices } from "./generators/services/services";
import { generateTypes } from "./generators/types/types";
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
  consola.start(`Generating TypeScript code from ${options.input}...`);

  // 1. Parse OpenAPI document
  consola.info("Parsing OpenAPI document...");
  const document = await parse(options.input);

  // 2. Transform to IR
  consola.info("Transforming to intermediate representation...");
  const ir: XcgenIR = transform(document);

  consola.info(
    `Found ${ir.models.length} models, ${ir.endpoints.length} endpoints`,
  );

  // 3. Generate code
  const files: string[] = [];

  // 3.1 Generate types.ts
  consola.info("Generating types...");
  const typesResult = generateTypes(ir);
  const typesPath = join(options.output, "types.ts");
  await ensureDir(dirname(typesPath));
  await writeFile(typesPath, typesResult.code, "utf-8");
  files.push(typesPath);
  consola.success(`Generated ${typesResult.count} types → ${typesPath}`);

  // 3.2 Generate services.ts
  consola.info("Generating services...");
  const servicesResult = generateServices(ir);
  const servicesPath = join(options.output, "services.ts");
  await writeFile(servicesPath, servicesResult.code, "utf-8");
  files.push(servicesPath);
  consola.success(
    `Generated ${servicesResult.count} services → ${servicesPath}`,
  );

  // 3.3 Generate client.ts
  consola.info("Generating client...");
  const clientResult = generateClient(ir);
  const clientPath = join(options.output, "client.ts");
  await writeFile(clientPath, clientResult.code, "utf-8");
  files.push(clientPath);
  consola.success(`Generated client → ${clientPath}`);

  // 3.4 Generate schemas.ts (if validator is specified)
  let schemasCount: number | undefined;
  if (options.validator === "valibot") {
    consola.info("Generating Valibot schemas...");
    const schemasResult = generateSchemas(ir);
    const schemasPath = join(options.output, "schemas.ts");
    await writeFile(schemasPath, schemasResult.code, "utf-8");
    files.push(schemasPath);
    schemasCount = schemasResult.count;
    consola.success(
      `Generated ${schemasResult.count} schemas → ${schemasPath}`,
    );
  }

  consola.success(
    `✅ Successfully generated ${files.length} files in ${options.output}`,
  );

  return {
    files,
    typesCount: typesResult.count,
    schemasCount,
    servicesCount: servicesResult.count,
  };
}

/**
 * ディレクトリが存在しない場合は作成する
 */
async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}
