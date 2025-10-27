/**
 * OpenAPI型エイリアス
 *
 * openapi-typesライブラリの型定義を、OpenAPIV3とV3_1の両方をサポートする
 * Union型として再エクスポート。
 */
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;
export type PathItemObject =
  | OpenAPIV3.PathItemObject
  | OpenAPIV3_1.PathItemObject;
export type OperationObject =
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject;
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type SchemaObjectWithNullable = SchemaObject & { nullable?: boolean };
export type ReferenceObject =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject;
export type ParameterObject =
  | OpenAPIV3.ParameterObject
  | OpenAPIV3_1.ParameterObject;
export type HeaderObject = OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject;
export type RequestBodyObject =
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3_1.RequestBodyObject;
export type ResponseObject =
  | OpenAPIV3.ResponseObject
  | OpenAPIV3_1.ResponseObject;
export type ComponentsObject =
  | OpenAPIV3.ComponentsObject
  | OpenAPIV3_1.ComponentsObject;
export type SecuritySchemeObject =
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3_1.SecuritySchemeObject;
export type ServerObject = OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject;
export type InfoObject = OpenAPIV3.InfoObject | OpenAPIV3_1.InfoObject;
export type ContactObject = OpenAPIV3.ContactObject | OpenAPIV3_1.ContactObject;
export type LicenseObject = OpenAPIV3.LicenseObject | OpenAPIV3_1.LicenseObject;
export type TagObject = OpenAPIV3.TagObject | OpenAPIV3_1.TagObject;

// Schema判別共用体
export type ArraySchemaObject =
  | OpenAPIV3.ArraySchemaObject
  | OpenAPIV3_1.ArraySchemaObject;

export type NonArraySchemaObject =
  | OpenAPIV3.NonArraySchemaObject
  | OpenAPIV3_1.NonArraySchemaObject;

export type BaseSchemaObject =
  | OpenAPIV3.BaseSchemaObject
  | OpenAPIV3_1.BaseSchemaObject;

// 型判定用
export type ArraySchemaObjectType =
  | OpenAPIV3.ArraySchemaObjectType
  | OpenAPIV3_1.ArraySchemaObjectType;

export type NonArraySchemaObjectType =
  | OpenAPIV3.NonArraySchemaObjectType
  | OpenAPIV3_1.NonArraySchemaObjectType;
