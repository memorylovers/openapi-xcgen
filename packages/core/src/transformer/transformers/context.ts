/**
 * コンテキスト管理 - v2 Transformer Architecture
 *
 * 簡素化されたコンテキスト定義とビルダー関数を提供します。
 */

/**
 * 変換コンテキスト（簡素化版）
 *
 * Phase 1-4では既存のVisitorContextと並行使用します。
 * Phase 5で完全移行予定。
 */
export interface TransformContext {
  /**
   * OpenAPIドキュメント内の現在位置
   *
   * 例:
   * - ["components", "schemas", "User"]
   * - ["paths", "/users/{id}", "get", "responses", "200"]
   */
  documentPath: string[];

  /**
   * ルートセグメント
   */
  rootSegment: "paths" | "components";

  /**
   * 追加メタデータ（拡張用）
   *
   * コンテキストに特殊な情報が必要な場合に使用します。
   * 例: discriminatorのマッピング情報など
   */
  metadata?: Record<string, unknown>;
}

/**
 * プロパティ用コンテキストを構築
 *
 * @param parent - 親コンテキスト
 * @param propName - プロパティ名
 * @returns 新しいコンテキスト
 */
export function buildPropertyContext(
  parent: TransformContext,
  propName: string,
): TransformContext {
  return {
    ...parent,
    documentPath: [...parent.documentPath, propName],
  };
}

/**
 * additionalProperties用コンテキストを構築
 *
 * @param parent - 親コンテキスト
 * @returns 新しいコンテキスト
 */
export function buildAdditionalPropertiesContext(
  parent: TransformContext,
): TransformContext {
  return {
    ...parent,
    documentPath: [...parent.documentPath, "additionalProperties"],
  };
}

/**
 * 配列要素用コンテキストを構築
 *
 * @param parent - 親コンテキスト
 * @returns 新しいコンテキスト
 */
export function buildArrayItemContext(
  parent: TransformContext,
): TransformContext {
  // 配列名が "Users" なら "UsersItem" のようにする
  const arrayName = parent.documentPath.at(-1) ?? "";
  const itemName = arrayName ? `${arrayName}Item` : "Item";

  return {
    ...parent,
    documentPath: [...parent.documentPath.slice(0, -1), itemName],
  };
}

/**
 * Composition（allOf/oneOf/anyOf）の要素用コンテキストを構築
 *
 * @param parent - 親コンテキスト
 * @param compositionType - 合成タイプ（"allOf" | "oneOf" | "anyOf"）
 * @param index - 配列内のインデックス
 * @returns 新しいコンテキスト
 */
export function buildCompositionItemContext(
  parent: TransformContext,
  compositionType: "allOf" | "oneOf" | "anyOf",
  index: number,
): TransformContext {
  // 親名が "Pet" で oneOf[0] なら "PetOneOf0" のようにする
  const parentName = parent.documentPath.at(-1) ?? "";
  const itemName = `${parentName}${compositionType[0].toUpperCase()}${compositionType.slice(1)}${index}`;

  return {
    ...parent,
    documentPath: [...parent.documentPath.slice(0, -1), itemName],
  };
}
