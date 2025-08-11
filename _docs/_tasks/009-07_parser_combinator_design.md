# Task 009-07: パーサーコンビネータ方式による実装設計

## 概要

OpenAPIドキュメントの処理を、パーサーコンビネータパターンを用いて実装する設計。
小さな純粋関数を組み合わせて、複雑な変換処理を構築する関数型プログラミングアプローチ。

## 設計思想

### 核心原則

1. **関数の合成** - 小さな関数を組み合わせて複雑な処理を構築
2. **純粋性** - 副作用なし、参照透過性を保証
3. **不変性** - データを変更せず、新しいデータを生成
4. **遅延評価** - 必要になるまで計算を遅延
5. **型駆動開発** - TypeScriptの型システムを最大限活用

### 設計メリット

- **Tree-shaking最適化** - 未使用の関数は自動的に除外
- **テスタビリティ** - 各関数を独立してテスト可能
- **予測可能性** - 同じ入力で常に同じ出力
- **再利用性** - 汎用的なコンビネータを様々な場面で再利用

## アーキテクチャ設計

### 1. 基本型定義

```typescript
// 変換結果を表す型
type TransformResult<T> = {
  value: T;              // 変換された値
  models: IRModel[];     // 抽出されたモデル（副産物）
};

// リゾルバー関数の型
type Resolver<I, O> = (input: I, context: Context) => TransformResult<O> | null;

// 特化したリゾルバー型
type TypeResolver = Resolver<SchemaObject, IRType>;
type PropertyResolver = Resolver<SchemaObject, IRProperty[]>;
type ModelResolver = Resolver<SchemaObject, IRModel>;

// コンテキスト情報
interface ResolverContext {
  parentName: string;     // 親の名前
  propertyName: string;   // 現在のプロパティ名
  depth: number;         // ネストの深さ
  options?: {
    includeDescription?: boolean;
    maxDepth?: number;
  };
}
```

### 2. 基本コンビネータ

```typescript
// === 結果生成コンビネータ ===

// 成功結果を生成
function success<T>(value: T, models: IRModel[] = []): TransformResult<T> {
  return { value, models };
}

// 空の結果を生成
function empty<T>(defaultValue: T): TransformResult<T> {
  return { value: defaultValue, models: [] };
}

// === 変換コンビネータ ===

// 値を変換（モデルは保持）
function map<T, U>(
  result: TransformResult<T>,
  fn: (value: T) => U
): TransformResult<U> {
  return {
    value: fn(result.value),
    models: result.models
  };
}

// ネストした結果を平坦化
function flatMap<T, U>(
  result: TransformResult<T>,
  fn: (value: T) => TransformResult<U>
): TransformResult<U> {
  const newResult = fn(result.value);
  return {
    value: newResult.value,
    models: [...result.models, ...newResult.models]
  };
}

// === 選択コンビネータ ===

// 最初に成功したリゾルバーの結果を返す
function firstOf<I, O>(resolvers: Resolver<I, O>[]): Resolver<I, O> {
  return (input, context) => {
    for (const resolver of resolvers) {
      const result = resolver(input, context);
      if (result !== null) return result;
    }
    return null;
  };
}

// 条件付きでリゾルバーを適用
function when<I, O>(
  predicate: (input: I) => boolean,
  resolver: Resolver<I, O>
): Resolver<I, O> {
  return (input, context) => {
    if (!predicate(input)) return null;
    return resolver(input, context);
  };
}

// === 合成コンビネータ ===

// 2つの処理を合成
function compose<I, M, O>(
  first: Resolver<I, M>,
  second: (result: TransformResult<M>) => TransformResult<O> | null
): Resolver<I, O> {
  return (input, context) => {
    const firstResult = first(input, context);
    if (firstResult === null) return null;
    return second(firstResult);
  };
}

// デフォルト値付きリゾルバー
function withDefault<I, O>(
  resolver: Resolver<I, O>,
  defaultValue: O
): Resolver<I, O> {
  return (input, context) => {
    const result = resolver(input, context);
    return result ?? success(defaultValue);
  };
}

// === 集約コンビネータ ===

// 複数の結果をマージ
function merge<T>(results: TransformResult<T>[]): TransformResult<T[]> {
  const values: T[] = [];
  const models: IRModel[] = [];
  
  for (const result of results) {
    values.push(result.value);
    models.push(...result.models);
  }
  
  return { value: values, models };
}
```

