# IR（中間表現）詳細設計

## 概要

OpenAPI仕様書からコード生成に最適化された中間表現（Intermediate Representation, XcgenIR）への変換設計。
bundle()メソッドで$refを保持したOpenAPIドキュメントから、コード生成に必要な情報を抽出・整理する。

## 1. 設計原則

### 1.1 基本方針

- **完全性**: コード生成に必要な全情報を保持
- **シンプルさ**: YAGNI原則に基づき必要最小限の構造
- **型安全性**: TypeScriptの型システムを最大限活用
- **拡張性**: 新しい言語サポートの追加を考慮

### 1.2 設計上の制約

- $refは解決済み（名前は保持）
- 循環参照のサポート
- OpenAPI 3.xのみサポート

## 2. 型定義の詳細設計

### 2.1 全体構造

```
XcgenIR
├── metadata: IRMetadata           # API基本情報
├── models: IRModel[]              # データモデル
├── enums: IREnum[]                # 列挙型
├── unions: IRUnion[]              # Union型
├── services: IRService[]          # APIサービス（タグでグループ化）
├── servers: IRServer[]            # サーバー情報
└── security?: IRSecurityScheme[]  # セキュリティ定義
```

#### ファイル構造（実装済み）

```
packages/core/src/types/ir/
├── index.ts      # XcgenIRと全型の再エクスポート
├── data.ts       # データモデル関連（IRModel, IREnum, IRUnion, IRType等）
├── api.ts        # API関連（IRService, IREndpoint, IRParameter等）
└── config.ts     # 設定関連（IRMetadata, IRServer, IRSecurityScheme等）
```

### 2.2 型の関係図

```
    OpenAPIDocument (bundle後)
           |
           | transform()
           ↓
    XcgenIR
           |
    ┌──────┴──────┬──────────┬──────────┐
    ↓             ↓          ↓          ↓
  IRModels    IREnums    IRServices  IRUnions
    |            |          |          |
    ├─IRProperty └─IREnumValue├─IREndpoint └─IRType
    └─IRType               └─IRParameter
         ↑                       ↑
         └───────────────────────┘
              (型の参照: IRRef)
```

### 2.3 主要な型定義

#### XcgenIR

```typescript
export interface XcgenIR {
  metadata: IRMetadata;
  models: IRModel[];
  enums: IREnum[];
  unions: IRUnion[];
  services: IRService[];
  servers: IRServer[];
  security?: IRSecurityScheme[];
}
```

**設計理由**:

- フラットな構造で各生成器がアクセスしやすい
- componentsの階層構造を排除

#### IRType（判別共用体）

```typescript
// プリミティブ型
export interface IRPrimitive {
  kind: "primitive";
  type: "string" | "number" | "integer" | "boolean";
  format?: string;
  nullable?: boolean;
}

// 型への参照（統一）
export interface IRRef {
  kind: "ref";
  name: string;  // "User", "Status", "Pet" など
  nullable?: boolean;
}

// 配列型
export interface IRArray {
  kind: "array";
  itemType: IRType;
  nullable?: boolean;
}

// マップ型
export interface IRMap {
  kind: "map";
  valueType: IRType;
  nullable?: boolean;
}

// any型
export interface IRAny {
  kind: "any";
  nullable?: boolean;
}

// 判別共用体
export type IRType = IRPrimitive | IRRef | IRArray | IRMap | IRAny;
```

**設計理由**:

- 判別共用体（discriminated union）で型安全性を向上
- IRRefで全ての参照を統一（探索時に実際の型を判別）
- 再帰的な型定義で複雑な型も表現可能

## 3. 変換ロジック設計

### 3.1 変換フロー

```
1. Components探索（Phase 1）
   └─→ schemas配下を巡回
       ├─→ enum配列あり → IREnum抽出
       ├─→ oneOf/anyOf → IRUnion抽出
       └─→ type: object → IRModel抽出

2. Paths探索（Phase 2）
   └─→ 各パスのoperationを巡回
       ├─→ tagsでグループ化 → IRService作成
       ├─→ 各operation → IREndpoint作成
       └─→ インラインスキーマ検出 → 一意の名前を生成してIRModel作成
           ├─→ requestBodyのインラインオブジェクト
           ├─→ responsesのインラインオブジェクト
           └─→ ネストされたインラインオブジェクト（再帰的に探索）

3. 型解決
   └─→ $refを見つけたら
       ├─→ コンポーネント名を抽出（例: "#/components/schemas/Pet" → "Pet"）
       └─→ IRResolvedTypeに名前を設定（modelName: "Pet"）
```

