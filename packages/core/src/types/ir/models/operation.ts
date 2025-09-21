/**
 * 操作固有モデル定義のIR型定義
 */

import type { IRType } from "../common/type";
import type { IRResponseHeader } from "../endpoints/response";
import type {
  IRArrayModel,
  IREnumModel,
  IRMapModel,
  IRObjectModel,
} from "./base";
import type { IRParameterProperty, IRProperty } from "./property";

/**
 * IRParameterModel - パラメータ統合モデル定義
 * APIエンドポイントのパラメータを統合したモデル（GetUsersParamsなど）
 * @example
 * ```yaml
 * # OpenAPI parameters → IRParameterModel
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query
 *     schema:
 *       type: integer
 *       default: 10
 * # → GetUsersParams model with IRParameterProperty
 * ```
 */
export interface IRParameterModel {
  /** 型種別 */
  kind: "parameter";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** パラメータプロパティの配列（in情報を含む） */
  properties: IRParameterProperty[];
}

/**
 * IRRequestBodyModel - リクエストボディ専用モデル定義
 * インラインスキーマから抽出されたrequestBodyモデル（PostUsersRequestBodyなど）
 * IRObjectModelの性質を継承し、リクエストボディ固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI requestBody → IRRequestBodyModel
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 * # → PostUsersRequestBody model (kind="requestBody")
 * ```
 */
export interface IRRequestBodyModel {
  /** 型種別（objectのサブタイプ） */
  kind: "requestBody";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティ配列（IRObjectModelから継承） */
  properties: IRProperty[];
  /** 必須フラグ（リクエストボディ固有） */
  required: boolean;
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
}

/**
 * IRResponseModel - レスポンス専用モデル定義
 * インラインスキーマから抽出されたresponseモデル（GetUsers200Responseなど）
 * IRObjectModelの性質を継承し、レスポンス固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI responses → IRResponseModel
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 *             count:
 *               type: integer
 * # → GetUsers200Response model (kind="response")
 * ```
 */
export interface IRResponseModel {
  /** 型種別（objectのサブタイプ） */
  kind: "response";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティ配列（IRObjectModelから継承） */
  properties: IRProperty[];
  /** HTTPステータスコード（レスポンス固有） */
  statusCode: string;
  /** ヘッダー配列（レスポンス固有） */
  headers: IRResponseHeader[] | null;
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
}

/**
 * IRModel - 統一されたモデル定義
 * 全てのデータモデルを統一的に表現する判別共用体
 *
 * @example
 * ```typescript
 * // 使用例：型安全なswitch文
 * function processModel(model: IRModel) {
 *   switch (model.kind) {
 *     case "object":
 *       // model.propertiesにアクセス可能
 *       break;
 *     case "enum":
 *       // model.valuesにアクセス可能
 *       break;
 *     case "array":
 *       // model.itemTypeにアクセス可能
 *       break;
 *     case "map":
 *       // model.valueTypeにアクセス可能
 *       break;
 *     case "parameter":
 *       // model.propertiesにアクセス可能（IRParameterProperty[]）
 *       break;
 *     case "requestBody":
 *       // model.contentにアクセス可能（IRRequestContent[]）
 *       break;
 *     case "response":
 *       // model.contentにアクセス可能（IRResponseContent[]）
 *       break;
 *   }
 * }
 * ```
 */
export type IRModel =
  | IRObjectModel
  | IREnumModel
  | IRArrayModel
  | IRMapModel
  | IRParameterModel
  | IRRequestBodyModel
  | IRResponseModel;
