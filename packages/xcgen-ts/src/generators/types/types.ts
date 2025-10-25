/**
 * TypeScript型定義生成器
 *
 * IRModelからTypeScriptの型定義（interface, type, enum）を生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import type { IFileWriter } from "../../helpers/file-writer";
import { runInParallel } from "../../helpers/parallel";
import type { HookableInstance } from "../../hooks";
import type { GeneratorResult } from "../../types";
import { buildUnifiedParameterTypesMap } from "./helpers/build-unified-parameter-map";
import { generateModelsIndex } from "./helpers/generate-index";
import { generateModelFile } from "./helpers/generate-model-file";

/**
 * 生成されるモデルファイル情報
 */
type GeneratedModelFile = {
  path: string;
  content: string;
};

/**
 * XcgenIRからTypeScript型定義を生成（ディレクトリベース構造）
 *
 * models/ディレクトリに個別のファイルとして生成し、並列書き込みを行う
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
 * const result = await generateTypes(ir, writer, hooks);
 * console.log(result.files); // ['models/Pet.ts', 'models/User.ts', 'models/index.ts']
 * console.log(result.count); // 2 (Pet, User)
 * ```
 */
export async function generateTypes(
  ir: XcgenIR,
  writer: IFileWriter,
  _hooks?: HookableInstance,
): Promise<GeneratorResult> {
  const files: string[] = [];

  // endpointsを走査して、統合型が必要なparameterモデルを検出
  const unifiedParameterTypes = buildUnifiedParameterTypesMap(ir);

  // Step 1: IR → Code (純粋関数による変換)
  const modelFiles = ir.models
    .map((model) => {
      const isUnified = unifiedParameterTypes.has(model.referencePath);
      const requestBodyTypeName = isUnified
        ? unifiedParameterTypes.get(model.referencePath)!
        : undefined;

      return {
        path: `models/${model.name}.ts`,
        content: generateModelFile(model, requestBodyTypeName, _hooks),
      };
    })
    .filter((f) => f.content !== null) as GeneratedModelFile[];

  // Step 2: Code → Write (並列書き込み、並列数制限あり)
  await runInParallel(modelFiles, (file) =>
    writer.write(file.path, file.content),
  );

  files.push(...modelFiles.map((f) => f.path));

  // Step 3: models/index.ts 生成・書き込み
  const indexContent = generateModelsIndex(ir.models);
  await writer.write("models/index.ts", indexContent);
  files.push("models/index.ts");

  return {
    files,
    count: modelFiles.length,
  };
}
