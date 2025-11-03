/**
 * Component Schemas Traverser
 *
 * components.schemasの走査を担当します。
 * 各スキーマに対してvisitSchemaを呼び出し、結果のモデルを収集します。
 */

import { consola } from "consola";
import { buildComponentSchemaPath } from "../../helpers";
import type {
  IRComponent,
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import type { TransformContext } from "../context";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable,
  context: TransformContext,
) => { type: unknown; models: IRComponent[] };

/**
 * ComponentSchemas走査結果
 */
export interface ComponentSchemasTraversalResult {
  /** 抽出されたモデル */
  models: IRComponent[];
}

/**
 * components.schemasを走査し、各スキーマをvisitSchemaで処理
 *
 * @param schemas - components.schemasのRecord
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（dispatchSchema）
 * @returns モデルの配列
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *     Status:
 *       type: string
 *       enum: [active, inactive]
 * ```
 */
export function traverseComponentSchemas(
  schemas: Record<string, ReferenceObject | SchemaObject>,
  context: TransformContext,
  visitSchema: VisitSchemaFn,
): ComponentSchemasTraversalResult {
  const models: IRComponent[] = [];

  for (const [name, schema] of Object.entries(schemas)) {
    // null/undefinedチェック
    if (!schema) {
      consola.warn(`Invalid schema for "${name}": schema is null or undefined`);
      continue;
    }

    // ReferenceObjectの場合は警告してスキップ（ネストされた$refは未対応）
    if (isReferenceObject(schema)) {
      consola.warn(
        `Nested $ref in components.schemas["${name}"] is not supported`,
      );
      continue;
    }

    try {
      // スキーマコンテキストを構築
      const schemaContext: TransformContext = {
        documentPath: buildComponentSchemaPath(context, name),
        rootSegment: "components",
      };

      // visitSchemaを呼び出し（実際にはdispatchSchema）
      const schemaResult = visitSchema(
        schema as SchemaObjectWithNullable,
        schemaContext,
      );

      // 結果のモデルを収集
      models.push(...schemaResult.models);
    } catch (error) {
      consola.warn(`Failed to process schema "${name}":`, error);
    }
  }

  return { models };
}
