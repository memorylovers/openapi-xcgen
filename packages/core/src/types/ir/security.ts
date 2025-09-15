/**
 * セキュリティ設定関連のIR型定義
 */

/**
 * IROAuth2ScopeMap - OAuth2スコープのマップ
 */
export type IROAuth2ScopeMap = Record<string, string>;

/**
 * IRApiKeyConfig - APIキー設定
 * @example
 * ```yaml
 * # OpenAPI → IRApiKeyConfig
 * name: X-API-KEY
 * in: header
 * ```
 */
export interface IRApiKeyConfig {
  /** APIキー名 */
  name: string;
  /** APIキーの場所 */
  in: "query" | "header" | "cookie";
}

/**
 * IROAuth2Flow - OAuth2フロー定義
 */
export interface IROAuth2Flow {
  /** 認可URL */
  authorizationUrl: string | null;
  /** トークンURL */
  tokenUrl: string | null;
  /** リフレッシュURL */
  refreshUrl: string | null;
  /** スコープ定義 */
  scopes: IROAuth2ScopeMap | null;
}

/**
 * IROAuth2Flows - OAuth2フロー設定
 * @example
 * ```yaml
 * # OpenAPI → IROAuth2Flows
 * flows:
 *   authorizationCode:
 *     authorizationUrl: https://example.com/oauth/authorize
 *     tokenUrl: https://example.com/oauth/token
 *     scopes:
 *       read: Read access
 *       write: Write access
 *   implicit:
 *     authorizationUrl: https://example.com/oauth/authorize
 *     scopes:
 *       read: Read access
 * ```
 */
export interface IROAuth2Flows {
  /** Implicit フロー */
  implicit: IROAuth2Flow | null;
  /** Password フロー */
  password: IROAuth2Flow | null;
  /** Client Credentials フロー */
  clientCredentials: IROAuth2Flow | null;
  /** Authorization Code フロー */
  authorizationCode: IROAuth2Flow | null;
}

/**
 * IRSecurityScheme - セキュリティスキーム
 * @example
 * ```yaml
 * # OpenAPI → IRSecurityScheme
 * components:
 *   securitySchemes:
 *     ApiKey:  # → name: "ApiKey"
 *       type: apiKey
 *       description: API key authentication
 *       name: X-API-KEY
 *       in: header
 *     BearerAuth:  # → name: "BearerAuth"
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *     OAuth2:  # → name: "OAuth2"
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: https://example.com/oauth/authorize
 *           tokenUrl: https://example.com/oauth/token
 *           scopes:
 *             read: Read access
 *             write: Write access
 * ```
 */
export interface IRSecurityScheme {
  /** スキーム名 */
  name: string;
  /** タイプ */
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  /** 説明 */
  description: string | null;
  /** APIキーの場合の設定 */
  apiKey: IRApiKeyConfig | null;
  /** HTTPの場合のスキーム */
  scheme: string | null;
  /** Bearer形式の場合のフォーマット */
  bearerFormat: string | null;
  /** OAuth2フロー */
  flows: IROAuth2Flows | null;
  /** OpenID Connect URL */
  openIdConnectUrl: string | null;
}
