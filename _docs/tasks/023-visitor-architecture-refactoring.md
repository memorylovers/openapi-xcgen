# Task 023: Visitor Architecture Refactoring

**Status**: 📋 Planning
**Priority**: High
**Complexity**: High
**Estimated Effort**: 3-5 days

## 概要

現在の`packages/core/src/transformer/visitors/`配下の実装を分析した結果、「Visitorパターン」と称しているが、実際には古典的なVisitorパターンの要素が欠如しており、**再帰的ディスパッチャーパターン**として機能していることが判明。さらに、トラバーサル（子要素訪問）と変換処理が混在しており、単一責任原則に違反している。

この状態は、テスタビリティの低下、コードの可読性の低下、保守性の低下を引き起こしており、早急なリファクタリングが必要。

## 現状分析

### 問題点のカテゴリ

#### 1. 古典的なVisitorパターンの要素が欠如

**現状**:

- `accept(visitor)`メソッドが存在しない（外部ライブラリの型のため追加不可）
- 統一されたVisitorインターフェースが存在しない
- Double Dispatchが実現されていない
- 型判定は各visitor関数内で直接実行

**実際の実装パターン**: 再帰的ディスパッチャーパターン

**影響**:

- パターン名と実装の乖離により、コードの意図が不明確
- 新しい開発者が混乱する可能性

#### 2. トラバーサルと変換処理が分離されていない ⚠️ **最重要**

**問題のある実装例** (`object-visitor.ts:97-211`):

```typescript
export function visitObject(schema, context) {
  // ① 検証処理
  if (!name.trim()) { consola.warn(...); return result; }

  // ② プロパティのイテレーション（トラバーサル）
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    // ③ 子要素の訪問
    const propResult = visitSchema(schemaObj, {...});

    // ④ 結果の収集
    nestedModels.push(...propResult.models);
  }

  // ⑤ 自身の変換処理
  const mainModel: IRModel = { kind: "object", ... };

  return result;
}
```

**問題点**:

- トラバーサル（②）、子要素訪問（③）、変換処理（⑤）が1つの関数に混在
- 単一責任原則に違反
- テストが複雑（モックが困難）
- 再利用性が低い

**影響範囲**:

- `visitObject` (object-visitor.ts)
- `visitArray` (array-visitor.ts)
- `visitAllOf` (allof-visitor.ts)
- `visitOneOf` (oneof-visitor.ts)
- `visitAnyOf` (anyof-visitor.ts)

#### 3. 命名が役割を反映していない

| 現在の関数名 | 実際の役割 | 適切な名前例 |
|-------------|-----------|-------------|
| `visitSchema` | 型判定→委譲（ディスパッチャー） | `dispatchSchema` / `resolveSchemaType` |
| `visitObject` | オブジェクト変換+子要素訪問 | `transformObject` + `traverseObjectProperties` |
| `visitType` | プリミティブ型解決のみ | `resolvePrimitiveType` / `transformPrimitive` |
| `visitEnum` | Enum変換のみ | `transformEnum` |

**問題点**:

- すべて`visit*`という名前だが、役割が異なる
- コードを読む際に各関数の責務が不明確
- 「visit」という言葉が何を意味するのか曖昧

#### 4. 戻り値の構造が統一されていない

```typescript
// schema-visitor.ts
export interface SchemaVisitorResult {
  type: IRType | null;
  models: IRModel[];
}

// operation-visitor.ts
export interface OperationResult {
  endpoint: IREndpoint;
  models: IRModel[];
}

// paths-visitor.ts
export interface PathsResult {
  endpoints: IREndpoint[];
  models: IRModel[];
}

// servers-visitor.ts
export function visitServers(...): IRServer[] | undefined {
  // 他のvisitorと構造が全く異なる
}
```

**問題点**:

- 統一されたインターフェースがない
- 合成（composition）が難しい
- 一貫性のあるエラーハンドリングが困難
- `servers-visitor.ts`だけ設計が完全に異なる

