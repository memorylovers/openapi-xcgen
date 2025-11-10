# Transformer アーキテクチャ実装詳細

## 概要

本ドキュメントでは、Transformerの3層アーキテクチャ（Dispatcher/Traverser/Transformer）の実装詳細を説明します。

設計思想については [002_core_architecture.md](./002_core_architecture.md) を参照してください。

## ディレクトリ構造

```
packages/core/src/transformer/
├── transformer.ts              # エントリポイント（transform()関数）
├── types.ts                    # Visitorコンテキスト定義（互換性維持）
│
├── transformers/               # 3層アーキテクチャ実装
│   ├── context.ts             # コンテキスト定義とビルダー関数
│   ├── types.ts               # 統一インターフェース（TransformResult等）
│   ├── errors.ts              # エラー生成ヘルパー
│   │
│   ├── dispatchers/           # Dispatcher層（型判定とルーティング）
│   ├── traversers/            # Traverser層（子要素の訪問）
│   ├── transformers/          # Transformer層（変換処理）
│   └── aggregators/           # Aggregator層（パラメータ統合等）
│
└── helpers/                   # ヘルパー関数
    ├── naming/                # 命名関連（モデル名・Enum名生成）
    ├── path/                  # パス構築関連（参照パス・documentPath）
    └── (その他)               # 型変換・バリデーション抽出等
```

**3層の役割**:

