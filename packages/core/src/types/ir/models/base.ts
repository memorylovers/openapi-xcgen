/**
 * コアモデル定義のIR型定義
 */

import type { IRScalarType, IRType } from "../common/type";
import type { IRProperty } from "./property";

/**
 * IRObjectModel - オブジェクト型モデル定義
 * componentsで定義されたものと、インラインスキーマから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IRObjectModel
 * # パターン1: componentsで定義
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *
 * # パターン2: インラインスキーマ（"CreateUserRequest"として自動命名）
 * paths:
 *   /users:
 *     post:
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 * ```
 */
export interface IRObjectModel {
  /** 型種別 */
  kind: "object";
  /** モデル名（PascalCase） */
  name: string;
  /**
   * 参照パス（$refで参照される際のパス）
   * @example
   * - Components定義: `#/components/schemas/User`
   * - インラインスキーマ: `#/paths/::users/post/requestBody/PostUsersRequestBody`
   */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティの配列 */
  properties: IRProperty[];
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
}

/**
 * IREnumValue - Enum値
 * @example
 * ```yaml
 * # OpenAPI → IREnumValue
 * enum: [active, inactive, pending]
 * # → values: [
 * #     { value: "active", name: "ACTIVE" },
 * #     { value: "inactive", name: "INACTIVE" },
 * #     { value: "pending", name: "PENDING" }
 * #   ]
 * ```
 */
export interface IREnumValue {
  /** 値 */
  value: string | number;
  /** 名前（コード生成用） */
  name: string;
  /** 説明 */
  description: string | null;
}

/**
 * IREnumModel - 列挙型モデル定義
 * componentsで定義されたものと、インラインenumから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IREnumModel
 * # パターン1: componentsで定義
 * components:
 *   schemas:
 *     Status:
 *       type: string
 *       enum: [active, inactive, pending]
 *
 * # パターン2: インラインenum（"UserStatus"として自動命名）
 * properties:
 *   status:
 *     type: string
 *     enum: [active, inactive, pending]
 * ```
 */
export interface IREnumModel {
  /** 型種別 */
  kind: "enum";
  /** Enum名（PascalCase） */
  name: string;
  /**
   * 参照パス（$refで参照される際のパス）
   * @example
   * - Components定義: `#/components/schemas/UserRole`
   * - インラインEnum: `#/paths/::users/get/parameters/GetUsersParamsSortEnum`
   */
  referencePath: string;
  /** 説明 */
  description: string | null;
  /** 値の型（OpenAPIの型をそのまま保持） */
  type: IRScalarType;
  /** Enum値の配列 */
  values: IREnumValue[];
}

/**
 * IRArrayModel - 配列型モデル定義（将来の拡張性のため）
 * 現在は未使用だが、将来的に独立したモデルとしての抽出に備える
 */
export interface IRArrayModel {
  /** 型種別 */
  kind: "array";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** 配列アイテムの型 */
  itemType: IRType;
}

/**
 * IRMapModel - マップ型モデル定義（将来の拡張性のため）
 * 現在は未使用だが、将来的に独立したモデルとしての抽出に備える
 */
export interface IRMapModel {
  /** 型種別 */
  kind: "map";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** 値の型 */
  valueType: IRType;
}
