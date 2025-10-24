# タスク013-1: Core - IR への extensions フィールド追加

## 概要

OpenAPI の拡張構文（x-プレフィックス）を IR（中間表現）で保持するため、Core パッケージの IR 型定義に `extensions` フィールドを追加します。

親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)

## ステータス

- 状態: 未実施

## 前提条件

- タスク009（Coreパッケージのソースコード実装）が完了していること

## IR の設計思想

本プロジェクトの IR（中間表現）は、「**コード生成しやすい形**」を主眼に設計されています。

### 設計原則

OpenAPI の構造を完全に再現するのではなく、Generator が扱いやすい形に変換します：

1. **情報の統合**: 複数箇所に分散した情報を1箇所にまとめる
   - 例: Path Item の `parameters` と Operation の `parameters` を統合

2. **階層の平坦化**: 不要な階層構造を削減
   - 例: Path Item は独立した IR 型を持たず、Operation に展開

3. **再利用可能な形**: インラインスキーマを独立したモデルとして抽出
   - 例: インラインの requestBody schema を `IRRequestBodyModel` として抽出

### x-extensions の扱い

この設計思想に従い、x-extensions も「コード生成しやすい形」に変換します：

- **Path Item の x-フィールド** + **Operation の x-フィールド** → `IREndpoint.extensions` に統合
- Generator は由来を気にせず、「この Operation で使える全ての x-フィールド」にアクセス可能
- 衝突時は Operation が優先（`parameters` と同じルール）

## 仕様詳細

### x-フィールドとは

OpenAPI 3.x では、`x-` プレフィックスを持つフィールドを使用して独自の拡張情報を定義できます。これらは OpenAPI 仕様に影響を与えず、ツール固有の情報を保持するために使用されます。

**Core の責務**: x-フィールドを解釈せず、そのまま IR に保持する（パススルー）

**Generator の責務**: IR から x-フィールドを読み取り、言語固有のコード生成に活用する

### OpenAPI YAML での使用パターンと対応する IR 表現

#### パターン1: プロパティレベルの x-フィールド（最も一般的）

**OpenAPI YAML**:

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        email:
          type: string
          format: email
          x-type: "EmailAddress"
          x-format: "rfc5322"
          x-validation:
            domain: "example.com"
            allowSubdomains: true
```

**対応する IR JSON**:

```json
{
  "kind": "object",
  "name": "User",
  "referencePath": "#/components/schemas/User",
  "properties": [
    {
      "name": "email",
      "type": {
        "kind": "primitive",
        "type": "string",
        "format": "email"
      },
      "extensions": {
        "x-type": "EmailAddress",
        "x-format": "rfc5322",
        "x-validation": {
          "domain": "example.com",
          "allowSubdomains": true
        }
      }
    }
  ]
}
```

#### パターン2: モデルレベルの x-フィールド

**OpenAPI YAML**:

```yaml
components:
  schemas:
    User:
      type: object
      x-type: "UserModel"
      x-package: "com.example.models"
      x-table: "users"
      properties:
        id:
          type: string
```

**対応する IR JSON**:

```json
{
  "kind": "object",
  "name": "User",
  "referencePath": "#/components/schemas/User",
  "properties": [
    {
      "name": "id",
      "type": {
        "kind": "primitive",
        "type": "string"
      }
    }
  ],
  "extensions": {
    "x-type": "UserModel",
    "x-package": "com.example.models",
    "x-table": "users"
  }
}
```

#### パターン3: パラメータレベルの x-フィールド

**OpenAPI YAML**:

```yaml
paths:
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          x-type: "UserId"
          x-format: "uuid-v7"
```

**対応する IR JSON**:

```json
{
  "name": "id",
  "in": "path",
  "required": true,
  "type": {
    "kind": "primitive",
    "type": "string"
  },
  "extensions": {
    "x-type": "UserId",
    "x-format": "uuid-v7"
  }
}
```

#### パターン4: Enum 型での x-フィールド

**OpenAPI YAML**:

```yaml
components:
  schemas:
    Status:
      type: string
      enum: [active, inactive, pending]
      x-type: "StatusEnum"
      x-serialization: "uppercase"
