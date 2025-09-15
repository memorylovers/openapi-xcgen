/**
 * レスポンス関連のIR型定義
 */

import type { MimeType } from "../common/mime-type";
import type { IRType } from "../common/type";

/**
 * IRResponseContent - レスポンスコンテンツ（MIMEタイプとスキーマの組み合わせ）
 */
export interface IRResponseContent {
  /** MIMEタイプ */
  mimeType: MimeType;
  /** スキーマ */
  schema: IRType;
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
  /** ヘッダー名 */
  name: string;
  /** 説明 */
  description: string | null;
  /** 型情報 */
  type: IRType;
  /** デフォルト値 */
  defaultValue: unknown | null;
  /** 非推奨フラグ */
  deprecated: boolean | null;
}

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
 *           $ref: '#/components/schemas/User'
 *
 * # パターン2: インラインスキーマ
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *
 * # パターン3: ヘッダー付き
 * responses:
 *   '200':
 *     description: Success
 *     headers:
 *       X-Total-Count:
 *         description: Total number of items
 *         schema:
 *           type: integer
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *
 * # パターン4: エラーレスポンス（コンテンツなし）
 * responses:
 *   '404':
 *     description: Not found
 *   '500':
 *     description: Internal server error
 * ```
 */
export interface IRResponse {
  /** HTTPステータスコード（"200", "404", "default"など） */
  statusCode: string;
  /** 説明 */
  description: string | null;
  /** コンテンツ配列（MIMEタイプとスキーマの組み合わせ） */
  content: IRResponseContent[] | null;
  /** レスポンスヘッダー */
  headers: IRResponseHeader[] | null;
}
