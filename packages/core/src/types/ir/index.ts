/**
 * XcgenIR - 中間表現(Intermediate Representation)の型定義
 *
 * OpenAPI仕様書からコード生成に最適化された中間表現への変換で使用する型定義。
 * TDDアプローチに従い、段階的に拡張していく。
 */

import type { IREnum, IRModel, IRUnion } from "./data";

import type { IRService } from "./api";

import type { IRMetadata, IRSecurityScheme, IRServer } from "./config";

/**
 * XcgenIR - 中間表現のルート型
 * OpenAPIドキュメントから変換された、コード生成に最適化された表現
 */
export interface XcgenIR {
  /** API基本情報 */
  metadata: IRMetadata;
  /** データモデルの配列 */
  models: IRModel[];
  /** 列挙型の配列 */
  enums: IREnum[];
  /** Union型の配列 */
  unions: IRUnion[];
  /** APIサービスの配列（タグでグループ化） */
  services: IRService[];
  /** サーバー情報の配列 */
  servers: IRServer[];
  /** セキュリティ定義 */
  security?: IRSecurityScheme[];
}

// Re-export all types from sub-modules
export * from "./api";
export * from "./config";
export * from "./data";
