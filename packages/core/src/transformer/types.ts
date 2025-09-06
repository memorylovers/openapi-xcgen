import type { SchemaObject } from "../types/index";
import type { IRType } from "../types/ir/index";

/**
 * Visitor実行コンテキスト
 */
export interface VisitorContext {
  /** OpenAPIドキュメント内の現在位置 */
  documentPath: string[];
}

/**
 * Visitorの実行結果
 */
export interface VisitorResult<T> {
  /** 変換結果 */
  value: T;
  /** 子要素の処理を続けるかどうか */
  continue?: boolean;
}

/**
 * Schema Visitor関数の型定義
 */
export type SchemaVisitor = (
  schema: SchemaObject,
  context: VisitorContext,
) => VisitorResult<IRType>;
