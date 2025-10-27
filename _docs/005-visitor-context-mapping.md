# Visitor・Context設計マッピング資料

## 全体構造

```
OpenAPI Document → XcgenIR
├── transformer.ts (エントリポイント) → XcgenIR
│   ├── info → metadata-visitor.ts → IRMetadata
│   ├── tags → tags-visitor.ts → IRTag[]
│   ├── paths → paths-visitor.ts → IREndpoint[] + IRModel[]
│   │   └── /path → path-item-visitor.ts → IREndpoint[] + IRModel[]
│   │       └── {method} → operation-visitor.ts → IREndpoint + IRModel[]
│   │           ├── parameters → parameters-visitor.ts → IRParameter[] + IRParameterModel
│   │           │   └── parameter-visitor.ts → IRParameter
│   │           ├── requestBody → request-body-visitor.ts → IRRequestBody + IRRequestBodyModel
│   │           └── responses → responses-visitor.ts → IRResponse[] + IRResponseModel[]
│   │               └── response-visitor.ts → IRResponse + IRResponseModel[]
│   └── components → components-visitor.ts → IRModel[]（object/enum/array/map）
│       └── schemas → schema-visitor.ts → IRType + IRModel[]
│           ├── object → object-visitor.ts → IRObjectModel
│           ├── enum → enum-visitor.ts → IREnumModel
│           ├── additionalProperties → additional-properties-visitor.ts → IRType（IRMapModel を生成）
│           └── primitive/array/ref → type-visitor.ts → IRType（必要に応じて IRArrayModel を生成）
└── 付随ヘルパー → build-reference-path.ts / generate-component-name.ts など
```

## Visitor階層の設計思想

### 処理の階層化

Transformerは、OpenAPI仕様の構造に合わせてトップダウンで処理を委譲します。

**トップレベル** (`transform()` エントリポイント):

- `visitMetadata()` - info、contact、license
- `visitTags()` - タグ配列
- `visitComponents()` - schemas、securitySchemes、responses、requestBodies
- `visitPaths()` - paths配列
- `visitServers()` - サーバー配列

**中間レベル** (パス・オペレーション単位):

- `visitPathItem()` - 個別パス（`/users`等）
- `visitOperation()` - HTTPメソッド（GET、POST等）

**下位レベル** (詳細な処理):

- `visitParameters()` / `visitRequestBody()` / `visitResponses()`
- `visitSchema()` → `visitObject()` / `visitEnum()` / `visitArray()` / `visitMap()` 等

### 階層分離の基準

- **OpenAPI仕様の構造に対応**: `components`、`paths`、`operations`、`schema`
- **単一責任原則**: 1 Visitor = 1責務
- **再利用性**: schema配下のVisitorは`components/schemas`と`paths`内のインラインスキーマで共通利用

### 再帰的処理の必要性

スキーマ処理（`schema/`配下のVisitor）は再帰的に呼び出し可能:

- オブジェクトのプロパティが別のオブジェクトを持つ
- 配列のアイテムが別のスキーマを参照
- `allOf`/`anyOf`/`oneOf`が複数のスキーマを組み合わせる

## コンテキスト伝播の仕組み

各Visitorは、コンテキスト情報を受け取り、下位Visitorに伝播します。

### VisitorContext

**役割**: Visitor間で共有される基本コンテキスト

**主要フィールド**:

- `documentPath`: YAMLパス配列（例: `["paths", "/users", "get", "responses", "200"]`）
  - インラインスキーマの命名に使用
  - 参照パス（`$ref`）の構築に使用
- `rootSegment`: ルートセグメント（`"components"` または `"paths"`）
  - components由来かpaths由来かを識別
  - 参照パス構築時に使用

### SchemaContext

**役割**: スキーマ処理に特化したコンテキスト

**追加情報**:

- モデル名（components由来の場合）
- 親モデル情報（ネストスキーマの場合）
- プロパティ名（オブジェクト内のプロパティの場合）

### コンテキストの活用

**命名**: `documentPath`と`rootSegment`から一意なモデル名を生成

- 例: `["paths", "/users", "post", "requestBody"]` → `PostUsersRequestBody`

