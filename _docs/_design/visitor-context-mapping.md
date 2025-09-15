# Visitor・Context設計マッピング資料

## 全体構造

```
OpenAPI Document → IRDocument/XcgenIR
├── transformer.ts (エントリポイント) → IRDocument
├── tags → tags-visitor.ts → IRTag[]
├── paths → paths-visitor.ts → IREndpoint[]
│   └── /path → path-item-visitor.ts → IREndpoint[]
│       └── {method} → operation-visitor.ts → IREndpoint
│           ├── parameters → parameters-visitor.ts → IRParameterModel | IRParameter[]
│           │   └── parameter-visitor.ts → IRParameter
│           ├── requestBody → request-body-visitor.ts → IRRequestBody
│           └── responses → responses-visitor.ts → IRResponse[]
│               └── response-visitor.ts → IRResponse
└── components → components-visitor.ts → IRModel[]
    └── schemas → schema-visitor.ts → IRModel
        ├── object → object-visitor.ts → IRObjectModel
        ├── enum → enum-visitor.ts → IREnumModel
        └── primitive/array/ref → type-visitor.ts → IRType
```

## 完全なOpenAPI仕様例

```yaml
openapi: 3.1.0
info:
  title: Pet Store API
  version: 1.0.0

# tags-visitor.ts: undefined | TagObject[] -> IRTag[]
tags:
  - name: pets
    description: Everything about your Pets

# paths-visitor.ts: VisitorContext -> IREndpoint[]
paths:
  # path-item-visitor.ts: PathItemContext -> IREndpoint[]
  /pets:
    # operation-visitor.ts: OperationContext -> IREndpoint
    get:
      operationId: listPets
      summary: List all pets
      tags: [pets]

      # parameters-visitor.ts: ParametersContext -> IRParameterModel | IRParameter[]
      parameters:
        # parameter-visitor.ts: ParameterContext -> IRParameter
        - name: limit
          in: query
          description: How many items to return
          required: false
          schema:
            # type-visitor.ts: VisitorContext -> IRScalarType "int"
            type: integer
            default: 10
            minimum: 1
            maximum: 100

      # responses-visitor.ts: ResponsesContext -> IRResponse[]
      responses:
        # response-visitor.ts: ResponseContext -> IRResponse
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                # type-visitor.ts: VisitorContext -> IRArray { itemType: IRRef "Pet" }
                type: array
                items:
                  $ref: '#/components/schemas/Pet'

  # path-item-visitor.ts: PathItemContext -> IREndpoint[]
  /pets/{id}:
    # operation-visitor.ts: OperationContext -> IREndpoint
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

    # operation-visitor.ts: OperationContext -> IREndpoint
    post:
      operationId: createPet
      summary: Create a new pet
      tags: [pets]

      # request-body-visitor.ts: RequestBodyContext -> IRRequestBody
      requestBody:
        required: true
        description: Pet to add
        content:
          application/json:
            schema:
              # object-visitor.ts: VisitorContext -> IRRequestBodyModel "CreatePetRequest"
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

      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'

# components-visitor.ts: VisitorContext -> IRModel[]
components:
  # components-visitor.ts: VisitorContext -> IRModel[]
  schemas:
    # object-visitor.ts: SchemaContext -> IRObjectModel "Pet"
    Pet:
      type: object
      required: [id, name]
      properties:
        # object-visitor.ts: SchemaContext -> IRProperty[]
        id:
          # type-visitor.ts: VisitorContext -> IRScalarType "string"
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
          # type-visitor.ts: VisitorContext -> IRArray { itemType: "string" }
          type: array
          items:
            type: string

        owner:
          # type-visitor.ts: VisitorContext -> IRRef "Owner"
          $ref: '#/components/schemas/Owner'

    # object-visitor.ts: SchemaContext -> IRObjectModel "Owner"
    Owner:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
          format: email
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
