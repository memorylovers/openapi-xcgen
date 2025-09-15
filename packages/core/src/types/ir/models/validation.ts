/**
 * バリデーション関連のIR型定義
 */

/**
 * IRValidation - バリデーション情報
 * @example
 * ```yaml
 * # OpenAPI → IRValidation
 * type: string
 * minLength: 3
 * maxLength: 50
 * pattern: "^[a-zA-Z0-9]+$"
 * ```
 */
export interface IRValidation {
  /** 最小値 */
  minimum: number | null;
  /** 最大値 */
  maximum: number | null;
  /** 排他的最小値 */
  exclusiveMinimum: boolean | null;
  /** 排他的最大値 */
  exclusiveMaximum: boolean | null;
  /** 最小長 */
  minLength: number | null;
  /** 最大長 */
  maxLength: number | null;
  /** パターン（正規表現） */
  pattern: string | null;
  /** 最小アイテム数 */
  minItems: number | null;
  /** 最大アイテム数 */
  maxItems: number | null;
  /** ユニークアイテム */
  uniqueItems: boolean | null;
  /** 最小プロパティ数 */
  minProperties: number | null;
  /** 最大プロパティ数 */
  maxProperties: number | null;
  /** フォーマット（uuid、email、uri、ipv4等のバリデーション用） */
  format: string | null;
}
