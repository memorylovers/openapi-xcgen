/**
 * Security IR types
 *
 * OpenAPIのSecurity定義をIR形式で表現する型定義のエクスポート
 */

export type {
  IRApiKeySecurityScheme,
  IRHttpSecurityScheme,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
  IROpenIdConnectSecurityScheme,
  IRSecurityScheme,
} from "./security-scheme.js";

export type { IRSecurityRequirement } from "./security-requirement.js";
