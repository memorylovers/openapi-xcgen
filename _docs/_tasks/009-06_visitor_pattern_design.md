# Task 009-06: 関数ベースVisitorパターンによる実装設計

## 概要

OpenAPIドキュメントのトラバース処理を、関数ベースのVisitorパターンで新規設計する。
現在のパーサーコンビネータ方式とは独立した、代替アプローチとして設計。

## 設計原則

- **Tree-shaking対応**: クラスを使用せず、関数ベースで実装
- **純粋関数**: 副作用なし、同じ入力で同じ出力を保証
- **不変性**: データを変更せず、新しいデータを生成
- **型安全性**: TypeScriptの型システムを最大限活用
- **テスタビリティ**: 各Visitor関数を独立してテスト可能

## アーキテクチャ設計

### 1. 型定義

```typescript
// Visitor Context - トラバース中の状態を管理
interface VisitorContext {
  path: string[];          // 現在のパス（例: ["components", "schemas", "User"]）
  parent?: SchemaObject;   // 親スキーマ
  root: OpenAPIDocument;   // ルートドキュメント
  visited: Set<string>;    // 訪問済みの$refを記録（循環参照対策）
}

// Visitor Result - 訪問結果
type VisitorResult<T> = {
  value: T;
  continue: boolean;  // トラバースを続けるか
  children?: T[];     // 子要素の結果
};

// Schema Visitor - スキーマ訪問関数
type SchemaVisitor<T> = (
  schema: SchemaObject | ReferenceObject,
  context: VisitorContext
) => VisitorResult<T> | null;

// Document Visitor - ドキュメント全体の訪問関数
type DocumentVisitor<T> = {
  enterDocument?: (doc: OpenAPIDocument) => T;
  exitDocument?: (doc: OpenAPIDocument, results: T[]) => T;
  
  enterSchema?: SchemaVisitor<T>;
  exitSchema?: SchemaVisitor<T>;
  
  enterProperty?: (name: string, schema: SchemaObject, ctx: VisitorContext) => T;
  exitProperty?: (name: string, schema: SchemaObject, results: T[], ctx: VisitorContext) => T;
  
  visitReference?: (ref: string, ctx: VisitorContext) => T;
  visitPrimitive?: (type: string, format?: string, ctx: VisitorContext) => T;
  visitArray?: (items: SchemaObject, ctx: VisitorContext) => T;
};
```

### 2. トラバーサル関数

```typescript
// メイントラバース関数
function traverseDocument<T>(
  doc: OpenAPIDocument,
  visitor: DocumentVisitor<T>
): T[] {
  const results: T[] = [];
  const context: VisitorContext = {
    path: [],
    root: doc,
    visited: new Set()
  };
  
  // Document開始
  if (visitor.enterDocument) {
    results.push(visitor.enterDocument(doc));
  }
  
  // components.schemasをトラバース
  if (doc.components?.schemas) {
    const schemaResults = traverseSchemas(doc.components.schemas, visitor, context);
    results.push(...schemaResults);
  }
  
  // Document終了
  if (visitor.exitDocument) {
    results.push(visitor.exitDocument(doc, results));
  }
  
  return results;
}

// スキーマトラバース関数
function traverseSchema<T>(
  schema: SchemaObject | ReferenceObject,
  visitor: DocumentVisitor<T>,
  context: VisitorContext
): T | null {
  // $ref処理
  if (isReferenceObject(schema)) {
    if (visitor.visitReference) {
      return visitor.visitReference(schema.$ref, context);
    }
    return null;
  }
  
  // スキーマ開始
  let result: T | null = null;
  if (visitor.enterSchema) {
    const visitorResult = visitor.enterSchema(schema, context);
    if (visitorResult && !visitorResult.continue) {
      return visitorResult.value;
    }
    result = visitorResult?.value ?? null;
  }
  
  // 型別処理
  switch (schema.type) {
    case "object":
      if (schema.properties && visitor.enterProperty) {
        const propResults = traverseProperties(schema.properties, visitor, context);
        // 結果を集約
      }
      break;
      
    case "array":
      if (schema.items && visitor.visitArray) {
        result = visitor.visitArray(schema.items, context);
      }
      break;
      
    case "string":
    case "number":
    case "integer":
    case "boolean":
      if (visitor.visitPrimitive) {
        result = visitor.visitPrimitive(schema.type, schema.format, context);
      }
      break;
  }
  
  // スキーマ終了
  if (visitor.exitSchema) {
    const visitorResult = visitor.exitSchema(schema, context);
    result = visitorResult?.value ?? result;
  }
  
  return result;
}
```

