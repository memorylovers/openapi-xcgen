import type { SchemaObject } from "../types/index";
import type { MimeType } from "../types/ir/common";
import type { IRHttpMethod } from "../types/ir/endpoint";
import type { IRType } from "../types/ir/index";

/**
 * Visitor実行コンテキスト
 */
export interface VisitorContext {
  /** OpenAPIドキュメント内の現在位置 */
  documentPath: string[];
  /** ルートセグメント（documentPathの最初の要素） */
  rootSegment: "paths" | "components";
}

/**
 * Schema処理用のコンテキスト
 */
export interface SchemaContext extends VisitorContext {
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** スキーマ名 */
  schemaName: string;
}

/**
 * Parameter処理用のコンテキスト
 */
export interface ParameterContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** パラメータ名 */
  parameterName: string;
  /** パラメータの場所 */
  in: "path" | "query" | "header" | "cookie";
  /** HTTPメソッド（pathsコンテキストの場合） */
  method: IRHttpMethod | null;
  /** パステンプレート（pathsコンテキストの場合） */
  pathTemplate: string | null;
}

/**
 * PathItem処理用のコンテキスト
 */
export interface PathItemContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

/**
 * Operation処理用のコンテキスト
 */
export interface OperationContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド（get/post/put等） */
  method: IRHttpMethod;
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

/**
 * Parameters処理用のコンテキスト
 */
export interface ParametersContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
}

/**
 * RequestBody処理用のコンテキスト
 */
export interface RequestBodyContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
  /** コンテンツタイプ（例: "application/json") */
  contentType: MimeType | null;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath: string[] | null;
}

/**
 * Responses処理用のコンテキスト
 */
export interface ResponsesContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
}

/**
 * Response処理用のコンテキスト
 */
export interface ResponseContext extends VisitorContext {
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
  /** HTTPステータスコード */
  statusCode: string;
  /** コンテンツタイプ（例: "application/json") */
  contentType: MimeType | null;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath: string[] | null;
}

/**
 * Visitorの実行結果
 */
export interface VisitorResult<T> {
  /** 変換結果 */
  value: T;
  /** 子要素の処理を続けるかどうか */
  continue: boolean | null;
}

/**
 * Schema Visitor関数の型定義
 */
export type SchemaVisitor = (
  schema: SchemaObject,
  context: VisitorContext,
) => VisitorResult<IRType>;