#### 5. 型判定ロジックの分散

**良い点**: `visitSchema`が中央ディスパッチャーとして機能

**問題点**:

- `visitType`もプリミティブ、配列、$refを判定している
- `visitObject`もobject型かどうかを判定している
- 型判定ロジックが複数箇所に散在

#### 6. コンテキスト管理が複雑すぎる

`types.ts`には15種類以上のコンテキスト型が定義されている:

- `VisitorContext`
- `SchemaContext`
- `AllOfContext`
- `OneOfContext`
- `ParameterContext`
- `PathItemContext`
- `OperationContext`
- `ParametersContext`
- `RequestBodyContext`
- `ResponsesContext`
- `ResponseContext`
- `HeaderContext`
- ...

**問題点**:

- 各visitorが独自のコンテキスト型を要求
- コンテキストの構築コードが散在
- 型安全性は高いが、保守性が低い

#### 7. エラーハンドリングが一貫していない

```typescript
// schema-visitor.ts:104-109
if ("not" in schema && schema.not) {
  consola.warn(`not schema is not supported yet: ...`);
  return result; // { type: null, models: [] }を返す
}

// object-visitor.ts:109-112
if (!name.trim()) {
  consola.warn("Invalid model name: empty or whitespace only");
  return result; // 空の結果を返す
}
```

**問題点**:

- エラー時の戻り値が統一されていない
- エラー情報が失われる（呼び出し側で区別できない）
- 警告だけで処理が続行されるケースと停止されるケースが混在
- エラー追跡が困難

#### 8. 循環依存の可能性

```typescript
// schema-visitor.ts
import { visitObject } from "./object-visitor";
import { visitEnum } from "./enum-visitor";
import { visitArray } from "./array-visitor";
// ...

// object-visitor.ts
import { visitSchema } from "./schema-visitor";
```

**現状**: これ自体は問題ないが、相互再帰が複雑になる可能性がある

#### 9. 一貫性のない設計

`servers-visitor.ts`だけが他のvisitorと異なる:

- 子要素を訪問しない（単純な変換のみ）
- `VisitorContext`を受け取らない
- `IRServer[]`を直接返す（modelsフィールドがない）

## 改善提案

### 設計方針: 3層アーキテクチャの導入

```
┌─────────────────────────────────────────┐
│  Dispatcher Layer (型判定とルーティング)  │
│  - dispatchSchema()                     │
│  - dispatchType()                       │
└─────────────────┬───────────────────────┘
                  │ 委譲
┌─────────────────▼───────────────────────┐
│  Traverser Layer (子要素の訪問)          │
│  - traverseObject()                     │
│  - traverseArray()                      │
│  - traverseAllOf()                      │
└─────────────────┬───────────────────────┘
                  │ 再帰呼び出し
┌─────────────────▼───────────────────────┐
│  Transformer Layer (変換処理)            │
│  - transformObject()                    │
│  - transformEnum()                      │
│  - transformArray()                     │
└─────────────────────────────────────────┘
```

### 1. Dispatcher Layer（型判定とルーティング）

**責務**: SchemaObjectの型を判定し、適切なtransformerを選択

```typescript
/**
 * Schema型を判定し、適切な処理に委譲
 */
export function dispatchSchema(
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: TransformContext,
): TransformResult {
  // $ref参照
  if (isReferenceObject(schema)) {
    return transformReference(schema, context);
  }

  // composition schemas
  if ("allOf" in schema && schema.allOf) {
    return transformAllOf(schema, context);
  }
  if ("oneOf" in schema && schema.oneOf) {
    return transformOneOf(schema, context);
  }
  if ("anyOf" in schema && schema.anyOf) {
    return transformAnyOf(schema, context);
  }

  // enum
  if (schema.enum !== undefined) {
    return transformEnum(schema, context);
  }

  // object (明示的または暗黙的)
  if (schema.type === "object" || (!schema.type && schema.properties)) {
    return transformObject(schema, context);
  }

  // array
  if (schema.type === "array") {
    return transformArray(schema, context);
  }

  // map (additionalPropertiesのみ)
  if (
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    (!schema.properties || Object.keys(schema.properties).length === 0)
  ) {
    return transformMap(schema, context);
  }

  // primitive
  return transformPrimitive(schema, context);
}
```

