# Task 009-06: Visitorパターンによるtransformer実装（TDD）

## 実装状況

- **Phase 1**: ✅ 完了 - Schema Object処理（プリミティブ型、配列型、$ref参照）
- **Phase 2**: ✅ 完了 - Components.schemas処理（enum、object型）
  - Step 5: Helper関数群 - ✅ 完了
  - Step 6: Enum処理 - ✅ 完了（`enum-visitor.ts`実装、Visitorパターン統合）
  - Step 7: Object型処理 - ✅ 完了（`object-visitor.ts`実装）
  - Step 8: Union型処理 - 🔜 将来実装（oneOf/anyOf/allOf）
  - Step 9: Schema統合Visitor - ✅ 完了（`schema-visitor.ts`実装）
  - Step 10: Components処理 - ✅ 完了（`components-visitor.ts`実装）
- **Phase 3**: 🚧 実装予定 - Paths/Operation処理
  - Step 11: 基本的なエンドポイント処理（`paths-visitor.ts`, `path-item-visitor.ts`）
  - Step 12: パラメータ付きOperation（`operation-visitor.ts`, `parameter-visitor.ts`）
- **Phase 4**: 🚧 未着手 - Document全体の統合
- **Phase 5**: 🚧 未着手 - 最適化とリファクタリング

## 概要

OpenAPIドキュメント（parser出力）を中間表現（IR）に変換するtransformerレイヤーを、関数ベースのVisitorパターンとTDD（Test-Driven Development）で実装する。

### 位置づけ

- **レイヤー**: `packages/core/src/transformer/`として実装
- **入力**: OpenAPIDocument（parserの出力、$ref保持）
- **出力**: XcgenIR（中間表現）
- **準拠**: OpenAPI v3.1 / JSON Schema 2020-12

## 設計原則

### 開発手法

- **TDD（Test-Driven Development）**: Red-Green-Refactorサイクル
  1. **Red**: 失敗するテストを書く
  2. **Green**: テストを通す最小限の実装
  3. **Refactor**: コードを改善（テストは常にGreen）

### アーキテクチャ原則

- **Tree-shaking対応**: クラスを使用せず、関数ベースで実装
- **純粋関数**: 副作用なし、同じ入力で同じ出力を保証
- **不変性**: データを変更せず、新しいデータを生成
- **型安全性**: TypeScriptの型システムを最大限活用
- **テスタビリティ**: 各Visitor関数を独立してテスト可能

## OpenAPI v3.1準拠のディレクトリ構造

### 設計原則：非終端記号 = Visitor

BNF仕様の各非終端記号に対して1つのVisitorファイルを対応させるフラットな構造。

```
packages/core/src/transformer/
├── types.ts                        # Visitor型定義
├── context.ts                      # Context管理
├── traverser.ts                    # トラバース関数
├── visitors/
│   ├── openapi-visitor.ts          # <openapi-object>
│   ├── info-visitor.ts             # <info-object>
│   ├── servers-visitor.ts          # <servers-array>
│   ├── server-visitor.ts           # <server-object>
│   ├── paths-visitor.ts            # <paths-object>
│   ├── path-item-visitor.ts        # <path-item-object>
│   ├── operation-visitor.ts        # <operation-object>
│   ├── parameter-visitor.ts        # <parameter-object>
│   ├── request-body-visitor.ts     # <request-body-object>
│   ├── responses-visitor.ts        # <responses-object>
│   ├── response-visitor.ts         # <response-object>
│   ├── media-type-visitor.ts       # <media-type-object>
│   ├── schema-visitor.ts           # <schema-object> ※統一
│   ├── discriminator-visitor.ts    # <discriminator-object>
│   ├── components-visitor.ts       # <components-object>
│   ├── security-scheme-visitor.ts  # <security-scheme-object>
│   ├── tags-visitor.ts             # <tags-array>
│   ├── tag-visitor.ts              # <tag-object>
│   ├── reference-visitor.ts        # <reference-object>
│   └── index.ts
│
├── helpers/                        # 共通ヘルパー関数
│   ├── type-resolver.ts           # 型解決ロジック
│   ├── extract-ref-name.ts        # $ref名抽出 ✅
│   ├── extract-validation.ts      # バリデーション情報抽出 ✅
│   ├── to-ir-scalar-type.ts       # IRScalarType変換 ✅
│   ├── generate-enum-name.ts      # Enum名生成 ✅
│   └── model-classifier.ts        # モデル/enum/union分類
│
├── combinators/                    # Visitor組み合わせユーティリティ
│   ├── compose.ts                  # Visitor合成
│   ├── filter.ts                   # フィルタリング
│   └── map.ts                      # 結果変換
│
├── transformer.ts                  # メインエントリポイント
└── index.ts
```

