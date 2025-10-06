/**
 * コアモデル定義のIR型定義
 */

import type { IRScalarType, IRType } from "../common/type";
import type { IRProperty } from "./property";

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
  description?: string;
  /** プロパティの配列 */
  properties: IRProperty[];
  /** 追加プロパティの型（additionalProperties） */
  additionalProperties?: IRType;
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
  description?: string;
  /** 値の型（OpenAPIの型をそのまま保持） */
  type: IRScalarType;
  /** Enum値の配列 */
  values: IREnumValue[];
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
  description?: string;
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
  description?: string;
  /** 値の型 */
  valueType: IRType;
}

/**
 * IRAllOfModel - allOf合成モデル定義
 * OpenAPIのallOfキーワードを表現し、複数のスキーマの合成（継承・インターセクション）を表す
 *
 * @example
 * ```yaml
 * # OpenAPI → IRAllOfModel
 * Extended:
 *   allOf:
 *     - $ref: '#/components/schemas/Base'
 *     - type: object
 *       properties:
 *         email:
 *           type: string
 *
 * # TypeSpec相当
 * model Extended extends Base {
 *   email: string;
 * }
 * ```
 */
export interface IRAllOfModel {
  /** 型種別 */
  kind: "allOf";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description?: string;
  /** 合成する型の配列（通常はIRRefまたはインライン型） */
  schemas: IRType[];
}

/**
 * IRAnyOfModel - anyOf合成モデル定義
 * OpenAPIのanyOfキーワードを表現し、複数のスキーマのうち1つ以上に適合する（包含的Union）を表す
 *
 * @example
 * ```yaml
 * # OpenAPI → IRAnyOfModel (通常のUnion)
 * Fruit:
 *   anyOf:
 *     - $ref: '#/components/schemas/Apple'
 *     - $ref: '#/components/schemas/Banana'
 *
 * # TypeSpec相当
 * union Fruit {
 *   apple: Apple,
 *   banana: Banana,
 * }
 * ```
 *
 * @example
 * ```yaml
 * # OpenAPI 3.1 → IRAnyOfModel (nullable型パターン)
 * NullableString:
 *   anyOf:
 *     - type: string
 *     - type: 'null'
 *
 * # IR変換後（null型は除外され、nullable: trueフラグが設定される）
 * {
 *   kind: "anyOf",
 *   name: "NullableString",
 *   nullable: true,
 *   schemas: ["string"]
 * }
 *
 * # TypeSpec相当
 * model NullableString {
 *   value: string | null;
 * }
 * ```
 */
export interface IRAnyOfModel {
  /** 型種別 */
  kind: "anyOf";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description?: string;
  /** null許容フラグ（anyOf: [{type: X}, {type: 'null'}]パターンで自動検出） */
  nullable?: true;
  /** 合成する型の配列（nullableの場合、null型は除外される） */
  schemas: IRType[];
}

/**
 * Discriminator情報（oneOf/anyOfで型判別に使用）
 *
 * OpenAPI 3.x の discriminator に対応。
 * ポリモーフィズムにおける型判別プロパティを指定。
 *
 * @example OpenAPI YAML
 * ```yaml
 * Pet:
 *   oneOf:
 *     - $ref: '#/components/schemas/Cat'
 *     - $ref: '#/components/schemas/Dog'
 *   discriminator:
 *     propertyName: petType
 *     mapping:
 *       cat: '#/components/schemas/Cat'
 *       dog: '#/components/schemas/Dog'
 * ```
 */
export interface IRDiscriminator {
  /** 判別に使用するプロパティ名 */
  propertyName: string;
  /** カスタムマッピング（値 → スキーマ参照） */
  mapping?: Record<string, string>;
}

/**
 * IRUnionModel - oneOf合成モデル（排他的Union - exactly one）
 *
 * OpenAPI 3.x の oneOf に対応。
 * TypeSpecでは @oneOf デコレータや discriminated union で生成。
 *
 * セマンティクス: 正確に1つのスキーマにマッチ（XOR）
 * - anyOf: 1つ以上にマッチ（OR）
 * - oneOf: 正確に1つにマッチ（XOR）
 *
 * @example OpenAPI YAML - シンプルなoneOf
 * ```yaml
 * Result:
 *   oneOf:
 *     - $ref: '#/components/schemas/Success'
 *     - $ref: '#/components/schemas/Error'
 * ```
 *
 * @example OpenAPI YAML - discriminator付き
 * ```yaml
 * Pet:
 *   oneOf:
 *     - $ref: '#/components/schemas/Cat'
 *     - $ref: '#/components/schemas/Dog'
 *   discriminator:
 *     propertyName: petType
 * ```
 *
 * @example IR JSON出力
 * ```json
 * {
 *   kind: "union",
 *   name: "Pet",
 *   referencePath: "#/components/schemas/Pet",
 *   discriminator: {
 *     propertyName: "petType"
 *   },
 *   types: [
 *     { kind: "ref", name: "#/components/schemas/Cat" },
 *     { kind: "ref", name: "#/components/schemas/Dog" }
 *   ]
 * }
 * ```
 *
 * # TypeSpec相当
 * ```typespec
 * @discriminator("petType")
 * union Pet {
 *   cat: Cat,
 *   dog: Dog,
 * }
 * ```
 */
export interface IRUnionModel {
  /** 型種別 */
  kind: "union";
  /** モデル名（PascalCase） */
  name: string;
  /** 参照パス */
  referencePath: string;
  /** モデルの説明 */
  description?: string;
  /** null許容フラグ（oneOf: [{$ref: X}, {type: 'null'}]パターンで自動検出） */
  nullable?: true;
  /** Discriminator情報（型判別用） */
  discriminator?: IRDiscriminator;
  /** 合成する型の配列（正確に1つにマッチ） */
  types: IRType[];
}