### 2. Traverser Layer（子要素の訪問）

**責務**: 子要素をイテレートし、再帰的にdispatcherを呼び出す

```typescript
/**
 * Objectのプロパティを訪問
 */
function traverseObjectProperties(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): PropertyTraversalResult {
  const properties: IRProperty[] = [];
  const childModels: IRModel[] = [];

  if (!schema.properties) {
    return { properties, childModels };
  }

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const propContext = buildPropertyContext(context, propName);

    // 再帰的にdispatcherを呼び出し
    const propResult = dispatchSchema(
      propSchema as SchemaObjectWithNullable,
      propContext,
    );

    // 子モデルを収集
    childModels.push(...propResult.models);

    // プロパティを構築
    if (propResult.type) {
      properties.push(buildProperty(propName, propSchema, propResult.type));
    }
  }

  return { properties, childModels };
}

/**
 * additionalPropertiesを訪問
 */
function traverseAdditionalProperties(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): AdditionalPropertiesTraversalResult {
  if (!("additionalProperties" in schema) || !schema.additionalProperties) {
    return { type: undefined, models: [] };
  }

  const additionalContext = buildAdditionalPropertiesContext(context);
  const result = dispatchSchema(
    schema.additionalProperties,
    additionalContext,
  );

  return { type: result.type, models: result.models };
}
```

### 3. Transformer Layer（変換処理）

**責務**: OpenAPIスキーマをIR型に変換（子要素訪問はTraverserに委譲）

```typescript
/**
 * Object型スキーマをIRModelに変換
 */
export function transformObject(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const name = extractModelName(context);

  // Validation
  if (!name.trim()) {
    return createErrorResult("Invalid model name: empty or whitespace only");
  }

  // 子要素の訪問はtraverserに委譲
  const propertiesResult = traverseObjectProperties(schema, context);
  const additionalResult = traverseAdditionalProperties(schema, context);

  // 自身の変換のみを行う
  const model: IRModel = {
    kind: "object",
    name,
    referencePath: buildReferencePath(context.documentPath),
    properties: propertiesResult.properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalResult.type && { additionalProperties: additionalResult.type }),
  };

  // 結果を返す（メインモデル + 子モデル）
  return {
    type: { kind: "ref", name: buildReferencePath(context.documentPath) },
    models: [model, ...propertiesResult.childModels, ...additionalResult.models],
  };
}

/**
 * Enum型スキーマをIRModelに変換
 */
export function transformEnum(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const name = extractModelName(context);

  if (!schema.enum || schema.enum.length === 0) {
    return createErrorResult("Invalid enum: empty values");
  }

  const model: IRModel = {
    kind: "enum",
    name,
    referencePath: buildReferencePath(context.documentPath),
    type: mapEnumType(schema.type),
    values: schema.enum.map(value => ({
      value,
      name: generateEnumMemberName(value, schema.type),
    })),
    ...(schema.description && { description: schema.description }),
  };

  return {
    type: { kind: "ref", name: buildReferencePath(context.documentPath) },
    models: [model],
  };
}

/**
 * Primitive型スキーマをIRScalarTypeに変換
 */
export function transformPrimitive(
  schema: SchemaObjectWithNullable,
  context: TransformContext,
): TransformResult {
  const type = resolvePrimitiveType(schema);

  if (!type) {
    return createErrorResult(`Invalid primitive type: ${schema.type}`);
  }

  return {
    type,
    models: [],
  };
}
```

### 4. 統一されたインターフェース