## ファイル設計方針

### 基本原則：責任の粒度による分類

#### Visitor層（1非終端記号1ファイル）

```
visitors/
├── schema-visitor.ts         # <schema-object>の処理
├── primitive-visitor.ts      # プリミティブ型特化処理
├── array-visitor.ts          # <array-schema>の処理
├── object-visitor.ts         # <object-schema>の処理
├── reference-visitor.ts      # <reference-object>の処理
└── ...
```

**設計理由**：

- BNF非終端記号 = 1つの責任単位
- OpenAPI仕様書の構造と1:1で対応
- 関連する処理をまとめて凝集度を高める
- 仕様書を読みながらコードを理解しやすい

#### Helper層（1関数1ファイル）

```
helpers/
├── extract-ref-name.ts       # $ref名抽出 ✅
├── extract-validation.ts     # バリデーション情報抽出 ✅
├── to-ir-scalar-type.ts      # IRScalarType安全変換 ✅
├── generate-enum-name.ts     # Enum名生成 ✅
└── ...
```

**設計理由**：

- 複数のvisitorから使われる汎用関数
- 単一責任で純粋関数として実装
- Tree-shaking効率の最大化
- 個別にテスト・再利用可能

### ファイル構造のパターン

#### Visitorファイルの構造

```typescript
// visitors/schema-visitor.ts

// 型定義（必要に応じて）
type SchemaVisitorOptions = { ... };

/**
 * <schema-object>を処理するvisitor関数
 * @param schema - OpenAPI SchemaObject
 * @param context - Visitor実行コンテキスト
 * @returns IRType型の結果
 */
export function visitSchema(
  schema: SchemaObject | ReferenceObject,
  context: VisitorContext
): VisitorResult<IRType> {
  // メイン処理
}

// visitor固有のヘルパー（外部公開しない）
function handlePrimitiveSchema(schema: SchemaObject): IRPrimitive {
  // schema-visitor専用の処理
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe("visitSchema", () => {
    // visitSchemaのテスト
  });
  
  describe("handlePrimitiveSchema", () => {
    // 内部関数のテストも可能
  });
}
```

#### Helperファイルの構造

```typescript
// helpers/is-primitive-type.ts

/**
 * プリミティブ型かどうかを判定
 * @param type - 判定対象の型
 * @returns プリミティブ型の場合true
 */
export function isPrimitiveType(type: unknown): boolean {
  return ["string", "number", "integer", "boolean"].includes(type as string);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe("isPrimitiveType", () => {
    it("should return true for primitive types", () => {
      expect(isPrimitiveType("string")).toBe(true);
      expect(isPrimitiveType("number")).toBe(true);
      expect(isPrimitiveType("integer")).toBe(true);
      expect(isPrimitiveType("boolean")).toBe(true);
    });
    
    it("should return false for non-primitive types", () => {
      expect(isPrimitiveType("array")).toBe(false);
      expect(isPrimitiveType("object")).toBe(false);
      expect(isPrimitiveType(undefined)).toBe(false);
    });
  });
}
```

### テスト戦略の変更

#### in-source testingを基本とする

- 実装とテストを同じファイルに配置
- `if (import.meta.vitest)`ブロックでテストを記述
- 変更時にテストの見落としを防ぐ
- コードとテストの一貫性を保つ

#### 外部テストファイルは統合テストのみ

- `tests/transformer/integration/`に配置
- 複数のvisitorを組み合わせた動作確認
- 実際のOpenAPIドキュメントを使用したE2Eテスト

### メリット

1. **明確な責任分離**: ファイル名から機能が明確
2. **保守性向上**: 変更箇所が限定的で影響範囲が明確
3. **Tree-shaking最適化**: 必要な関数のみインポート可能
4. **テストの局所性**: コードとテストが同じ場所
5. **仕様との対応**: BNF仕様書とコードが1:1対応

## TDD実装計画

### 実装済みファイル

✅ **完了済み**:

**基盤実装**:

- `context.ts` - Visitorコンテキスト管理
- `types.ts` - Visitor型定義、IRScalarType型エイリアス
- `index.ts` - モジュールエクスポート

**Visitor実装**:

