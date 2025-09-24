/**
 * API メタデータ関連のIR型定義
 */

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
 * ```
 */
export interface IRMetadata {
  /** APIタイトル */
  title: string;
  /** APIバージョン */
  version: string;
  /** API説明 */
  description?: string;
}