```

**対応する IR JSON**:

```json
{
  "kind": "enum",
  "name": "Status",
  "referencePath": "#/components/schemas/Status",
  "type": "string",
  "values": [
    { "value": "active", "name": "ACTIVE" },
    { "value": "inactive", "name": "INACTIVE" },
    { "value": "pending", "name": "PENDING" }
  ],
  "extensions": {
    "x-type": "StatusEnum",
    "x-serialization": "uppercase"
  }
}
```

#### パターン5: Union 型（oneOf）での x-フィールド

**OpenAPI YAML**:

```yaml
components:
  schemas:
    Pet:
      oneOf:
        - $ref: '#/components/schemas/Cat'
        - $ref: '#/components/schemas/Dog'
      discriminator:
        propertyName: petType
      x-type: "PetUnion"
      x-sealed: true
```

**対応する IR JSON**:

```json
{
  "kind": "union",
  "name": "Pet",
  "referencePath": "#/components/schemas/Pet",
  "discriminator": {
    "propertyName": "petType"
  },
  "types": [
    { "kind": "ref", "ref": "#/components/schemas/Cat" },
    { "kind": "ref", "ref": "#/components/schemas/Dog" }
  ],
  "extensions": {
    "x-type": "PetUnion",
    "x-sealed": true
  }
}
```

#### パターン6: 複雑なネスト構造

**OpenAPI YAML**:

```yaml
components:
  schemas:
    Config:
      type: object
      properties:
        database:
          type: object
          properties:
            host:
              type: string
              x-type: "Hostname"
              x-validation:
                format: "fqdn"
                maxLength: 255
            port:
              type: integer
              x-type: "Port"
              x-validation:
                min: 1
                max: 65535
```

**対応する IR JSON**:

```json
{
  "kind": "object",
  "name": "Config",
  "properties": [
    {
      "name": "database",
      "type": {
        "kind": "object",
        "properties": [
          {
            "name": "host",
            "type": {
              "kind": "primitive",
              "type": "string"
            },
            "extensions": {
              "x-type": "Hostname",
              "x-validation": {
                "format": "fqdn",
                "maxLength": 255
              }
            }
          },
          {
            "name": "port",
            "type": {
              "kind": "primitive",
              "type": "integer"
            },
            "extensions": {
              "x-type": "Port",
              "x-validation": {
                "min": 1,
                "max": 65535
              }
            }
          }
        ]
      }
    }
  ]
}
```

#### パターン7: Path Item + Operation レベルの x-フィールド統合

Path Item と Operation の両方に x-フィールドがある場合、IR では統合されます。

**OpenAPI YAML**:

```yaml
paths:
  /users/{id}:  # Path Item レベル
    x-rate-limit: 100
    x-cache-ttl: 3600
    x-version: "v1"

    get:  # Operation レベル
      operationId: getUser
      x-version: "v2"        # Path Item の x-version を上書き
      x-require-auth: true   # Operation 固有の x-フィールド
      responses:
        '200':
          description: Success
```

**対応する IR JSON**:

```json
{
  "method": "get",
  "path": "/users/{id}",
  "operationId": "getUser",
  "extensions": {
    "x-rate-limit": 100,      // Path Item 由来
    "x-cache-ttl": 3600,      // Path Item 由来
    "x-version": "v2",        // Operation が Path Item を上書き
    "x-require-auth": true    // Operation 由来
  }
}
```

**統合ルール**:

1. Path Item の x-フィールドを収集
2. Operation の x-フィールドを収集
3. Operation の値が Path Item の値を上書き（`parameters` と同じルール）
4. 統合結果を `IREndpoint.extensions` に格納

**理由**:

- Generator は「この Operation で使える全ての x-フィールド」が欲しい
- 由来（Path Item か Operation か）を気にする必要がない
- シンプルで扱いやすい設計

### 値の型パターン

x-フィールドの値は様々な型を取ることができます：

#### 文字列値

```yaml
x-type: "EmailAddress"
x-format: "rfc5322"
```

→ `{ "x-type": "EmailAddress", "x-format": "rfc5322" }`

#### オブジェクト値

```yaml
x-validation:
  domain: "example.com"
  allowSubdomains: true
  maxLength: 255
