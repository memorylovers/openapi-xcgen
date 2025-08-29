import type { SchemaObject } from "../types/index";
import type { IRType } from "../types/ir/index";

/**
 * Visitor実行コンテキスト
 */
export interface VisitorContext {
  /** 現在のパス（breadcrumb） */
  path: string[];
  /** 訪問済み$refを記録（循環参照対策） */
  visited: Set<string>;
  /** 現在の深さ */
  depth: number;
  /** 最大深さ制限 */
  maxDepth: number;
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

/**
 * デフォルトコンテキストを作成
 */
export function createContext(
  options?: Partial<VisitorContext>,
): VisitorContext {
  return {
    path: [],
    visited: new Set(),
    depth: 0,
    maxDepth: 100,
    ...options,
  };
}
