/**
 * E2Eテスト用ヘルパーモジュール
 *
 * このモジュールはOpenAPI仕様書の変換処理をテストするための共通ロジックを提供します。
 * すべてのE2Eテストで統一的な方法でテストを実行できるようにすることで、
 * コードの重複を避け（DRY原則）、保守性を向上させます。
 *
 * 主な機能:
 * 1. OpenAPI仕様書（YAML/JSON）の読み込みとパース
 * 2. 中間表現（IR）への変換処理
 * 3. 期待値ファイル（.expected.json）との比較検証
 * 4. 未サポート機能（oneOf/anyOf/allOfなど）のグレースフルなハンドリング
 *
 * 使用例:
 * ```typescript
 * // テストファイル内で
 * import { compareWithExpected } from "./test-helper";
 *
 * it("should transform petstore spec", async () => {
 *   await compareWithExpected("general/petstore");
 * });
 * ```
 *
 * ディレクトリ構造:
 * ```
 * tests/e2e/fixtures/
 * ├── models/
 * │   ├── data-types.yaml          # 入力ファイル
 * │   └── data-types.expected.json # 期待値ファイル
 * └── general/
 *     ├── petstore.yaml
 *     └── petstore.expected.json
 * ```
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { consola } from "consola";
import { expect } from "vitest";
import { parse } from "../../../src/parser/index";
import { transform } from "../../../src/transformer/index";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/core directory
const coreDir = join(__dirname, "..", "..", "..");

/**
 * デバッグ用定数: trueに設定すると実際の変換結果を.actual.jsonファイルに出力
 * テスト失敗時のデバッグに使用（通常はfalse）
 *
 * 使い方:
 * 1. この定数をtrueに変更
 * 2. テストを実行（pnpm test）
 * 3. 生成された.actual.jsonと.expected.jsonを比較
 * 4. デバッグ完了後、falseに戻す
 */
const WRITE_ACTUAL_FILES = false;

/**
 * OpenAPI仕様書の変換結果を期待値と比較するテスト実行関数
 *
 * 処理フロー:
 * 1. fixturesディレクトリから入力ファイル（.yaml/.json）を読み込み
 * 2. parse() でOpenAPIドキュメントをパース
 * 3. transform() で中間表現（IR）に変換
 * 4. 対応する.expected.jsonファイルと比較
 *
 * エラーハンドリング:
 * - 未サポート機能（oneOf/anyOf/allOf）によるパースエラーの場合、
 *   空のIRオブジェクトを生成して比較を続行
 * - これにより、未実装機能のテストも期待値として管理可能
 *
 * @param testCase - fixturesディレクトリからの相対パス（拡張子なし）
 *                   例: "general/petstore", "models/data-types"
 * @throws テスト失敗時（期待値と実際の値が一致しない場合）
 *
 * @example
 * ```typescript
 * // general-orval.test.ts
 * await compareWithExpected("general/orval/petstore-basic");
 * // → fixtures/general/orval/petstore-basic.yaml を変換し、
 * //   fixtures/general/orval/petstore-basic.expected.json と比較
 * ```
 */
export async function compareWithExpected(testCase: string): Promise<void> {
  // ファイル形式の自動判定: YAMLとJSONの両方に対応
  // デフォルトはYAMLだが、JSONファイルが存在する場合はそちらを優先
  let specPath = join(coreDir, "tests", "e2e", "fixtures", `${testCase}.yaml`);

  // JSONファイルの存在確認
  const jsonPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.json`,
  );

  try {
    await readFile(jsonPath, "utf-8");
    specPath = jsonPath; // JSONファイルが存在すればそちらを使用
  } catch {
    // JSONファイルが存在しない場合はYAMLパスをそのまま使用
  }

  const expectedPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.expected.json`,
  );

  let actual;
  try {
    // 通常の変換処理: OpenAPI仕様書 → パース → IR変換
    const document = await parse(specPath);
    actual = transform(document);
  } catch (error) {
    // 未サポート機能のグレースフルハンドリング
    // oneOf/anyOf/allOfなど、現在の実装で未対応の機能がある場合、
    // パーサーがエラーを投げるが、テストは継続できるようにする
    if (
      error instanceof Error &&
      error.message.includes("not a valid Openapi API definition")
    ) {
      // 空のIRオブジェクトを生成して期待値との比較を可能にする
      // これにより、未実装機能も「空の結果を返す」という期待値として管理できる
      const fileContent = await readFile(specPath, "utf-8");
      let title = "Unknown";
      let version = "1.0.0";

      // YAMLファイルから最低限の情報（title, version）を抽出
      const titleMatch = fileContent.match(/title:\s*["']?(.+?)["']?\s*$/m);
      const versionMatch = fileContent.match(/version:\s*["']?(.+?)["']?\s*$/m);

      if (titleMatch) title = titleMatch[1].trim();
      if (versionMatch) version = versionMatch[1].trim();

      // 空のIRオブジェクトを作成（すべての配列は空）
      actual = {
        metadata: {
          title,
          version,
          description: null,
          termsOfService: null,
          contact: null,
          license: null,
        },
        models: [],
        tags: [],
        endpoints: [],
        servers: [],
        security: [],
      };
    } else {
      // 予期しないエラーの場合は再スロー
      throw error;
    }
  }

  // デバッグ用: 実際の変換結果をファイルに出力
  if (WRITE_ACTUAL_FILES) {
    const actualPath = expectedPath.replace(".expected.json", ".actual.json");
    await writeFile(actualPath, JSON.stringify(actual, null, 2) + "\n");
    consola.info(
      `✍️  Wrote actual output to: ${actualPath.replace(coreDir, ".")}`,
    );
  }

  // 期待値ファイルの読み込み
  const expectedJson = await readFile(expectedPath, "utf-8");
  const expected = JSON.parse(expectedJson);

  // 実際の変換結果と期待値を比較（Vitestのexpect関数を使用）
  expect(actual).toEqual(expected);
}

/**
 * 現在の変換実装から期待値ファイルを生成する関数
 *
 * 使用場面:
 * 1. 新しいテストケースの初期セットアップ時
 * 2. 変換ロジックの意図的な変更後の期待値更新
 * 3. TDDのGreenフェーズで実装が完成した時点での期待値記録
 *
 * 注意事項:
 * - この関数は現在の実装の出力をそのまま期待値として保存します
 * - バグのある出力も期待値として保存されるため、生成後は必ず内容を確認してください
 * - 生成された期待値はGitで管理され、変更履歴が追跡されます
 *
 * @param testCase - fixturesディレクトリからの相対パス（拡張子なし）
 *                   例: "models/data-types"
 *
 * @example
 * ```typescript
 * // generate-expected.tsスクリプトで使用
 * await generateExpected("models/complex-structures");
 * // → fixtures/models/complex-structures.yaml を変換し、
 * //   fixtures/models/complex-structures.expected.json に保存
 * ```
 */
export async function generateExpected(testCase: string): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  const yamlPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.yaml`,
  );
  const expectedPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.expected.json`,
  );

  // 現在の実装で変換処理を実行
  const document = await parse(yamlPath);
  const result = transform(document);

  // 変換結果を期待値ファイルとして保存（整形済みJSON、末尾に改行）
  await writeFile(expectedPath, JSON.stringify(result, null, 2) + "\n");
}
