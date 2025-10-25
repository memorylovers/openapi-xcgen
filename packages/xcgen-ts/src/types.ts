/**
 * TypeScript生成器の型定義
 *
 * @module @openapi-xcgen/generator-typescript/types
 */

import type { Hooks } from "./hooks";

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
  /** コード生成をカスタマイズするHook（オプション） */
  hooks?: Hooks;
}

/**
 * 生成ファイルの種別
 */
export type GeneratedFileType = "types" | "schemas" | "services" | "client";

/**
 * 個別生成器の生成結果
 *
 * Types/Schemas/Services生成器が返す結果
 */
export interface GeneratorResult {
  /** 書き込まれたファイルパスの配列（相対パス） */
  files: string[];
  /** 生成されたモデル/スキーマ/サービスの数 */
  count: number;
}

/**
 * 全体の生成結果
 *
 * メインのgenerate()関数が返す結果
 */
export interface GenerationResult {
  /** 生成されたファイルパスの配列（絶対パス） */
  files: string[];
  /** 生成された型定義の数 */
  typesCount: number;
  /** 生成されたスキーマの数（validator指定時のみ） */
  schemasCount?: number;
  /** 生成されたAPI関数の数 */
  servicesCount: number;
}

/**
 * 生成器設定を定義するヘルパー関数
 *
 * TypeScript設定ファイルで型補完を提供します
 *
 * @param options - 生成器設定オプション
 * @returns 同じ設定オプション（型推論付き）
 *
 * @example
 * ```typescript
 * // xcgen.config.ts
 * import { defineConfig } from '@openapi-xcgen/xcgen-ts';
 *
 * export default defineConfig({
 *   input: './openapi.yaml',
 *   output: './generated',
 *   validator: 'valibot',
 *   hooks: {
 *     'property:generate': async (ctx) => {
 *       // カスタム処理
 *     }
 *   }
 * });
 * ```
 */
export function defineConfig(options: GeneratorOptions): GeneratorOptions {
  return options;
}