### 3. リゾルバー実装

```typescript
// === プリミティブ型リゾルバー ===
const primitiveResolver: TypeResolver = (schema, context) => {
  const primitiveTypes = ["string", "number", "integer", "boolean"];
  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  
  if (!schemaType || !primitiveTypes.includes(schemaType)) return null;
  
  return success({
    kind: "primitive",
    type: mapPrimitiveType(schemaType),
    format: schema.format
  });
};

// === 参照型リゾルバー ===
const refResolver: TypeResolver = (schema) => {
  if (!("$ref" in schema) || typeof schema.$ref !== "string") return null;
  
  return success({
    kind: "ref",
    name: extractRefName(schema.$ref)
  });
};

// === 配列型リゾルバー（高階関数） ===
const createArrayResolver = (itemResolver: TypeResolver): TypeResolver => {
  return (schema, context) => {
    if (schema.type !== "array" || !schema.items) return null;
    
    const itemContext = {
      ...context,
      propertyName: `${context.propertyName}Item`,
      depth: context.depth + 1
    };
    
    const itemResult = itemResolver(schema.items, itemContext);
    if (!itemResult) return null;
    
    return {
      value: {
        kind: "array",
        itemType: itemResult.value
      },
      models: itemResult.models
    };
  };
};

// === Map型リゾルバー ===
const mapResolver: TypeResolver = (schema) => {
  // additionalPropertiesまたはpropertiesなしのobject型
  if (schema.type !== "object" || schema.properties) return null;
  
  return success({
    kind: "map",
    valueType: { kind: "any" } // TODO: additionalPropertiesの型を解析
  });
};

// === オブジェクト型リゾルバー（高階関数） ===
const createObjectResolver = (
  propertyResolver: PropertyResolver
): ModelResolver => {
  return (schema, context) => {
    if (schema.type !== "object" || !schema.properties) return null;
    
    const modelName = `${context.parentName}${capitalize(context.propertyName)}`;
    const propsResult = propertyResolver(schema, { ...context, parentName: modelName });
    
    if (!propsResult) return null;
    
    const model: IRModel = {
      name: modelName,
      description: schema.description,
      properties: propsResult.value
    };
    
    return {
      value: model,
      models: [model, ...propsResult.models]
    };
  };
};
```

### 4. 相互再帰の解決

```typescript
// 相互再帰を含む型リゾルバーの構築
function createTypeResolver(): TypeResolver {
  // 遅延初期化のためのプレースホルダー
  let propertyExtractor: PropertyResolver;
  
  // 型リゾルバーの定義（自己参照を含む）
  const typeResolver: TypeResolver = firstOf([
    refResolver,
    primitiveResolver,
    createArrayResolver((...args) => typeResolver(...args)), // 自己参照
    when(
      schema => schema.type === "object" && !!schema.properties,
      (schema, context) => {
        // ネストしたオブジェクトを別モデルとして抽出
        const objectResolver = createObjectResolver(propertyExtractor);
        const result = objectResolver(schema, context);
        
        if (!result) return null;
        
        // モデルへの参照を返す
        return {
          value: { kind: "ref", name: result.value.name },
          models: result.models
        };
      }
    ),
    mapResolver,
    withDefault(
      () => null,
      { kind: "any" } // フォールバック
    )
  ]);
  
  // プロパティ抽出器の定義（型リゾルバーを参照）
  propertyExtractor = createPropertyExtractor(typeResolver);
  
  return typeResolver;
}

// プロパティ抽出器の作成
function createPropertyExtractor(typeResolver: TypeResolver): PropertyResolver {
  return (schema, context) => {
    if (!schema.properties) return empty([]);
    
    const required = new Set(schema.required || []);
    const results: TransformResult<IRProperty>[] = [];
    
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      const propContext = {
        ...context,
        propertyName: name
      };
      
      const typeResult = typeResolver(propSchema as SchemaObject, propContext);
      const type = typeResult?.value ?? { kind: "any" };
      
      const property: IRProperty = {
        name,
        type,
        required: required.has(name),
        description: (propSchema as SchemaObject).description
      };
      
      results.push({
        value: property,
        models: typeResult?.models ?? []
      });
    }
    
    return merge(results);
  };
}
```

