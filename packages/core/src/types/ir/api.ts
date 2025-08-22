/**
 * APIエンドポイント関連のIR型定義
 */

import type { IRType } from "./data";

/**
 * MimeType - MIMEタイプ
 * よく使われるMIMEタイプを列挙し、それ以外もstringで許可
 */
export type MimeType =
  | "application/json"
  | "application/xml"
  | "application/x-www-form-urlencoded"
  | "multipart/form-data"
  | "text/plain"
  | "text/html"
  | "application/octet-stream"
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "application/pdf"
  | string; // その他のカスタムMIMEタイプも許可

/**
 * IRContentMap - コンテンツタイプごとのスキーママップ
 */
export type IRContentMap = Record<MimeType, IRType>;

/**
 * IRService - APIサービス（タグでグループ化）
 * @example
 * ```yaml
 * # OpenAPI → IRService
 * tags:
 *   - name: users
 *     description: User management operations
 *
 * paths:
 *   /users:
 *     get:
 *       tags: [users]  # この"users"タグでグループ化
 *       operationId: listUsers
 *   /users/{id}:
 *     get:
 *       tags: [users]  # 同じタグのエンドポイント
 *       operationId: getUser
 * ```
 */
export interface IRService {
  /** サービス名 */
  name: string;
  /** 説明 */
  description?: string;
  /** エンドポイントの配列 */
  endpoints: IREndpoint[];
}

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
  /** エンドポイントID（operationId） */
  id: string;
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パス */
  path: string;
  /** 説明 */
  description?: string;
  /** サマリー */
  summary?: string;
  /** パラメータ */
  parameters: IRParameter[];
  /** リクエストボディ */
  requestBody?: IRRequestBody;
  /** レスポンス */
  responses: IRResponse[];
  /** 非推奨フラグ */
  deprecated?: boolean;
  /** セキュリティ要件 */
  security?: string[];
}

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
  | "options";

/**
 * IRParameterInType - パラメータの場所を表す型
 * OpenAPIの parameter.in の値に対応
 */
export type IRParameterInType = "path" | "query" | "header" | "cookie";

/**
 * IRParameter - パラメータ
 * @example
 * ```yaml
 * # OpenAPI → IRParameter
 * # パターン1: インラインスキーマ
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
 *       default: 10
 *
 * # パターン2: components参照
 * parameters:
 *   - $ref: "#/components/parameters/PageParam"
 *
 * components:
 *   parameters:
 *     PageParam:
 *       name: page
 *       in: query
 *       schema:
 *         type: integer
 *         minimum: 1
 * ```
 */
export interface IRParameter {
  /** パラメータ名 */
  name: string;
  /** パラメータの場所 */
  in: IRParameterInType;
  /** 説明 */
  description?: string;
  /** 必須フラグ */
  required: boolean;
  /** 型情報 */
  type: IRType;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: boolean;
}

/**
 * IRRequestBody - リクエストボディ
 * @example
 * ```yaml
 * # OpenAPI → IRRequestBody
 * # パターン1: components参照
 * requestBody:
 *   description: User data
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/User"
 *
 * # パターン2: インラインスキーマ（"CreateUserRequest"として自動命名）
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           email:
 *             type: string
 *             format: email
 *           name:
 *             type: string
 *         required: [email, name]
 *
 * # パターン3: 複数のMIMEタイプ
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/User"
 *     application/xml:
 *       schema:
 *         $ref: "#/components/schemas/User"
 *     multipart/form-data:
 *       schema:
 *         type: object
 *         properties:
 *           file:
 *             type: string
 *             format: binary
 *           metadata:
 *             type: object
 * ```
 */
export interface IRRequestBody {
  /** 説明 */
  description?: string;
  /** 必須フラグ */
  required: boolean;
  /** コンテンツタイプごとのスキーマ */
  content: IRContentMap;
}

/**
 * IRResponseHeader - レスポンスヘッダー
 * @example
 * ```yaml
 * # OpenAPI → IRResponseHeader
 * headers:
 *   X-Total-Count:
 *     description: Total number of items
 *     schema:
 *       type: integer
 *   X-Rate-Limit:
 *     schema:
 *       type: integer
 *     deprecated: true
 * ```
 */
export interface IRResponseHeader {
  /** 説明 */
  description?: string;
  /** 型情報 */
  type: IRType;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: boolean;
}

/**
 * IRResponseHeaderMap - レスポンスヘッダーのマップ
 */
export type IRResponseHeaderMap = Record<string, IRResponseHeader>;

/**
 * IRResponse - レスポンス
 * @example
 * ```yaml
 * # OpenAPI → IRResponse
 * # パターン1: components参照
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/User"
 *   '404':
 *     $ref: "#/components/responses/NotFound"
 *
 * # パターン2: インラインスキーマ（"GetUserResponse"として自動命名）
 * responses:
 *   '200':
 *     description: User list
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             users:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *             total:
 *               type: integer
 *       application/xml:
 *         schema:
 *           type: object
 *           xml:
 *             name: users
 *       text/csv:
 *         schema:
 *           type: string
 *     headers:
 *       X-Total-Count:
 *         schema:
 *           type: integer
 * ```
 */
export interface IRResponse {
  /** HTTPステータスコード */
  statusCode: string;
  /** 説明 */
  description?: string;
  /** コンテンツタイプごとのスキーマ */
  content?: IRContentMap;
  /** ヘッダー */
  headers?: IRResponseHeaderMap;
}