- `visitors/primitive-visitor.ts` - プリミティブ型処理（IRScalarType使用）
- `visitors/type-visitor.ts` - 汎用型解決（配列、参照型含む）
- `visitors/enum-visitor.ts` - Enum型処理（Context pattern採用）✅ NEW

**Helper関数**:

- `helpers/extract-ref-name.ts` - $ref名抽出
- `helpers/extract-validation.ts` - バリデーション情報抽出
- `helpers/to-ir-scalar-type.ts` - IRScalarType安全変換 ✅ NEW
- `helpers/generate-enum-name.ts` - Enum名生成 ✅ NEW

**テスト戦略**:

- in-sourceテスティング採用
- 全121テスト合格
- null返却パターンでエラーハンドリング統一

### Phase 1: Schema Object処理 ✅ 完了

最も基礎となるSchema Objectの処理を完了（JSON Schema 2020-12準拠）。

#### 完了したステップ

1. **Step 1: プリミティブ型** ✅
   - `visitPrimitive`関数実装
   - string、number、integer、boolean型サポート
   - TDDサイクル（Red-Green-Refactor）実践

2. **Step 2: format付きプリミティブ** ✅
   - format属性の処理（email、date-time、uri、uuid等）
   - nullable属性のサポート（OpenAPI 3.0.x互換）

3. **Step 3: $ref参照** ✅
   - `extractRefName`によるコンポーネント名抽出
   - 無効な$refに対するnull返却とconsola.warn
   - 外部参照、URL参照のサポート

4. **Step 4: 配列型** ✅
   - `visitType`関数での配列型処理
   - ネストした配列型のサポート
   - 要素型が無効な場合のnull伝播

### Phase 2: Components.schemas処理（実装中）

依存関係に基づき、leafに近いステップから順に実装。

#### Step 5: Helper関数群 ✅ 完了

- `extract-validation.ts` - バリデーション情報抽出（13テスト実装）
- `extractName` → es-toolkit/last に移行

#### Step 6: Enum処理 ✅ 完了

`enum-visitor.ts`として実装完了。Visitorパターンに統合し、Context patternを採用：

- **visitEnum**: SchemaObjectからIREnumへの変換
- **generateEnumName**: 有効な識別子名の生成（別ファイル）
- **IRScalarType**: 型安全性向上のための型エイリアス導入
- **toIRScalarType**: 安全な型変換ヘルパー

#### Step 7: Object型処理 ✅ 完了

`object-visitor.ts`として実装完了。Contextパターンを採用し、モデル名を必須パラメータ化：

- **visitObject**: SchemaObjectからIRModelへの変換
- **required/nullable対応**: OpenAPI 3.0.x互換の4パターン完全サポート
- **プロパティ属性**: description、defaultValue、deprecated、validation対応
- **型サポート**: プリミティブ、配列、$ref参照をvisitType経由で処理
- **エラーハンドリング**: 無効プロパティのスキップと警告（17テスト実装）

#### Step 8: Union型処理 🔜 将来実装

oneOf/anyOf/allOfを使用したUnion型およびスキーママージ処理：

- **oneOf**: 排他的Union（exactly one）
- **anyOf**: 包含的Union（one or more）
- **allOf**: スキーママージ
- **discriminator**: ポリモーフィズムサポート

**実装予定時期**: 基本機能の安定化後（Phase 2.5）
**理由**: 使用頻度が低く（全体の5-10%）、基本的な型処理を優先

#### Step 9: Schema統合Visitor ✅ 完了

`schema-visitor.ts`として実装完了。中央ディスパッチャーとして全ての型処理を統合：

- **visitSchema**: SchemaObjectの型判定と適切なVisitorへの振り分け
- **処理優先順位**: enum > object > その他の型（primitive、array、$ref）
- **ネストしたオブジェクトの抽出**: object型プロパティを独立したIRModelとして分離
- **インラインenumの抽出**: プロパティ内のenum配列を独立したIREnumとして分離
- **階層的命名規則**: ネスト構造に対応した名前生成（例: Blog → BlogPosts → BlogPostsAuthor）
- **配列要素の特別処理**: 配列要素がobjectの場合も独立モデルとして抽出

#### Step 10: Components処理 ✅ 完了

`components-visitor.ts`として実装完了。ComponentsObjectのschemasセクションを処理し、models/enumsに分類：

