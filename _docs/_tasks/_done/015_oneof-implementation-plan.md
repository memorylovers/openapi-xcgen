# タスク015: oneOf実装計画

## 概要

OpenAPIの`oneOf`キーワードをサポートし、排他的Union型（exactly one）に対応します。oneOfをIR型として表現し、discriminatorサポートを含めることで、型安全なポリモーフィズムを実現します。

## 背景

### 重要度評価

TypeSpec 1.0.0における生成頻度：

- **allOf**: 最高頻度 ⭐⭐⭐⭐⭐（`model extends`で必ず生成）- ✅ 完了
- **anyOf**: 高頻度 ⭐⭐⭐⭐（unionのデフォルト出力）- ✅ 完了
- **oneOf**: 中頻度 ⭐⭐⭐（`@oneOf`デコレータ、discriminated union）- ✅ 完了

### TypeSpecでの使用例

```typespec
// TypeSpec - discriminated union
@discriminator("petType")
union Pet {
  cat: Cat,
  dog: Dog,
}
```

↓ OpenAPI生成（oneOf + discriminator）

```yaml
Pet:
  oneOf:
    - $ref: '#/components/schemas/Cat'
    - $ref: '#/components/schemas/Dog'
  discriminator:
    propertyName: petType
```

### anyOf vs oneOf の違い

| 項目 | anyOf（包含的） | oneOf（排他的） |
|------|----------------|----------------|
| **意味** | 1つ以上にマッチ（OR） | **正確に1つだけ**マッチ（XOR） |
| **バリデーション** | スキーマAまたはBまたは両方 | スキーマAまたはBのどちらか一方のみ |
| **IR kind** | `"anyOf"` | `"union"` |
| **型配列名** | `schemas` | `types` |
| **discriminator** | 任意 | **よく使われる** |
| **TypeScript出力** | Union型 (A \| B) | Union型 (A \| B) |
| **Dart出力** | Union型 | Sealed class（型安全） |
| **用途** | 複数型の選択 | 成功/エラーレスポンス |

### 設計上の重要な判断

**IR型名を `"union"` にする理由**：

1. **Generator視点**: anyOfとoneOfは生成コードが同じ（Union型）
2. **型安全性**: discriminatorがある場合、oneOfの方が型安全
3. **意味の明確化**: "oneOf" = 排他的 → "union" = Union型の意味を強調

## IR型設計

### IRDiscriminator定義

```typescript
/**
 * Discriminator情報（oneOf/anyOfで型判別に使用）
 *
 * OpenAPI 3.x の discriminator に対応。
 * ポリモーフィズムにおける型判別プロパティを指定。
 *
 * @example OpenAPI
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
```

### IRUnionModel定義

```typescript
/**
 * IRUnionModel - oneOf合成モデル（排他的Union）
 * OpenAPIのoneOfキーワードを表現
 *
 * セマンティクス: 正確に1つのスキーマにマッチ（XOR）
 *
 * @example OpenAPI
 * ```yaml
 * Result:
 *   oneOf:
 *     - $ref: '#/components/schemas/Success'
 *     - $ref: '#/components/schemas/Error'
 * ```
 *
 * @example OpenAPI with discriminator
 * ```yaml
 * Pet:
 *   oneOf:
 *     - $ref: '#/components/schemas/Cat'
 *     - $ref: '#/components/schemas/Dog'
 *   discriminator:
 *     propertyName: petType
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
```

### IRModelへの追加

```typescript
export type IRModel =
  | IRObjectModel
  | IREnumModel
  | IRAllOfModel
  | IRAnyOfModel
  | IRUnionModel        // ← 追加
  | IRParameterModel;
```

### Type Guard（必要に応じて）

```typescript
export function isIRUnionModel(model: IRModel): model is IRUnionModel {
  return model.kind === "union";
}
```

## 命名・パス戦略

### インラインスキーマの命名

anyOfと同じ戦略を適用：

```typescript
// 親モデル: Pet
// oneOfのインデックス: 0, 1, 2...
// 生成されるモデル名: PetOneOf0, PetOneOf1, PetOneOf2

const inlineModelName = buildInlineModelName(name, "oneOf", i);
// → "PetOneOf0"
```

### referencePath生成

```typescript
const documentPath = buildInlineSchemaPath(context, inlineModelName);
// → ["components", "schemas", "PetOneOf0"]

