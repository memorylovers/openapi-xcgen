# タスク013: allOf実装計画

## 概要

OpenAPIの`allOf`キーワードをサポートし、TypeSpecの`model extends`パターンに対応します。allOfをIR型として表現することで、OpenAPI構造を忠実に保持し、Generator側で柔軟な実装を可能にします。

## 背景

### 重要度評価

TypeSpec 1.0.0における生成頻度：

- **allOf**: 最高頻度 ⭐⭐⭐⭐⭐（`model extends`で必ず生成）
- **anyOf**: 高頻度 ⭐⭐⭐⭐（unionのデフォルト出力）
- **oneOf**: 中頻度 ⭐⭐⭐（`@oneOf`デコレータ、discriminated union）

### TypeSpecでの使用例

```typespec
// TypeSpec
model Animal {
  name: string;
}

model Dog extends Animal {
  breed: string;
}
```

↓ OpenAPI生成

```yaml
Dog:
  allOf:
    - $ref: '#/components/schemas/Animal'
    - type: object
      properties:
        breed:
          type: string
```

## IR型設計

### IRAllOfModel定義

```typescript
/**
 * IRAllOfModel - allOf合成モデル
 * OpenAPIのallOfキーワードを表現
 *
 * @example OpenAPI
 * ```yaml
 * Extended:
 *   allOf:
 *     - $ref: '#/components/schemas/Base'
 *     - type: object
 *       properties:
 *         email: string
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
  /** 合成する型の配列（IRRef | その他） */
  schemas: IRType[];
}
```

### IRModelへの追加

```typescript
export type IRModel =
  | IRObjectModel
  | IREnumModel
  | IRAllOfModel        // ← 追加
  | IRRequestBodyModel
  | IRResponseModel
  | IRParameterModel;
```

### Type Guard

```typescript
export function isIRAllOfModel(model: IRModel): model is IRAllOfModel {
  return model.kind === "allOf";
}
```

## 命名・パス戦略

### インラインスキーマの命名規則

**パターン**: `{親名}AllOf{インデックス}`（0始まり）

例：

- `ExtendedAllOf0`
- `ExtendedAllOf1`
- `PostUsersRequestBodyAllOf0`

### referencePathの生成

documentPathに `"allOf"` と `"{インデックス}"` を追加することで、`buildReferencePath`が自動的に正しいパスを生成します。

#### components の場合

```typescript
// allOfモデル
documentPath: ["components", "schemas", "Extended"]
→ referencePath: "#/components/schemas/Extended"
→ モデル名: "Extended"

// インラインスキーマ（インデックス1）
documentPath: ["components", "schemas", "Extended", "allOf", "1"]
→ referencePath: "#/components/schemas/Extended/allOf/1"
→ モデル名: "ExtendedAllOf1"
```

#### paths の場合

```typescript
// allOfモデル
documentPath: ["paths", "/users", "post", "requestBody", "PostUsersRequestBody"]
→ referencePath: "#/paths/::users/post/requestBody/PostUsersRequestBody"
→ モデル名: "PostUsersRequestBody"

// インラインスキーマ（インデックス0）
documentPath: ["paths", "/users", "post", "requestBody", "PostUsersRequestBody", "allOf", "0"]
→ referencePath: "#/paths/::users/post/requestBody/PostUsersRequestBody/allOf/0"
→ モデル名: "PostUsersRequestBodyAllOf0"
```

## 処理フロー

### 入力例

```yaml
components:
  schemas:
    Base:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
      required: [id]

    Extended:
      allOf:
        - $ref: '#/components/schemas/Base'
        - type: object
          properties:
            email:
              type: string
          required: [email]
```

### 出力IR

```typescript
// メインモデル
{
  kind: "allOf",
  name: "Extended",
  referencePath: "#/components/schemas/Extended",
  schemas: [
    { kind: "ref", name: "#/components/schemas/Base" },
    { kind: "ref", name: "#/components/schemas/ExtendedAllOf1" }
  ]
}