- **visitComponents**: components.schemasをイテレートし、各スキーマをvisitSchemaで処理
- **エラーハンドリング**: null/undefinedスキーマのスキップと警告
- **結果の集約**: 各スキーマから抽出されたmodels/enumsを統合
- **TypeSpec互換**: array型、scalar型、$ref型のスキーマに対応
- **テスト最適化**: 8テストケースで完全カバレッジ、toEqual()での厳密な検証

### Phase 3: Paths/Operation処理

OpenAPIのPaths/Operationセクションを処理し、APIエンドポイント情報をIRに変換します。

#### 実装方針

- **TDDアプローチ**: Red-Green-Refactorサイクルの厳守
- **in-sourceテスティング**: 実装とテストを同じファイルに配置
- **エラーハンドリング**: null返却パターンで統一（例外を投げない）
- **既存Visitorとの連携**: `visitType`でschema処理、`visitSchema`でボディ処理
- **段階的実装**: 基本的なGETから始め、段階的に機能を追加

#### 責務分担

- **paths-visitor.ts**: `PathsObject`を処理し、タグでグループ化された`IRService[]`を生成
- **path-item-visitor.ts**: `PathItemObject`から各HTTPメソッドのエンドポイントを抽出
- **operation-visitor.ts**: `OperationObject`から`IREndpoint`を生成
- **parameter-visitor.ts**: `ParameterObject`から`IRParameter`を生成（path/query/header/cookie）
- **response-visitor.ts**: `ResponseObject`から`IRResponse`を生成（必要に応じて）

#### Step 11: 単純なGETエンドポイント

基本的なGET操作を処理し、タグによるサービスグループ化を実装します。

##### 11-1: paths-visitor.ts

```typescript
// Red - テストファースト
describe("paths-visitor", () => {
  it("should extract GET operation", () => {
    const paths: PathsObject = {
      "/pets": {
        get: {
          operationId: "listPets",
          tags: ["pets"],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Pet" }
                  }
                }
              }
            }
          }
        }
      }
    };
    const context = createContext();
    const result = visitPaths(paths, context);
    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("pets");
    expect(result.services[0].endpoints).toHaveLength(1);
  });
});

// Green - 最小限の実装
// src/transformer/visitors/paths-visitor.ts
import type { PathsObject } from "../../types/index.js";
import type { IRService } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { visitPathItem } from "./path-item-visitor.js";

export interface PathsResult {
  services: IRService[];
}

export function visitPaths(
  paths: PathsObject,
  context: VisitorContext
): PathsResult {
  const serviceMap = new Map<string, IRService>();
  
  Object.entries(paths).forEach(([path, pathItem]) => {
    const pathContext = {
      ...context,
      path: [...context.path, 'paths', path]
    };
    
    const endpoints = visitPathItem(pathItem, pathContext);
    
    // タグでグループ化（OpenAPIのtagsを使ってサービスを分類）
    endpoints.forEach(endpoint => {
      const tag = endpoint.tags?.[0] || 'default';
      if (!serviceMap.has(tag)) {
        serviceMap.set(tag, {
          name: tag,
          endpoints: []
        });
      }
      serviceMap.get(tag)!.endpoints.push(endpoint);
    });
  });
  
  return { services: Array.from(serviceMap.values()) };
}
```

##### 11-2: path-item-visitor.ts

```typescript
// src/transformer/visitors/path-item-visitor.ts
import type { PathItemObject } from "../../types/index.js";
import type { IREndpoint } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { visitOperation } from "./operation-visitor.js";

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

export function visitPathItem(
  pathItem: PathItemObject,
  context: VisitorContext
): IREndpoint[] {
  const endpoints: IREndpoint[] = [];
  const pathTemplate = context.path[context.path.length - 1]; // 最後の要素がパス
  
  HTTP_METHODS.forEach(method => {
    const operation = pathItem[method];
    if (operation) {
      const operationContext = {
        ...context,
        method,
        pathTemplate
      };
      const endpoint = visitOperation(operation, operationContext);
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }
  });
  
  return endpoints;
}
```

#### Step 12: パラメータ付きOperation

パラメータ、リクエストボディ、レスポンスを含む完全なOperation処理を実装します。

##### 12-1: operation-visitor.ts（基本実装）

