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
import type { IRComponent } from "./models/operation";
import type { IRSecurityRequirement } from "./security/security-requirement";
import type { IRSecurityScheme } from "./security/security-scheme";
import type { IRServer } from "./servers";
import type { IRTag } from "./tags";

/**
 * XcgenIR - 中間表現のルート型
 * OpenAPIドキュメントから変換された、コード生成に最適化された表現
 */
export interface XcgenIR {
  /** API基本情報 */
  metadata: IRMetadata;
  /** データモデルの配列（オブジェクト、列挙型、配列、マップを統一的に管理） */
  models: IRComponent[];
  /** タグ定義の配列 */
  tags: IRTag[];
  /** APIエンドポイントの配列 */
  endpoints: IREndpoint[];
  /** サーバー定義の配列（ルートレベルのserversから変換） */
  servers?: IRServer[];
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
// common (直接ファイルから)
export type { IRExtensions, IRExtensionValue } from "./common/extensions";
export type { MimeType } from "./common/mime-type";
export type { IRRef, IRScalarType, IRType } from "./common/type";
// metadata (inline定義なのでそのまま)
export type { IRMetadata } from "./metadata";
// models (直接ファイルから)
export type {
  IRAllOfSchema,
  IRAnyOfSchema,
  IRArraySchema,
  IRDiscriminator,
  IREnumSchema,
  IREnumValue,
  IRMapSchema,
  IRObjectSchema,
  IRUnionSchema,
} from "./models/base";
export type {
  IRComponent,
  IROperationComponent,
  IRParameterComponent,
  IRRequestBodyComponent,
  IRResponseComponent,
  IRSchema,
} from "./models/operation";
export type { IRParameterProperty, IRProperty } from "./models/property";
export type { IRValidation } from "./models/validation";
// tags (inline定義なのでそのまま)
export type { IRTag, IRTagExternalDocs } from "./tags";
// endpoints (直接ファイルから)
export type { IREndpoint, IRHttpMethod } from "./endpoints/endpoint";
export type { IRParameter, IRParameterInType } from "./endpoints/parameter";
export { isIRRequestBodyWithContent } from "./endpoints/request";
export type {
  IRRequestBody,
  IRRequestBodyWithContent,
  IRRequestBodyWithRef,
  IRRequestContent,
} from "./endpoints/request";
export type {
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
} from "./endpoints/response";
// security (直接ファイルから)
export type {
  IRApiKeySecurityScheme,
  IRHttpSecurityScheme,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
  IROpenIdConnectSecurityScheme,
  IRSecurityScheme,
} from "./security/security-scheme";
export type { IRSecurityRequirement } from "./security/security-requirement";
// servers (inline定義なのでそのまま)
export type { IRServer, IRServerVariable } from "./servers";