## 実装ディレクトリ構造

```
packages/core/src/transformer/
├── types.ts                      # 型定義
├── extractors/
│   ├── combinators/
│   │   ├── types.ts             # コンビネータ型定義
│   │   ├── combinators/         # 基本コンビネータ
│   │   │   ├── success.ts      # 結果生成
│   │   │   ├── empty.ts        # 空の結果
│   │   │   ├── map.ts          # 変換
│   │   │   ├── flat-map.ts     # 平坦化
│   │   │   ├── first-of.ts     # 選択
│   │   │   ├── when.ts         # 条件付き
│   │   │   ├── compose.ts      # 合成
│   │   │   ├── with-default.ts # デフォルト値
│   │   │   ├── merge.ts        # 集約
│   │   │   └── index.ts
│   │   └── resolvers/           # 型リゾルバー
│   │       ├── primitive.ts    # プリミティブ型
│   │       ├── ref.ts          # 参照型
│   │       ├── array.ts        # 配列型
│   │       ├── map.ts          # Map型
│   │       ├── object.ts       # オブジェクト型
│   │       └── index.ts
│   └── model/
│       ├── type-resolver.ts    # 型リゾルバー統合
│       ├── property-extractor.ts # プロパティ抽出
│       ├── nested-object.ts    # ネストオブジェクト処理
│       └── index.ts            # モデル抽出エントリーポイント
└── transformer.ts               # メイン変換関数
```

## 利点と課題

### 利点

1. **関数型プログラミングの利点**
   - 純粋関数による予測可能な動作
   - 副作用の排除による安全性
   - 関数の合成による柔軟な処理構築

2. **最適化**
   - Tree-shaking による未使用コードの削除
   - 遅延評価による効率的な処理
   - メモ化による重複計算の回避

3. **テスタビリティ**
   - 各関数を独立してテスト可能
   - モックなしでテスト可能
   - プロパティベーステスト適用可能

4. **型安全性**
   - TypeScriptの型推論を最大限活用
   - コンパイル時のエラー検出
   - 型駆動開発の実現

### 課題

1. **学習曲線**
   - 関数型プログラミングの知識が必要
   - 高階関数の理解が必要
   - コンビネータパターンの習得

2. **デバッグの複雑さ**
   - 関数の組み合わせを追跡しにくい
   - スタックトレースが深くなる
   - 中間状態の確認が困難

3. **相互再帰の複雑さ**
   - 遅延初期化パターンの理解
   - 循環参照の回避テクニック
   - 初期化順序の管理

## Visitorパターンとの比較

| 観点 | パーサーコンビネータ | Visitorパターン |
|------|---------------------|-----------------|
| **設計思想** | 関数の合成 | ツリートラバース |
| **Tree-shaking** | ◎ 優秀 | ◎ 優秀（関数ベース） |
| **純粋性** | ◎ 完全に純粋 | ○ 純粋にできる |
| **デバッグ** | △ 複雑 | ◎ 直感的 |
| **学習曲線** | △ 急（FP知識必要） | ○ 緩やか |
| **拡張性** | ○ コンビネータ追加 | ◎ Visitor追加 |
| **テスト** | ◎ 単純なテスト | ○ 状態を考慮 |
| **型安全性** | ◎ 型推論活用 | ◎ 明示的な型 |
| **パフォーマンス** | ○ 関数呼び出しコスト | ◎ 直接的な処理 |
| **メモリ効率** | △ 中間オブジェクト生成 | ○ 状態を保持 |

## 実装ステップ

### Phase 1: 基礎実装（5日）

- [ ] 型定義の作成
  - [ ] TransformResult型
  - [ ] Resolver型階層
  - [ ] Context型
