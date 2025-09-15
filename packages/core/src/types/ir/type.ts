/**
 * 基本型システムのIR型定義
 */

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
