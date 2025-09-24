/**
 * XcgenIR - 中間表現(Intermediate Representation)の型定義
 *
 * OpenAPI仕様書からコード生成に最適化された中間表現への変換で使用する型定義。
 * TDDアプローチに従い、段階的に拡張していく。
 */

import type { IREndpoint } from "./endpoints/endpoint";
import type { IRMetadata } from "./metadata";
import type { IRModel } from "./models/operation";
import type { IRTag } from "./tags";

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
}

// Re-export all types from sub-modules
// common
export type {
  IRArray,
  IRMap,
  IRRef,
  IRScalarType,
  IRType,
  MimeType,
} from "./common";
// metadata
export type { IRMetadata } from "./metadata";
// models
export type {
  IRArrayModel,
  IREnumModel,
  IREnumValue,
  IRMapModel,
  IRModel,
  IRObjectModel,
  IRParameterModel,
  IRParameterProperty,
  IRProperty,
  IRRequestBodyModel,
  IRResponseModel,
  IRValidation,
} from "./models";
// tags
export type { IRTag, IRTagExternalDocs } from "./tags";
// endpoints
export type {
  IREndpoint,
  IRHttpMethod,
  IRParameter,
  IRParameterInType,
  IRRequestBody,
  IRRequestContent,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
} from "./endpoints";
