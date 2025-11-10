/**
 * API サービス関数生成器（Orchestrator）
 *
 * IREndpointからTypeScriptのAPI関数を生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import type { IFileWriter } from "../../helpers/file-writer";
import type { HookableInstance } from "../../hooks";
import type { GeneratorResult } from "../../types";
import { kebabCase } from "es-toolkit";
import { runInParallel } from "../../helpers/parallel";
import { groupEndpointsByTag } from "./helpers/group-by-tag";
import { generateServiceFile } from "./helpers/generate-service-file";
import { generateServicesIndex } from "./helpers/generate-index";

/**
 * XcgenIRからAPI関数を生成（ディレクトリベース構造）
 *
 * services/ディレクトリにタグ別のファイルとして生成し、並列書き込みを行う
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
 * const result = await generateServices(ir, writer, hooks);
 * console.log(result.files); // ['services/pets.ts', 'services/users.ts', 'services/index.ts']
 * console.log(result.count); // 2 (services)
 * ```
 */
export async function generateServices(
  ir: XcgenIR,
  writer: IFileWriter,
  hooks?: HookableInstance,
): Promise<GeneratorResult> {
  const files: string[] = [];

  // タグごとにグループ化
  const servicesByTag = groupEndpointsByTag(ir.endpoints);

  // Step 1: IR → Code (純粋関数による変換)
  const serviceFiles = Object.entries(servicesByTag).map(([tag, endpoints]) => {
    const filename = kebabCase(tag);
    return {
      path: `services/${filename}.ts`,
      content: generateServiceFile(tag, endpoints, ir.components, hooks),
    };
  });

  // Step 2: Code → Write (並列書き込み、並列数制限あり)
  await runInParallel(serviceFiles, (file) =>
    writer.write(file.path, file.content),
  );

  files.push(...serviceFiles.map((f) => f.path));

  // Step 3: services/index.ts 生成・書き込み
  const tags = Object.keys(servicesByTag);
  const indexContent = generateServicesIndex(tags);
  await writer.write("services/index.ts", indexContent);
  files.push("services/index.ts");

  return {
    files,
    count: serviceFiles.length,
  };
}
