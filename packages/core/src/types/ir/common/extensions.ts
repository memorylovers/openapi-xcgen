/**
 * OpenAPI Specification Extensions の型定義
 *
 * x- プレフィックスを持つフィールド（カスタム拡張）の型定義。
 * OpenAPI 3.x では、x- で始まるフィールドを使用して独自の情報を定義できる。
 *
 * @see https://spec.openapis.org/oas/v3.0.3#specification-extensions
 * @see https://spec.openapis.org/oas/v3.1.0#specification-extensions
 */

/**
 * OpenAPI Specification Extensions の値型
 *
 * x-フィールドの値として許可される型。
 * JSON 値の仕様に準拠（再帰的な構造をサポート）。
 *
 * @see https://spec.openapis.org/oas/v3.0.3#specification-extensions
 *
 * @example
 * ```yaml
 * x-type: "EmailAddress"           # string
 * x-priority: 1                    # number
 * x-required: true                 # boolean
 * x-metadata: null                 # null
 * x-tags: ["internal", "beta"]     # array
 * x-validation:                    # object (nested)
 *   domain: "example.com"
 *   maxLength: 255
 * ```
 */
export type ExtensionValue =
  | string
  | number
  | boolean
  | null
  | ExtensionValue[]
  | { [key: string]: ExtensionValue };

/**
 * OpenAPI Specification Extensions
 *
 * x- プレフィックスを持つフィールドのマップ。
 * キーは x- で始まる必要があるが、型レベルでは強制しない。
 *
 * @example OpenAPI YAML
 * ```yaml
 * properties:
 *   email:
 *     type: string
 *     format: email
 *     x-type: "EmailAddress"
 *     x-format: "rfc5322"
 *     x-validation:
 *       domain: "example.com"
 *       allowSubdomains: true
 * ```
 *
 * @example IR JSON
 * ```json
 * {
 *   "name": "email",
 *   "type": "string",
 *   "extensions": {
 *     "x-type": "EmailAddress",
 *     "x-format": "rfc5322",
 *     "x-validation": {
 *       "domain": "example.com",
 *       "allowSubdomains": true
 *     }
 *   }
 * }
 * ```
 */
export type Extensions = Record<string, ExtensionValue>;
