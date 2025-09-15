/**
 * プロパティ関連のIR型定義
 */

import type { IRParameterInType } from "../endpoints/parameter";
import type { IRType } from "../common/type";
import type { IRValidation } from "./validation";

/**
 * IRProperty - オブジェクトのプロパティ定義
 * @example
 * ```yaml
 * # OpenAPI → IRProperty
 * properties:
 *   id:
 *     type: integer
 *     format: int64
 *     description: User ID
 *     example: 1234
 *   name:
 *     type: string
 *     minLength: 3
 *     maxLength: 50
 *     description: User name
 *   email:
 *     type: string
 *     format: email
 *     nullable: true
 *     deprecated: true
 * ```
 */
export interface IRProperty {
  /** プロパティ名 */
  name: string;
  /** 説明 */
  description: string | null;
  /** 型情報 */
  type: IRType;
  /** 必須フラグ（requiredArrayから導出） */
  required: boolean;
  /** null許容フラグ（OpenAPI 3.0のnullable、OpenAPI 3.1のtype配列） */
  nullable: boolean | null;
  /** デフォルト値 */
  defaultValue: unknown | null;
  /** 非推奨フラグ */
  deprecated: boolean | null;
  /** バリデーション制約 */
  validation: IRValidation | null;
}

/**
 * IRParameterProperty - パラメータモデルのプロパティ定義
 * IRPropertyにパラメータ固有のin情報を追加
 * @example
 * ```yaml
 * # OpenAPI → IRParameterProperty (パラメータが統合モデルのプロパティになる)
 * parameters:
 *   - name: id
 *     in: path  # この情報を保持
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query # この情報を保持
 *     schema:
 *       type: integer
 * ```
 */
export interface IRParameterProperty extends IRProperty {
  /** パラメータの配置場所 */
  in: IRParameterInType;
}