```typescript
// Red - パラメータ付きのテスト
describe("operation-visitor", () => {
  it("should extract path and query parameters", () => {
    const operation: OperationObject = {
      operationId: "getPet",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" }
        },
        {
          name: "detailed",
          in: "query",
          schema: { type: "boolean" }
        }
      ]
    };
    const context = createContext({
      method: "GET",
      pathTemplate: "/pets/{id}"
    });
    const result = visitOperation(operation, context);
    expect(result.parameters).toHaveLength(2);
    expect(result.parameters[0].in).toBe("path");
    expect(result.parameters[1].in).toBe("query");
  });
});

// Green - operation-visitor.ts
// src/transformer/visitors/operation-visitor.ts
import { consola } from "consola";
import type { OperationObject } from "../../types/index.js";
import type { IREndpoint, IRParameter } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { visitParameter } from "./parameter-visitor.js";
import { isReferenceObject } from "../../types/guards.js";

interface OperationContext extends VisitorContext {
  method: string;
  pathTemplate: string;
}

export function visitOperation(
  operation: OperationObject,
  context: OperationContext
): IREndpoint | null {
  if (!operation.operationId) {
    consola.warn(`Operation without operationId at ${context.pathTemplate}`);
    return null;
  }
  
  const endpoint: IREndpoint = {
    id: operation.operationId,
    method: context.method as IRHttpMethod,
    path: context.pathTemplate,
    summary: operation.summary,
    description: operation.description,
    parameters: [],
    responses: [],
    deprecated: operation.deprecated
  };
  
  // パラメータ処理
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (isReferenceObject(param)) {
        // $ref参照のパラメータは現時点でスキップ
        consola.warn(`Reference parameter not supported yet: ${param.$ref}`);
        continue;
      }
      
      const irParam = visitParameter(param, context);
      if (irParam) {
        endpoint.parameters.push(irParam);
      }
    }
  }
  
  // TODO: requestBody処理
  // TODO: responses処理
  
  return endpoint;
}
```

##### 12-2: parameter-visitor.ts

```typescript
// src/transformer/visitors/parameter-visitor.ts
import { consola } from "consola";
import type { ParameterObject } from "../../types/index.js";
import type { IRParameter } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { visitType } from "./type-visitor.js";

export function visitParameter(
  parameter: ParameterObject,
  context: VisitorContext
): IRParameter | null {
  if (!parameter.schema) {
    consola.warn(`Parameter without schema: ${parameter.name}`);
    return null;
  }
  
  const type = visitType(parameter.schema);
  if (!type) {
    consola.warn(`Invalid parameter type for: ${parameter.name}`);
    return null;
  }
  
  return {
    name: parameter.name,
    in: parameter.in,
    description: parameter.description,
    required: parameter.required || false,
    type,
    deprecated: parameter.deprecated
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe("visitParameter", () => {
    it("should handle path parameter", () => {
      const param: ParameterObject = {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" }
      };
      const result = visitParameter(param, createContext());
      
      expect(result).toEqual({
        name: "id",
        in: "path",
        required: true,
        type: { kind: "primitive", type: "string" },
        description: undefined,
        deprecated: undefined
      });
    });
    
    it("should handle query parameter with default", () => {
      const param: ParameterObject = {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 10 }
      };
      const result = visitParameter(param, createContext());
      
      expect(result?.type).toEqual({
        kind: "primitive",
        type: "integer",
        defaultValue: 10
      });
    });
  });
}
```

### Phase 4: Document全体の統合

#### Step 13: 完全なOpenAPIドキュメント

```typescript
// Red
describe("transformer", () => {
  it("should transform complete OpenAPI 3.1 document", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.1.0",
      info: {
        title: "Pet Store API",
        version: "1.0.0"
      },
      servers: [
        { url: "https://api.example.com" }
      ],
      paths: {
        "/pets": {
          get: {
            operationId: "listPets",
            tags: ["pets"],
            parameters: [
              {
                name: "limit",
                in: "query",
                schema: { type: "integer", minimum: 1, maximum: 100 }
              }
            ],
            responses: {
              "200": {
                description: "List of pets",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Pet" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Pet: {
            type: "object",
            properties: {
              id: { type: "integer", format: "int64" },
              name: { type: "string" },
              status: {
                type: "string",
                enum: ["available", "pending", "sold"]
              }
            },
            required: ["id", "name"]
          }
        }
      }
    };

    const ir = transform(doc);
    
    expect(ir.metadata.title).toBe("Pet Store API");
    expect(ir.metadata.version).toBe("1.0.0");
    expect(ir.servers).toHaveLength(1);
    expect(ir.models).toHaveLength(1);
    expect(ir.services).toHaveLength(1);
    expect(ir.enums).toHaveLength(1); // statusのenum
  });
});

// Green: transformer.ts メインエントリポイント
// src/transformer/transformer.ts
import { visitOpenAPI } from './visitors/openapi-visitor';

export function transform(doc: OpenAPIDocument): XcgenIR {
  const context = createContext();
  return visitOpenAPI(doc, context);
}

// src/transformer/visitors/openapi-visitor.ts
export function visitOpenAPI(
  doc: OpenAPIDocument,
  context: VisitorContext
): XcgenIR {
  const ir: XcgenIR = {
    metadata: visitInfo(doc.info, context),
    servers: doc.servers ? visitServers(doc.servers, context) : [],
    models: [],
    enums: [],
    unions: [],
    services: []
  };
  
  // Components処理
  if (doc.components) {
    const componentsResult = visitComponents(doc.components, context);
    ir.models.push(...componentsResult.models);
    ir.enums.push(...componentsResult.enums);
    ir.unions.push(...componentsResult.unions);
  }
  
  // Paths処理
  if (doc.paths) {
    const pathsResult = visitPaths(doc.paths, context);
    ir.services.push(...pathsResult.services);
  }
  
  return ir;
}
```

