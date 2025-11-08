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
  | "null" // null (OpenAPI 3.1)
  // 日時型（特別扱い）
  | "date" // string/date → 日付のみ
  | "datetime" // string/date-time → 日時
  // バイナリ型（特別扱い）
  | "binary" // string/binary → バイナリデータ
  | "byte"; // string/byte → Base64エンコード

/**
 * IRComponentRef - コンポーネントへの参照（$ref）
 * 実際の型（IRSchema/IROperationComponent）はXcgenIRから探索して判明
 * @example
 * ```yaml
 * # OpenAPI
 * $ref: "#/components/schemas/User"    # スキーマ参照
 * $ref: "#/components/schemas/Status"  # Enum参照
 * $ref: "#/components/schemas/Pet"     # Union参照
 * ```
 */
export interface IRComponentRef {
  kind: "ref";
  referencePath: string; // "#/components/schemas/User" など
}

/**
 * 後方互換性のためのエイリアス
 * @deprecated Use IRComponentRef instead
 */
export type IRRef = IRComponentRef;

/**
 * IRType - 型情報の判別共用体
 * プロパティやパラメータの型として使用される
 * 配列型やマップ型は常にコンポーネントとして抽出され、IRComponentRefで参照される
 */
export type IRType = IRScalarType | IRComponentRef;