### 3.2 $ref解決の実装

```typescript
private resolveRef(ref: string): IRRef {
  // "#/components/schemas/Pet" → "Pet"
  const name = ref.split('/').pop()!;
  
  // IRRefを返す（実際の型は探索時に判別）
  return {
    kind: "ref",
    name: name
  };
}

// 実際の型判別は別の箇所で実施
private resolveRefType(name: string): 'model' | 'enum' | 'union' {
  if (this.models.has(name)) return 'model';
  if (this.enums.has(name)) return 'enum';
  if (this.unions.has(name)) return 'union';
  
  throw new Error(`Unknown reference: ${name}`);
}
```

### 3.3 エッジケース処理

#### 循環参照

```typescript
// OK: 名前による参照なので問題なし
interface User {
  friends: IRProperty; // type: { kind: 'array', itemType: { kind: 'ref', name: 'User' } }
}
```

#### discriminator

```typescript
interface IRUnion {
  discriminator?: string; // 判別子プロパティ名
}
// oneOfでdiscriminatorが指定されている場合に設定
```

### 3.4 インラインスキーマ処理

#### 命名戦略

インラインスキーマに対して一意の名前を生成する3つのパターン：

```typescript
// パターン1: パス + メソッド + 位置ベース
"CreateUserRequest"     // POST /users のrequestBody
"CreateUserResponse200" // POST /users の200レスポンス
"GetUserByIdParams"     // GET /users/{id} のパラメータ
"UpdateUserRequest"     // PUT /users/{id} のrequestBody

// パターン2: operationIdベース（存在する場合）
"CreateUserInput"       // operationId: createUser のrequestBody
"CreateUserOutput"      // operationId: createUser のresponse

// パターン3: 階層的な命名（ネストされたオブジェクト）
"UserAddress"          // User内のaddressプロパティのインラインオブジェクト
"UserAddressGeo"       // さらにネストされた場合
```

#### 実装例

```typescript
class Transformer {
  private componentModels: Map<string, IRModel> = new Map();
  private inlineModels: Map<string, IRModel> = new Map();
  
  transform(doc: OpenAPIDocument): XcgenIR {
    // Phase 1: Components探索
    this.extractComponentModels(doc.components);
    
    // Phase 2: Paths探索（インラインスキーマ検出）
    this.extractInlineSchemas(doc.paths);
    
    // 結合
    return {
      models: [
        ...this.componentModels.values(),
        ...this.inlineModels.values()
      ],
      // ...
    };
  }
  
  private extractInlineSchemas(paths: Paths) {
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        // requestBodyのインラインスキーマ
        if (operation.requestBody?.content?.['application/json']?.schema) {
          const schema = operation.requestBody.content['application/json'].schema;
          if (!schema.$ref && schema.type === 'object') {
            const name = this.generateInlineName(path, method, 'Request', operation.operationId);
            this.inlineModels.set(name, this.schemaToModel(schema, name));
            
            // ネストされたインラインスキーマも探索
            this.extractNestedInlineSchemas(schema, name);
          }
        }
        
        // responseのインラインスキーマ
        for (const [status, response] of Object.entries(operation.responses || {})) {
          const schema = response.content?.['application/json']?.schema;
          if (schema && !schema.$ref && schema.type === 'object') {
            const name = this.generateInlineName(path, method, `Response${status}`, operation.operationId);
            this.inlineModels.set(name, this.schemaToModel(schema, name));
            
            // ネストされたインラインスキーマも探索
            this.extractNestedInlineSchemas(schema, name);
          }
        }
      }
    }
  }
  
  private generateInlineName(
    path: string, 
    method: string, 
    suffix: string,
    operationId?: string
  ): string {
    // operationIdが存在する場合は優先
    if (operationId) {
      return `${toPascalCase(operationId)}${suffix}`;
    }
    
    // パスベースの命名
    // /users/{id} → UsersById
    const pathPart = path
      .split('/')
      .filter(Boolean)
      .map(part => part.replace(/{(.+)}/, 'By$1'))
      .map(toPascalCase)
      .join('');
    
    // HTTPメソッドをアクション名に変換
    const methodMap = {
      'get': 'Get',
      'post': 'Create',
      'put': 'Update',
      'patch': 'Patch',
      'delete': 'Delete'
    };
    const methodPart = methodMap[method.toLowerCase()] || toPascalCase(method);
    
    return `${methodPart}${pathPart}${suffix}`;
  }
  
  private extractNestedInlineSchemas(
    schema: SchemaObject,
    parentName: string
  ): void {
    for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
      if (!propSchema.$ref && propSchema.type === 'object') {
        const nestedName = `${parentName}${toPascalCase(propName)}`;
        this.inlineModels.set(nestedName, this.schemaToModel(propSchema, nestedName));
        
        // 再帰的に探索
        this.extractNestedInlineSchemas(propSchema, nestedName);
      }
      
      // 配列の要素がインラインオブジェクトの場合
      if (propSchema.type === 'array' && 
          propSchema.items && 
          !propSchema.items.$ref && 
          propSchema.items.type === 'object') {
        const itemName = `${parentName}${toPascalCase(propName)}Item`;
        this.inlineModels.set(itemName, this.schemaToModel(propSchema.items, itemName));
        
        // 再帰的に探索
        this.extractNestedInlineSchemas(propSchema.items, itemName);
      }
    }
  }
}
```

