# Core IR 型設計

## 概要

XcgenIR（Intermediate Representation: 中間表現）は、OpenAPI仕様とコード生成を橋渡しする言語非依存のデータ構造です。

本ドキュメントでは、IR型システムの設計思想と構造を解説します。

## 設計思想

### 言語非依存性

**目的**: 複数の言語生成器で共通利用できるデータ構造

**設計原則**:

- OpenAPIの概念をそのまま保持（metadata、models、endpoints等）
- 言語固有の詳細を排除（TypeScript/Dartの型システムに依存しない）
- 抽象データ構造に徹する

**利点**:

- Transformerの再利用（新言語追加時に再実装不要）
- IR型定義の拡張で全言語に機能展開
- 各言語生成器は独立して進化可能

## IR型システム全体像

IR型システムは、以下の4つのレイヤーで構成されています。各レイヤーは明確な役割を持ち、上位レイヤーが下位レイヤーを参照する構造になっています。

- **Layer 1: XcgenIR**
  - ルートコンテナとその主要フィールド（`models: IRModel[]`、`endpoints: IREndpoint[]`）
- **Layer 2: 具体的な型**
  - `IRModel`（9種類の判別共用体）
  - `IREndpoint`
- **Layer 3: 型表現（再帰的）**
  - `IRType`（4種類の判別共用体）
- **Layer 4: 基底型・補助型**
  - `IRScalarType`、`IRRef`
  - `IRValidation`、`IRExtensions`

## Layer 1: XcgenIR

### XcgenIR (ルートコンテナ)

```
XcgenIR
─ metadata: IRMetadata    ... API基本情報（titleなど）
─ models: IRModel[]       ... すべてのデータモデル
─ tags: IRTag[]           ... タグ定義
─ endpoints: IREndpoint[] ... すべてのエンドポイント
─ servers?: IRServer[]    ... サーバー定義
─ securitySchemes?: SecuritySchemeObject[]   ... セキュリティスキーム定義
─ globalSecurity?: SecurityRequirement[]     ... グローバルセキュリティ要件
─ commonResponses?: IRResponseModel[]        ... 共通レスポンス定義
─ commonRequestBodies?: IRRequestBodyModel[] ... 共通リクエストボディ定義
```

## Layer 2-A: IRModel（OpenAPI視点での分類）

OpenAPIから抽出されたすべてのデータモデルを統一的に管理:

- **components/schemas**から生成されるモデル（schema系）
- **paths内のインラインスキーマ**から生成されるモデル（operation系）
- **allOf/anyOf**などの合成モデル（composition系）

### IRModel

IRModelは以下の種類がある

- IRObjectModel
- IREnumModel
- IRArrayModel
- IRMapModel
- IRParameterModel
- IRRequestBodyModel
- IRResponseModel
- IRAllOfModel
- IRAnyOfModel

### components/schemasから生成（schema系）

#### IRObjectModel - object型スキーマ

OpenAPIの`type: object`から生成されます。

```
IRObjectModel
├── properties: IRProperty[]
│   ├── name
│   ├── type: IRType
│   ├── required
│   └── description
├── validation?: IRValidation
├── additionalProperties?: IRType
└── extensions?: IRExtensions
```

**用途**: User、Post、Commentなどのエンティティモデル

#### IREnumModel - enum型スキーマ

OpenAPIの`enum`から生成されます。

```
IREnumModel
├── values: IREnumValue[]
│   ├── value
│   └── description
├── scalarType: IRScalarType
└── extensions?: IRExtensions
```

**用途**: Status、Role、CategoryなどのEnum型

#### IRArrayModel - array型スキーマ

OpenAPIの`type: array`から生成されます。

```
IRArrayModel
├── items: IRType
├── validation?: IRValidation
└── extensions?: IRExtensions
```

**用途**: Users[]、Tags[]などの配列型

#### IRMapModel - map型スキーマ

OpenAPIの`type: object` + `additionalProperties`から生成されます。

```
IRMapModel
├── valueType: IRType
├── validation?: IRValidation
└── extensions?: IRExtensions
```

**用途**: Record<string, User>のようなMap型

### paths内のインラインスキーマから生成（operation系）

#### IRParameterModel - parameters配下

pathsのparameters配下のインラインスキーマから生成されます。

```
IRParameterModel
├── type: IRType
├── in: IRParameterInType
│   └── "query" | "path" | "header" | "cookie"
└── extensions?: IRExtensions
```

**用途**: クエリパラメータ、パスパラメータの型