```

→ `{ "x-validation": { "domain": "example.com", "allowSubdomains": true, "maxLength": 255 } }`

#### 配列値

```yaml
x-tags: ["internal", "deprecated", "beta"]
x-scopes: [read, write, admin]
```

→ `{ "x-tags": ["internal", "deprecated", "beta"], "x-scopes": ["read", "write", "admin"] }`

#### 数値・真偽値

```yaml
x-priority: 1
x-required: true
x-version: 2.5
```

→ `{ "x-priority": 1, "x-required": true, "x-version": 2.5 }`

#### null 値

```yaml
x-metadata: null
```

→ `{ "x-metadata": null }`

### エッジケースと制約

#### 1. x- プレフィックス以外のフィールドは無視

**OpenAPI YAML**:

```yaml
type: string
format: email
x-type: "EmailAddress"  # ✅ 抽出される
custom-field: "value"   # ❌ 無視される（x- プレフィックスなし）
```

**IR JSON**:

```json
{
  "extensions": {
    "x-type": "EmailAddress"
  }
}
```

#### 2. extensions が空の場合は undefined

**OpenAPI YAML**:

```yaml
type: string
format: email
# x-フィールドなし
```

**IR JSON**:

```json
{
  "kind": "primitive",
  "type": "string",
  "format": "email"
  // extensions フィールド自体が存在しない（undefined）
}
```

これにより JSON 出力がクリーンに保たれます。

#### 3. ネストの深さ制限なし

x-フィールドの値は `unknown` 型で保持されるため、任意の深さのネスト構造を持つことができます：

```yaml
x-config:
  level1:
    level2:
      level3:
        value: "deep"
```

→ `{ "x-config": { "level1": { "level2": { "level3": { "value": "deep" } } } } }`

#### 4. 空のオブジェクト・配列も保持

```yaml
x-metadata: {}
x-tags: []
```

→ `{ "x-metadata": {}, "x-tags": [] }`

#### 5. 予約済み OpenAPI フィールドとの衝突はない

x- プレフィックスが OpenAPI 仕様で予約されているため、標準フィールドとの衝突は発生しません。

### 型定義

#### Extensions 型の定義（新規）

```typescript
// packages/core/src/types/ir/common/extensions.ts (新規ファイル)

/**
 * OpenAPI Specification Extensions の値型
 *
 * x-フィールドの値として許可される型。
 * JSON 値の仕様に準拠（再帰的な構造をサポート）。
 *
 * @see https://spec.openapis.org/oas/v3.0.3#specification-extensions
 *
 * @example
 * ```yaml
 * x-type: "EmailAddress"           # string
 * x-priority: 1                    # number
 * x-required: true                 # boolean
 * x-metadata: null                 # null
 * x-tags: ["internal", "beta"]     # array
 * x-validation:                    # object (nested)
 *   domain: "example.com"
 *   maxLength: 255
 * ```
 */
export type ExtensionValue =
  | string
  | number
  | boolean
  | null
  | ExtensionValue[]
  | { [key: string]: ExtensionValue };

/**
 * OpenAPI Specification Extensions
 *
 * x- プレフィックスを持つフィールドのマップ。
 * キーは x- で始まる必要があるが、型レベルでは強制しない。
 */
export type Extensions = Record<string, ExtensionValue>;
```

**型制限の理由**:

- `unknown` ではなく `ExtensionValue` を使用することで、Generator 側で型ガードが利用可能
- JSON 値の仕様に準拠（OpenAPI の x-フィールドは JSON として扱われる）
- 再帰的な定義により、任意の深さのネスト構造をサポート

**Generator 側での使用例**:

```typescript
if (property.extensions) {
  const xType = property.extensions["x-type"];

  // ExtensionValue 型なので、型ガードで安全に扱える
  if (typeof xType === "string") {
    // xType は string 型として扱える
    return xType;
  }

  // オブジェクト値の場合
  const xValidation = property.extensions["x-validation"];
  if (xValidation && typeof xValidation === "object" && !Array.isArray(xValidation)) {
    // xValidation は { [key: string]: ExtensionValue } 型
    const domain = xValidation["domain"];
    if (typeof domain === "string") {
      // domain を文字列として処理
    }
  }
}
```

#### IR 型定義への適用

```typescript
// packages/core/src/types/ir/models/property.ts
import type { Extensions } from "../common/extensions";

export interface IRProperty {
  name: string;
  description?: string;
  type: IRType;
  required?: true;
  nullable?: true;
  defaultValue?: unknown;
  deprecated?: true;
  readOnly?: true;
  writeOnly?: true;
  validation?: IRValidation;
  extensions?: Extensions; // ✅ 統一された型
}

