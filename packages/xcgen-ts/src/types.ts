/**
 * TypeScript生成器の型定義
 *
 * @module @openapi-xcgen/generator-typescript/types
 */

/**
 * 生成器設定オプション
 */
export interface GeneratorOptions {
  /** 入力ファイルパス（OpenAPI YAML/JSON） */
  input: string;
  /** 出力ディレクトリパス */
  output: string;
  /** バリデーションライブラリ（オプション） */
  validator?: "valibot";
  /** カスタムテンプレートディレクトリ（オプション） */
  templatesDir?: string;
}

/**
 * 生成ファイルの種別
 */
export type GeneratedFileType = "types" | "schemas" | "services" | "client";

/**
 * 生成結果
 */
export interface GenerationResult {
  /** 生成されたファイルパスの配列 */
  files: string[];
  /** 生成された型定義の数 */
  typesCount: number;
  /** 生成されたスキーマの数（validator指定時のみ） */
  schemasCount?: number;
  /** 生成されたAPI関数の数 */
  servicesCount: number;
}
