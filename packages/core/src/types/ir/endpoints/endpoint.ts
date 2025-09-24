/**
 * エンドポイント関連のIR型定義
 */

import type { IRType } from "../common/type";
import type { IRParameter } from "./parameter";
import type { IRRequestBody } from "./request";
import type { IRResponse } from "./response";

/**
 * IRHttpMethod - HTTPメソッド
 */
export type IRHttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options"
  | "trace";

/**
 * IREndpoint - APIエンドポイント
 * @example
 * ```yaml
 * # OpenAPI → IREndpoint
 * paths:
 *   /users/{id}:
 *     get:
 *       operationId: getUser
 *       summary: Get user by ID
 *       description: Retrieve a user by their unique identifier
 *       tags: [users]
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Success
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: "#/components/schemas/User"
 * ```
 */
export interface IREndpoint {
  /** OpenAPIのoperationId - エンドポイント識別子（任意項目） */
  operationId?: string;
  /** HTTPメソッド（GET/POST等） */
  method: IRHttpMethod;
  /** エンドポイントパス（例: "/users/{id}"） */
  path: string;
  /** 説明 */
  description?: string;
  /** サマリー */
  summary?: string;
  /** タグ（OpenAPIのtags配列） */
  tags: string[];
  /** パラメータ（統合モデルがある場合は参照、ない場合は個別配列） */
  parameters: IRType | IRParameter[];
  /** リクエストボディ */
  requestBody?: IRRequestBody;
  /** レスポンス */
  responses: IRResponse[];
  /** 非推奨フラグ */
  deprecated?: true;
}