// インラインスキーマ（自動生成モデル）
{
  kind: "object",
  name: "ExtendedAllOf1",
  referencePath: "#/components/schemas/Extended/allOf/1",
  properties: [
    { name: "email", type: "string", required: true }
  ]
}
```

## 実装ステップ（TDD）

### Phase 1: IR型定義

**ファイル**: `packages/core/src/types/ir/models/base.ts`

1. `IRAllOfModel`インターフェース追加
2. `IRModel`型に追加
3. エクスポート更新

**ファイル**: `packages/core/src/types/guards.ts`

4. `isIRAllOfModel` Type Guard追加
5. テスト追加

### Phase 2: allOf visitor実装

**ファイル**: `packages/core/src/transformer/visitors/schema/allof-visitor.ts`

1. `visitAllOf`関数を作成

   ```typescript
   export function visitAllOf(
     schema: SchemaObjectWithNullable,
     context: VisitorContext
   ): AllOfVisitorResult
   ```

2. 処理ロジック:
   - allOf配列をループ（インデックス付き）
   - 各スキーマを`visitSchema`で処理
   - $refの場合: そのままschemas配列に追加
   - インラインobjectの場合:
     - 新しいcontextを作成（documentPath + ["allOf", インデックス]）
     - モデル名: `{親名}AllOf{インデックス}`
     - 自動モデル化してnestedModelsに追加
     - $refとしてschemas配列に追加
   - IRAllOfModelを返す

3. In-sourceテスト:
   - $ref + objectの合成
   - 複数$refの合成
   - 複数objectの合成
   - description処理
   - required処理

### Phase 3: schema-visitor統合

**ファイル**: `packages/core/src/transformer/visitors/schema/schema-visitor.ts`

1. allOf警告を削除（90-95行目）
2. `visitAllOf`呼び出しを追加:

   ```typescript
   if ("allOf" in schema && schema.allOf) {
     const allOfResult = visitAllOf(schema, context);
     // models追加
     // typeを返す
   }
   ```

3. 既存テスト更新:
   - "should warn for allOf"テストを"should handle allOf"に変更
   - 正しいIR生成を検証

### Phase 4: E2Eテスト

**ファイル**: `packages/core/tests/e2e/fixtures/general/allof.yaml`

1. テストフィクスチャ作成:
   - 単純な継承（$ref + object）
   - 複数$refの合成
   - ネストしたallOf
   - paths内でのallOf

**ファイル**: `packages/core/tests/e2e/fixtures/general/allof.expected.json`

2. expected JSONを作成

**ファイル**: `packages/core/tests/e2e/transformer/general.test.ts`

3. テストケース追加:

   ```typescript
   describe("Composition", () => {
     it("should handle allOf composition correctly", async () => {
       await compareWithExpected("general/allof");
     });
   });
   ```

### Phase 5: ドキュメント更新

**ファイル**: `_docs/_tasks/012_core-unsupported-features.md`

1. allOfセクションに完了マーク追加
2. 実装完了の説明追加

## Generator側での処理例

allOfを受け取ったGeneratorは、言語の特性に応じて実装します。

### TypeScript Generator

```typescript
// 継承スタイル
interface Base {
  id: string;
  name: string;
}

interface Extended extends Base {
  email: string;
}

// または交差型スタイル
type Extended = Base & {
  email: string;
};
```

### Dart Generator

```typescript
// Mixinスタイル
class Extended extends Base with ExtendedAllOf1 { }

// またはフラット化
class Extended {
  String id;
  String name;
  String email;
}
```

## allOfの意味（参考）

OpenAPI仕様におけるallOf:

- allOfは配列内の**すべてのスキーマに対して有効**である必要がある
- 各サブスキーマの検証ルールがマージされる
- プロパティ、required、バリデーションすべてが合成される
- 論理AND演算子のように動作

## 制限事項（初期実装）

以下は後のフェーズで対応：

1. **discriminator未対応**
   - oneOf/anyOf実装後にdiscriminatorを統合

2. **循環参照検出なし**
   - 必要に応じてPhase 2で追加

3. **プロパティ競合の警告なし**
   - 同名プロパティの型チェックは将来対応

## テストケース

### 1. 単純な継承

```yaml
Base:
  type: object
  properties:
    id: { type: string }

Extended:
  allOf:
    - $ref: '#/components/schemas/Base'
    - type: object
      properties:
        name: { type: string }
```

### 2. 複数$refの合成

```yaml
Extended:
  allOf:
    - $ref: '#/components/schemas/Base'
    - $ref: '#/components/schemas/Timestamps'
    - type: object
      properties:
        extra: { type: string }
```

### 3. paths内でのallOf

```yaml
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/UserBase'
                - type: object
                  properties:
                    password: { type: string }
```

## 参考資料

- [OpenAPI Specification - allOf](https://spec.openapis.org/oas/v3.0.3.html)
- [TypeSpec Documentation - Models](https://typespec.io/docs/language-basics/models/)
- [Swagger Docs - oneOf, anyOf, allOf](https://swagger.io/docs/specification/v3_0/data-models/oneof-anyof-allof-not/)