// packages/core/src/types/ir/endpoints/parameter.ts
import type { Extensions } from "../common/extensions";

export interface IRParameter {
  name: string;
  in: IRParameterInType;
  description?: string;
  required?: true;
  type: IRType;
  nullable?: true;
  defaultValue?: unknown;
  deprecated?: true;
  validation?: IRValidation;
  extensions?: Extensions; // ✅ 統一された型
}

// packages/core/src/types/ir/models/base.ts
import type { Extensions } from "../common/extensions";

export interface IRObjectModel {
  kind: "object";
  name: string;
  referencePath: string;
  description?: string;
  properties: IRProperty[];
  additionalProperties?: IRType;
  extensions?: Extensions; // ✅ 統一された型
}

export interface IREnumModel {
  kind: "enum";
  name: string;
  referencePath: string;
  description?: string;
  type: IRScalarType;
  values: IREnumValue[];
  extensions?: Extensions; // ✅ 統一された型
}

// 以下同様に IRAllOfModel, IRAnyOfModel, IRUnionModel にも Extensions を追加

// packages/core/src/types/ir/endpoints/endpoint.ts
import type { Extensions } from "../common/extensions";

export interface IREndpoint {
  operationId?: string;
  method: IRHttpMethod;
  path: string;
  description?: string;
  summary?: string;
  tags: string[];
  parameters: IRType | IRParameter[];
  requestBody?: IRRequestBody;
  responses: IRResponse[];
  deprecated?: true;
  security?: IRSecurityRequirement[];
  extensions?: Extensions; // ✅ 統一された型（Path Item + Operation を統合）
}

// packages/core/src/types/ir/endpoints/request.ts
import type { Extensions } from "../common/extensions";

export interface IRRequestBodyWithContent {
  kind: "content";
  description?: string;
  required?: true;
  content: IRRequestContent[];
  extensions?: Extensions; // ✅ 統一された型
}

export interface IRRequestContent {
  mimeType: MimeType;
  schema: IRType;
  extensions?: Extensions; // ✅ 統一された型
}

// packages/core/src/types/ir/endpoints/response.ts
import type { Extensions } from "../common/extensions";

export interface IRResponseWithContent {
  kind: "content";
  statusCode: string;
  description?: string;
  content?: IRResponseContent[];
  headers?: IRResponseHeader[];
  extensions?: Extensions; // ✅ 統一された型
}

export interface IRResponseContent {
  mimeType: MimeType;
  schema: IRType;
  extensions?: Extensions; // ✅ 統一された型
}

