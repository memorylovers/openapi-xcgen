# タスク014: anyOf実装計画

## 概要

OpenAPIの`anyOf`キーワードをサポートし、TypeSpec 1.0の`union`型（デフォルト出力）に対応します。anyOfをIR型として表現することで、OpenAPI構造を忠実に保持し、Generator側で柔軟な実装を可能にします。

## 背景

### 重要度評価

TypeSpec 1.0.0における生成頻度：

- **allOf**: 最高頻度 ⭐⭐⭐⭐⭐（`model extends`で必ず生成）- ✅ 完了
- **anyOf**: 高頻度 ⭐⭐⭐⭐（unionのデフォルト出力）- 🚀 Phase 3実装対象
- **oneOf**: 中頻度 ⭐⭐⭐（`@oneOf`デコレータ、discriminated union）

### TypeSpecでの使用例

```typespec
// TypeSpec
union Fruit {
  apple: Apple,
  banana: Banana,
}
```

↓ OpenAPI生成（anyOf）

```yaml
Fruit:
  anyOf:
    - $ref: '#/components/schemas/Apple'
    - $ref: '#/components/schemas/Banana'
```

### anyOfとallOfの違い

| 項目 | allOf | anyOf |
|------|-------|-------|
| 意味 | すべてのスキーマに対して有効（AND） | 1つ以上のスキーマに対して有効（OR） |
| TypeScript出力 | 交差型 (A & B) | Union型 (A \| B) |
| 用途 | 継承・拡張 | 複数の型の選択 |
| TypeSpec | `model extends` | `union` |

## IR型設計

### IRAnyOfModel定義

```typescript
/**
 * IRAnyOfModel - anyOf合成モデル
 * OpenAPIのanyOfキーワードを表現
 *
 * @example OpenAPI
 * ```yaml
 * Fruit:
 *   anyOf:
 *     - $ref: '#/components/schemas/Apple'
 *     - $ref: '#/components/schemas/Banana'
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
  /** 合成する型の配列（IRRef | その他） */
  schemas: IRType[];
}
```

### IRModelへの追加

```typescript
export type IRModel =
  | IRObjectModel
  | IREnumModel
  | IRAllOfModel
  | IRAnyOfModel        // ← 追加
  | IRArrayModel
  | IRMapModel
  | IRRequestBodyModel
  | IRResponseModel
  | IRParameterModel;
```

### Type Guard（必要に応じて）

```typescript
export function isIRAnyOfModel(model: IRModel): model is IRAnyOfModel {
  return model.kind === "anyOf";
}
```

## 命名・パス戦略

### インラインスキーマの命名規則

**パターン**: `{親名}AnyOf{インデックス}`（0始まり）

例：

- `FruitAnyOf0`
- `FruitAnyOf1`
- `PostUsersRequestBodyAnyOf0`

### referencePathの生成

documentPathに `"anyOf"` と `"{インデックス}"` を追加することで、`buildReferencePath`が自動的に正しいパスを生成します。

#### components の場合

```typescript
// anyOfモデル
documentPath: ["components", "schemas", "Fruit"]
→ referencePath: "#/components/schemas/Fruit"
→ モデル名: "Fruit"

// インラインスキーマ（インデックス0）
documentPath: ["components", "schemas", "Fruit", "anyOf", "0"]
→ referencePath: "#/components/schemas/Fruit/anyOf/0"
→ モデル名: "FruitAnyOf0"
```

#### paths の場合

```typescript
// anyOfモデル
documentPath: ["paths", "/users", "post", "requestBody", "PostUsersRequestBody"]
→ referencePath: "#/paths/::users/post/requestBody/PostUsersRequestBody"
→ モデル名: "PostUsersRequestBody"

// インラインスキーマ（インデックス1）
documentPath: ["paths", "/users", "post", "requestBody", "PostUsersRequestBody", "anyOf", "1"]
→ referencePath: "#/paths/::users/post/requestBody/PostUsersRequestBody/anyOf/1"
→ モデル名: "PostUsersRequestBodyAnyOf1"
```

## 処理フロー

### 入力例1: 基本的なUnion型

```yaml
components:
  schemas:
    Fruit:
      anyOf:
        - $ref: '#/components/schemas/Apple'
        - $ref: '#/components/schemas/Banana'
```

### 出力IR1

```typescript
{
  kind: "anyOf",
  name: "Fruit",
  referencePath: "#/components/schemas/Fruit",
  schemas: [
    { kind: "ref", name: "#/components/schemas/Apple" },
    { kind: "ref", name: "#/components/schemas/Banana" }
  ]
}
```

### 入力例2: プロパティ + anyOf（TypeSpec union特有）

```yaml
components:
  schemas:
    fruit:
      type: object
      properties:
        color:
          type: string
      anyOf:
        - $ref: '#/components/schemas/apple'
        - $ref: '#/components/schemas/banana'