```typescript
/**
 * 全transformer/traverser/dispatcherの統一戻り値型
 */
export interface TransformResult {
  /** 変換後の型（nullの場合はエラー） */
  type: IRType | null;
  /** 抽出されたモデル */
  models: IRModel[];
  /** エラー情報（オプション） */
  error?: {
    code: string;
    message: string;
    context: unknown;
  };
}

/**
 * プロパティトラバーサルの結果
 */
export interface PropertyTraversalResult {
  properties: IRProperty[];
  childModels: IRModel[];
}

/**
 * additionalPropertiesトラバーサルの結果
 */
export interface AdditionalPropertiesTraversalResult {
  type: IRType | undefined;
  models: IRModel[];
}
```

### 5. コンテキストの簡素化

```typescript
/**
 * 変換コンテキスト（簡素化版）
 */
export interface TransformContext {
  /** ドキュメントパス */
  documentPath: string[];
  /** ルートセグメント */
  rootSegment: "paths" | "components";
  /** 追加メタデータ（必要に応じて） */
  metadata?: Record<string, unknown>;
}

/**
 * コンテキストビルダー関数
 */
export function buildPropertyContext(
  parent: TransformContext,
  propName: string,
): TransformContext {
  return {
    ...parent,
    documentPath: [...parent.documentPath, propName],
  };
}
```

### 6. エラーハンドリングの標準化

```typescript
/**
 * エラー結果を作成
 */
export function createErrorResult(
  message: string,
  code: string = "TRANSFORM_ERROR",
): TransformResult {
  consola.warn(message);
  return {
    type: null,
    models: [],
    error: {
      code,
      message,
      context: {},
    },
  };
}

/**
 * エラーチェック
 */
export function isErrorResult(result: TransformResult): boolean {
  return result.type === null || result.error !== undefined;
}
```

### 7. 命名規約

| 層 | プレフィックス | 例 | 責務 |
|----|--------------|-----|------|
| Dispatcher | `dispatch*` | `dispatchSchema` | 型判定とルーティング |
| Traverser | `traverse*` | `traverseObjectProperties` | 子要素の訪問 |
| Transformer | `transform*` | `transformObject` | 変換処理 |
| Helper | なし | `buildPropertyContext` | ユーティリティ |

## 実装計画

### Phase 1: 設計の確定とプロトタイプ（1日）

1. **新しいディレクトリ構造の作成**

   ```
   packages/core/src/transformer/
   ├── visitors/               # 既存（段階的に削除）
   └── v2/                     # 新設計
       ├── dispatchers/
       │   ├── schema-dispatcher.ts
       │   └── type-dispatcher.ts
       ├── traversers/
       │   ├── object-traverser.ts
       │   ├── array-traverser.ts
       │   └── composition-traverser.ts
       ├── transformers/
       │   ├── object-transformer.ts
       │   ├── enum-transformer.ts
       │   ├── array-transformer.ts
       │   ├── primitive-transformer.ts
       │   └── reference-transformer.ts
       ├── types.ts             # 統一されたインターフェース
       ├── context.ts           # コンテキスト管理
       └── index.ts
   ```

2. **プロトタイプ実装**（schema系のみ）
   - `dispatchSchema`
   - `transformObject`
   - `transformEnum`
   - `transformPrimitive`
   - `traverseObjectProperties`

3. **既存テストとの互換性確認**

### Phase 2: 既存コードのリファクタリング（2-3日）

**📝 注意**: Task 022/022.5で整理された`helpers/`構造を活用：

- **Parser Functions**: `helpers/path/`のパーサー関数（`parseResponsePath`, `parseParameterPath`等）をTransformer層で使用
- **Naming Functions**: `helpers/naming/`の組織化パターンをTransformer層の命名処理の参考にする
- **documentPath-based Context**: Task 022で導入された簡素化されたContextがTransformer層で使いやすい

#### Step 1: Schema系の移行

