/**
 * XcgenIR - 中間表現(Intermediate Representation)の型定義
 *
 * OpenAPI仕様書からコード生成に最適化された中間表現への変換で使用する型定義。
 * TDDアプローチに従い、段階的に拡張していく。
 */

import type { IRModel } from "./models/operation";
import type { IREndpoint } from "./endpoints/endpoint";
import type { IRTag } from "./tags";
import type { IRMetadata } from "./metadata";
import type { IRSecurityScheme } from "./security";
import type { IRServer } from "./servers";

/**
 * XcgenIR - 中間表現のルート型
 * OpenAPIドキュメントから変換された、コード生成に最適化された表現
 */
export interface XcgenIR {
  /** API基本情報 */
  metadata: IRMetadata;
  /** データモデルの配列（オブジェクト、列挙型、配列、マップを統一的に管理） */
  models: IRModel[];
  /** タグ定義の配列 */
  tags: IRTag[];
  /** APIエンドポイントの配列 */
  endpoints: IREndpoint[];
  /** サーバー情報の配列 */
  servers: IRServer[];
  /** セキュリティ定義 */
  security: IRSecurityScheme[];
}

// Re-export all types from sub-modules
export * from "./common";
export * from "./metadata";
export * from "./models";
export * from "./tags";
export * from "./endpoints";
export * from "./servers";
export * from "./security";
