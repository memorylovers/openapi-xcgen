/**
 * データモデル関連のIR型定義
 */

import type { IRParameterInType, IRResponseHeader } from "./api";

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * OpenAPIのスカラー型
 * IRPrimitiveとIREnumで使用される基本型
 */
export type IRScalarType =
  // 整数型
  | "int" // integer/int32 → 32ビット整数
  | "long" // integer/int64 → 64ビット整数
  // 浮動小数点型
  | "float" // number/float → 単精度
  | "double" // number/double → 倍精度
  // 基本型
  | "string" // string
  | "boolean" // boolean
  // 日時型（特別扱い）
  | "date" // string/date → 日付のみ
  | "datetime" // string/date-time → 日時
  // バイナリ型（特別扱い）
  | "binary" // string/binary → バイナリデータ
  | "byte"; // string/byte → Base64エンコード

// ============================================================================
// 型参照（IRType）- プロパティやパラメータの型として使用
// ============================================================================

/**
 * IRRef - 型への参照（$ref）
 * 実際の型（model/enum/union）はXcgenIRから探索して判明
 * @example
 * ```yaml
 * # OpenAPI
 * $ref: "#/components/schemas/User"    # モデル参照
 * $ref: "#/components/schemas/Status"  # Enum参照
 * $ref: "#/components/schemas/Pet"     # Union参照
 * ```
 */
export interface IRRef {
  kind: "ref";
  name: string; // "User", "Status", "Pet" など
}

/**
 * IRArray - 配列型
 * @example
 * ```yaml
 * # OpenAPI
 * type: array
 * items:
 *   $ref: "#/components/schemas/User"
 * ```
 */
export interface IRArray {
  kind: "array";
  itemType: IRType;
}

/**
 * IRMap - マップ型（additionalProperties）
 * @example
 * ```yaml
 * # OpenAPI
 * type: object
 * additionalProperties:
 *   type: string
 * ```
 */
export interface IRMap {
  kind: "map";
  valueType: IRType;
}

/**
 * IRType - 型情報の判別共用体
 * プロパティやパラメータの型として使用される
 */
export type IRType = IRScalarType | IRRef | IRArray | IRMap;

// ============================================================================
// 型定義（XcgenIRのトップレベルで定義される実体）
// ============================================================================

/**
 * IRObjectModel - オブジェクト型モデル定義
 * componentsで定義されたものと、インラインスキーマから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IRObjectModel
 * # パターン1: componentsで定義
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *
 * # パターン2: インラインスキーマ（"CreateUserRequest"として自動命名）
 * paths:
 *   /users:
 *     post:
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 * ```
 */
export interface IRObjectModel {
  /** 型種別 */
  kind: "object";
  /** モデル名（PascalCase） */
  name: string;
  /**
   * 参照パス（$refで参照される際のパス）
   * @example
   * - Components定義: `#/components/schemas/User`
   * - インラインスキーマ: `#/paths/::users/post/requestBody/PostUsersRequestBody`
   */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティの配列 */
  properties: IRProperty[];
}

/**
 * IRProperty - モデルのプロパティ
 * @example
 * ```yaml
 * # OpenAPI → IRProperty
 * properties:
 *   email:
 *     type: string
 *     format: email
 *     description: User's email address
 *   friends:
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/User"
 * ```
 */
export interface IRProperty {
  /** プロパティ名 */
  name: string;
  /** プロパティの説明 */
  description: string | null;
  /** 型情報 */
  type: IRType;
  /** 必須フラグ */
  required: boolean;
  /** null許容フラグ */
  nullable: boolean | null;
  /** デフォルト値 */
  defaultValue: unknown | null;
  /** 非推奨フラグ */
  deprecated: boolean | null;
  /** バリデーション情報 */
  validation: IRValidation | null;
}

/**
 * IRParameterProperty - パラメータモデルのプロパティ
 * IRPropertyを拡張して、パラメータ固有の`in`フィールドを追加
 * 既存のIRParameterInTypeを再利用して型安全性を確保
 * @example
 * ```yaml
 * # OpenAPI parameters → IRParameterProperty
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query
 *     required: false
 *     schema:
 *       type: integer
 * ```
 */
export interface IRParameterProperty extends IRProperty {
  /** パラメータの場所 */
  in: IRParameterInType;
}

/**
 * IREnumModel - 列挙型モデル定義
 * componentsで定義されたものと、インラインenumから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IREnumModel
 * # パターン1: componentsで定義
 * components:
 *   schemas:
 *     Status:
 *       type: string
 *       enum: [active, inactive, pending]
 *
 * # パターン2: インラインenum（"UserStatus"として自動命名）
 * properties:
 *   status:
 *     type: string
 *     enum: [active, inactive, pending]
 * ```
 */
export interface IREnumModel {
  /** 型種別 */
  kind: "enum";
  /** Enum名（PascalCase） */
  name: string;
  /**
   * 参照パス（$refで参照される際のパス）
   * @example
   * - Components定義: `#/components/schemas/UserRole`
   * - インラインEnum: `#/paths/::users/get/parameters/GetUsersParamsSortEnum`
   */
  referencePath: string;
  /** 説明 */
  description: string | null;
  /** 値の型（OpenAPIの型をそのまま保持） */
  type: IRScalarType;
  /** Enum値の配列 */
  values: IREnumValue[];
}

