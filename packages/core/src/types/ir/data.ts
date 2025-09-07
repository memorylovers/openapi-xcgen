/**
 * データモデル関連のIR型定義
 */

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
 * IRModel - モデル定義
 * componentsで定義されたものと、インラインスキーマから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IRModel
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
export interface IRModel {
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
  description?: string;
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
  description?: string;
  /** 型情報 */
  type: IRType;
  /** 必須フラグ */
  required: boolean;
  /** null許容フラグ */
  nullable?: boolean;
  /** デフォルト値 */
  defaultValue?: unknown;
  /** 非推奨フラグ */
  deprecated?: boolean;
  /** バリデーション情報 */
  validation?: IRValidation;
}

/**
 * IREnum - 列挙型定義
 * componentsで定義されたものと、インラインenumから自動生成されたものの両方を含む
 * @example
 * ```yaml
 * # OpenAPI → IREnum
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
export interface IREnum {
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
  description?: string;
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
  description?: string;
}

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
  minimum?: number;
  /** 最大値 */
  maximum?: number;
  /** 排他的最小値 */
  exclusiveMinimum?: boolean;
  /** 排他的最大値 */
  exclusiveMaximum?: boolean;
  /** 最小長 */
  minLength?: number;
  /** 最大長 */
  maxLength?: number;
  /** パターン（正規表現） */
  pattern?: string;
  /** 最小アイテム数 */
  minItems?: number;
  /** 最大アイテム数 */
  maxItems?: number;
  /** ユニークアイテム */
  uniqueItems?: boolean;
  /** 最小プロパティ数 */
  minProperties?: number;
  /** 最大プロパティ数 */
  maxProperties?: number;
  /** フォーマット（uuid、email、uri、ipv4等のバリデーション用） */
  format?: string;
}
