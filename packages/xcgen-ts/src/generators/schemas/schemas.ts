/**
 * Valibot スキーマ生成器（Orchestrator）
 *
 * IRModelからValibotのバリデーションスキーマを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { sortModelsByDependencies } from "./schemas-sort";
import type { IFileWriter } from "../../helpers/file-writer";
import type { GeneratorResult } from "../../types";
import { runInParallel } from "../../helpers/parallel";
import { generateSchemaFile } from "./helpers/generate-schema-file";
import { generateSchemasIndex } from "./helpers/generate-index";

/**
 * XcgenIRからValibotスキーマを生成（ディレクトリベース構造）
 *
 * schemas/ディレクトリに個別のファイルとして生成し、並列書き込みを行う
 *
 * @param ir - 中間表現
 * @param writer - ファイル書き込みインターフェース
 * @returns 生成結果（ファイルパス配列とカウント）
 *
 * @example
 * ```typescript
 * const ir: XcgenIR = { ... };
 * const writer = new FileWriter('./output');
 * const result = await generateSchemas(ir, writer);
 * console.log(result.files); // ['schemas/PetSchema.ts', 'schemas/UserSchema.ts', 'schemas/index.ts']
 * console.log(result.count); // 2 (Pet, User)
 * ```
 */
export async function generateSchemas(
  ir: XcgenIR,
  writer: IFileWriter,
): Promise<GeneratorResult> {
  const files: string[] = [];

  // 依存関係順にソート
  const sortedModels = sortModelsByDependencies(ir.models);

  // Step 1: IR → Code (純粋関数による変換)
  const schemaFiles = sortedModels
    .map((model) => ({
      path: `schemas/${model.name}Schema.ts`,
      content: generateSchemaFile(model),
    }))
    .filter((f) => f.content !== null) as Array<{
    path: string;
    content: string;
  }>;

  // Step 2: Code → Write (並列書き込み、並列数制限あり)
  await runInParallel(schemaFiles, (file) =>
    writer.write(file.path, file.content),
  );

  files.push(...schemaFiles.map((f) => f.path));

  // Step 3: schemas/index.ts 生成・書き込み
  const indexContent = generateSchemasIndex(sortedModels);
  await writer.write("schemas/index.ts", indexContent);
  files.push("schemas/index.ts");

  return {
    files,
    count: schemaFiles.length,
  };
}