#### IRRequestBodyModel - requestBody配下

pathsのrequestBody配下のインラインスキーマから生成されます。

```
IRRequestBodyModel
├── contents: IRRequestContent[]
│   ├── mimeType
│   └── type: IRType
└── extensions?: IRExtensions
```

**用途**: POSTリクエストのボディ型

#### IRResponseModel - responses配下

pathsのresponses配下のインラインスキーマから生成されます。

```
IRResponseModel
├── contents: IRResponseContent[]
│   ├── mimeType
│   └── type: IRType
├── headers?: IRResponseHeader[]
└── extensions?: IRExtensions
```

**用途**: レスポンスボディ型

### スキーマ合成（composition系）

#### IRAllOfModel - allOf

OpenAPIの`allOf`から生成されます。

```
IRAllOfModel
├── schemas: IRType[]
└── extensions?: IRExtensions
```

**用途**: スキーママージ、継承の表現

#### IRAnyOfModel - anyOf

OpenAPIの`anyOf`から生成されます。

```
IRAnyOfModel
├── schemas: IRType[]
└── extensions?: IRExtensions
```

**用途**: Union型、ポリモーフィズムの表現

## Layer 2-B: IREndpoint

OpenAPIのpaths配下のすべてのオペレーション（GET、POST等）を表現:

- HTTPメソッドとパス
- parameters、requestBody、responses
- セキュリティ、タグなど

pathsから生成されるエンドポイント:

```
IREndpoint
├── path
├── method: IRHttpMethod
├── operationId
├── summary
├── description
├── tags
├── parameters?: IRParameter[]
├── requestBody?: IRRequestBody
├── responses: IRResponse[]
├── security
└── extensions?: IRExtensions
```

## Layer 3: IRType（型表現）

IRTypeは、すべてのモデルから参照される型表現です。再帰的構造により、複雑な型を表現できます。

### IRType (判別共用体 - いずれか1つ、再帰的構造)

- IRScalarType
- IRRef
- IRArray
- IRMap

### IRScalarType - プリミティブ型

```
IRScalarType
├── scalarType: "string" | "number" | "integer" | "boolean" | "any"
├── nullable?: boolean
└── validation?: IRValidation → Layer 4へ参照
```

**用途**: string、number、booleanなどの基本型

### IRRef - コンポーネント参照

```
IRRef
├── modelName
└── nullable?: boolean
```

**用途**: $ref: "#/components/schemas/User"などの参照

### IRArray - 配列型

```
IRArray
├── items: IRType → IRTypeを参照（再帰）
├── nullable?: boolean
└── validation?: IRValidation → Layer 4へ参照
```

**用途**: string[]、User[]などの配列型。再帰的にネストした配列も表現可能

### IRMap - マップ型

```
IRMap
├── valueType: IRType → IRTypeを参照（再帰）
├── nullable?: boolean
└── validation?: IRValidation → Layer 4へ参照
```

**用途**: Record<string, T>型。再帰的にネストしたMapも表現可能

## Layer 4: 基底型と補助型

### IRValidation（バリデーション情報）

OpenAPIのバリデーション制約を保持し、各言語生成器でバリデータライブラリにマッピングします。

```
IRValidation
├── 文字列バリデーション
│   ├── minLength
│   ├── maxLength
│   ├── pattern
│   └── format
├── 数値バリデーション
│   ├── minimum
│   ├── maximum
│   ├── exclusiveMinimum
│   ├── exclusiveMaximum
│   └── multipleOf
├── 配列バリデーション
│   ├── minItems
│   ├── maxItems
│   └── uniqueItems
└── オブジェクトバリデーション
    ├── minProperties
    └── maxProperties
```

### IRExtensions（拡張フィールド）

IRExtensions型は、OpenAPIの`x-`拡張フィールドを保持するための汎用的なキー・バリュー構造です。全IR型から参照可能です。

**活用例**:

- `x-format: ulid` → カスタムバリデーション
- `x-readonly: true` → 読み取り専用プロパティ
- `x-internal: true` → 内部API マーカー

## 参考資料

- 関連ドキュメント
  - [002_core_architecture.md](./002_core_architecture.md) - Core全体アーキテクチャ
  - [004_core_parser_transformer.md](./004_core_parser_transformer.md) - Parser/Transformer設計
  - [005-visitor-context-mapping.md](./005-visitor-context-mapping.md) - Visitor実装マッピング

- 実装
  - `packages/core/src/types/ir/` - IR型定義
  - `packages/core/src/types/guards.ts` - 型ガード関数
