/**
 * パラメータ関連のIR型定義
 */

import type { IRExtensions } from "../common/extensions";
import type { IRType } from "../common/type";
import type { IRValidation } from "../models/validation";

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
  description?: string;
  /** 必須フラグ */
  required?: true;
  /** 型情報 */
  type: IRType;
  /** null許容フラグ（OpenAPI 3.0のnullable、OpenAPI 3.1のtype配列） */
  nullable?: true;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: true;
  /** バリデーション制約 */
  validation?: IRValidation;
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: IRExtensions;
}
