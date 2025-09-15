/**
 * パラメータ関連のIR型定義
 */

import type { IRType } from "./type";

/**
 * IRParameterInType - パラメータの配置場所
 */
export type IRParameterInType = "path" | "query" | "header" | "cookie";

/**
 * IRParameter - APIパラメータ
 * @example
 * ```yaml
 * # OpenAPI → IRParameter
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     description: User ID
 *     schema:
 *       type: string
 *       format: uuid
 *   - name: limit
 *     in: query
 *     required: false
 *     schema:
 *       type: integer
 *       default: 20
 * ```
 */
export interface IRParameter {
  /** パラメータ名 */
  name: string;
  /** パラメータの配置場所 */
  in: IRParameterInType;
  /** 説明 */
  description: string | null;
  /** 必須フラグ */
  required: boolean;
  /** 型情報 */
  type: IRType;
  /** null許容フラグ（OpenAPI 3.0のnullable、OpenAPI 3.1のtype配列） */
  nullable: boolean | null;
  /** デフォルト値 */
  defaultValue: unknown | null;
  /** 非推奨フラグ */
  deprecated: boolean | null;
}