```

### 出力IR2

```typescript
// anyOfモデル
{
  kind: "anyOf",
  name: "fruit",
  referencePath: "#/components/schemas/fruit",
  schemas: [
    { kind: "ref", name: "#/components/schemas/apple" },
    { kind: "ref", name: "#/components/schemas/banana" }
  ]
}

// 注: propertiesの処理は要検討
// OpenAPI 3.0では、type: object + anyOfの組み合わせは
// "objectかつ(appleまたはbanana)"を意味する
```

### 入力例3: インラインスキーマとの混在

```yaml
components:
  schemas:
    Response:
      anyOf:
        - $ref: '#/components/schemas/Success'
        - type: object
          properties:
            error:
              type: string
```

### 出力IR3

```typescript
// メインモデル
{
  kind: "anyOf",
  name: "Response",
  referencePath: "#/components/schemas/Response",
  schemas: [
    { kind: "ref", name: "#/components/schemas/Success" },
    { kind: "ref", name: "#/components/schemas/Response/anyOf/1" }
  ]
}

// インラインスキーマ（自動生成モデル）
{
  kind: "object",
  name: "ResponseAnyOf1",
  referencePath: "#/components/schemas/Response/anyOf/1",
  properties: [
    { name: "error", type: "string", required: false }
  ]
}
```

## 実装ステップ（TDD）

### Phase 1: IR型定義

**ファイル**: `packages/core/src/types/ir/models/base.ts`

1. `IRAnyOfModel`インターフェース追加（`IRAllOfModel`の直後）
2. `IRModel`型に追加（`packages/core/src/types/ir/models/operation.ts`）
3. エクスポート更新

**ファイル**: `packages/core/src/types/guards.ts`

4. `isIRAnyOfModel` Type Guard追加（必要に応じて）
5. テスト追加（in-source testing）

### Phase 2: anyof-visitor実装

**ファイル**: `packages/core/src/transformer/visitors/schema/anyof-visitor.ts`（新規作成）

1. `visitAnyOf`関数を作成（`allof-visitor.ts`を参考）

   ```typescript
   export function visitAnyOf(
     schema: SchemaObjectWithNullable,
     context: VisitorContext
   ): SchemaVisitorResult
   ```

2. 処理ロジック:
   - anyOf配列をループ（インデックス付き）
   - 各スキーマを`visitSchema`で処理
   - $refの場合: そのままschemas配列に追加
   - インラインobjectの場合:
     - 新しいcontextを作成（documentPath + ["anyOf", インデックス]）
     - モデル名: `{親名}AnyOf{インデックス}`（`getModelName`が自動生成）
     - 自動モデル化してnestedModelsに追加
     - $refとしてschemas配列に追加
   - `IRAnyOfModel`を返す

3. In-sourceテスト:
   - $ref + $refの合成
   - $ref + objectの合成
   - 複数objectの合成
   - description処理

### Phase 3: schema-visitor統合

**ファイル**: `packages/core/src/transformer/visitors/schema/schema-visitor.ts`

1. anyOf警告を削除（31-35行目）
2. `visitAnyOf`呼び出しを追加:

   ```typescript
   if ("anyOf" in schema && schema.anyOf) {
     const anyOfResult = visitAnyOf(schema, context);
     result.models.push(...anyOfResult.models);
     result.type = anyOfResult.type;
     return result;
   }
   ```

3. インポート追加:

   ```typescript
   import { visitAnyOf } from "./anyof-visitor.js";
   ```

### Phase 4: E2Eテスト更新

**既存テストファイル**:

- `packages/core/tests/e2e/fixtures/general/swagger-parser/anyof.yaml`
- `packages/core/tests/e2e/fixtures/general/swagger-parser/anyof.expected.json`
- `packages/core/tests/e2e/fixtures/general/openapi-generator/anyof.yaml`
- `packages/core/tests/e2e/fixtures/general/openapi-generator/anyof.expected.json`

1. 期待値ファイルを更新:
   - `fruit`スキーマに対して`IRAnyOfModel`が生成されることを期待
   - 既存のapple/bananaモデルはそのまま

2. テスト実行:

   ```bash
   pnpm test -- anyof
   ```

**新規テストケース（必要に応じて）**:

**ファイル**: `packages/core/tests/e2e/fixtures/general/anyof.yaml`（新規作成の可能性）

```yaml
openapi: 3.0.3
info:
  title: anyOf Test
  version: 1.0.0
