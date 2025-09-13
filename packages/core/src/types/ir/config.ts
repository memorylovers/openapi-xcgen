/**
 * 設定・メタデータ関連のIR型定義
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
  name: string | null;
  /** メールアドレス */
  email: string | null;
  /** URL */
  url: string | null;
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
  url: string | null;
}

/**
 * IRServerVariableMap - サーバー変数のマップ
 */
export type IRServerVariableMap = Record<string, IRServerVariable>;

/**
 * IROAuth2ScopeMap - OAuth2スコープのマップ
 */
export type IROAuth2ScopeMap = Record<string, string>;

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
  description: string | null;
  /** OpenAPIバージョン */
  openApiVersion: string;
  /** 連絡先情報 */
  contact: IRContact | null;
  /** ライセンス情報 */
  license: IRLicense | null;
}

/**
 * IRServer - サーバー情報
 * @example
 * ```yaml
 * # OpenAPI → IRServer
 * servers:
 *   - url: https://api.example.com
 *     description: Production server
 *   - url: https://{environment}.example.com
 *     description: Environment-specific server
 *     variables:
 *       environment:
 *         default: staging
 *         enum: [staging, development]
 *         description: Server environment
 * ```
 */
export interface IRServer {
  /** URL */
  url: string;
  /** 説明 */
  description: string | null;
  /** 変数 */
  variables: IRServerVariableMap | null;
}

/**
 * IRServerVariable - サーバー変数
 */
export interface IRServerVariable {
  /** デフォルト値 */
  default: string;
  /** 選択可能な値 */
  enum: string[] | null;
  /** 説明 */
  description: string | null;
}

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
