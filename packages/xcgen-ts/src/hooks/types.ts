/**
 * Hook型定義
 *
 * コード生成の各タイミングで実行される Hook の型定義。
 * ユーザーが xcgen.config.ts で Hook を定義する際に型補完が効く。
 */

import type {
  Extensions,
  IREndpoint,
  IRModel,
  IRParameter,
  IRProperty,
  IRType,
  IRValidation,
} from "@openapi-xcgen/core";

/**
 * プロパティ生成Hook の Context
 *
 * IRProperty から TypeScript プロパティ定義を生成する際に呼び出される。
 *
 * @example
 * ```yaml
 * properties:
 *   email:
 *     type: string
 *     x-type: "EmailAddress"
 * ```
 *
 * @example Hook実装
 * ```typescript
 * hooks: {
 *   'property:generate': async (ctx) => {
 *     // x-type があれば型名を変換
 *     if (ctx.extensions?.['x-type']) {
 *       ctx.tsCode.typeName = ctx.extensions['x-type'] as string;
 *     }
 *   }
 * }
 * ```
 */
export interface PropertyGenerateContext {
  /** IR プロパティ定義 */
  property: IRProperty;
  /** 所属モデル */
  model: IRModel;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeProperty;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * プロパティのコード生成モデル
 *
 * Hook が介入してこのモデルを変更することで、生成されるコードをカスタマイズできます。
 */
export interface TsCodeProperty {
  /** 型名（例: "string", "EmailAddress"） */
  typeName: string;
  /** オプショナルかどうか */
  optional: boolean;
  /** nullable かどうか */
  nullable: boolean;
  /** デフォルト値（存在する場合） */
  defaultValue?: string;
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * パラメータ生成Hook の Context
 *
 * @remarks
 * `endpoint` はオプショナルです。
 * - パラメータモデル生成時（`generateParameterType()`）: endpoint なし
 * - エンドポイント固有のパラメータ生成時: endpoint あり
 */
export interface ParameterGenerateContext {
  /** IR パラメータ定義 */
  parameter: IRParameter;
  /** 所属エンドポイント（オプショナル） */
  endpoint?: IREndpoint;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeParameter;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * パラメータのコード生成モデル
 */
export interface TsCodeParameter {
  /** パラメータ名 */
  name: string;
  /** 型名 */
  typeName: string;
  /** オプショナルかどうか */
  optional: boolean;
  /** nullable かどうか */
  nullable: boolean;
  /** デフォルト値（存在する場合） */
  defaultValue?: string;
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * モデル生成Hook の Context
 */
export interface ModelGenerateContext {
  /** IR モデル定義 */
  model: IRModel;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeModel;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * モデルのコード生成モデル
 */
export interface TsCodeModel {
  /** モデル名 */
  name: string;
  /** 生成される型定義コード */
  code: string;
  /** 追加インポート（Hookで追加可能） */
  imports: string[];
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * エンドポイント生成Hook の Context
 */
export interface EndpointGenerateContext {
  /** IR エンドポイント定義 */
  endpoint: IREndpoint;
  /** 生成される API 関数（Hookで変更可能） */
  tsCode: TsCodeEndpoint;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * エンドポイントのコード生成モデル
 */
export interface TsCodeEndpoint {
  /** 関数名 */
  functionName: string;
  /** 生成される関数コード */
  code: string;
  /** 追加インポート（Hookで追加可能） */
  imports: string[];
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * 型変換Hook の Context
 */
export interface TypeTransformContext {
  /** IR 型 */
  type: IRType;
  /** 生成される TypeScript 型文字列（Hookで変更可能） */
  tsCode: TsCodeType;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * 型変換のコード生成モデル
 */
export interface TsCodeType {
  /** 型文字列（例: "string", "EmailAddress"） */
  typeString: string;
}

/**
 * バリデーション変換Hook の Context
 */
export interface ValidationTransformContext {
  /** IR バリデーション */
  validation: IRValidation;
  /** 対象の型 */
  type: IRType;
  /** 生成される Valibot schema 文字列（Hookで変更可能） */
  tsCode: TsCodeValidation;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * バリデーションのコード生成モデル
 */
export interface TsCodeValidation {
  /** Valibot schema 文字列 */
  schemaString: string;
}

/**
 * Hook Handler の基本型
 *
 * 各 Hook は Context を受け取り、void を返す（純粋関数、同期のみ）
 */
export type HookHandler<T> = (context: T) => void;

/**
 * プロパティ生成Hook の Handler 型
 */
export type PropertyGenerateHandler = HookHandler<PropertyGenerateContext>;

/**
 * パラメータ生成Hook の Handler 型
 */
export type ParameterGenerateHandler = HookHandler<ParameterGenerateContext>;

/**
 * モデル生成Hook の Handler 型
 */
export type ModelGenerateHandler = HookHandler<ModelGenerateContext>;

/**
 * エンドポイント生成Hook の Handler 型
 */
export type EndpointGenerateHandler = HookHandler<EndpointGenerateContext>;

/**
 * 型変換Hook の Handler 型
 */
export type TypeTransformHandler = HookHandler<TypeTransformContext>;

/**
 * バリデーション変換Hook の Handler 型
 */
export type ValidationTransformHandler =
  HookHandler<ValidationTransformContext>;

/**
 * すべての Hook をまとめた型
 *
 * xcgen.config.ts で定義する Hook の型定義
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@openapi-xcgen/xcgen-ts'
 *
 * export default defineConfig({
 *   input: './openapi.yaml',
 *   output: './generated',
 *   hooks: {
 *     'property:generate': async (ctx) => {
 *       // プロパティ生成時の処理
 *     },
 *     'validation:transform': async (ctx) => {
 *       // バリデーション変換時の処理
 *     }
 *   }
 * })
 * ```
 */
export interface Hooks {
  /**
   * プロパティ生成時に呼び出される Hook
   *
   * 単一または配列で複数の Handler を登録可能
   */
  "property:generate"?: PropertyGenerateHandler | PropertyGenerateHandler[];

