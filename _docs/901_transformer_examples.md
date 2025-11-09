# Transformer 処理例とマッピング

本ドキュメントでは、Transformerの3層アーキテクチャにおける具体的な処理例、命名規則のマッピング、完全なOpenAPI仕様例を示します。

アーキテクチャの概要については [004_core_transformer_architecture.md](./004_core_transformer_architecture.md) を参照してください。

---

## YAML Path → ComponentName → $ref マッピング

インラインスキーマがどのように命名され、参照パスが生成されるかの具体例です。

### パラメータ（GET /pets の query）

- YAML path: `paths./pets.get.parameters`
- 生成モデル名: `GetPetsParams`
- 参照パス: `#/paths/::pets/get/parameters/GetPetsParams`

### パラメータ（GET /pets/{id} の path）

- YAML path: `paths./pets/{id}.get.parameters`
- 生成モデル名: `GetPetsIdParams`
- 参照パス: `#/paths/::pets::{id}/get/parameters/GetPetsIdParams`

### リクエストボディ（POST /pets の application/json）

- YAML path: `paths./pets.post.requestBody.content.application/json.schema`
- 生成モデル名: `PostPetsRequestBody`
- 参照パス: `#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody`

### レスポンス（POST /pets 201 application/json）

- YAML path: `paths./pets.post.responses.201.content.application/json.schema`
- 生成モデル名: `PostPets201Response`
- 参照パス: `#/paths/::pets/post/responses/201/content/application::json/schema/PostPets201Response`

### レスポンス（GET /pets 400 application/json）

- YAML path: `paths./pets.get.responses.400.content.application/json.schema`
- 生成モデル名: `GetPets400Response`
- 参照パス: `#/paths/::pets/get/responses/400/content/application::json/schema/GetPets400Response`

### コンポーネント（Enum）

- YAML path: `components.schemas.Status`
- 生成モデル名: `Status`
- 参照パス: `#/components/schemas/Status`

---

## 完全なOpenAPI仕様例

以下は、各層の処理フローをコメントで示した完全なOpenAPI仕様例です。

```yaml
openapi: 3.1.0
info:
  # metadata-transformer.ts: VisitorContext -> IRMetadata
  title: Pet Store API
  version: 1.0.0

# tags-transformer.ts: TagObject[] -> IRTag[]
tags:
  - name: pets
    description: Everything about your Pets

# paths-transformer.ts: VisitorContext -> IREndpoint[] + IRComponent[]
paths:
  # path-item-transformer.ts: PathItemContext -> IREndpoint[] + IRComponent[]
  /pets:
    # operation-transformer.ts: OperationContext -> IREndpoint + IRComponent[]
    get:
      operationId: listPets
      summary: List all pets
      tags: [pets]

      # parameters-traverser.ts: ParametersContext -> IRParameter[] + IRParameterModel
      parameters:
        # parameter-transformer.ts: ParameterContext -> IRParameter
        - name: limit
          in: query
          description: How many items to return
          required: false
          schema:
            # primitive-transformer.ts: VisitorContext -> IRType
            type: integer
            default: 10
            minimum: 1
            maximum: 100

      # responses-traverser.ts: ResponsesContext -> IRResponse[] + IRResponseModel[]
      responses:
        # response-transformer.ts: ResponseContext -> IRResponse + IRResponseModel[]
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                # array-transformer.ts: VisitorContext -> IRArraySchema
                # array-traverser.ts: モデル名に Item サフィックスを付与
                type: array
                items:
                  # primitive-transformer.ts: VisitorContext -> IRType（$ref はそのまま伝播）
                  $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid request payload
          content:
            application/json:
              schema:
                # object-transformer.ts + object-traverser.ts
                type: object
                properties:
                  message:
                    type: string
                # object-traverser.ts: additionalPropertiesを訪問
                additionalProperties:
                  type: string

  /pets/{id}:
    get:
      operationId: getPet
      summary: Get a pet by ID
      tags: [pets]

      parameters:
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

    post:
      operationId: createPet
      summary: Create a new pet
      tags: [pets]

      # request-body-transformer.ts: RequestBodyContext -> IRRequestBody + IRRequestBodyModel
      requestBody:
        required: true
        description: Pet to add
        content:
          application/json:
            schema:
              # object-transformer.ts: SchemaContext -> IRRequestBodyModel
              type: object
              required: [name, type]
              properties:
                name:
                  type: string
                  description: Pet name
                type:
                  # enum-transformer.ts: VisitorContext -> IREnumSchema
                  type: string
                  enum: [dog, cat, bird]

      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                # object-transformer.ts: SchemaContext -> IRResponseModel
                type: object
                properties:
                  id:
                    type: string
                  status:
                    type: string

# components-transformer.ts: VisitorContext -> IRComponent[]
components:
  schemas:
    # object-transformer.ts: SchemaContext -> IRObjectSchema
    Pet:
      type: object
      required: [id, name]
      properties:
        id:
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
          # array-transformer.ts + array-traverser.ts
          type: array
          items:
            type: string
        owner:
          # primitive-transformer.ts: $ref -> IRRef
          $ref: '#/components/schemas/Owner'
      # object-traverser.ts: additionalPropertiesを訪問
      additionalProperties:
        type: string

    Owner:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
          format: email

    # array-transformer.ts: SchemaContext -> IRArraySchema
    CatalogList:
      type: array
      items:
        $ref: '#/components/schemas/Catalog'

    Catalog:
      type: object
      properties:
        id:
          type: string
        name:
          type: string

    # map-transformer.ts: SchemaContext -> IRMapSchema
    LocalizedSettings:
      type: object
      additionalProperties:
        type: string

    # enum-transformer.ts: SchemaContext -> IREnumSchema
    Status:
      type: string
      enum: [active, inactive]
```

---

## 処理フローの詳細

### Schema系の処理フロー

```
dispatchSchema(schema, context)
  ↓
[型判定]
  ├─ object → traverseObjectProperties() + transformObject()
  ├─ enum → transformEnum()
  ├─ array → traverseArrayItem() + transformArray()
  ├─ map → traverseMapValue() + transformMap()
  ├─ allOf/oneOf/anyOf → traverseComposition() + transform*Of()
  └─ primitive/$ref → transformPrimitive()
  ↓
TransformResult { type, components }
```

### Operation系の処理フロー

```
transformOperation(operation, pathContext)
  ↓
[子要素を順次処理]
  ├─ traverseParameters() → ParametersTraversalResult
  ├─ traverseContent(requestBody) → ContentTraversalResult
  └─ traverseResponses() → ResponsesTraversalResult
  ↓
各traverserが内部でdispatchSchema()を呼び出し
  ↓
IREndpoint + 抽出されたIRComponent[]
```

---

## 参考資料

- [004_core_transformer_architecture.md](./004_core_transformer_architecture.md) - Transformer アーキテクチャ実装詳細
- [002_core_architecture.md](./002_core_architecture.md) - Core全体アーキテクチャ
- [003_core_ir_design.md](./003_core_ir_design.md) - IR型設計
