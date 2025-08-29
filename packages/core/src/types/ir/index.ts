/**
 * XcgenIR - 中間表現(Intermediate Representation)の型定義
 *
 * OpenAPI仕様書からコード生成に最適化された中間表現への変換で使用する型定義。
 * TDDアプローチに従い、段階的に拡張していく。
 */

import type { IREnum, IRModel } from "./data";

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
  /** APIサービスの配列（タグでグループ化） */
  services: IRService[];
  /** サーバー情報の配列 */
  servers: IRServer[];
  /** セキュリティ定義 */
  security?: IRSecurityScheme[];
}

/**
 * IRInfo - API基本情報（簡易版）
 *
 * transformer.tsで使用される簡易版のAPI情報。
 * 完全な実装ではIRMetadataに移行予定。
 */
export interface IRInfo {
  /** APIタイトル */
  title: string;
  /** APIバージョン */
  version: string;
  /** API説明 */
  description?: string;
}

/**
 * IRDocument - 中間表現のドキュメント型（簡易版）
 *
 * 現在のtransformer実装で使用される簡易版。
 * 将来的にXcgenIRに移行予定。
 */
export interface IRDocument {
  /** API基本情報 */
  info: IRInfo;
  /** データモデルの配列 */
  models: IRModel[];
  /** 列挙型の配列 */
  enums: IREnum[];
  /** APIサービスの配列（タグでグループ化） */
  services: IRService[];
}

// Re-export all types from sub-modules
export * from "./api";
export * from "./config";
export * from "./data";