### Phase 5: 最適化とリファクタリング

- パフォーマンス最適化
- メモリ使用量の削減
- コードの整理と重複の除去

## 実装ガイドライン

### TDDサイクルの実践

1. **Red（5分）**
   - 失敗するテストを書く
   - 期待される動作を明確に定義

2. **Green（10分）**
   - テストを通す最小限の実装
   - ハードコードでも構わない

3. **Refactor（5分）**
   - コードの重複を除去
   - 命名を改善
   - 構造を整理

### in-sourceテストの活用

```typescript
// src/transformer/visitors/schema-visitor.ts
import { resolveType } from '../helpers/type-resolver';
import { detectEnum } from '../helpers/enum-detector';
import { visitReference } from './reference-visitor';
import { isReferenceObject } from '../../types/guards';

export function visitSchema(
  schema: SchemaObject | ReferenceObject,
  context: VisitorContext
): VisitorResult<IRType> {
  // $ref処理は reference-visitor に委譲
  if (isReferenceObject(schema)) {
    return visitReference(schema, context);
  }

  // enum検出
  if (schema.enum) {
    const name = last(context.path) || "Unknown";  // es-toolkitのlast関数を使用
    return {
      value: detectEnum(schema, name),
      continue: false
    };
  }

  // oneOf/anyOf処理
  if (schema.oneOf || schema.anyOf) {
    const types = (schema.oneOf || schema.anyOf).map(s => {
      const subContext = { ...context, path: [...context.path, 'oneOf'] };
      return visitSchema(s, subContext).value;
    });
    
    return {
      value: {
        kind: 'union',
        name: extractName(context.path),
        types,
        discriminator: schema.discriminator?.propertyName
      },
      continue: false
    };
  }

  // 基本的な型解決はヘルパーに委譲
  return {
    value: resolveType(schema),
    continue: schema.type === 'object' // objectの場合はpropertiesも処理
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe("visitSchema", () => {
    it("should handle enum schema", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "approved", "rejected"]
      };
      const context = createContext();
      const result = visitSchema(schema, context);
      
      expect(result.value.kind).toBe("enum");
      expect(result.continue).toBe(false);
    });

    it("should handle object schema", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      };
      const context = createContext();
      const result = visitSchema(schema, context);
      
      expect(result.value.kind).toBe("object");
      expect(result.continue).toBe(true); // propertiesも処理する
    });
  });
}

// src/transformer/helpers/type-resolver.ts
export function resolveType(schema: SchemaObject): IRType {
  // プリミティブ型
  if (['string', 'number', 'integer', 'boolean'].includes(schema.type)) {
    return {
      kind: 'primitive',
      type: schema.type,
      format: schema.format
    };
  }
  
  // 配列型
  if (schema.type === 'array' && schema.items) {
    return {
      kind: 'array',
      items: resolveType(schema.items as SchemaObject)
    };
  }
  
  // オブジェクト型
  if (schema.type === 'object') {
    return {
      kind: 'object',
      properties: schema.properties ? {} : undefined
    };
  }
  
  // その他はany
  return { kind: 'any' };
}
```

### コーディング規約

