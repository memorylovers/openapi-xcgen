/**
 * security-requirement.ts - OpenAPI SecurityRequirementのIR表現
 *
 * エンドポイントレベルで必要な認証要件を表現する型定義。
 * Operation/PathItemレベルで指定されるsecurity配列の要素。
 */

/**
 * IRSecurityRequirement - セキュリティ要件
 *
 * エンドポイントで必要な認証スキームとそのスコープを定義。
 * OpenAPIのSecurityRequirementObjectに対応。
 *
 * @example
 * ```yaml
 * # OpenAPI定義
 * security:
 *   - ApiKey: []
 *   - BearerAuth: []
 *   - OAuth2:
 *     - read:pets
 *     - write:pets
 * ```
 *
 * @example
 * ```typescript
 * // IR表現
 * [
 *   { scheme: "ApiKey", scopes: [] },
 *   { scheme: "BearerAuth", scopes: [] },
 *   { scheme: "OAuth2", scopes: ["read:pets", "write:pets"] }
 * ]
 * ```
 */
export interface IRSecurityRequirement {
  /**
   * セキュリティスキーム名
   * components.securitySchemesで定義されたスキーム名を参照
   */
  scheme: string;

  /**
   * 必要なスコープ（OAuth2/OpenIDConnect用）
   * OAuth2やOpenIDConnectの場合、必要なスコープのリスト。
   * ApiKeyやHTTP認証の場合は空配列または未定義。
   */
  scopes?: string[];
}