### 3. Visitor関数の実装例

```typescript
// モデル抽出Visitor
const modelExtractorVisitor: DocumentVisitor<IRModel | null> = {
  enterSchema: (schema, context) => {
    // object型のスキーマをモデルとして抽出
    if (schema.type === "object" && context.path.length > 0) {
      const modelName = context.path[context.path.length - 1];
      return {
        value: {
          name: modelName,
          description: schema.description,
          properties: []
        },
        continue: true  // プロパティも処理
      };
    }
    return { value: null, continue: true };
  },
  
  enterProperty: (name, schema, context) => {
    // プロパティを抽出
    return {
      name,
      type: resolveType(schema),
      required: isRequired(name, context.parent),
      description: schema.description
    };
  },
  
  visitReference: (ref, context) => {
    // $ref参照を解決
    return {
      kind: "ref",
      name: extractRefName(ref)
    };
  },
  
  visitPrimitive: (type, format) => {
    // プリミティブ型を変換
    return {
      kind: "primitive",
      type: mapPrimitiveType(type),
      format
    };
  }
};
```

## 実装ディレクトリ構造

```
packages/core/src/visitor/
├── types.ts              # Visitor型定義
├── traverser.ts          # トラバース関数
├── context.ts            # Context管理
├── visitors/
│   ├── model-visitor.ts  # モデル抽出Visitor
│   ├── type-visitor.ts   # 型解決Visitor
│   ├── property-visitor.ts # プロパティ抽出Visitor
│   └── index.ts
├── combinators/          # Visitor組み合わせユーティリティ
│   ├── compose.ts        # Visitor合成
│   ├── filter.ts         # フィルタリング
│   └── map.ts           # 結果変換
└── index.ts
```

## 利点と特徴

### 利点

1. **デバッグの容易性**
   - トラバースの流れが明確
   - 各段階でのログ出力が簡単
   - スタックトレースが追いやすい

2. **拡張性**
   - 新しいVisitor関数を追加しやすい
   - 既存のVisitorを組み合わせて新機能を実現

3. **保守性**
   - 処理の流れが直感的
   - 各Visitorの責任が明確
   - テストが書きやすい

4. **パフォーマンス**
   - 不要なトラバースをスキップ可能（continueフラグ）
   - 訪問済み管理で循環参照を効率的に処理

### 現在の実装との比較

| 項目 | パーサーコンビネータ | Visitorパターン |
|------|---------------------|-----------------|
| Tree-shaking | ◎ 優秀 | ◎ 優秀（関数ベース） |
| デバッグ | △ 複雑 | ◎ 容易 |
| 学習曲線 | △ 急 | ○ 緩やか |
| 拡張性 | ○ 良好 | ◎ 優秀 |
| テスト | ◎ 優秀 | ◎ 優秀 |
| 型安全性 | ◎ 優秀 | ◎ 優秀 |

## 実装ステップ

### Phase 1: 基礎実装（1週間）

- [ ] 型定義の作成
- [ ] 基本的なトラバース関数
- [ ] Contextの管理機能
- [ ] ユニットテスト

### Phase 2: Visitor実装（1週間）

- [ ] モデル抽出Visitor
- [ ] 型解決Visitor
- [ ] プロパティ抽出Visitor
- [ ] 統合テスト

### Phase 3: 高度な機能（3日）

- [ ] Visitor組み合わせユーティリティ
- [ ] 循環参照対策
- [ ] エラーハンドリング
- [ ] パフォーマンステスト

### Phase 4: 最適化（3日）

- [ ] パフォーマンス最適化
- [ ] メモリ使用量の最適化
- [ ] ベンチマーク作成
- [ ] ドキュメント作成

## 実装ガイドライン

### 1. ファイル構造

- **1関数1ファイル原則**: 各Visitor関数は独立したファイルに実装
- **index.tsでエクスポート**: 各ディレクトリのindex.tsで公開APIを管理
- **明確な命名**: ファイル名は関数名と一致（kebab-case）

