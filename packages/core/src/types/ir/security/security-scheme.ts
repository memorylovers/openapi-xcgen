/**
 * security-scheme.ts - OpenAPI SecuritySchemeのIR表現
 *
 * OpenAPIのSecuritySchemeObjectをIR形式に変換した型定義。
 * 4つの認証タイプ（apiKey、http、oauth2、openIdConnect）をサポート。
 */

/**
 * OAuth2フロー定義
 */
export interface IROAuthFlow {
  /** 認可エンドポイントURL（implicit、authorizationCode用） */
  authorizationUrl?: string;
  /** トークンエンドポイントURL（password、clientCredentials、authorizationCode用） */
  tokenUrl?: string;
  /** トークンリフレッシュURL（任意） */
  refreshUrl?: string;
  /** スコープ定義（スコープ名 -> 説明のマッピング） */
  scopes: Record<string, string>;
}

/**
 * OAuth2の全フロー定義
 */
export interface IROAuthFlows {
  /** Implicit flow */
  implicit?: IROAuthFlow;
  /** Resource Owner Password Credentials flow */
  password?: IROAuthFlow;
  /** Client Credentials flow */
  clientCredentials?: IROAuthFlow;
  /** Authorization Code flow */
  authorizationCode?: IROAuthFlow;
}

/**
 * APIキー認証スキーム
 * @example
 * ```yaml
 * ApiKey:
 *   type: apiKey
 *   name: X-API-Key
 *   in: header
 * ```
 */
export interface IRApiKeySecurityScheme {
  type: "apiKey";
  /** パラメータ名 */
  name: string;
  /** APIキーの場所 */
  in: "header" | "query" | "cookie";
  /** スキームの説明（任意） */
  description?: string;
}

/**
 * HTTP認証スキーム（Basic、Bearer等）
 * @example
 * ```yaml
 * BearerAuth:
 *   type: http
 *   scheme: bearer
 *   bearerFormat: JWT
 * ```
 */
export interface IRHttpSecurityScheme {
  type: "http";
  /** 認証スキーム（'basic', 'bearer'等） */
  scheme: string;
  /** Bearerトークンのフォーマット（JWT等、任意） */
  bearerFormat?: string;
  /** スキームの説明（任意） */
  description?: string;
}

/**
 * OAuth2認証スキーム
 * @example
 * ```yaml
 * OAuth2:
 *   type: oauth2
 *   flows:
 *     authorizationCode:
 *       authorizationUrl: https://example.com/oauth/authorize
 *       tokenUrl: https://example.com/oauth/token
 *       scopes:
 *         read: Read access
 *         write: Write access
 * ```
 */
export interface IROAuth2SecurityScheme {
  type: "oauth2";
  /** OAuth2フロー定義 */
  flows: IROAuthFlows;
  /** スキームの説明（任意） */
  description?: string;
}

/**
 * OpenID Connect認証スキーム
 * @example
 * ```yaml
 * OpenID:
 *   type: openIdConnect
 *   openIdConnectUrl: https://example.com/.well-known/openid-configuration
 * ```
 */
export interface IROpenIdConnectSecurityScheme {
  type: "openIdConnect";
  /** OpenID Connect discovery document URL */
  openIdConnectUrl: string;
  /** スキームの説明（任意） */
  description?: string;
}

/**
 * IRSecurityScheme - すべての認証スキームの共用体型
 *
 * OpenAPIのSecuritySchemeObjectに対応するIR型。
 * 4つの認証タイプをサポート。
 */
export type IRSecurityScheme =
  | IRApiKeySecurityScheme
  | IRHttpSecurityScheme
  | IROAuth2SecurityScheme
  | IROpenIdConnectSecurityScheme;