**参照パス構築**: `buildReferencePath()`で`$ref`形式の参照を構築

- 例: `#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody`

## IRModel の位置づけ

`IRModel` は `packages/core/src/types/ir/models/operation.ts:161` で定義されている判別共用体で、以下の `kind` ごとの形を束ねています。

- `object` → `IRObjectModel`（プロパティ配列とバリデーションを保持）
- `enum` → `IREnumModel`（`values` に列挙値を保持）
- `array` → `IRArrayModel`（`itemType` が `IRType`）
- `map` → `IRMapModel`（`valueType` が `IRType`）
- `parameter` → `IRParameterModel`（パラメータ統合モデルの `properties` を保持）
- `requestBody` → `IRRequestBodyModel`（`content` に MIME/型ペアを保持）
- `response` → `IRResponseModel`（レスポンスコンテンツやヘッダーを保持）

## ComponentName 命名ルール

インラインスキーマをコンポーネント化する際には、`generate-component-name.ts` と関連ヘルパーで命名を統一しています。

| コンテキスト | パターン | 例 | 呼び出し元 |
| --- | --- | --- | --- |
| requestBody | `PascalCase(method + path) + RequestBody` | `/users` × `post` → `PostUsersRequestBody` | `request-body-visitor.ts` |
| response | `PascalCase(method + path) + <Status>Response` | `/pets/{id}` × `get`, `200` → `GetPetsId200Response` | `response-visitor.ts` |
| parameter | `PascalCase(method + path) + Params` | `/users/{id}`, `get` → `GetUsersIdParams` | `parameters-visitor.ts` |
| property（ネスト） | `<ParentName> + <Property>` | `PostUsersRequestBody` 内 `profile` → `PostUsersRequestBodyProfile` | `object-visitor.ts`（`generateNestedComponentName`） |
| enum（プロパティ由来） | `<ParentName><Property>Enum` | `GetPets200Response` 内 `status` → `GetPets200ResponseStatusEnum` | `enum-visitor.ts`（`generateEnumComponentName`） |

- 配列のインライン要素は `array-visitor.ts` が `{配列モデル名}Item` を `documentPath` 末尾に設定して処理するため、`BlogPostsItemAuthor` のように必ず `Item` サフィックス付きで抽出されます。
- マップ (additionalProperties) の値スキーマは `additional-properties-visitor.ts` が `{マップモデル名}Item` を採用するため、値オブジェクトは `SettingsItem` のように `Item` サフィックスで命名されます。

- `pathToComponentBase` が `/users/{id}` → `UsersId` のようにパスを PascalCase 化し、HTTP メソッドを付けて基礎名を構築します。
- コンテキストごとにサフィックスやステータスコードを付加し、レスポンスやリクエストボディごとに一意の名前を作ります。
- ネストしたオブジェクト／列挙型は親コンポーネント名をプレフィックスにした派生名で管理し、`buildReferencePath` と組み合わせて `#/paths/...` 系の参照を組み立てます。
- 同じパス・メソッドで複数の media type が定義される場合でも、`application/json` は既定名のまま、その他の media type は `Xml` や `TextPlain` など MIME に応じたサフィックスを付与して重複を避けます。

### YAML Path → ComponentName → $ref 対応

サンプルに含まれる主なインラインスキーマと生成結果の対応は以下の通りです。

- パラメータ（GET /pets の query）
  - path: `paths./pets.get.parameters`
  - name: `GetPetsParams`
  - ref: `#/paths/::pets/get/parameters/GetPetsParams`
- パラメータ（GET /pets/{id} の path）
  - path: `paths./pets/{id}.get.parameters`
  - name: `GetPetsIdParams`
  - ref: `#/paths/::pets::{id}/get/parameters/GetPetsIdParams`
- リクエストボディ（POST /pets の application/json）
  - path: `paths./pets.post.requestBody.content.application/json.schema`
  - name: `PostPetsRequestBody`
  - ref: `#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody`
- レスポンス（POST /pets 201 application/json）
  - path: `paths./pets.post.responses.201.content.application/json.schema`
  - name: `PostPets201Response`
  - ref: `#/paths/::pets/post/responses/201/content/application::json/schema/PostPets201Response`
