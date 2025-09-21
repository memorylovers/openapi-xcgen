/**
 * タグ関連のIR型定義
 */

/**
 * IRTagExternalDocs - タグの外部ドキュメント
 */
export interface IRTagExternalDocs {
  /** ドキュメントURL */
  url: string;
  /** ドキュメントの説明 */
  description?: string;
}

/**
 * IRTag - OpenAPIのタグ定義
 * @example
 * ```yaml
 * # OpenAPI → IRTag
 * tags:
 *   - name: users
 *     description: User management operations
 *     externalDocs:
 *       url: https://example.com/docs/users
 *       description: User API documentation
 *   - name: pets
 *     description: Pet management operations
 * ```
 */
export interface IRTag {
  /** タグ名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 外部ドキュメント */
  externalDocs?: IRTagExternalDocs;
}
