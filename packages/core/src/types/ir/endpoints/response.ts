/**
 * レスポンス関連のIR型定義
 */

import type { Extensions } from "../common/extensions";
import type { MimeType } from "../common/mime-type";
import type { IRRef, IRType } from "../common/type";

/**
 * IRResponseContent - レスポンスコンテンツ（MIMEタイプとスキーマの組み合わせ）
 */
export interface IRResponseContent {
  /** MIMEタイプ */
  mimeType: MimeType;
  /** スキーマ */
  schema: IRType;
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: Extensions;
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
  description?: string;
  /** 型情報 */
  type: IRType;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: true;
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: Extensions;
}

/**
 * IRResponse - レスポンス (Discriminated Union型)
 * @example
 * ```yaml
 * # OpenAPI → IRResponse
 * # パターン1: components参照
 * responses:
 *   '200':
 *     $ref: '#/components/responses/SuccessResponse'
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
export type IRResponse = IRResponseWithContent | IRResponseWithRef;

/**
 * IRResponseWithContent - コンテンツを持つレスポンス
 */
export interface IRResponseWithContent {
  /** 判別子 */
  kind: "content";
  /** HTTPステータスコード（"200", "404", "default"など） */
  statusCode: string;
  /** 説明 */
  description?: string;
  /** コンテンツ配列（MIMEタイプとスキーマの組み合わせ） */
  content?: IRResponseContent[];
  /** レスポンスヘッダー */
  headers?: IRResponseHeader[];
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: Extensions;
}

/**
 * IRResponseWithRef - $ref参照を持つレスポンス
 */
export interface IRResponseWithRef {
  /** 判別子 */
  kind: "ref";
  /** HTTPステータスコード（"200", "404", "default"など） */
  statusCode: string;
  /** $ref参照情報（components/responsesへの参照など） */
  ref: IRRef;
}

/**
 * IRResponseがIRResponseWithContentかどうかを判定する型ガード
 */
export function isIRResponseWithContent(
  response: IRResponse,
): response is IRResponseWithContent {
  return response.kind === "content";
}