- **dispatchers/**: 型判定とルーティング（`dispatchSchema`, `dispatchOperation`）
- **traversers/**: 子要素の訪問（`traverseObjectProperties`, `traverseArrayItem`等）
- **transformers/**: 変換処理（`transformObject`, `transformEnum`等）
- **aggregators/**: 特殊な集約処理（パラメータ統合モデル生成等）

**命名規約**:

- Dispatcher: `*-dispatcher.ts`
- Traverser: `*-traverser.ts`
- Transformer: `*-transformer.ts`
- Helper: 機能名（`get-model-name.ts`, `build-reference-path.ts`等）

---

## 3層アーキテクチャ実装詳細

### Dispatcher層：型判定とルーティング

**責務**: SchemaObjectやOperationObjectの型を判定し、適切なTraverser/Transformerに処理を委譲

**主要関数**:

- `dispatchSchema()` - スキーマ型判定（`transformers/dispatchers/schema-dispatcher.ts`）
- `dispatchOperation()` - オペレーション型判定（`transformers/dispatchers/operation-dispatcher.ts`）

**処理フロー**:

```
dispatchSchema(schema, context)
  ↓ 型判定（if文による分岐）
  ├─ $ref → transformPrimitive()
  ├─ enum → transformEnum()
  ├─ array → traverseArrayItem() + transformArray()
  ├─ map → traverseMapValue() + transformMap()
  ├─ allOf/oneOf/anyOf → traverseComposition() + transform*()
  ├─ object → traverseObjectProperties() + transformObject()
  └─ primitive → transformPrimitive()
```

**特徴**:

- 型判定のみを行い、実際の処理はtraverserとtransformerに委譲
- `dispatchSchema`自身を再帰的に渡すことで、子要素も同じルーティング処理を受ける

---

### Traverser層：子要素の訪問

**責務**: 親要素の子要素（プロパティ、配列要素、合成スキーマ等）をイテレートし、各子要素に対してDispatcherを再帰呼び出し

**主要関数**:

- `traverseObjectProperties()` - objectのpropertiesを訪問
- `traverseObjectAdditionalProperties()` - objectのadditionalPropertiesを訪問
- `traverseArrayItem()` - arrayのitemsを訪問
- `traverseComposition()` - allOf/oneOf/anyOfの子スキーマを訪問
- `traverseParameters()` - parametersを訪問
- `traverseContent()` - requestBody/responseのcontentを訪問
- `traverseResponses()` - responsesを訪問

**処理フロー**（例：objectのproperties）:

```
traverseObjectProperties(schema, context, visitSchema)
  ↓ propertiesをイテレート
  ├─ for each property:
  │   ├─ コンテキスト構築（propName追加）
  │   ├─ visitSchema(propSchema, propContext) ← dispatcherを再帰呼び出し
  │   └─ 結果を収集（type, models）
  └─ 返却: { properties: [...], childModels: [...] }
```

**特徴**:

- プロパティのイテレーションのみを行う
- 各プロパティの変換は `visitSchema`（実体は `dispatchSchema`）に委譲
- 子要素から抽出されたモデルを収集して返す

---

### Transformer層：変換処理

**責務**: OpenAPIスキーマをIR型（IRComponent、IRType）に変換。子要素の訪問はTraverserに委譲済みであるため、自身の変換のみに集中

**主要関数**:

- Schema系: `transformObject()`, `transformEnum()`, `transformArray()`, `transformMap()`, `transform*Of()`
- Operation系: `transformOperation()`, `transformParameter()`, `transformRequestBody()`, `transformResponse()`
- その他: `transformPrimitive()`, `transformComponents()`, `transformPaths()`, `transformMetadata()`, `transformTags()`, `transformServers()`

**処理フロー**（例：object変換）:

```
transformObject(schema, context, propertyResult, additionalResult)
  ↓
  ├─ モデル名・参照パス生成
  ├─ IRObjectSchema作成（propertyResultから取得）
  └─ 返却: { type: ref, components: [objectModel, ...childModels] }
```

**特徴**:

- プロパティの訪問はtraverserから受け取った結果を使用
- 自身のIRModel生成のみに集中
- 子モデルを収集して一緒に返す

---

## 統一インターフェース

すべてのDispatcher/Traverser/Transformerは統一された結果型を返します（`transformers/types.ts`）。

**主要インターフェース**:

- `TransformResult` - 全層共通の戻り値（`type`, `models`, `error?`）
- Schema系トラバーサル結果
  - `PropertyTraversalResult` - objectのproperties訪問結果
  - `AdditionalPropertiesTraversalResult` - additionalProperties訪問結果
  - `ArrayItemTraversalResult` - array items訪問結果
  - `CompositionTraversalResult` - allOf/oneOf/anyOf訪問結果
- Operation系トラバーサル結果
  - `ContentTraversalResult` - requestBody/response content訪問結果
  - `ParametersTraversalResult` - parameters訪問結果
  - `ResponsesTraversalResult` - responses訪問結果
  - `HeadersTraversalResult` - headers訪問結果

**共通構造**:

```
{
  type / properties / content: 変換結果本体
  models / childModels: 子要素から抽出されたモデル
  error?: エラー情報（オプショナル）
}
```

---

## コンテキスト設計

**VisitorContext** (`transformer/types.ts`)

コンテキストは、変換処理中の現在位置とルートセグメントを保持します：

```typescript
{
  documentPath: string[]  // 例: ["paths", "/users", "post", "requestBody"]
  rootSegment: "paths" | "components"
}
```

**ビルダー関数** (`transformers/context.ts`)

子要素用のコンテキストを構築するヘルパー関数：

- `buildPropertyContext()` - プロパティ名を追加
- `buildArrayItemContext()` - 配列名 + "Item"
- `buildCompositionItemContext()` - 親名 + "AllOf0"等
- `buildAdditionalPropertiesContext()` - "additionalProperties"を追加

**コンテキストの役割**:

1. **一意なモデル名の生成**: `documentPath`から階層的な名前を構築
2. **参照パスの構築**: `$ref`形式の参照を組み立て
3. **由来の識別**: components由来かpaths由来かを判別

**例**:

- `documentPath: ["paths", "/users", "post", "requestBody"]`
- 生成モデル名: `PostUsersRequestBody`
- 参照パス: `#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody`

---

## 命名規則

### ComponentName生成ルール

インラインスキーマをコンポーネント化する際の命名規則です（`helpers/naming/*.ts`）。

### 命名規約テーブル

| コンテキスト | パターン | 例 | 呼び出し元 |
| --- | --- | --- | --- |
| requestBody | `PascalCase(method + path) + RequestBody` | `/users` × `post` → `PostUsersRequestBody` | `request-body-transformer.ts` |
| response | `PascalCase(method + path) + <Status>Response` | `/pets/{id}` × `get`, `200` → `GetPetsId200Response` | `response-transformer.ts` |
| parameter | `PascalCase(method + path) + Params` | `/users/{id}`, `get` → `GetUsersIdParams` | `parameter-aggregator.ts` |
| property（ネスト） | `<ParentName> + <Property>` | `PostUsersRequestBody` 内 `profile` → `PostUsersRequestBodyProfile` | `object-traverser.ts` |
| enum（プロパティ由来） | `<ParentName><Property>Enum` | `GetPets200Response` 内 `status` → `GetPets200ResponseStatusEnum` | `enum-transformer.ts` |
| array item | `<ArrayName>Item` | `BlogPosts` → `BlogPostsItem` | `array-traverser.ts` |
| map value | `<MapName>Item` | `Settings` → `SettingsItem` | `map-traverser.ts` |

**詳細な例**: YAML Path → ComponentName → $ref マッピングや完全なOpenAPI仕様例については、[901_transformer_examples.md](./901_transformer_examples.md) を参照してください。

---

## IR型定義

生成されるIR型の詳細については [003_core_ir_design.md](./003_core_ir_design.md) を参照してください。

---

## 参考資料

### 関連ドキュメント

- [002_core_architecture.md](./002_core_architecture.md) - Core全体アーキテクチャと設計思想
- [003_core_ir_design.md](./003_core_ir_design.md) - IR型設計の詳細
- [901_transformer_examples.md](./901_transformer_examples.md) - Transformer処理例とマッピング

### 実装

- `packages/core/src/transformer/` - Transformer実装
- `packages/core/src/transformer/transformers/` - 3層アーキテクチャ実装