#### 名前の衝突回避

```typescript
private ensureUniqueName(baseName: string): string {
  let name = baseName;
  let counter = 1;
  
  // componentModelsとinlineModelsの両方をチェック
  while (this.componentModels.has(name) || this.inlineModels.has(name)) {
    name = `${baseName}${counter}`;
    counter++;
  }
  
  return name;
}
```

## 4. 段階的実装計画

### Step 1: IR型定義 ✅ 完了

**実装済みの主要な型**:

```typescript
// packages/core/src/types/ir/index.ts
export interface XcgenIR {
  metadata: IRMetadata;
  models: IRModel[];
  enums: IREnum[];
  unions: IRUnion[];
  services: IRService[];
  servers: IRServer[];
  security?: IRSecurityScheme[];
}

// packages/core/src/types/ir/data.ts
export type IRType = IRPrimitive | IRRef | IRArray | IRMap | IRAny;

export interface IRModel {
  name: string;
  description?: string;
  properties: IRProperty[];
}

export interface IRProperty {
  name: string;
  description?: string;
  type: IRType;
  required: boolean;
  defaultValue?: unknown;
  deprecated?: boolean;
  validation?: IRValidation;
}
```

### Step 2: Transformer基本構造（次の実装ステップ）

```typescript
// packages/core/src/transformer/openapi-transformer.ts
export class OpenAPITransformer {
  transform(doc: OpenAPIDocument): XcgenIR {
    // TODO: 実装
  }
}
```

### Step 3: 今後の実装ステップ

- [ ] Transformerクラスの実装
- [ ] Components探索ロジック
- [ ] Paths探索ロジック
- [ ] インラインスキーマ抽出
- [ ] 型解決ロジック

## 5. テスト戦略

### 5.1 フィクスチャ準備

```yaml
# tests/fixtures/simple.yaml
openapi: 3.0.0
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
      required: [id]
```

### 5.2 段階的テスト

#### Task 5.1: 基本構造

```typescript
test('should create transformer', () => {
  const transformer = new Transformer();
  expect(transformer).toBeDefined();
});
```

#### Task 5.2: IRModel抽出

```typescript
test('should extract models', () => {
  const doc = loadFixture('simple.yaml');
  const ir = transformer.transform(doc);
  expect(ir.models).toHaveLength(1);
  expect(ir.models[0].name).toBe('User');
});
```

#### Task 5.3-5.7: 各機能のテスト

- IREnum抽出テスト
- IRUnion型テスト
- IRService/IREndpoint抽出テスト
- 型解決テスト
- 依存関係解析テスト

#### Task 5.8: インラインスキーマ抽出テスト

