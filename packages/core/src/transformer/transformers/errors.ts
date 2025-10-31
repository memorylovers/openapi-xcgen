/**
 * エラーハンドリング - v2 Transformer Architecture
 *
 * 統一されたエラー処理ヘルパー関数を提供します。
 */

import { consola } from "consola";
import type {
  AdditionalPropertiesTraversalResult,
  ArrayItemTraversalResult,
  CompositionTraversalResult,
  ContentTraversalResult,
  HeadersTraversalResult,
  OperationTraversalResult,
  ParametersTraversalResult,
  ParameterTransformResult,
  PropertyTraversalResult,
  ResponsesTraversalResult,
  TransformError,
  TransformResult,
} from "./types";

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

/**
 * パラメータエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "PARAMETER_TRANSFORM_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns パラメータエラー結果
 */
export function createParameterErrorResult(
  message: string,
  code: string = "PARAMETER_TRANSFORM_ERROR",
  context?: unknown,
): ParameterTransformResult {
  // 既存の動作を維持：警告を出力
  consola.warn(message);

  return {
    parameter: null,
    models: [],
    error: {
      code,
      message,
      context,
    },
  };
}

//
// === Traverser Error Helpers ===
//

/**
 * プロパティトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "PROPERTY_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns プロパティトラバーサルエラー結果
 */
export function createPropertyTraversalError(
  message: string,
  code: string = "PROPERTY_TRAVERSAL_ERROR",
  context?: unknown,
): PropertyTraversalResult {
  consola.warn(message);

  return {
    properties: [],
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * AdditionalPropertiesトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "ADDITIONAL_PROPERTIES_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns AdditionalPropertiesトラバーサルエラー結果
 */
export function createAdditionalPropertiesTraversalError(
  message: string,
  code: string = "ADDITIONAL_PROPERTIES_TRAVERSAL_ERROR",
  context?: unknown,
): AdditionalPropertiesTraversalResult {
  consola.warn(message);

  return {
    type: undefined,
    models: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * 配列要素トラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "ARRAY_ITEM_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns 配列要素トラバーサルエラー結果
 */
export function createArrayItemTraversalError(
  message: string,
  code: string = "ARRAY_ITEM_TRAVERSAL_ERROR",
  context?: unknown,
): ArrayItemTraversalResult {
  consola.warn(message);

  return {
    itemType: null,
    models: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * Compositionトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "COMPOSITION_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns Compositionトラバーサルエラー結果
 */
export function createCompositionTraversalError(
  message: string,
  code: string = "COMPOSITION_TRAVERSAL_ERROR",
  context?: unknown,
): CompositionTraversalResult {
  consola.warn(message);

  return {
    schemas: [],
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * Contentトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "CONTENT_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns Contentトラバーサルエラー結果
 */
export function createContentTraversalError(
  message: string,
  code: string = "CONTENT_TRAVERSAL_ERROR",
  context?: unknown,
): ContentTraversalResult {
  consola.warn(message);

  return {
    content: [],
    childModels: [],
    requiresSpecialModel: false,
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * ヘッダートラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "HEADERS_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns ヘッダートラバーサルエラー結果
 */
export function createHeadersTraversalError(
  message: string,
  code: string = "HEADERS_TRAVERSAL_ERROR",
  context?: unknown,
): HeadersTraversalResult {
  consola.warn(message);

  return {
    headers: [],
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * パラメータトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "PARAMETERS_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns パラメータトラバーサルエラー結果
 */
export function createParametersTraversalError(
  message: string,
  code: string = "PARAMETERS_TRAVERSAL_ERROR",
  context?: unknown,
): ParametersTraversalResult {
  consola.warn(message);

  return {
    parameters: [],
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * レスポンストラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "RESPONSES_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns レスポンストラバーサルエラー結果
 */
export function createResponsesTraversalError(
  message: string,
  code: string = "RESPONSES_TRAVERSAL_ERROR",
  context?: unknown,
): ResponsesTraversalResult {
  consola.warn(message);

  return {
    responses: [],
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}

/**
 * Operationトラバーサルエラー結果を作成
 *
 * @param message - エラーメッセージ
 * @param code - エラーコード（デフォルト: "OPERATION_TRAVERSAL_ERROR"）
 * @param context - エラーが発生したコンテキスト情報
 * @returns Operationトラバーサルエラー結果
 */
export function createOperationTraversalError(
  message: string,
  code: string = "OPERATION_TRAVERSAL_ERROR",
  context?: unknown,
): OperationTraversalResult {
  consola.warn(message);

  return {
    childModels: [],
    error: {
      code,
      message,
      context,
    },
  };
}