export interface IRResponseHeader {
  name: string;
  description?: string;
  type: IRType;
  defaultValue?: unknown;
  deprecated?: true;
  extensions?: Extensions; // ✅ 統一された型
}
```

**型定義の一元管理**:

すべての IR 型で `Extensions` 型を使用することにより：

- 型定義の変更が1箇所で完結
- Generator 側で一貫した型ガードが使用可能
- 将来的な拡張が容易

## 実装対象

### Phase 0: Extensions 型定義の作成（新規）

共通の型定義ファイルを作成します。

**新規作成ファイル**:

- `packages/core/src/types/ir/common/extensions.ts`
  - `ExtensionValue` 型（再帰的な JSON 値型）
  - `Extensions` 型（`Record<string, ExtensionValue>`）

**更新ファイル**:

- `packages/core/src/types/ir/common/index.ts`
  - `Extensions`, `ExtensionValue` を export

### Phase 1: IR 型定義への extensions フィールド追加

Core は OpenAPI の `x-*` フィールドを解釈せず、そのまま IR に保持することが責務です。

#### 対象 IR 型

以下の IR 型に `extensions?: Extensions` フィールドを追加：

1. **IRProperty** (`packages/core/src/types/ir/models/property.ts`)
   - オブジェクトのプロパティ定義
   - 使用例: スキーマのプロパティに `x-type: "EmailAddress"` などを指定

2. **IRParameter** (`packages/core/src/types/ir/endpoints/parameter.ts`)
   - API パラメータ定義
   - 使用例: パラメータに `x-format: "uuid-v7"` などを指定

3. **IRObjectModel** (`packages/core/src/types/ir/models/base.ts`)
   - オブジェクト型モデル定義
   - 使用例: モデル全体に `x-type: "UserModel"` などを指定

4. **IREnumModel** (`packages/core/src/types/ir/models/base.ts`)
   - 列挙型モデル定義
   - 使用例: Enum に `x-type: "StatusEnum"` などを指定

5. **IRAllOfModel, IRAnyOfModel, IRUnionModel** (`packages/core/src/types/ir/models/base.ts`)
   - 合成型モデル定義
   - 使用例: Union 型に拡張フィールドを指定

6. **IREndpoint** (`packages/core/src/types/ir/endpoints/endpoint.ts`)
   - エンドポイント（Operation）定義
   - Path Item と Operation の x-フィールドを統合して格納
   - 使用例: `x-rate-limit: 100`, `x-require-auth: true` など

7. **IRRequestBodyWithContent** (`packages/core/src/types/ir/endpoints/request.ts`)
   - リクエストボディ定義
   - 使用例: `x-form-encoding: "multipart"`, `x-max-size: 10485760` など

8. **IRResponseWithContent** (`packages/core/src/types/ir/endpoints/response.ts`)
   - レスポンス定義
   - 使用例: `x-cache-ttl: 3600`, `x-error-model: "NotFoundError"` など

9. **IRResponseHeader** (`packages/core/src/types/ir/endpoints/response.ts`)
   - レスポンスヘッダー定義
   - 使用例: `x-expose-to-client: true`, `x-type: "RateLimitInfo"` など

10. **IRRequestContent, IRResponseContent** (`packages/core/src/types/ir/endpoints/request.ts`, `response.ts`)
    - メディアタイプ定義
    - 使用例: `x-parser: "custom-json"`, `x-serializer: "xml-fast"` など

### Phase 2: Transformer での x-* フィールド抽出

OpenAPI スキーマから `x-*` フィールドを抽出し、IR の `extensions` に保存します。

#### 実装方針

**Helper 関数の作成**:

- `packages/core/src/transformer/helpers/extract-extensions.ts`
  - `extractExtensions(schema: unknown): Record<string, unknown> | undefined`
  - スキーマから `x-` プレフィックスのフィールドを抽出
  - In-source テストで動作を検証

**Visitor の更新**:

以下の visitor で `extractExtensions()` を呼び出し、IR に設定：

1. `packages/core/src/transformer/visitors/primitive-visitor.ts`
   - IRPrimitive → IRProperty/IRParameter 生成時に extensions を設定

2. `packages/core/src/transformer/visitors/object-visitor.ts`
   - IRObjectModel 生成時に extensions を設定
   - プロパティ生成時にも extensions を設定

3. `packages/core/src/transformer/visitors/enum-visitor.ts`
   - IREnumModel 生成時に extensions を設定

4. `packages/core/src/transformer/visitors/allof-visitor.ts`
   - IRAllOfModel 生成時に extensions を設定

5. `packages/core/src/transformer/visitors/anyof-visitor.ts`
   - IRAnyOfModel 生成時に extensions を設定

6. `packages/core/src/transformer/visitors/union-visitor.ts`
   - IRUnionModel 生成時に extensions を設定

7. `packages/core/src/transformer/visitors/parameter-visitor.ts`
   - IRParameter 生成時に extensions を設定

8. `packages/core/src/transformer/visitors/path-item-visitor.ts`
   - Path Item の x-フィールドを抽出

9. `packages/core/src/transformer/visitors/operation-visitor.ts`
   - Operation の x-フィールドを抽出
   - Path Item と Operation の x-フィールドを統合
   - 統合結果を IREndpoint.extensions に設定

10. `packages/core/src/transformer/visitors/request-body-visitor.ts`
    - Request Body の x-フィールドを抽出
    - IRRequestBodyWithContent.extensions に設定
    - content 内の Media Type の x-フィールドも抽出

11. `packages/core/src/transformer/visitors/response-visitor.ts`
    - Response の x-フィールドを抽出
    - IRResponseWithContent.extensions に設定
    - headers、content 内の Media Type の x-フィールドも抽出

## 実装手順（TDD アプローチ）

### ステップ1: extract-extensions helper の実装

```typescript
// packages/core/src/transformer/helpers/extract-extensions.ts