- [ ] 基本コンビネータの実装
  - [ ] success, empty
  - [ ] map, flatMap
  - [ ] merge
- [ ] コンビネータのテスト
- [ ] in-source testingの設定

### Phase 2: 選択・条件コンビネータ（3日）

- [ ] firstOfコンビネータ
- [ ] whenコンビネータ
- [ ] composeコンビネータ
- [ ] withDefaultコンビネータ
- [ ] 各コンビネータのテスト

### Phase 3: リゾルバー実装（1週間）

- [ ] primitiveResolver
- [ ] refResolver
- [ ] createArrayResolver（高階関数）
- [ ] mapResolver
- [ ] createObjectResolver（高階関数）
- [ ] 各リゾルバーのテスト

### Phase 4: 相互再帰の解決（3日）

- [ ] createTypeResolver実装
- [ ] createPropertyExtractor実装
- [ ] 循環参照のテスト
- [ ] 深いネストのテスト

### Phase 5: 統合とモデル抽出（3日）

- [ ] extractModels関数の実装
- [ ] ネストしたモデルの抽出
- [ ] 重複モデルの除去
- [ ] 実際のOpenAPIドキュメントでのテスト

### Phase 6: 最適化（2日）

- [ ] パフォーマンス測定
- [ ] メモ化の実装
- [ ] 不要な中間オブジェクトの削減
- [ ] ベンチマーク作成

## テスト戦略

### 1. 単体テスト

```typescript
// 各コンビネータの単体テスト
describe("map combinator", () => {
  it("should transform value while keeping models", () => {
    const result = { value: 10, models: [] };
    const mapped = map(result, n => n * 2);
    expect(mapped.value).toBe(20);
    expect(mapped.models).toEqual([]);
  });
});
```

### 2. プロパティベーステスト

```typescript
// 法則のテスト
describe("combinator laws", () => {
  it("map identity law", () => {
    // map(x, id) === x
    const result = { value: "test", models: [] };
    expect(map(result, x => x)).toEqual(result);
  });
  
  it("map composition law", () => {
    // map(map(x, f), g) === map(x, compose(f, g))
    const result = { value: 5, models: [] };
    const f = (n: number) => n * 2;
    const g = (n: number) => n + 1;
    
    expect(map(map(result, f), g)).toEqual(
      map(result, n => g(f(n)))
    );
  });
});
```

### 3. 統合テスト

```typescript
// 実際のOpenAPIドキュメントでのテスト
describe("extractModels integration", () => {
  it("should extract nested models", () => {
    const doc = loadOpenAPIDocument("petstore.yaml");
    const models = extractModels(doc);
    
    expect(models).toContainEqual(
      expect.objectContaining({ name: "Pet" })
    );
    expect(models).toContainEqual(
      expect.objectContaining({ name: "PetCategory" })
    );
  });
});
```

### 4. パフォーマンステスト

```typescript
// 大規模ドキュメントでのパフォーマンス
describe("performance", () => {
  it("should handle large documents efficiently", () => {
    const largeDoc = generateLargeOpenAPIDoc(1000); // 1000モデル
    
    const start = performance.now();
    const models = extractModels(largeDoc);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000); // 1秒以内
    expect(models).toHaveLength(1000);
  });
});
```

## 実装ガイドライン

### 1. ファイル構造

- **1関数1ファイル原則**: 各コンビネータ・リゾルバーは独立したファイルに実装
- **index.tsでエクスポート**: 各ディレクトリのindex.tsで公開APIを管理
- **明確な命名**: ファイル名は関数名と一致（kebab-case）
  - `success.ts` → `export function success()`
  - `first-of.ts` → `export function firstOf()`
  - `create-array-resolver.ts` → `export function createArrayResolver()`

### 2. テスト配置

- **in-sourceテスト**: 単体テストは`if (import.meta.vitest)`ブロックで同じファイル内に記載
- **統合テスト**: `packages/core/tests/transformer/`配下に配置
- **カバレッジ目標**: 各関数100%のテストカバレッジ

### 3. ドキュメンテーション

