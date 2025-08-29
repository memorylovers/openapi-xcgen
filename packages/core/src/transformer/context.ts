/**
 * Context管理ユーティリティ
 */

import type { VisitorContext } from "./types";

/**
 * 新しいパスコンテキストを作成
 */
export function withPath(
  context: VisitorContext,
  ...segments: string[]
): VisitorContext {
  return {
    ...context,
    path: [...context.path, ...segments],
  };
}

/**
 * 深さを増やした新しいコンテキストを作成
 */
export function withDepth(context: VisitorContext): VisitorContext {
  return {
    ...context,
    depth: context.depth + 1,
  };
}

/**
 * 訪問済みマークを追加した新しいコンテキストを作成
 */
export function withVisited(
  context: VisitorContext,
  ref: string,
): VisitorContext {
  const newVisited = new Set(context.visited);
  newVisited.add(ref);
  return {
    ...context,
    visited: newVisited,
  };
}

/**
 * 循環参照をチェック
 */
export function isCircularReference(
  context: VisitorContext,
  ref: string,
): boolean {
  return context.visited.has(ref);
}

/**
 * 深さ制限をチェック
 */
export function isDepthLimitExceeded(context: VisitorContext): boolean {
  return context.depth >= context.maxDepth;
}
