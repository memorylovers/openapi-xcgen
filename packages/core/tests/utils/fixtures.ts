import { fileURLToPath } from "node:url";
import { dirname, resolve } from "pathe";

// テストユーティリティのディレクトリを基準にfixturesディレクトリを特定
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 各種fixtureファイルのパスを取得
 * @param path - fixturesディレクトリからの相対パス
 * @returns 絶対パス
 */
function getFixturePath(path: string): string {
  return resolve(__dirname, "../", path);
}

/**
 * テスト用fixtureファイルのパス定数
 * 直接parseやreadFileに渡せる絶対パスを提供
 */
export const FIXTURES = {
  // General fixtures
  PETSTORE: getFixturePath("e2e/fixtures/general/petstore.yaml"),
  MULTI_SERVICE: getFixturePath("e2e/fixtures/general/multi-service.yaml"),
  COMPLEX_SCHEMA: getFixturePath("e2e/fixtures/general/complex-schema.yaml"),

  // Parser test fixtures
  INVALID: getFixturePath("parser/fixtures/invalid.yaml"),
  INVALID_OPENAPI: getFixturePath("parser/fixtures/invalid-openapi.yaml"),
} as const;

// 型定義（オプション）
export type FixturePath = (typeof FIXTURES)[keyof typeof FIXTURES];
