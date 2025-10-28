/**
 * エラーハンドリング - v2 Transformer Architecture
 *
 * 統一されたエラー処理ヘルパー関数を提供します。
 */

import { consola } from "consola";
import type { TransformError, TransformResult } from "./types";

/**
 * エラー結果を作成
 *
 * Phase 1-4では既存のwarn-and-return-nullパターンを維持しつつ、
 * エラー情報を構造化します。Phase 5で厳格化予定。
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "TRANSFORM_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns エラー結果
 */
export function createErrorResult(
  message: string,
  code: string = "TRANSFORM_ERROR",
  context?: unknown,
): TransformResult {
  // 既存の動作を維持：警告を出力
  consola.warn(message);

  return {
    type: null,
    models: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * エラー結果かどうかを判定
 *
 * @param result - 判定対象の結果
 * @returns エラー結果の場合true
 */
export function isErrorResult(result: TransformResult): boolean {
  return result.type === null || result.error !== undefined;
}

/**
 * 複数のエラーをマージ
 *
 * 複数の変換結果からエラーを収集します。
 *
 * @param results - 結果の配列
 * @returns マージされたエラー配列
 */
export function collectErrors(results: TransformResult[]): TransformError[] {
  return results
    .filter(isErrorResult)
    .map((r) => r.error)
    .filter(Boolean) as TransformError[];
}