1. **関数名**: 動詞で始める（`visitSchema`, `resolveType`, `extractModels`）
2. **ファイル名**: kebab-case（`schema-visitor.ts`）
3. **型定義**: PascalCase（`VisitorContext`, `SchemaVisitor`）
4. **定数**: UPPER_SNAKE_CASE（`MAX_DEPTH`）

## テスト戦略

### テストの種類

1. **単体テスト**（in-source）
   - 各Visitor関数の振る舞い
   - 純粋関数として独立テスト
   - カバレッジ100%目標

2. **統合テスト**（`tests/transformer/`）
   - 実際のOpenAPIドキュメント
   - エンドツーエンドの変換
   - fixtures/petstore.yamlを使用

3. **スナップショットテスト**
   - 生成されるIRの一貫性
   - リグレッション防止

### テストファイル構造

```
packages/core/tests/transformer/
├── unit/                       # 単体テスト
│   ├── context.test.ts
│   ├── traverser.test.ts
│   ├── visitors/
│   │   ├── openapi-visitor.test.ts
│   │   ├── info-visitor.test.ts
│   │   ├── servers-visitor.test.ts
│   │   ├── paths-visitor.test.ts
│   │   ├── path-item-visitor.test.ts
│   │   ├── operation-visitor.test.ts
│   │   ├── parameter-visitor.test.ts
│   │   ├── request-body-visitor.test.ts
│   │   ├── responses-visitor.test.ts
│   │   ├── response-visitor.test.ts
│   │   ├── media-type-visitor.test.ts
│   │   ├── schema-visitor.test.ts
│   │   ├── discriminator-visitor.test.ts
│   │   ├── components-visitor.test.ts
│   │   ├── security-scheme-visitor.test.ts
│   │   ├── tags-visitor.test.ts
│   │   ├── tag-visitor.test.ts
│   │   └── reference-visitor.test.ts
│   └── helpers/
│       ├── type-resolver.test.ts
│       ├── ref-extractor.test.ts
│       ├── validation-extractor.test.ts
│       ├── enum-detector.test.ts
│       └── model-classifier.test.ts
├── integration/                # 統合テスト
│   ├── petstore.test.ts
│   ├── complex-schemas.test.ts
│   └── edge-cases.test.ts
└── snapshots/                  # スナップショット
    └── __snapshots__/
```

## 実装時の注意点

### エラーハンドリング戦略

#### null返却パターン

Visitor関数は例外を投げずに、警告とnull返却で対応：

```typescript
export function visitPrimitive(
  schema: SchemaObjectWithNullable,
): IRPrimitive | null {  // null許容型
  if (!isPrimitiveType(schema.type)) {
    consola.warn(`Invalid type for primitive visitor: ${schema.type}`);
    return null;  // 例外ではなくnullを返す
  }
  // 正常処理...
}
```

#### null伝播

下位のvisitorがnullを返した場合、上位も適切にnullを伝播：

```typescript
export function visitType(schema: SchemaObjectWithNullable): IRType | null {
  if (schema.type === "array" && schema.items) {
    const itemType = visitType(schema.items);
    if (itemType === null) {
      return null;  // 配列の要素型が無効な場合は全体もnull
    }
    return { kind: "array", itemType } as IRArray;
  }
  // ...
}
```

#### エラーメッセージの設計

- **明確性**: "Invalid"を使用（"Expected"より実行可能）
- **文脈情報**: どのvisitorで、どんな値が問題かを明示
- **実行可能**: ユーザーが何をすべきか理解できる内容

### 循環参照の処理

```typescript
interface VisitorContext {
  visited: Set<string>;  // 訪問済み$refを記録
  depth: number;         // 現在の深さ
  maxDepth: number;      // 最大深さ制限
}

function visitSchema(schema: SchemaObject, context: VisitorContext) {
  // 循環参照チェック
  const schemaId = getSchemaId(schema);
  if (context.visited.has(schemaId)) {
    return createCircularReference(schemaId);
  }
  
  // 深さ制限チェック
  if (context.depth >= context.maxDepth) {
    return createDepthLimitExceeded();
  }
  
  // 訪問を記録
  context.visited.add(schemaId);
  context.depth++;
  
  // 処理...
  
  context.depth--;
}
```

### エラーハンドリング

```typescript
class TransformerError extends Error {
  constructor(
    message: string,
    public path: string[],
    public cause?: unknown
  ) {
    super(message);
    this.name = 'TransformerError';
  }
}

function safeVisit<T>(
  visitor: () => T,
  context: VisitorContext
): T | null {
  try {
    return visitor();
  } catch (error) {
    console.warn(`Error at path ${context.path.join('.')}: ${error}`);
    return null;
  }
}
```