/**
 * スキーマから x-* 拡張フィールドを抽出
 * @param schema - 抽出対象のスキーマオブジェクト
 * @returns 拡張フィールドのマップ、存在しない場合は undefined
 *
 * @example
 * ```typescript
 * const schema = {
 *   type: "string",
 *   "x-type": "EmailAddress",
 *   "x-format": "rfc5322"
 * };
 * const extensions = extractExtensions(schema);
 * // { "x-type": "EmailAddress", "x-format": "rfc5322" }
 * ```
 */
export function extractExtensions(
  schema: unknown
): Record<string, unknown> | undefined {
  // 実装とin-sourceテスト
}
```

**テストケース**:

- `x-` フィールドが存在する場合に抽出されること
- `x-` 以外のフィールドは無視されること
- 拡張フィールドが存在しない場合は `undefined` を返すこと
- ネストされたオブジェクトも正しく保持されること

### ステップ2: IR 型定義の更新

1. **Red**: 型定義に `extensions` を追加した状態で既存テストを実行（型エラーで失敗）
2. **Green**: visitor を更新して `extensions: undefined` を設定（テスト通過）
3. **Refactor**: コードの可読性を改善

### ステップ3: Visitor の更新

各 visitor で `extractExtensions()` を呼び出し：

```typescript
// 例: primitive-visitor.ts での使用
import { extractExtensions } from "../helpers/extract-extensions";

export function visitPrimitive(schema: SchemaObject): IRPrimitive | null {
  // ... 既存の処理 ...

  const extensions = extractExtensions(schema);

  return {
    kind: "primitive",
    type: schema.type as IRScalarType,
    format: schema.format,
    extensions, // 追加
  };
}
```

**各 visitor でのテストケース**:

- 拡張フィールドが正しく IR に設定されること
- 拡張フィールドがない場合は `undefined` になること

### ステップ4: E2E テストの追加

`packages/core/tests/e2e/x-extensions/` ディレクトリに E2E テストを追加：

**テストファイル構成**:

```
packages/core/tests/e2e/x-extensions/
├── openapi.yaml          # x-* フィールドを含む OpenAPI 定義
└── expected.json         # 期待される IR 出力
```

**openapi.yaml の例**:

```yaml
openapi: 3.0.3
info:
  title: Extensions Test API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          x-type: "UserId"
          x-format: "uuid-v7"
components:
  schemas:
    User:
      type: object
      x-type: "UserModel"
      properties:
        email:
          type: string
          format: email
          x-type: "EmailAddress"
          x-format: "rfc5322"
          x-validation:
            domain: "example.com"
