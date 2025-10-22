import type {
  IRHttpMethod,
  IRModel,
  IRType,
  MimeType,
  ParameterObject,
  ReferenceObject,
  SchemaObject,
} from "../types";

/**
 * Visitorコンテキストの種類
 *
 * コンテキストの判別と命名戦略の決定に使用されます。
 */
export type VisitorContextKind =
  | "schema"
  | "allOf"
  | "oneOf"
  | "anyOf"
  | "parameter"
  | "pathItem"
  | "operation"
  | "parameters"
  | "requestBody"
  | "componentsRequestBody"
  | "responses"
  | "response"
  | "componentsResponse"
  | "header";

/**
 * Visitor実行コンテキスト
 */
export interface VisitorContext {
  /** コンテキストの種類（判別用） */
  kind?: VisitorContextKind;
  /** OpenAPIドキュメント内の現在位置 */
  documentPath: string[];
  /** ルートセグメント（documentPathの最初の要素） */
  rootSegment: "paths" | "components";
}

/**
 * Schema処理用のコンテキスト
 */
export interface SchemaContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "schema";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** スキーマ名 */
  schemaName: string;
}

/**
 * AllOf処理用のコンテキスト（インラインスキーマ）
 */
export interface AllOfContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "allOf";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** 親スキーマ名（例: "Extended"） */
  parentSchemaName: string;
  /** allOf配列内のインデックス */
  index: number;
}

/**
 * OneOf処理用のコンテキスト（インラインスキーマ）
 */
export interface OneOfContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "oneOf";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** 親スキーマ名 */
  parentSchemaName: string;
  /** oneOf配列内のインデックス */
  index: number;
}

/**
 * AnyOf処理用のコンテキスト（インラインスキーマ）
 */
export interface AnyOfContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "anyOf";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** 親スキーマ名 */
  parentSchemaName: string;
  /** anyOf配列内のインデックス */
  index: number;
}

/**
 * Composition用コンテキストのUnion型
 */
export type CompositionContext = AllOfContext | OneOfContext | AnyOfContext;

/**
 * Parameter処理用のコンテキスト
 */
export interface ParameterContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "parameter";
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
  /** コンテキストの種類 */
  kind: "pathItem";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

/**
 * Operation処理用のコンテキスト
 */
export interface OperationContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "operation";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド（get/post/put等） */
  method: IRHttpMethod;
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
  /** PathItemレベルの共通パラメータ（継承用） */
  commonParameters?: Array<ParameterObject | ReferenceObject>;
}

/**
 * Parameters処理用のコンテキスト
 */
export interface ParametersContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "parameters";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
  /** PathItemレベルの共通パラメータ（継承用） */
  commonParameters?: Array<ParameterObject | ReferenceObject>;
}

/**
 * RequestBody処理用のコンテキスト（paths配下）
 */
export interface PathsRequestBodyContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "requestBody";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
  /** コンテンツタイプ（例: "application/json") */
  contentType?: MimeType;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath?: string[];
}

/**
 * RequestBody処理用のコンテキスト（components配下）
 */
export interface ComponentsRequestBodyContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "componentsRequestBody";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** コンテンツタイプ（例: "application/json") */
  contentType?: MimeType;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath?: string[];
}

/**
 * RequestBody処理用のコンテキスト（Union型）
 */
export type RequestBodyContext =
  | PathsRequestBodyContext
  | ComponentsRequestBodyContext;

/**
 * Responses処理用のコンテキスト
 */
export interface ResponsesContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "responses";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
}

/**
 * Response処理用のコンテキスト（paths配下）
 */
export interface PathsResponseContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "response";
  /** ルートセグメント（固定値: paths） */
  rootSegment: "paths";
  /** HTTPメソッド */
  method: IRHttpMethod;
  /** パステンプレート */
  pathTemplate: string;
  /** HTTPステータスコード */
  statusCode: string;
  /** コンテンツタイプ（例: "application/json") */
  contentType?: MimeType;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath?: string[];
}

/**
 * Response処理用のコンテキスト（components配下）
 */
export interface ComponentsResponseContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "componentsResponse";
  /** ルートセグメント（固定値: components） */
  rootSegment: "components";
  /** コンテンツタイプ（例: "application/json") */
  contentType?: MimeType;
  /** スキーマパス（contentの中のネストしたスキーマパス） */
  schemaPath?: string[];
}

/**
 * Response処理用のコンテキスト（Union型）
 */
export type ResponseContext = PathsResponseContext | ComponentsResponseContext;

/**
 * Header処理用のコンテキスト
 */
export interface HeaderContext extends VisitorContext {
  /** コンテキストの種類 */
  kind: "header";
  /** ルートセグメント（paths または components） */
  rootSegment: "paths" | "components";
  /** ヘッダー名 */
  headerName: string;
  /** HTTPメソッド（pathsコンテキストの場合） */
  method: IRHttpMethod | null;
  /** パステンプレート（pathsコンテキストの場合） */
  pathTemplate: string | null;
  /** HTTPステータスコード */
  statusCode: string;
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

export interface SchemaTransformationResult {
  type: IRType | null;
  models: IRModel[];
}
