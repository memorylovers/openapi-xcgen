import { fileURLToPath } from "node:url";
import { dirname, resolve } from "pathe";

// テストユーティリティのディレクトリを基準にfixturesディレクトリを特定
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, "../fixtures");

/**
 * fixtureファイルのパスを取得
 * @param filename - fixtureファイル名
 * @returns 絶対パス
 */
function getFixturePath(filename: string): string {
  return resolve(FIXTURES_DIR, filename);
}

/**
 * テスト用fixtureファイルのパス定数
 * 直接parseやreadFileに渡せる絶対パスを提供
 */
export const FIXTURES = {
  PETSTORE: getFixturePath("petstore.yaml"),
  INVALID: getFixturePath("invalid.yaml"),
  INVALID_OPENAPI: getFixturePath("invalid-openapi.yaml"),
} as const;

// 型定義（オプション）
export type FixturePath = (typeof FIXTURES)[keyof typeof FIXTURES];