- レスポンス（GET /pets 400 application/json）
  - path: `paths./pets.get.responses.400.content.application/json.schema`
  - name: `GetPets400Response`
  - ref: `#/paths/::pets/get/responses/400/content/application::json/schema/GetPets400Response`
- コンポーネント（Enum）
  - path: `components.schemas.Status`
  - name: `Status`
  - ref: `#/components/schemas/Status`

## 完全なOpenAPI仕様例

```yaml
openapi: 3.1.0
info:
  # metadata-visitor.ts: VisitorContext -> IRMetadata
  title: Pet Store API
  version: 1.0.0

# tags-visitor.ts: undefined | TagObject[] -> IRTag[]
tags:
  - name: pets
    description: Everything about your Pets

# paths-visitor.ts: VisitorContext -> IREndpoint[] + IRModel[]
paths:
  # path-item-visitor.ts: PathItemContext -> IREndpoint[] + IRModel[]
  /pets:
    # operation-visitor.ts: OperationContext -> IREndpoint + IRModel[]
    get:
      operationId: listPets
      summary: List all pets
      tags: [pets]

      # parameters-visitor.ts: ParametersContext -> IRParameter[] + IRParameterModel
      parameters:
        # parameter-visitor.ts: ParameterContext -> IRParameter
        - name: limit
          in: query
          description: How many items to return
          required: false
          schema:
            # type-visitor.ts: VisitorContext -> IRType
            type: integer
            default: 10
            minimum: 1
            maximum: 100

      # responses-visitor.ts: ResponsesContext -> IRResponse[] + IRResponseModel[]
      responses:
        # response-visitor.ts: ResponseContext -> IRResponse + IRResponseModel[]
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                # array-visitor.ts: VisitorContext -> IRArrayModel (モデル名に Item サフィックスを付与)
                type: array
                items:
                  # type-visitor.ts: VisitorContext -> IRType（$ref はそのまま伝播）
                  $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid request payload
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                # visitResponseObject: SchemaContext -> IRResponseModel "GetPets400Response"
                additionalProperties:
                  type: string
                # additional-properties-visitor.ts: VisitorContext -> IRType（IRObjectModel.additionalProperties に格納）

  # path-item-visitor.ts: PathItemContext -> IREndpoint[] + IRModel[]
  /pets/{id}:
    # operation-visitor.ts: OperationContext -> IREndpoint + IRModel[]
    get:
      operationId: getPet
      summary: Get a pet by ID
      tags: [pets]

      parameters:
        # parameter-visitor.ts: ParameterContext -> IRParameter
        - name: id
          in: path
          required: true
          description: Pet ID
          schema:
            type: string
            format: uuid

      responses:
        '200':
          description: Pet details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'

    # operation-visitor.ts: OperationContext -> IREndpoint + IRModel[]
    post:
      operationId: createPet
      summary: Create a new pet
      tags: [pets]

      # request-body-visitor.ts: RequestBodyContext -> IRRequestBody + IRRequestBodyModel
      requestBody:
        required: true
        description: Pet to add
        content:
          application/json:
            schema:
              # visitRequestBodyObject: SchemaContext -> IRRequestBodyModel "CreatePetRequest"
              type: object
              required: [name, type]
              properties:
                name:
                  type: string
                  description: Pet name
                type:
                  # enum-visitor.ts: VisitorContext -> IREnumModel "CreatePetRequestTypeEnum"
                  type: string
                  enum: [dog, cat, bird]

      # responses-visitor.ts: ResponsesContext -> IRResponse[] + IRResponseModel[]
      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                # visitResponseObject: SchemaContext -> IRResponseModel "PostPets201Response"
                type: object
                properties:
                  id:
                    type: string
                  status:
                    type: string

  /catalogs:
    # operation-visitor.ts: OperationContext -> IREndpoint + IRModel[]
    get:
      operationId: listCatalogs
      summary: List catalogs
      tags: [catalog]

      # responses-visitor.ts: ResponsesContext -> IRResponse[] + IRResponseModel[]
      responses:
        '200':
          description: Catalog list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CatalogList'

  /settings:
    # operation-visitor.ts: OperationContext -> IREndpoint + IRModel[]
    get:
      operationId: listSettings
      summary: List localized settings
      tags: [config]

      # responses-visitor.ts: ResponsesContext -> IRResponse[] + IRResponseModel[]
      responses:
        '200':
          description: Map of localized strings
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LocalizedSettings'

# components-visitor.ts: VisitorContext -> IRModel[]
components:
  # components-visitor.ts: VisitorContext -> IRModel[]
  schemas:
    # object-visitor.ts: SchemaContext -> IRObjectModel
    Pet:
      type: object
      required: [id, name]
      properties:
        # object-visitor.ts: SchemaContext -> IRObjectModel
        id:
          # type-visitor.ts: VisitorContext -> IRType
          type: string
          format: uuid

        name:
          type: string
          description: Pet name
          minLength: 1
          maxLength: 100

        type:
          type: string
          enum: [dog, cat, bird]

        age:
          type: integer
          nullable: true  # OpenAPI 3.0形式
          minimum: 0
          maximum: 50

        tags:
          # type-visitor.ts: VisitorContext -> IRType
          type: array
          items:
            type: string

        owner:
          # type-visitor.ts: VisitorContext -> IRType
          $ref: '#/components/schemas/Owner'

      # additional-properties-visitor.ts: SchemaContext -> IRType（IRObjectModel.additionalProperties に格納）
      additionalProperties:
        type: string

    # object-visitor.ts: SchemaContext -> IRObjectModel "Owner"
    Owner:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
          format: email
          
    # array-visitor.ts: SchemaContext -> IRArrayModel（CatalogList / CatalogListItem）
    CatalogList:
      type: array
      items:
        $ref: '#/components/schemas/Catalog'

    # object-visitor.ts: SchemaContext -> IRObjectModel "Catalog"
    Catalog:
      type: object
      properties:
        id:
          type: string
        name:
          type: string

    # additional-properties-visitor.ts: SchemaContext -> IRMapModel（LocalizedSettings / LocalizedSettingsItem）
    LocalizedSettings:
      type: object
      additionalProperties:
        type: string

    Status:
      type: string
      enum: [active, inactive]
      # enum-visitor.ts: SchemaContext -> IREnumModel "Status"
```