components:
  schemas:
    # ケース1: 単純な2つの$ref
    Fruit:
      anyOf:
        - $ref: '#/components/schemas/Apple'
        - $ref: '#/components/schemas/Banana'

    # ケース2: $ref + インラインスキーマ
    Response:
      anyOf:
        - $ref: '#/components/schemas/Success'
        - type: object
          properties:
            error: { type: string }

    # ケース3: 複数インラインスキーマ
    Data:
      anyOf:
        - type: object
          properties:
            text: { type: string }
        - type: object
          properties:
            number: { type: number }
```

### Phase 5: ドキュメント更新

**ファイル**: `_docs/_tasks/012_core-unsupported-features.md`

1. anyOfセクション（141-165行目）を更新:

```markdown
### ✅ Phase 3完了: Union型サポート

5. ✅ **anyOf** - 包含的Union（TypeSpec 1.0で高頻度 ⭐⭐⭐⭐）

**実装状況**: 完了

**実装内容**:

- IR型定義に`IRAnyOfModel`を追加
- `anyof-visitor.ts`で処理
- インラインスキーマの自動モデル化（`{親名}AnyOf{インデックス}`形式）
- E2Eテスト: `anyof.yaml`で検証

**影響範囲**:

- Union型の表現
- 型システムでの複数型の選択
- Generator側でUnion型として実装可能

**使用例**:

\`\`\`yaml
# TypeSpec: union Fruit { apple: Apple, banana: Banana }
Fruit:
  anyOf:
    - $ref: '#/components/schemas/Apple'
    - $ref: '#/components/schemas/Banana'
\`\`\`
```

2. 実装状況サマリーを更新
3. 次のフェーズ（oneOf実装）へ移行

## Generator側での処理例

anyOfを受け取ったGeneratorは、言語の特性に応じて実装します。

### TypeScript Generator

```typescript
// Union型スタイル
type Fruit = Apple | Banana;

// または判別Union
type Response =
  | { kind: 'success', data: Success }
  | { kind: 'error', error: string };
```

### Dart Generator

```dart
// Sealed classスタイル
sealed class Fruit {}
class Apple extends Fruit { /* ... */ }
class Banana extends Fruit { /* ... */ }

// または
abstract class Fruit {
  T when<T>({
    required T Function(Apple) apple,
    required T Function(Banana) banana,
  });
}
```

## anyOfの意味（参考）

OpenAPI仕様におけるanyOf:

- anyOfは配列内の**1つ以上のスキーマに対して有効**である必要がある
- 複数のスキーマに同時にマッチしても良い（包含的OR）
- 論理OR演算子のように動作
- OpenAPI 3.1ではnullable型の表現にも使用される

## allOfとanyOfの実装パターン比較

| 項目 | allOf | anyOf |
|------|-------|-------|
| Visitor実装 | `visitAllOf` | `visitAnyOf` |
| IR型 | `IRAllOfModel` | `IRAnyOfModel` |
| Context型 | `AllOfContext` | `AnyOfContext` |
| 命名パターン | `{親名}AllOf{i}` | `{親名}AnyOf{i}` |
| TypeScript出力 | A & B | A \| B |

## 制限事項（初期実装）

以下は後のフェーズで対応：

1. **discriminator未対応**
   - oneOf実装後にdiscriminatorを統合

2. **type: object + anyOfの厳密な処理**
   - 現状は警告を出す、または適切に処理する方針を決定

3. **循環参照検出なし**
   - 必要に応じて将来対応

## テストケース

### 1. 単純なUnion（$ref のみ）

```yaml
Fruit:
  anyOf:
    - $ref: '#/components/schemas/Apple'
    - $ref: '#/components/schemas/Banana'
```

### 2. $ref + インラインスキーマ

```yaml
Response:
  anyOf:
    - $ref: '#/components/schemas/Success'
    - type: object
      properties:
        error: { type: string }
```

### 3. paths内でのanyOf

```yaml
paths:
  /data:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                anyOf:
                  - $ref: '#/components/schemas/TextData'
                  - $ref: '#/components/schemas/NumericData'
```

### 4. 複数インラインスキーマ

```yaml
Data:
  anyOf:
    - type: object
      properties:
        text: { type: string }
    - type: object
      properties:
        number: { type: number }
```

## 参考資料

- [OpenAPI Specification - anyOf](https://spec.openapis.org/oas/v3.0.3.html)
- [TypeSpec Documentation - Unions](https://typespec.io/docs/language-basics/unions/)
- [Swagger Docs - oneOf, anyOf, allOf](https://swagger.io/docs/specification/v3_0/data-models/oneof-anyof-allof-not/)
- [タスク013: allOf実装計画](./013_allof-implementation-plan.md)