- `schema-visitor.ts` → `schema-dispatcher.ts`
- `object-visitor.ts` → `object-transformer.ts` + `object-traverser.ts`
- `enum-visitor.ts` → `enum-transformer.ts`
- `array-visitor.ts` → `array-transformer.ts` + `array-traverser.ts`
- `type-visitor.ts` → `primitive-transformer.ts`

#### Step 2: Composition系の移行

- `allof-visitor.ts` → `allof-transformer.ts` + `composition-traverser.ts`
- `oneof-visitor.ts` → `oneof-transformer.ts`
- `anyof-visitor.ts` → `anyof-transformer.ts`

#### Step 3: Operation系の移行

- `operation-visitor.ts` → `operation-transformer.ts`
- `parameter-visitor.ts` → `parameter-transformer.ts`
- `request-body-visitor.ts` → `request-body-transformer.ts`
- `response-visitor.ts` → `response-transformer.ts`

#### Step 4: その他の移行

- `servers-visitor.ts` → `servers-transformer.ts`（統一インターフェースに準拠）
- `paths-visitor.ts` → `paths-transformer.ts`

#### Step 5: 既存コードの削除

- `visitors/`ディレクトリの削除
- `v2/` → `transformers/`にリネーム

### Phase 3: テストとドキュメント（0.5日）

1. **ユニットテストの追加**
   - 各transformer、traverser、dispatcherに対してテストを追加
   - in-sourceテストを維持

2. **E2Eテストの確認**
   - 既存のE2Eテストが通ることを確認
   - 必要に応じて修正

3. **ドキュメント更新**
   - `CLAUDE.md`の更新
   - アーキテクチャ図の追加
   - このタスクファイルの完了マーク

## 期待される効果

### 1. コード品質の向上

- **単一責任原則の実現**: 各関数が1つの責務のみを持つ
- **可読性の向上**: 関数名から役割が明確
- **保守性の向上**: 影響範囲が明確

### 2. テスタビリティの向上

- **モックが容易**: Traverserをモック化してTransformerのテストが可能
- **独立したテスト**: 各層を独立してテスト可能
- **テスト速度の向上**: 必要な層のみをテスト

### 3. 拡張性の向上

- **新機能追加が容易**: 新しいTransformerを追加するだけ
- **再利用性の向上**: Traverserを異なる用途で再利用可能
- **カスタマイズ性**: Dispatcherのロジックを変更可能

### 4. パフォーマンスの向上可能性

- **最適化のポイントが明確**: Traverserのキャッシュ化等
- **並列処理の導入余地**: 独立した変換処理を並列化

## リスクと対策

### リスク1: 既存テストの破壊

**対策**:

- 段階的な移行（Phase 2のStepを細かく分割）
- 各Stepでテストを実行
- テストが通るまで次のStepに進まない

### リスク2: パフォーマンスの劣化

**対策**:

- ベンチマークの実施
- 必要に応じてキャッシュ化やメモ化を導入

### リスク3: 実装期間の超過

**対策**:

- Phase 1で早期にプロトタイプを作成
- 問題があれば設計を見直し
- 必要に応じて段階的リリース（v2とv1を並行稼働）

## 成功基準

- [ ] すべての既存テストが通る
- [ ] 新しいアーキテクチャで100%のカバレッジを維持
- [ ] E2E生成結果が既存と一致
- [ ] パフォーマンスが劣化していない（±5%以内）
- [ ] ドキュメントが更新されている

## 参考資料

- [Visitor Pattern - GoF Design Patterns](https://en.wikipedia.org/wiki/Visitor_pattern)
- [Strategy Pattern vs Visitor Pattern](https://refactoring.guru/design-patterns/visitor)
- [TypeScript AST Transformer](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#creating-and-printing-a-typescript-ast)

## 関連タスク

- Task 025: IRComponent Architecture Redesign（アーキテクチャ全体の見直し）
- Task 024: Barrel Files Reduction（エクスポート構造の整理）

---

**Created**: 2025-10-27
**Author**: AI Analysis
**Last Updated**: 2025-10-27