### 2. テスト配置

- **in-sourceテスト**: 単体テストは`if (import.meta.vitest)`ブロックで同じファイル内に記載
- **統合テスト**: `packages/core/tests/visitor/`配下に配置
- **カバレッジ目標**: 各関数100%のテストカバレッジ

### 3. ドキュメンテーション

```typescript
/**
 * スキーマを訪問して型情報を抽出
 * 
 * object型のスキーマからプロパティ情報を収集し、
 * ネストしたオブジェクトは別モデルとして抽出
 * 
 * @example OpenAPI YAML
 * ```yaml
 * User:
 *   type: object
 *   properties:
 *     id:
 *       type: integer
 *     address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 * ```
 * 
 * @example 出力
 * ```typescript
 * // Userモデル
 * { name: "User", properties: [...] }
 * // UserAddressモデル（ネストから抽出）
 * { name: "UserAddress", properties: [...] }
 * ```
 */
```

### 4. コメント規約

```typescript
// WHY: 訪問済みチェックで循環参照を防止
if (context.visited.has(schemaId)) return null;

// WHAT: プロパティごとに型を解決
for (const [name, prop] of Object.entries(schema.properties)) {
  // ネストしたオブジェクトは別モデルとして処理する必要があるため
  if (prop.type === "object" && prop.properties) {
    // ...
  }
}
```

### 5. in-sourceテストの例

```typescript
// packages/core/src/visitor/visitors/model-visitor.ts

export function createModelVisitor(): DocumentVisitor<IRModel | null> {
  return {
    enterSchema: (schema, context) => {
      // object型のスキーマのみモデルとして抽出
      if (schema.type !== "object" || context.path.length === 0) {
        return { value: null, continue: true };
      }
      
      const modelName = context.path[context.path.length - 1];
      return {
        value: {
          name: modelName,
          description: schema.description,
          properties: []
        },
        continue: true
      };
    }
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("createModelVisitor", () => {
    it("should extract object schema as model", () => {
      const visitor = createModelVisitor();
      const schema = { 
        type: "object", 
        description: "Test model" 
      } as SchemaObject;
      const context = {
        path: ["components", "schemas", "User"],
        root: {} as OpenAPIDocument,
        visited: new Set()
      };
      
      const result = visitor.enterSchema?.(schema, context);
      
      expect(result?.value).toEqual({
        name: "User",
        description: "Test model",
        properties: []
      });
      expect(result?.continue).toBe(true);
    });

    it("should return null for non-object types", () => {
      const visitor = createModelVisitor();
      const schema = { type: "string" } as SchemaObject;
      const context = {
        path: ["components", "schemas", "StringType"],
        root: {} as OpenAPIDocument,
        visited: new Set()
      };
      
      const result = visitor.enterSchema?.(schema, context);
      
      expect(result?.value).toBeNull();
      expect(result?.continue).toBe(true);
    });
  });
}
```

## 実装時の注意点

1. **循環参照の処理**
   - visitedセットで訪問済みを管理
   - 深さ制限の実装も検討

2. **エラーハンドリング**
   - 各Visitorでのエラーを適切に伝播
   - 部分的な失敗を許容する設計

3. **メモリ効率**
   - 大規模なOpenAPIドキュメントでも効率的に動作
   - 不要な中間オブジェクトの生成を避ける

4. **型安全性**
   - TypeScriptの型推論を最大限活用
   - 型ガードを適切に使用

## テスト戦略

1. **単体テスト**
   - 各Visitor関数を独立してテスト
   - トラバース関数のエッジケース

2. **統合テスト**
   - 実際のOpenAPIドキュメントでテスト
   - 複雑なネスト構造の処理

3. **パフォーマンステスト**
   - 大規模ドキュメントでの処理時間
   - メモリ使用量の測定

4. **比較テスト**
   - 現在の実装と同じ結果を生成することを確認

## まとめ

関数ベースのVisitorパターンは、現在のパーサーコンビネータ方式の利点（Tree-shaking、純粋関数）を維持しながら、デバッグの容易性と拡張性を向上させる設計です。実装の複雑さを軽減し、保守性を高めることが期待できます。
