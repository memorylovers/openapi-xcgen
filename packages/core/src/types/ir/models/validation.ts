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
  minimum?: number;
  /** 最大値 */
  maximum?: number;
  /** 排他的最小値 */
  exclusiveMinimum?: true;
  /** 排他的最大値 */
  exclusiveMaximum?: true;
  /** 最小長 */
  minLength?: number;
  /** 最大長 */
  maxLength?: number;
  /** パターン（正規表現） */
  pattern?: string;
  /** 最小アイテム数 */
  minItems?: number;
  /** 最大アイテム数 */
  maxItems?: number;
  /** ユニークアイテム */
  uniqueItems?: true;
  /** 最小プロパティ数 */
  minProperties?: number;
  /** 最大プロパティ数 */
  maxProperties?: number;
  /** フォーマット（uuid、email、uri、ipv4等のバリデーション用） */
  format?: string;
  /** const値（リテラル値、OpenAPI 3.1） - discriminator mappingの自動生成に使用 */
  const?: string | number | boolean;
}
