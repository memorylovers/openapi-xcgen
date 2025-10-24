/**
 * プロパティ関連のIR型定義
 */

import type { Extensions } from "../common/extensions";
import type { IRType } from "../common/type";
import type { IRParameterInType } from "../endpoints/parameter";
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
  description?: string;
  /** 型情報 */
  type: IRType;
  /** 必須フラグ（requiredArrayから導出） */
  required?: true;
  /** null許容フラグ（OpenAPI 3.0のnullable、OpenAPI 3.1のtype配列） */
  nullable?: true;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: true;
  /** レスポンス専用フラグ */
  readOnly?: true;
  /** リクエスト専用フラグ */
  writeOnly?: true;
  /** バリデーション制約 */
  validation?: IRValidation;
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: Extensions;
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
