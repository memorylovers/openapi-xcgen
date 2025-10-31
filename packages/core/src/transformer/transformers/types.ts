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
    defaultValue?: unknown;
    deprecated?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    validation?: import("../../types").IRValidation;
    extensions?: import("../../types").IRExtensions;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * additionalPropertiesトラバーサルの結果
 */
export interface AdditionalPropertiesTraversalResult {
  /** additionalPropertiesの型（未定義の場合はundefined） */
  type: IRType | undefined;
  /** 子要素から抽出されたモデル */
  models: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * 配列要素トラバーサルの結果
 */
export interface ArrayItemTraversalResult {
  /** 配列要素の型 */
  itemType: IRType | null;
  /** 子要素から抽出されたモデル */
  models: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * Composition（allOf/oneOf/anyOf）トラバーサルの結果
 */
export interface CompositionTraversalResult {
  /** 合成される型の配列 */
  schemas: IRType[];
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

//
// === Operation System Types ===
//

/**
 * Content（MIME type dictionary）トラバーサルの結果
 *
 * RequestBodyとResponseで共有される、MIMEタイプとスキーマの組み合わせを
 * 処理した結果を表します。
 */
export interface ContentTraversalResult {
  /** MIMEタイプとスキーマの配列 */
  content: Array<{
    mimeType: string;
    schema: IRType;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** インラインオブジェクトスキーマとして特別なモデルを生成すべきか */
  requiresSpecialModel: boolean;
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * ヘッダー（headers dictionary）トラバーサルの結果
 */
export interface HeadersTraversalResult {
  /** 変換されたヘッダーの配列 */
  headers: Array<{
    name: string;
    type: IRType;
    description?: string;
    defaultValue?: unknown;
    deprecated?: boolean;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * パラメータ配列トラバーサルの結果
 */
export interface ParametersTraversalResult {
  /** 変換されたパラメータの配列 */
  parameters: Array<{
    name: string;
    in: "path" | "query" | "header" | "cookie";
    type: IRType;
    required?: boolean;
    nullable?: boolean;
    description?: string;
    defaultValue?: unknown;
    deprecated?: boolean;
    validation?: import("../../types").IRValidation;
    extensions?: import("../../types").IRExtensions;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * レスポンス辞書トラバーサルの結果
 */
export interface ResponsesTraversalResult {
  /** ステータスコード別のレスポンス配列 */
  responses: Array<{
    statusCode: string;
    description?: string;
    content?: Array<{
      mimeType: string;
      schema: IRType;
    }>;
    headers?: Array<{
      name: string;
      type: IRType;
      description?: string;
      defaultValue?: unknown;
      deprecated?: boolean;
    }>;
    ref?: string;
  }>;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * Operation子要素トラバーサルの結果
 *
 * OperationObjectの子要素（parameters, requestBody, responses）を
 * すべて訪問した結果を集約します。
 */
export interface OperationTraversalResult {
  /** パラメータトラバーサル結果 */
  parametersResult?: ParametersTraversalResult;
  /** リクエストボディトラバーサル結果 */
  requestBodyResult?: {
    required?: boolean;
    description?: string;
    content: ContentTraversalResult;
  };
  /** レスポンストラバーサル結果 */
  responsesResult?: ResponsesTraversalResult;
  /** 子要素から抽出されたモデル */
  childModels: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}

/**
 * パラメータ集約の結果
 *
 * Aggregatorレイヤーでパラメータ統合モデルを生成した結果を表します。
 */
export interface ParameterAggregationResult {
  /** パラメータ統合モデルへの参照（生成された場合） */
  reference: IRType | null;
  /** パラメータ統合モデル（IRParameterModel）*/
  model: IRModel | null;
}

/**
 * パラメータ変換の結果
 *
 * Transformerレイヤーで個別のParameterObjectをIRParameterに変換した結果を表します。
 */
export interface ParameterTransformResult {
  /** 変換されたパラメータ（失敗時はnull） */
  parameter: unknown | null;
  /** 子要素から抽出されたモデル */
  models: IRModel[];
  /** エラー情報（オプショナル） */
  error?: TransformError;
}