## BNF非終端記号とVisitorの対応表

| BNF非終端記号 | Visitor File | IR Type Output |
|--------------|--------------|----------------|
| `<openapi-object>` | openapi-visitor.ts | XcgenIR（ルート） |
| `<info-object>` | info-visitor.ts | IRMetadata |
| `<servers-array>` | servers-visitor.ts | IRServer[] |
| `<server-object>` | server-visitor.ts | IRServer |
| `<paths-object>` | paths-visitor.ts | IRService[] |
| `<path-item-object>` | path-item-visitor.ts | IREndpoint[] |
| `<operation-object>` | operation-visitor.ts | IREndpoint |
| `<parameter-object>` | parameter-visitor.ts | IRParameter |
| `<request-body-object>` | request-body-visitor.ts | IRRequestBody |
| `<responses-object>` | responses-visitor.ts | IRResponse[] |
| `<response-object>` | response-visitor.ts | IRResponse |
| `<media-type-object>` | media-type-visitor.ts | IRContentMap |
| `<schema-object>` | schema-visitor.ts | IRType |
| `<discriminator-object>` | discriminator-visitor.ts | discriminator情報 |
| `<components-object>` | components-visitor.ts | models/enums/unions |
| `<security-scheme-object>` | security-scheme-visitor.ts | IRSecurityScheme |
| `<tags-array>` | tags-visitor.ts | タグ情報 |
| `<tag-object>` | tag-visitor.ts | タグメタデータ |
| `<reference-object>` | reference-visitor.ts | IRRef |

## 期待される成果

1. **高品質なコード**
   - テストカバレッジ100%
   - 型安全性の保証
   - エッジケースの網羅

2. **保守性**
   - 明確な責任分離
   - 拡張可能な設計
   - 充実したドキュメント

3. **パフォーマンス**
   - 効率的なトラバース
   - メモリ使用量の最適化
   - Tree-shakingによる軽量化

4. **開発効率**
   - TDDによる確実な進捗
   - リファクタリングの安全性
   - デバッグの容易性

## 実装サマリー

### 完了済みタスク

#### Phase 1: Schema Object処理（完了）

- プリミティブ型処理（visitPrimitive）
- 汎用型解決（visitType）
- 配列型処理
- $ref参照処理
- format属性サポート
- nullable属性サポート

#### Phase 2: Components.schemas処理（完了）

- ✅ Step 5: Helper関数群（extractValidation、es-toolkit移行）
- ✅ Step 6: Enum処理（enum-visitor.ts、generate-enum-name.ts）
- ✅ Step 7: Object型処理（object-visitor.ts、required/nullable対応）
- ✅ Step 9: Schema統合Visitor（schema-visitor.ts、ネストオブジェクト/インラインenum抽出）
- ✅ Step 10: Components処理（components-visitor.ts、models/enums分類）

**将来実装（Phase 2.5）:**

- 🔜 Step 8: Union型処理（oneOf/anyOf/allOf）
- 🔜 discriminator対応
- 🔜 not（否定スキーマ）

### 実装予定タスク

#### Phase 3: Paths/Operation処理（実装予定）

- Step 11: 基本的なエンドポイント処理
  - paths-visitor.ts: PathsObjectからIRService[]生成
  - path-item-visitor.ts: HTTPメソッドごとのエンドポイント抽出
  - operation-visitor.ts（基本）: IREndpoint基本情報生成
  
- Step 12: パラメータ付きOperation
  - parameter-visitor.ts: IRParameter生成（path/query/header/cookie）
  - operation-visitor.ts（拡張）: パラメータ/リクエスト/レスポンス処理
  - response-visitor.ts: IRResponse生成（必要に応じて）

### 現在の成果

- **テスト数**: 151テスト全て合格（parser: 1, transformer: 150）
- **エラーハンドリング**: consola.warn + null返却パターンで統一
- **型安全性**: IRScalarType導入により型安全性向上
- **Tree-shaking**: 1ファイル1関数原則の徹底
- **Schema統合Visitor完成**: 中央ディスパッチャーによる型処理の統合実現

## 今後の展望

関数ベースのVisitorパターンとTDDの組み合わせにより、OpenAPI v3.1仕様に完全準拠した高品質なtransformer実装を実現します。段階的な実装とテストファーストのアプローチにより、確実で保守性の高いコードベースを構築できます。