```

## 検証項目

- [ ] `extractExtensions()` のin-sourceテストがすべてパス
- [ ] IR 型定義に `extensions` フィールドが追加されている
- [ ] 各 visitor が `extensions` を正しく設定している
- [ ] E2E テストで x-* フィールドが IR に保持されている
- [ ] ビルドが成功すること（`pnpm build`）
- [ ] 型チェックが通ること（`pnpm typecheck`）
- [ ] 全テストがパスすること（`pnpm test`）
- [ ] Lintエラーがないこと（`pnpm lint`）

## 非機能要件

### パフォーマンス

- 拡張フィールドの抽出処理は軽量であること
- 不要なオブジェクトコピーを避けること

### 後方互換性

- 既存の IR 出力に影響を与えないこと（`extensions` が `undefined` の場合は JSON 出力に含まれない）
- 既存のテストが引き続きパスすること

## 制約事項と互換性

### OpenAPI バージョン間の互換性

#### 3.0.3 vs 3.1.0

**x-フィールドを配置できる箇所**:

- **3.0.3**: 30個のオブジェクトで x-* をサポート
- **3.1.0**: 29個のオブジェクトで x-* をサポート

基本的に変わりはなく、本実装の `extensions?: Record<string, unknown>` で両バージョンをカバーできます。

**3.1.0 で追加された変更点**:

1. **予約済みプレフィックス**（重要）
   - `x-oai-*` と `x-oas-*` プレフィックスは OpenAPI Initiative によって予約
   - 例: `x-oai-custom`, `x-oas-feature` は将来の OpenAPI 公式拡張と衝突する可能性
   - 推奨: `x-type`, `x-format`, `x-validation` など一般的な名前は問題なく使用可能

2. **新しいオブジェクトの追加**
   - Webhooks Object（トップレベル）が追加され、x-* をサポート
   - 本タスクでは未対応（将来的に対応検討）

3. **JSON Schema 互換性の変更**
   - `nullable` キーワード削除 → `type: ["string", "null"]` に変更
   - x-extensions とは直接関係なし

### 対応範囲の制約

#### ✅ 現在対応する IR 型（Phase 1 の範囲）

本タスクで extensions フィールドを追加する対象：

- **Schema Object** → IRObjectModel, IREnumModel, IRAllOfModel, IRAnyOfModel, IRUnionModel
- **Property（Schema の properties）** → IRProperty
- **Parameter Object** → IRParameter
- **Operation Object + Path Item Object** → IREndpoint
  - Path Item の x-フィールドと Operation の x-フィールドを統合
  - Operation が優先（`parameters` と同じルール）
- **Request Body Object** → IRRequestBody (IRRequestBodyWithContent)
  - リクエストボディ全体の処理方法を指定
  - 例: `x-form-encoding`, `x-max-size`, `x-validation`
- **Response Object** → IRResponse (IRResponseWithContent)
  - レスポンスごとの処理方法を指定
  - 例: `x-cache-ttl`, `x-error-model`, `x-response-handler`
- **Header Object** → IRResponseHeader
  - レスポンスヘッダーごとの処理方法を指定
  - 例: `x-expose-to-client`, `x-type`
- **Media Type Object** → IRRequestContent, IRResponseContent
  - メディアタイプごとの処理方法を指定
  - 例: `x-parser`, `x-serializer`

これらはコード生成に直接影響する箇所です。

#### ❌ 対応予定なし

以下はメタデータであり、コード生成に影響しないため対応しません：

- **メタデータ系**: Info, Contact, License, Server, Server Variable, Tag
- **ドキュメント系**: External Documentation, Example
- **認証系**: Security Scheme, OAuth Flows, Security Requirement
- **参照系**: Reference Object（$ref は OpenAPI の仕組みであり拡張不要）
- **構造系**: Components, Paths, Responses（コレクションオブジェクト）

**理由**: これらは API のメタ情報であり、生成されるクライアントコードには含まれません。

### 実装上の注意点

#### 1. パススルー方式

Core は x-フィールドを解釈せず、そのまま IR に保持します：

```typescript
// ✅ 正しい実装
extensions: extractExtensions(schema) // そのまま保持

// ❌ 誤った実装
extensions: {
  type: schema["x-type"], // 特定のフィールドだけ抽出
}
```

#### 2. 空の場合は undefined

x-フィールドが存在しない場合、extensions は undefined になります：

```typescript
// x-フィールドなし
{ name: "email", type: { kind: "primitive", type: "string" } }
// extensions フィールド自体が存在しない

// x-フィールドあり
{ name: "email", type: { kind: "primitive", type: "string" }, extensions: { "x-type": "Email" } }
```

これにより JSON 出力がクリーンに保たれます。

#### 3. プレフィックスの制約

- **抽出対象**: `x-` で始まるフィールドのみ
- **無視される**: `custom-field`, `myExtension` など x- プレフィックスなし
- **予約済みも保持**: `x-oai-*`, `x-oas-*` も含め全て保持（Generator 側で処理を判断）

#### 4. 値の型制約

`unknown` 型で保持されるため、以下すべてをサポート：

- プリミティブ値: 文字列、数値、真偽値、null
- オブジェクト値: ネストされた構造も保持
- 配列値: 任意の要素を含む配列
- ネストの深さ制限なし

#### 5. 型安全性の注意

Generator 側で x-フィールドを使用する際は、適切な型チェックが必要：

```typescript
// Generator 側での使用例
if (property.extensions?.["x-type"]) {
  const xType = property.extensions["x-type"];
  if (typeof xType === "string") {
    // 文字列として処理
  }
}
```

## 次のタスク

- タスク013-2（予定）: xcgen-ts での Hook 機構実装と x-extensions 処理

## 参考資料

- [OpenAPI Specification 3.0.3 - Specification Extensions](https://spec.openapis.org/oas/v3.0.3#specification-extensions)
- [OpenAPI Specification 3.1.0 - Specification Extensions](https://spec.openapis.org/oas/v3.1.0#specification-extensions)
- [OpenAPI 3.1.0 変更点](https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0)
- 親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)