const referencePath = buildReferencePath(documentPath);
// → "#/components/schemas/PetOneOf0"
```

**設計原則**: `referencePath.split('/').pop() === modelName`

## Visitor実装

### oneof-visitor.ts

anyof-visitor.ts をベースに、以下の差分を実装：

```typescript
import { consola } from "consola";
import type {
  IRUnionModel,
  IRModel,
  IRRef,
  IRType,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types/guards";
import {
  buildInlineModelName,
  buildInlineSchemaPath,
  buildReferencePath,
  getModelName,
} from "../../helpers";
import type { OneOfContext, VisitorContext } from "../../types";
import { type SchemaVisitorResult, visitSchema } from "./schema-visitor";

/**
 * スキーマがnull型かどうかを判定
 */
function isNullType(schema: SchemaObject): boolean {
  if (isReferenceObject(schema)) return false;
  return schema.type === "null" || schema.type === null;
}

/**
 * oneOf配列からnullableパターンを検出
 * パターン: oneOfにnull型が含まれる場合（要素数は問わない）
 */
function detectNullablePattern(schemas: SchemaObject[]): {
  isNullable: boolean;
  nonNullSchemas: SchemaObject[];
} {
  const hasNullType = schemas.some(isNullType);

  if (hasNullType) {
    const nonNullSchemas = schemas.filter((schema) => !isNullType(schema));
    return { isNullable: true, nonNullSchemas };
  }

  return { isNullable: false, nonNullSchemas: schemas };
}

/**
 * oneOf型のSchemaObjectをIRUnionModelに変換
 *
 * 責務:
 * - oneOfスキーマ構造の処理（サブスキーマの展開）
 * - discriminatorの処理
 * - 各サブスキーマの型判定を`visitSchema`に委譲
 * - インラインスキーマの自動モデル化
 * - ネストされたモデルの収集と集約
 */
export function visitOneOf(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): SchemaVisitorResult {
  const result: SchemaVisitorResult = {
    type: null,
    models: [],
  };

  const name = getModelName(context);

  if (!name.trim()) {
    consola.warn("Invalid model name for oneOf: empty or whitespace only");
    return result;
  }

  if (!(\"oneOf\" in schema) || !schema.oneOf || !Array.isArray(schema.oneOf)) {
    consola.warn(
      `Invalid oneOf schema: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  // nullableパターン検出
  const { isNullable } = detectNullablePattern(schema.oneOf as SchemaObject[]);

  // 各サブスキーマを処理
  const types: IRType[] = [];
  const nestedModels: IRModel[] = [];

  for (let i = 0; i < schema.oneOf.length; i++) {
    const subSchema = schema.oneOf[i] as SchemaObject;

    // nullableパターンの場合、null型はスキップ
    if (isNullable && isNullType(subSchema)) {
      continue;
    }

    // $refの場合はそのまま使用
    if (isReferenceObject(subSchema)) {
      const refType: IRRef = {
        kind: "ref",
        name: subSchema.$ref,
      };
      types.push(refType);
      continue;
    }

    // インラインスキーマの場合は自動モデル化
    const inlineModelName = buildInlineModelName(name, "oneOf", i);
    const inlineContext: OneOfContext = {
      kind: "oneOf",
      documentPath: buildInlineSchemaPath(context, inlineModelName),
      rootSegment: "components",
      parentSchemaName: name,
      index: i,
    };

    const subResult = visitSchema(subSchema, inlineContext);
    nestedModels.push(...subResult.models);

    if (subResult.type) {
      types.push(subResult.type);
    } else {
      consola.warn(
        `Skipping oneOf subschema at index ${i} in ${name}: invalid type`,
      );
    }
  }

  // oneOfモデルを作成
  const unionModel: IRUnionModel = {
    kind: "union",
    name,
    referencePath: buildReferencePath(context.documentPath),
    ...(schema.description && { description: schema.description }),
    ...(isNullable && { nullable: true }),
    ...(schema.discriminator && {
      discriminator: {
        propertyName: schema.discriminator.propertyName,
        ...(schema.discriminator.mapping && {
          mapping: schema.discriminator.mapping,
        }),
      },
    }),
    types,
  };

  // oneOfモデルへの参照を作成
  const unionRef: IRRef = {
    kind: "ref",
    name: unionModel.referencePath,
  };

  result.models = [unionModel, ...nestedModels];
  result.type = unionRef;

  return result;
}
```

### schema-visitor.ts への追加

```typescript
// anyOfの後に追加
if ("oneOf" in schema && schema.oneOf) {
  const oneOfResult = visitOneOf(schema, context);
  result.models.push(...oneOfResult.models);
  result.type = oneOfResult.type;
  return result;
}
```

## 型定義の追加

### SchemaObjectWithNullable拡張

```typescript
export interface SchemaObjectWithNullable extends SchemaObject {
  nullable?: boolean;
  allOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];  // ← 追加
  discriminator?: {                             // ← 追加
    propertyName: string;
    mapping?: Record<string, string>;
  };
}
```

### OneOfContext追加

```typescript
/**
 * oneOf処理用のコンテキスト
 */
export interface OneOfContext extends VisitorContext {
  kind: "oneOf";
  /** 親スキーマ名 */
  parentSchemaName: string;
  /** oneOf配列内のインデックス */
  index: number;
}
```

### CompositionContext更新

```typescript
export type CompositionContext = AllOfContext | AnyOfContext | OneOfContext;
```

## テスト戦略

### 1. In-sourceテスト（oneof-visitor.ts内）

```typescript
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitOneOf", () => {
    it("should handle $ref + $ref composition", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
      };

      const result = visitOneOf(schema, context);

      expect(result.models[0]).toMatchObject({
        kind: "union",
        types: [
          { kind: "ref", name: "#/components/schemas/Cat" },
          { kind: "ref", name: "#/components/schemas/Dog" },
        ],
      });
    });

    it("should handle discriminator", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "petType",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
      };

      const result = visitOneOf(schema, context);

      expect(result.models[0]).toMatchObject({
        kind: "union",
        discriminator: {
          propertyName: "petType",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
      });
    });

    it("should detect nullable pattern with $ref + null", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Success" },
          { type: "null" },
        ],
      };

      const result = visitOneOf(schema, context);

      expect(result.models[0]).toMatchObject({
        kind: "union",
        nullable: true,
        types: [{ kind: "ref", name: "#/components/schemas/Success" }],
      });
    });
  });
}
```

### 2. E2Eテスト

既存テストケース：

1. **oneof.yaml** (openapi-generator)
   - シンプルなoneOf（$ref x 3）
   - discriminatorなし

2. **discriminator-one-of.yaml** (hey-api)
   - oneOf + discriminator
   - discriminator + mapping
   - allOfとの組み合わせ

## 実装ステップ

### Phase 1: IR型定義追加 ✅

- [x] `IRDiscriminator` interface 追加
- [x] `IRUnionModel` interface 追加
- [x] `IRModel` に `IRUnionModel` 追加
- [x] exports更新

### Phase 2: 型定義拡張 ✅

- [x] `SchemaObjectWithNullable` に `oneOf`, `discriminator` 追加
- [x] `OneOfContext` interface 追加
- [x] `CompositionContext` に追加
- [x] Type guards 更新（必要に応じて）

### Phase 3: Visitor実装 ✅

- [x] `oneof-visitor.ts` 作成
- [x] `isNullType()` ヘルパー（visitor内に実装）
- [x] `detectNullablePattern()` 実装
- [x] `visitOneOf()` 実装
- [x] discriminator処理実装

### Phase 4: schema-visitor更新 ✅

- [x] oneOf処理を追加
- [x] テスト更新（警告テストを削除）

### Phase 5: テスト ✅

- [x] In-sourceテスト追加・実行（11テストケース）
- [x] E2Eテスト用expected更新
  - `oneof.expected.json`
  - `transformers-all-of.expected.json`
  - `null-types.expected.json`
  - `train-travel-api.expected.json`
  - `museum-api.expected.json`
- [x] 全テスト実行・確認（414 passed, 3 skipped）

### Phase 6: ドキュメント更新

- [ ] `012_core-unsupported-features.md` を更新（oneOfを完了済みに）
- [ ] コミットメッセージ作成

## 注意点・考慮事項

### 1. discriminatorの扱い

- **必須ではない**: discriminatorがない場合も動作する
- **Generator側で活用**: TypeScript/Dartで型安全なコード生成に利用
- **mappingは任意**: 省略時はスキーマ名を使用

### 2. allOfとの組み合わせ

hey-apiのテストケースでは以下のパターンがある：

```yaml
Bar:
  allOf:
    - $ref: '#/components/schemas/Qux'

Foo:
  oneOf:
    - $ref: '#/components/schemas/Bar'
```

このケースでは：

- allOfが先に処理される（IRAllOfModel生成）
- oneOfはallOfへの参照を持つ（IRRef）

### 3. nullable型パターン

oneOfでもnullableパターンをサポート：

```yaml
NullableResult:
  oneOf:
    - $ref: '#/components/schemas/Success'
    - type: 'null'
```

→ `{ kind: "union", nullable: true, types: [...] }`

### 4. anyOfとの使い分け

| 使用場面 | 推奨 |
|---------|------|
| 成功/エラーレスポンス | oneOf |
| discriminatorあり | oneOf |
| 型安全性が重要 | oneOf |
| nullable型パターン | anyOf |
| 複数型の包含的選択 | anyOf |

## 期待される出力例

### 入力（OpenAPI）

```yaml
components:
  schemas:
    Pet:
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: petType
```

### 出力（IR JSON）

```json
{
  "models": [
    {
      "kind": "union",
      "name": "Pet",
      "referencePath": "#/components/schemas/Pet",
      "discriminator": {
        "propertyName": "petType"
      },
      "types": [
        { "kind": "ref", "name": "#/components/schemas/Cat" },
        { "kind": "ref", "name": "#/components/schemas/Dog" }
      ]
    }
  ]
}
```

## 実装結果 ✅

### 成果物

#### 1. IR型定義

- **`packages/core/src/types/ir/models/base.ts`**
  - `IRDiscriminator` interface追加
  - `IRUnionModel` interface追加（kind: "union"）

#### 2. Visitor実装

- **`packages/core/src/transformer/visitors/schema/oneof-visitor.ts`**
  - `visitOneOf()` 関数実装
  - discriminatorサポート（propertyName + optional mapping）
  - nullable pattern検出
  - 11個のin-sourceテスト

#### 3. 型定義拡張

- **`packages/core/src/transformer/types.ts`**
  - `OneOfContext` interface追加
  - `SchemaObjectWithNullable` に `oneOf`, `discriminator` 追加

#### 4. 統合

- **`packages/core/src/transformer/visitors/schema/schema-visitor.ts`**
  - oneOf処理を追加（line 99-104）
  - 警告からvisitorへ置き換え
  - 単体テスト更新（2テストケース）

#### 5. E2Eテスト

更新したexpectedファイル：

- `oneof.expected.json` - union model追加
- `transformers-all-of.expected.json` - BarFooItem union追加
- `null-types.expected.json` - nullable oneOf追加
- `train-travel-api.expected.json` - discriminator付きunion追加
- `museum-api.expected.json` - payment_method union追加

### テスト結果

```
Test Files  48 passed (48)
Tests       414 passed | 3 skipped (417)
```

### 主要な設計決定

1. **IR kind名を "union" にした理由**
   - Generator側でanyOfとoneOfの区別が不要
   - TypeScript/DartどちらもUnion型として生成
   - discriminatorの有無で型安全性が決まる

2. **プロパティ名を "types" にした理由**
   - anyOfの "schemas" と区別
   - Union型の意味を明確化
   - より直感的な命名

3. **discriminatorサポート**
   - propertyName（必須）
   - mapping（任意）
   - Generator側で型安全なコード生成に活用

### 実装時の課題と解決

1. **E2Eテストの更新順序**
   - 課題: モデル配列の順序がパーサーに依存
   - 解決: 実際の出力を確認して正確な順序で更新

2. **nullable pattern検出**
   - anyOfと同じロジックを適用
   - `oneOf: [{$ref: X}, {type: 'null'}]` → `nullable: true`

## 関連タスク

- **前提**: タスク013（allOf実装）- ✅ 完了
- **前提**: タスク014（anyOf実装）- ✅ 完了
- **次**: タスク012完了後、discriminatorの詳細サポート（必要に応じて）

## 参考資料

- [OpenAPI 3.0 Specification - oneOf](https://spec.openapis.org/oas/v3.0.3#schema-object)
- [OpenAPI 3.0 Specification - discriminator](https://spec.openapis.org/oas/v3.0.3#discriminator-object)
- [TypeSpec - @oneOf decorator](https://typespec.io/docs/standard-library/built-in-decorators#oneof)
