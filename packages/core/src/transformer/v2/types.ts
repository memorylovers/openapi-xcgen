/**
 * 統一インターフェース定義 - v2 Transformer Architecture
 *
 * 3層アーキテクチャ（Dispatcher/Traverser/Transformer）で使用される
 * 統一された型定義を提供します。
 */

import type { IRModel, IRType } from "../../types";

/**
 * 変換結果の統一インターフェース
 *
 * 全ての Dispatcher/Traverser/Transformer が返す統一された結果型。
 * エラー情報をオプショナルで含むことで、段階的なエラーハンドリングの
 * 厳格化に対応します。
 */
export interface TransformResult {
  /**
   * 変換後の型
   * - プリミティブ型、参照型、配列型などのIR型
   * - nullの場合はエラーを示す
   */
  type: IRType | null;

  /**
   * 抽出されたモデルの配列
   * - オブジェクト、列挙型、配列、マップなどのIRモデル
   * - 子要素から抽出されたモデルも含む
   */
  models: IRModel[];

  /**
   * エラー情報（オプショナル）
   * - Phase 5で厳格化予定
   * - 現在は互換性のため警告レベルで使用
   */
  error?: TransformError;
}

/**
 * エラー情報
 */
export interface TransformError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** エラーが発生したコンテキスト情報 */
  context?: unknown;
}

/**
 * プロパティトラバーサルの結果
 *
 * Object型のプロパティを走査した結果を表します。
 */
export interface PropertyTraversalResult {
  /** 変換されたプロパティの配列 */
  properties: Array<{
    name: string;
    type: IRType;
    required?: boolean;
    nullable?: boolean;
    description?: string;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
}

/**
 * additionalPropertiesトラバーサルの結果
 */
export interface AdditionalPropertiesTraversalResult {
  /** additionalPropertiesの型（未定義の場合はundefined） */
  type: IRType | undefined;
  /** 子要素から抽出されたモデル */
  models: IRModel[];
}

/**
 * 配列要素トラバーサルの結果
 */
export interface ArrayItemTraversalResult {
  /** 配列要素の型 */
  itemType: IRType | null;
  /** 子要素から抽出されたモデル */
  models: IRModel[];
}

/**
 * Composition（allOf/oneOf/anyOf）トラバーサルの結果
 */
export interface CompositionTraversalResult {
  /** 合成される型の配列 */
  schemas: IRType[];
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
}
