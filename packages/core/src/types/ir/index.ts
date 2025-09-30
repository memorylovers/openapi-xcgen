/**
 * XcgenIR - 中間表現(Intermediate Representation)の型定義
 *
 * OpenAPI仕様書からコード生成に最適化された中間表現への変換で使用する型定義。
 * TDDアプローチに従い、段階的に拡張していく。
 */

import type { IREndpoint } from "./endpoints/endpoint";
import type { IRRequestBody } from "./endpoints/request";
import type { IRResponse } from "./endpoints/response";
import type { IRMetadata } from "./metadata";
import type { IRModel } from "./models/operation";
import type { IRSecurityRequirement, IRSecurityScheme } from "./security";
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
  /** セキュリティスキーム定義（components.securitySchemesから変換） */
  securitySchemes?: Record<string, IRSecurityScheme>;
  /** グローバルセキュリティ要件（ルートレベルのsecurityから変換） */
  globalSecurity?: IRSecurityRequirement[];
  /** 共通レスポンス定義（components.responsesから変換） */
  commonResponses?: Record<string, IRResponse>;
  /** 共通リクエストボディ定義（components.requestBodiesから変換） */
  commonRequestBodies?: Record<string, IRRequestBody>;
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
  IRRequestBodyWithContent,
  IRRequestBodyWithRef,
  IRRequestContent,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
} from "./endpoints";
export {
  isIRRequestBodyWithContent,
  isIRRequestBodyWithRef,
} from "./endpoints";
// security
export type {
  IRApiKeySecurityScheme,
  IRHttpSecurityScheme,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
  IROpenIdConnectSecurityScheme,
  IRSecurityRequirement,
  IRSecurityScheme,
} from "./security";