```typescript
/**
 * 配列型を解決するリゾルバーを作成
 * 
 * 高階関数として、要素の型を解決するリゾルバーを受け取り、
 * 配列全体の型を解決するリゾルバーを返す
 * 
 * @param itemResolver - 配列要素の型を解決するリゾルバー
 * @returns 配列型リゾルバー
 * 
 * @example OpenAPI YAML
 * ```yaml
 * # プリミティブ配列
 * tags:
 *   type: array
 *   items:
 *     type: string
 * 
 * # ネストした配列
 * matrix:
 *   type: array
 *   items:
 *     type: array
 *     items:
 *       type: number
 * ```
 * 
 * @example 出力
 * ```typescript
 * // tags の場合
 * { kind: "array", itemType: { kind: "primitive", type: "string" } }
 * 
 * // matrix の場合（ネスト）
 * { 
 *   kind: "array", 
 *   itemType: { 
 *     kind: "array", 
 *     itemType: { kind: "primitive", type: "number" } 
 *   } 
 * }
 * ```
 */
```

### 4. コメント規約

```typescript
// WHY: 自己参照により再帰的な型解決を実現
const typeResolver: TypeResolver = firstOf([
  refResolver,
  primitiveResolver,
  // 配列の要素も同じtypeResolverで解決（再帰）
  createArrayResolver((...args) => typeResolver(...args)),
  mapResolver
]);

// WHAT: 遅延初期化でプロパティ抽出器を設定
// 相互参照を解決するために後から初期化
propertyExtractor = createPropertyExtractor(typeResolver);
```

### 5. in-sourceテストの例

```typescript
// packages/core/src/transformer/extractors/combinators/combinators/map.ts

export function map<T, U>(
  result: TransformResult<T>,
  fn: (value: T) => U
): TransformResult<U> {
  return {
    value: fn(result.value),
    models: result.models
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("map combinator", () => {
    it("should transform value while keeping models", () => {
      const result = { value: 10, models: [] };
      const mapped = map(result, n => n * 2);
      
      expect(mapped.value).toBe(20);
      expect(mapped.models).toEqual([]);
    });

    it("should preserve model references", () => {
      const models = [{ name: "Test", properties: [] }];
      const result = { value: "test", models };
      const mapped = map(result, s => s.toUpperCase());
      
      expect(mapped.value).toBe("TEST");
      expect(mapped.models).toBe(models); // 同じ参照
    });
  });
}
```

## 実装時の注意点

### 1. 型推論の活用

```typescript
// 明示的な型注釈を避け、型推論を活用
const result = success(10); // TransformResult<number>と推論
const mapped = map(result, n => n.toString()); // TransformResult<string>と推論
```

### 2. エラーハンドリング

```typescript
// nullを使った失敗の表現
const resolver: TypeResolver = (schema, context) => {
  if (!isValidSchema(schema)) return null; // 失敗
  return success(transformSchema(schema)); // 成功
};
```

### 3. パフォーマンス最適化

```typescript
// 不要な中間オブジェクトを避ける
// Bad
const results = items.map(item => process(item));
const merged = merge(results);

// Good
const results = [];
const models = [];
for (const item of items) {
  const result = process(item);
  results.push(result.value);
  models.push(...result.models);
}
return { value: results, models };
```

### 4. 循環参照の検出

```typescript
// Contextに訪問済みセットを追加
interface ResolverContext {
  visited?: Set<string>;
  // ...
}

// リゾルバーで循環をチェック
if (context.visited?.has(schemaId)) {
  return success({ kind: "ref", name: schemaId });
}
```

## まとめ

パーサーコンビネータ方式は、関数型プログラミングの原則に基づいた強力な設計パターンです。小さな純粋関数を組み合わせることで、複雑なOpenAPIドキュメントの変換処理を構築できます。

**強み:**

- Tree-shaking最適化
- 純粋関数による予測可能性
- 高い再利用性とテスタビリティ

**課題:**

- 学習曲線の急さ
- デバッグの複雑さ
- 相互再帰の管理

Visitorパターンと比較して、より関数型プログラミングの利点を活かした設計ですが、チームのスキルセットと要件に応じて選択することが重要です。
