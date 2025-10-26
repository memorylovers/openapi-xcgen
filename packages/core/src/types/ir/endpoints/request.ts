/**
 * リクエスト関連のIR型定義
 */

import type { IRExtensions } from "../common/extensions";
import type { MimeType } from "../common/mime-type";
import type { IRRef, IRType } from "../common/type";

/**
 * IRRequestContent - リクエストコンテンツ（MIMEタイプとスキーマの組み合わせ）
 */
export interface IRRequestContent {
  /** MIMEタイプ */
  mimeType: MimeType;
  /** スキーマ */
  schema: IRType;
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: IRExtensions;
}

/**
 * IRRequestBodyWithContent - 実際のコンテンツを持つリクエストボディ
 */
export interface IRRequestBodyWithContent {
  /** 判別子 */
  kind: "content";
  /** 説明 */
  description?: string;
  /** 必須フラグ */
  required?: true;
  /** コンテンツ配列（MIMEタイプとスキーマの組み合わせ） */
  content: IRRequestContent[];
  /** OpenAPI拡張フィールド（x-プレフィックス） */
  extensions?: IRExtensions;
}

/**
 * IRRequestBodyWithRef - $ref参照を持つリクエストボディ
 */
export interface IRRequestBodyWithRef {
  /** 判別子 */
  kind: "ref";
  /** $ref参照情報（components/requestBodiesへの参照など） */
  ref: IRRef;
}

/**
 * IRRequestBody - リクエストボディ（Discriminated Union）
 *
 * contentとrefのいずれかを持つが、両方を同時に持つことはない。
 * TypeScriptの型システムでこの制約を強制し、型安全性を向上させる。
 *
 * @example
 * ```yaml
 * # OpenAPI → IRRequestBodyWithContent
 * requestBody:
 *   description: User to create
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
 * # OpenAPI → IRRequestBodyWithRef
 * requestBody:
 *   $ref: '#/components/requestBodies/UserInput'
 * ```
 */
export type IRRequestBody = IRRequestBodyWithContent | IRRequestBodyWithRef;

/**
 * IRRequestBodyがコンテンツ型かどうかを判定する型ガード
 */
export function isIRRequestBodyWithContent(
  requestBody: IRRequestBody,
): requestBody is IRRequestBodyWithContent {
  return requestBody.kind === "content";
}
