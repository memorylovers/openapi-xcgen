/**
 * 操作固有モデル定義のIR型定義
 */

import type { IRType } from "../common/type";
import type { IRResponseHeader } from "../endpoints/response";
import type {
  IRAllOfSchema,
  IRAnyOfSchema,
  IRArraySchema,
  IREnumSchema,
  IRMapSchema,
  IRObjectSchema,
  IRUnionSchema,
} from "./base";
import type { IRParameterProperty, IRProperty } from "./property";

/**
 * IRParameterComponent - パラメータ統合コンポーネント定義
 * APIエンドポイントのパラメータを統合したコンポーネント（GetUsersParamsなど）
 * @example
 * ```yaml
 * # OpenAPI parameters → IRParameterComponent
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
 * # → GetUsersParams component with IRParameterProperty
 * ```
 */
export interface IRParameterComponent {
  /** 型種別 */
  kind: "parameter";
  /** コンポーネント名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** コンポーネントの説明 */
  description?: string;
  /** パラメータプロパティの配列（in情報を含む） */
  properties: IRParameterProperty[];
}

/**
 * IRRequestBodyComponent - リクエストボディ専用コンポーネント定義
 * インラインスキーマから抽出されたrequestBodyコンポーネント（PostUsersRequestBodyなど）
 * IRObjectSchemaの性質を継承し、リクエストボディ固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI requestBody → IRRequestBodyComponent
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
 * # → PostUsersRequestBody component (kind="requestBody")
 * ```
 */
export interface IRRequestBodyComponent {
  /** 型種別（objectのサブタイプ） */
  kind: "requestBody";
  /** コンポーネント名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** コンポーネントの説明 */
  description?: string;
  /** プロパティ配列（IRObjectSchemaから継承） */
  properties: IRProperty[];
  /** 必須フラグ（リクエストボディ固有） */
  required?: true;
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
}

/**
 * IRResponseComponent - レスポンス専用コンポーネント定義
 * インラインスキーマから抽出されたresponseコンポーネント（GetUsers200Responseなど）
 * IRObjectSchemaの性質を継承し、レスポンス固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI responses → IRResponseComponent
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
 * # → GetUsers200Response component (kind="response")
 * ```
 */
export interface IRResponseComponent {
  /** 型種別（objectのサブタイプ） */
  kind: "response";
  /** コンポーネント名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** コンポーネントの説明 */
  description?: string;
  /** プロパティ配列（IRObjectSchemaから継承） */
  properties: IRProperty[];
  /** HTTPステータスコード（レスポンス固有） */
  statusCode: string;
  /** ヘッダー配列（レスポンス固有） */
  headers?: IRResponseHeader[];
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
}

/**
 * IRSchema - スキーマ型の統合
 * OpenAPIのschemas配下で定義される型の統合
 */
export type IRSchema =
  | IRObjectSchema
  | IREnumSchema
  | IRArraySchema
  | IRMapSchema
  | IRAllOfSchema
  | IRAnyOfSchema
  | IRUnionSchema;

/**
 * IROperationComponent - 操作固有コンポーネントの統合
 * エンドポイント操作に関連するコンポーネントの統合
 */
export type IROperationComponent =
  | IRParameterComponent
  | IRRequestBodyComponent
  | IRResponseComponent;

/**
 * IRComponent - 統一されたコンポーネント定義
 * 全てのデータコンポーネントを統一的に表現する判別共用体
 *
 * @example
 * ```typescript
 * // 使用例：型安全なswitch文
 * function processComponent(component: IRComponent) {
 *   switch (component.kind) {
 *     case "object":
 *       // component.propertiesにアクセス可能
 *       break;
 *     case "enum":
 *       // component.valuesにアクセス可能
 *       break;
 *     case "array":
 *       // component.itemTypeにアクセス可能
 *       break;
 *     case "map":
 *       // component.valueTypeにアクセス可能
 *       break;
 *     case "parameter":
 *       // component.propertiesにアクセス可能（IRParameterProperty[]）
 *       break;
 *     case "requestBody":
 *       // component.propertiesにアクセス可能
 *       break;
 *     case "response":
 *       // component.propertiesにアクセス可能
 *       break;
 *   }
 * }
 * ```
 */
export type IRComponent = IRSchema | IROperationComponent;