## IR型定義

```typescript
// ルート型
XcgenIR
├── metadata: IRMetadata
├── models: IRModel[]
├── tags: IRTag[]
├── endpoints: IREndpoint[]
└── servers: IRServer[]

// API型定義
interface IRTag {
  name: string
  description: string | null
  externalDocs?: {
    url: string
    description?: string
  } | null
}

interface IREndpoint {
  operationId: string | null
  method: IRHttpMethod  // "get" | "post" | "put" | "patch" | "delete" | ...
  path: string
  description: string | null
  summary: string | null
  tags: string[] | null
  parameters: IRType | IRParameter[]
  requestBody: IRRequestBody | null
  responses: IRResponse[]
  deprecated: boolean | null
  security: string[] | null
}

interface IRParameter {
  name: string
  in: "path" | "query" | "header" | "cookie"
  description: string | null
  required: boolean
  type: IRType
  nullable: boolean | null
  defaultValue: unknown | null
  deprecated: boolean | null
}

interface IRRequestBody {
  description: string | null
  required: boolean
  content: IRRequestContent[]  // MIMEタイプとスキーマの組み合わせ
}

interface IRResponse {
  statusCode: string
  description: string | null
  content: IRResponseContent[] | null  // MIMEタイプとスキーマの組み合わせ
  headers: IRResponseHeader[] | null
}

// IRModel - モデルの判別共用体
IRModel =
  | IRObjectModel       // kind: "object"
  | IREnumModel        // kind: "enum"
  | IRParameterModel   // kind: "parameter"
  | IRRequestBodyModel // kind: "requestBody"
  | IRResponseModel    // kind: "response"
  | IRArrayModel       // kind: "array"
  | IRMapModel        // kind: "map"

// IRType - プロパティの型情報
IRType =
  | IRScalarType  // "string" | "int" | "boolean" | ...
  | IRRef         // { kind: "ref", name: "User" }
  | IRArray       // { kind: "array", itemType: IRType }
  | IRMap         // { kind: "map", valueType: IRType }
```
