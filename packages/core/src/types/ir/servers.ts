/**
 * servers.ts - サーバー情報の中間表現型定義
 *
 * OpenAPIのServerObjectをIRに変換するための型定義。
 */

/**
 * IRServerVariable - サーバー変数の中間表現
 *
 * URL内の変数置換に使用される値の定義。
 */
export interface IRServerVariable {
  /** デフォルト値（必須） */
  default: string;
  /** 許可される値の列挙 */
  enum?: string[];
  /** 説明 */
  description?: string;
}

/**
 * IRServer - サーバー情報の中間表現
 *
 * OpenAPIのServerObjectから変換された、
 * APIのベースURLと環境設定を表現する型。
 */
export interface IRServer {
  /** サーバーURL（変数を{brackets}で含む可能性あり） */
  url: string;
  /** サーバーの説明 */
  description?: string;
  /** URL内の変数定義 */
  variables?: Record<string, IRServerVariable>;
}