```typescript
test('should extract inline schemas from requestBody', () => {
  const doc = loadFixture('inline-schemas.yaml');
  const ir = transformer.transform(doc);
  
  // requestBodyのインラインスキーマが抽出されている
  const createUserRequest = ir.models.find(m => m.name === 'CreateUserRequest');
  expect(createUserRequest).toBeDefined();
  expect(createUserRequest.properties).toContainEqual(
    expect.objectContaining({ name: 'email' })
  );
});

test('should extract nested inline schemas', () => {
  const doc = loadFixture('nested-inline.yaml');
  const ir = transformer.transform(doc);
  
  // ネストされたインラインスキーマが抽出されている
  const userAddress = ir.models.find(m => m.name === 'CreateUserRequestAddress');
  expect(userAddress).toBeDefined();
  
  // さらにネストされたスキーマ
  const userAddressGeo = ir.models.find(m => m.name === 'CreateUserRequestAddressGeo');
  expect(userAddressGeo).toBeDefined();
});

test('should handle name conflicts', () => {
  const doc = loadFixture('name-conflicts.yaml');
  const ir = transformer.transform(doc);
  
  // 同じ名前になりそうなインラインスキーマが区別されている
  const models = ir.models.filter(m => m.name.startsWith('User'));
  const uniqueNames = new Set(models.map(m => m.name));
  expect(uniqueNames.size).toBe(models.length);
});
```

#### インラインスキーマのフィクスチャ例

```yaml
# tests/fixtures/inline-schemas.yaml
openapi: 3.0.0
paths:
  /users:
    post:
      operationId: createUser
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                address:  # ネストされたインラインオブジェクト
                  type: object
                  properties:
                    street:
                      type: string
                    city:
                      type: string
                    geo:  # さらにネストされたオブジェクト
                      type: object
                      properties:
                        lat:
                          type: number
                        lng:
                          type: number
      responses:
        '201':
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  email:
                    type: string
```

### 5.3 統合テスト

```typescript
test('should transform complete OpenAPI document', () => {
  const doc = loadFixture('petstore.yaml');
  const ir = transformer.transform(doc);
  
  // 全体構造の検証
  expect(ir.metadata.title).toBeDefined();
  expect(ir.models.length).toBeGreaterThan(0);
  expect(ir.services.length).toBeGreaterThan(0);
  
  // 型解決の検証
  const petModel = ir.models.find(m => m.name === 'Pet');
  expect(petModel).toBeDefined();
});
```

## 6. 実装チェックリスト

- [x] Task 5.0: IR型定義作成 ✅ 完了
  - [x] `src/types/ir/` ディレクトリ作成
  - [x] `data.ts` - データモデル関連
  - [x] `api.ts` - APIエンドポイント関連
  - [x] `config.ts` - 設定・メタデータ関連
  - [x] `index.ts` - 統合エクスポート
  - [x] 判別共用体（IRType）の実装
  - [x] type aliasの追加（MimeType, IRContentMap等）
  - [x] インライン型の分離（IRContact, IRLicense等）

- [ ] Task 5.1: Transformer基本構造
  - [ ] クラス作成
  - [ ] 空のtransform()メソッド

- [ ] Task 5.2: IRModel抽出
  - [ ] components.schemas巡回
  - [ ] IRModel型への変換

- [ ] Task 5.3: IREnum抽出
  - [ ] enum配列の検出
  - [ ] IREnum型への変換

- [ ] Task 5.4: IRUnion型抽出
  - [ ] oneOf/anyOf検出
  - [ ] IRUnion作成

- [ ] Task 5.5: IRService/IREndpoint抽出
  - [ ] paths巡回
  - [ ] tagsによるグループ化

- [ ] Task 5.6: 型解決
  - [ ] $ref解決ロジック
  - [ ] IRResolvedType完全実装

- [ ] Task 5.7: 依存関係解析
  - [ ] imports配列生成
  - [ ] 循環参照チェック

- [ ] Task 5.8: インラインスキーマ抽出
  - [ ] requestBodyのインラインスキーマ検出
  - [ ] responsesのインラインスキーマ検出
  - [ ] ネストされたインラインスキーマの再帰的探索
  - [ ] 一意の名前生成ロジック
  - [ ] 名前の衝突回避処理

## 7. 実装済みの設計決定

### 7.1 bundle()メソッドの採用

- dereference()ではなくbundle()を使用
- $refを保持し、コンポーネント名を保存

### 7.2 判別共用体の採用

- IRTypeを判別共用体として実装
- 型安全性とコードの明確性を向上

### 7.3 型の分離と整理

- インライン型定義を独立した型に分離
- Record型をtype aliasに変換（意図を明確化）

## 8. 今後の拡張ポイント

### 7.1 追加可能な機能

- OpenAPI 3.1サポート
- webhooks対応
- callbacks対応
- links対応

### 7.2 最適化

- 型の重複排除
- 未使用型の削除
- 型の正規化

## 8. 参考資料

- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [TypeScript Handbook - Type Manipulation](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [@apidevtools/swagger-parser Documentation](https://apitools.dev/swagger-parser/docs/)
