/**
 * リクエスト関連のIR型定義
 */

import type { MimeType } from "./common";
import type { IRType } from "./type";

/**
 * IRRequestContent - リクエストコンテンツ（MIMEタイプとスキーマの組み合わせ）
 */
export interface IRRequestContent {
  /** MIMEタイプ */
  mimeType: MimeType;
  /** スキーマ */
  schema: IRType;
}

/**
 * IRRequestBody - リクエストボディ
 * @example
 * ```yaml
 * # OpenAPI → IRRequestBody
 * requestBody:
 *   description: User to create
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: '#/components/schemas/User'
 *     application/xml:
 *       schema:
 *         $ref: '#/components/schemas/User'
 *
 * # インラインスキーマ
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
 *             format: email
 *
 * # フォームデータ
 * requestBody:
 *   content:
 *     multipart/form-data:
 *       schema:
 *         type: object
 *         properties:
 *           file:
 *             type: string
 *             format: binary
 *           description:
 *             type: string
 *
 * # プレーンテキスト
 * requestBody:
 *   content:
 *     text/plain:
 *       schema:
 *         type: string
 *
 * # カスタムMIMEタイプ
 * requestBody:
 *   content:
 *     application/vnd.api+json:
 *       schema:
 *         type: object
 * ```
 */
export interface IRRequestBody {
  /** 説明 */
  description: string | null;
  /** 必須フラグ */
  required: boolean;
  /** コンテンツ配列（MIMEタイプとスキーマの組み合わせ） */
  content: IRRequestContent[];
}
