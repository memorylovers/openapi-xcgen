/**
 * Valibot スキーマ生成器（Orchestrator）
 *
 * IRComponentからValibotのバリデーションスキーマを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { sortModelsByDependencies } from "./schemas-sort";
import type { IFileWriter } from "../../helpers/file-writer";
import { toTypeName } from "../../helpers/naming";
import type { HookableInstance } from "../../hooks";
import type { GeneratorResult } from "../../types";
import { runInParallel } from "../../helpers/parallel";
import type { TypeGenerationContext } from "../types/generation-context";
import { generateSchemaFile } from "./helpers/generate-schema-file";
import { generateSchemasIndex } from "./helpers/generate-index";

/**
 * XcgenIRからValibotスキーマを生成（ディレクトリベース構造）
 *
 * schemas/ディレクトリに個別のファイルとして生成し、並列書き込みを行う
 *
 * @param ir - 中間表現
 * @param writer - ファイル書き込みインターフェース
 * @param hooks - Hookインスタンス（オプショナル）
 * @returns 生成結果（ファイルパス配列とカウント）
 *
 * @example
 * ```typescript
 * const ir: XcgenIR = { ... };
 * const writer = new FileWriter('./output');
 * const hooks = createHooks();
 * const result = await generateSchemas(ir, writer, hooks);
 * console.log(result.files); // ['schemas/PetSchema.ts', 'schemas/UserSchema.ts', 'schemas/index.ts']
 * console.log(result.count); // 2 (Pet, User)
 * ```
 */
export async function generateSchemas(
  ir: XcgenIR,
  writer: IFileWriter,
  hooks?: HookableInstance,
): Promise<GeneratorResult> {
  const files: string[] = [];

  // Create TypeGenerationContext
  const ctx: TypeGenerationContext = { ir, hooks };

  // 依存関係順にソート
  const sortedModels = sortModelsByDependencies(ir.components);

  // Step 1: IR → Code (純粋関数による変換)
  const schemaFiles = sortedModels
    .map((model) => {
      return {
        path: `schemas/${toTypeName(model.name)}Schema.ts`,
        content: generateSchemaFile(model, ctx),
      };
    })
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
