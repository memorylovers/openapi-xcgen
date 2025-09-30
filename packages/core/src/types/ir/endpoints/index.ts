/**
 * Endpoint type definitions
 */

export type { IREndpoint, IRHttpMethod } from "./endpoint";
export type { IRParameter, IRParameterInType } from "./parameter";
export type {
  IRRequestBody,
  IRRequestBodyWithContent,
  IRRequestBodyWithRef,
  IRRequestContent,
} from "./request";
export { isIRRequestBodyWithContent, isIRRequestBodyWithRef } from "./request";
export type {
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
} from "./response";