/**
 * IREnumValue - Enum値
 * @example
 * ```yaml
 * # OpenAPI → IREnumValue
 * enum: [active, inactive, pending]
 * # → values: [
 * #     { value: "active", name: "ACTIVE" },
 * #     { value: "inactive", name: "INACTIVE" },
 * #     { value: "pending", name: "PENDING" }
 * #   ]
 * ```
 */
export interface IREnumValue {
  /** 値 */
  value: string | number;
  /** 名前（コード生成用） */
  name: string;
  /** 説明 */
  description: string | null;
}

/**
 * IRArrayModel - 配列型モデル定義（将来の拡張性のため）
 * 現在は未使用だが、将来的に独立したモデルとしての抽出に備える
 */
export interface IRArrayModel {
  /** 型種別 */
  kind: "array";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** 配列アイテムの型 */
  itemType: IRType;
}

/**
 * IRMapModel - マップ型モデル定義（将来の拡張性のため）
 * 現在は未使用だが、将来的に独立したモデルとしての抽出に備える
 */
export interface IRMapModel {
  /** 型種別 */
  kind: "map";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** 値の型 */
  valueType: IRType;
}

/**
 * IRParameterModel - パラメータ統合モデル定義
 * APIエンドポイントのパラメータを統合したモデル（GetUsersParamsなど）
 * @example
 * ```yaml
 * # OpenAPI parameters → IRParameterModel
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query
 *     schema:
 *       type: integer
 *       default: 10
 * # → GetUsersParams model with IRParameterProperty
 * ```
 */
export interface IRParameterModel {
  /** 型種別 */
  kind: "parameter";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** パラメータプロパティの配列（in情報を含む） */
  properties: IRParameterProperty[];
}

/**
 * IRRequestBodyModel - リクエストボディ専用モデル定義
 * インラインスキーマから抽出されたrequestBodyモデル（PostUsersRequestBodyなど）
 * IRObjectModelの性質を継承し、リクエストボディ固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI requestBody → IRRequestBodyModel
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 * # → PostUsersRequestBody model (kind="requestBody")
 * ```
 */
export interface IRRequestBodyModel {
  /** 型種別（objectのサブタイプ） */
  kind: "requestBody";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティ配列（IRObjectModelから継承） */
  properties: IRProperty[];
  /** 必須フラグ（リクエストボディ固有） */
  required: boolean;
}

/**
 * IRResponseModel - レスポンス専用モデル定義
 * インラインスキーマから抽出されたresponseモデル（GetUsers200Responseなど）
 * IRObjectModelの性質を継承し、レスポンス固有の文脈情報を追加
 * @example
 * ```yaml
 * # OpenAPI responses → IRResponseModel
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 *             count:
 *               type: integer
 * # → GetUsers200Response model (kind="response")
 * ```
 */
export interface IRResponseModel {
  /** 型種別（objectのサブタイプ） */
  kind: "response";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description: string | null;
  /** プロパティ配列（IRObjectModelから継承） */
  properties: IRProperty[];
  /** HTTPステータスコード（レスポンス固有） */
  statusCode: string;
  /** ヘッダー配列（レスポンス固有） */
  headers: IRResponseHeader[] | null;
}

// ============================================================================
// 統一されたモデル定義（判別共用体）
// ============================================================================

/**
 * IRModel - 統一されたモデル定義
 * 全てのデータモデルを統一的に表現する判別共用体
 *
 * @example
 * ```typescript
 * // 使用例：型安全なswitch文
 * function processModel(model: IRModel) {
 *   switch (model.kind) {
 *     case "object":
 *       // model.propertiesにアクセス可能
 *       break;
 *     case "enum":
 *       // model.valuesにアクセス可能
 *       break;
 *     case "array":
 *       // model.itemTypeにアクセス可能
 *       break;
 *     case "map":
 *       // model.valueTypeにアクセス可能
 *       break;
 *     case "parameter":
 *       // model.propertiesにアクセス可能（IRParameterProperty[]）
 *       break;
 *     case "requestBody":
 *       // model.contentにアクセス可能（IRRequestContent[]）
 *       break;
 *     case "response":
 *       // model.contentにアクセス可能（IRResponseContent[]）
 *       break;
 *   }
 * }
 * ```
 */
export type IRModel =
  | IRObjectModel
  | IREnumModel
  | IRArrayModel
  | IRMapModel
  | IRParameterModel
  | IRRequestBodyModel
  | IRResponseModel;

/**
 * IRValidation - バリデーション情報
 * @example
 * ```yaml
 * # OpenAPI → IRValidation
 * type: string
 * minLength: 3
 * maxLength: 50
 * pattern: "^[a-zA-Z0-9]+$"
 * ```
 */
export interface IRValidation {
  /** 最小値 */
  minimum: number | null;
  /** 最大値 */
  maximum: number | null;
  /** 排他的最小値 */
  exclusiveMinimum: boolean | null;
  /** 排他的最大値 */
  exclusiveMaximum: boolean | null;
  /** 最小長 */
  minLength: number | null;
  /** 最大長 */
  maxLength: number | null;
  /** パターン（正規表現） */
  pattern: string | null;
  /** 最小アイテム数 */
  minItems: number | null;
  /** 最大アイテム数 */
  maxItems: number | null;
  /** ユニークアイテム */
  uniqueItems: boolean | null;
  /** 最小プロパティ数 */
  minProperties: number | null;
  /** 最大プロパティ数 */
  maxProperties: number | null;
  /** フォーマット（uuid、email、uri、ipv4等のバリデーション用） */
  format: string | null;
}