  /**
   * パラメータ生成時に呼び出される Hook
   */
  "parameter:generate"?: ParameterGenerateHandler | ParameterGenerateHandler[];

  /**
   * モデル生成時に呼び出される Hook
   */
  "model:generate"?: ModelGenerateHandler | ModelGenerateHandler[];

  /**
   * エンドポイント生成時に呼び出される Hook
   */
  "endpoint:generate"?: EndpointGenerateHandler | EndpointGenerateHandler[];

  /**
   * 型変換時に呼び出される Hook
   */
  "type:transform"?: TypeTransformHandler | TypeTransformHandler[];

  /**
   * バリデーション変換時に呼び出される Hook
   */
  "validation:transform"?:
    | ValidationTransformHandler
    | ValidationTransformHandler[];
}

/**
 * Hook名からContext型を推論
 *
 * Hooks インターフェースから自動的に対応するContext型を抽出します。
 * Hookを追加する際は Hooks の定義だけを変更すれば、この型も自動的に更新されます。
 *
 * @example
 * ```typescript
 * type Ctx = HookContext<"property:generate">; // PropertyGenerateContext
 * ```
 */
export type HookContext<K extends keyof Hooks> =
  NonNullable<Hooks[K]> extends HookHandler<infer T> | HookHandler<infer T>[]
    ? T
    : never;

/**
 * Hook インスタンス型
 *
 * 各 Hook タイプに対して Handler または Handler 配列を保持
 */
export interface HookableInstance {
  /**
   * Hook を呼び出す（同期）
   * @param name - Hook 名
   * @param context - Hook コンテキスト
   */
  callHook<K extends keyof Hooks>(name: K, context: HookContext<K>): void;
}
