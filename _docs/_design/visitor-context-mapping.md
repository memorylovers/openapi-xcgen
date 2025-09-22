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

### IRModel の位置づけ

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

- `pathToComponentBase` が `/users/{id}` → `UsersId` のようにパスを PascalCase 化し、HTTP メソッドを付けて基礎名を構築します。
- コンテキストごとにサフィックスやステータスコードを付加し、レスポンスやリクエストボディごとに一意の名前を作ります。
- ネストしたオブジェクト／列挙型は親コンポーネント名をプレフィックスにした派生名で管理し、`buildReferencePath` と組み合わせて `#/paths/...` 系の参照を組み立てます。

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
                # type-visitor.ts: VisitorContext -> IRType
                type: array
                items:
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
                  type: string  # additional-properties-visitor.ts: IRType（IRMapModel）

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

      # additional-properties-visitor.ts: VisitorContext -> IRType（IRMapModel）
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

    Status:
      type: string
      enum: [active, inactive]
      # enum-visitor.ts: SchemaContext -> IREnumModel "Status"
```

## IR型定義

```typescript
// ルート型
IRDocument / XcgenIR
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
  | IRArrayModel       // kind: "array" (将来用)
  | IRMapModel        // kind: "map" (将来用)

// IRType - プロパティの型情報
IRType =
  | IRScalarType  // "string" | "int" | "boolean" | ...
  | IRRef         // { kind: "ref", name: "User" }
  | IRArray       // { kind: "array", itemType: IRType }
  | IRMap         // { kind: "map", valueType: IRType }
```
