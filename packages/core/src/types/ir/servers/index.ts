/**
 * サーバー設定関連のIR型定義
 */

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
 * IRServerVariableMap - サーバー変数のマップ
 */
export type IRServerVariableMap = Record<string, IRServerVariable>;

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
