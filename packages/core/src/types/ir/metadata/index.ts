/**
 * API メタデータ関連のIR型定義
 */

/**
 * IRContact - 連絡先情報
 * @example
 * ```yaml
 * # OpenAPI → IRContact
 * contact:
 *   name: API Support
 *   email: support@example.com
 *   url: https://example.com/support
 * ```
 */
export interface IRContact {
  /** 連絡先名 */
  name?: string;
  /** メールアドレス */
  email?: string;
  /** URL */
  url?: string;
}

/**
 * IRLicense - ライセンス情報
 * @example
 * ```yaml
 * # OpenAPI → IRLicense
 * license:
 *   name: MIT
 *   url: https://opensource.org/licenses/MIT
 * ```
 */
export interface IRLicense {
  /** ライセンス名 */
  name: string;
  /** ライセンスURL */
  url?: string;
}

/**
 * IRMetadata - API基本情報
 * @example
 * ```yaml
 * # OpenAPI → IRMetadata
 * openapi: 3.1.0  # → openApiVersion
 * info:
 *   title: User Management API  # → title
 *   version: 1.0.0              # → version
 *   description: API for managing users
 *   termsOfService: https://example.com/terms
 *   contact:
 *     name: API Support
 *     email: support@example.com
 *     url: https://example.com/support
 *   license:
 *     name: MIT
 *     url: https://opensource.org/licenses/MIT
 * ```
 */
export interface IRMetadata {
  /** APIタイトル */
  title: string;
  /** APIバージョン */
  version: string;
  /** API説明 */
  description?: string;
  /** 利用規約URL */
  termsOfService?: string;
  /** 連絡先情報 */
  contact?: IRContact;
  /** ライセンス情報 */
  license?: IRLicense;
}
