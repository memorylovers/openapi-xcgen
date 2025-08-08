# openapi-xcgen Core実装の詳細設計

## 概要

このドキュメントは、openapi-xcgenのCore実装における詳細設計を記述します。
OpenAPI仕様書からTypeScript/Dartコードを生成するための、各コンポーネントの設計と実装方針を定義します。

## 全体アーキテクチャ詳細

### 3層アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    Input Layer                           │
│                  YAML/JSON Files                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               Parser & Validator Layer                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │          OpenAPIDocument (Raw Structure)        │    │
│  │  - Direct mapping of OpenAPI spec               │    │
│  │  - Contains $refs and nested definitions        │    │
│  │  - Preserves original structure                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Transformation Layer                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │   IntermediateRepresentation (Optimized for     │    │
│  │                Code Generation)                  │    │
│  │  - Fully resolved types (no $refs)              │    │
│  │  - Flattened component lists                    │    │
│  │  - Services grouped by tags                     │    │
│  │  - Complete dependency graph                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Generation Layer                        │
│  ┌──────────────────┐         ┌──────────────────┐      │
│  │   TypeScript     │         │      Dart        │      │
│  │   Generator      │         │    Generator     │      │
│  └──────────────────┘         └──────────────────┘      │
│            ↓                           ↓                 │
│     TypeScript Code              Dart Code              │
└─────────────────────────────────────────────────────────┘
```

### 詳細コンポーネント図

```
┌──────────────────────────────────────────────────────────┐
│                      CLI Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ CLI Commands │  │ Config Loader│  │ File System  │   │
│  │  (citty)     │  │              │  │  Operations  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────┐
│                       Core Engine                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                    Parser                         │   │
│  │  - OpenAPI parse with bundle()                    │   │
│  │  - Validation by @apidevtools/swagger-parser      │   │
│  │  - Preserve $refs as internal references          │   │
│  └──────────────────────────────────────────────────┘   │
│                              ↓                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Advanced Transformer                 │   │
│  │  - Extract Models, Enums, Unions from components  │   │
│  │  - Resolve $refs while preserving names           │   │
│  │  - Group Services by Tags                         │   │
│  │  - Analyze Dependencies                           │   │
│  └──────────────────────────────────────────────────┘   │
│                              ↓                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Intermediate Representation (IR)          │   │
│  │  - Flat component lists                           │   │
│  │  - Fully resolved types                           │   │
│  │  - Service-oriented structure                     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────┐
│                     Code Generators                       │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │   TypeScript     │         │      Dart        │       │
│  │   Generator      │         │    Generator     │       │
│  │                  │         │                  │       │
│  │ ·Models         │         │ ·Models          │       │
│  │ ·Schemas        │         │ ·Serialization   │       │
│  │ ·Services       │         │ ·Services        │       │
│  │ ·Client         │         │ ·Client          │       │
│  └──────────────────┘         └──────────────────┘       │
│            ↓                           ↓                  │
│     TypeScript Code              Dart Code               │
└──────────────────────────────────────────────────────────┘
```

## コンポーネント詳細設計

### 1. Core Engine (`packages/core/src/`)

#### 1.1 types.ts - 共通型定義

##### Layer 1: OpenAPI Raw Structure (生のOpenAPI構造)

```typescript
// @apidevtools/swagger-parserとopenapi-typesの型をそのまま利用
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// OpenAPI 3.0と3.1の両方をサポート
export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

// よく使う型のエイリアス（開発効率のため）
export type OpenAPIV3Document = OpenAPIV3_1.Document;
export type PathsObject = OpenAPIV3_1.PathsObject;
export type PathItemObject = OpenAPIV3_1.PathItemObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type ReferenceObject = OpenAPIV3_1.ReferenceObject;
export type ParameterObject = OpenAPIV3_1.ParameterObject;
export type RequestBodyObject = OpenAPIV3_1.RequestBodyObject;
export type ResponseObject = OpenAPIV3_1.ResponseObject;
export type ComponentsObject = OpenAPIV3_1.ComponentsObject;
export type SecuritySchemeObject = OpenAPIV3_1.SecuritySchemeObject;
export type ServerObject = OpenAPIV3_1.ServerObject;
export type InfoObject = OpenAPIV3_1.InfoObject;
export type TagObject = OpenAPIV3_1.TagObject;

// ヘルパー型
export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

// 型ガード関数
export function isReferenceObject(obj: any): obj is ReferenceObject {
  return obj && typeof obj === 'object' && '$ref' in obj;
}

export function isOpenAPIV3Document(doc: OpenAPIDocument): doc is OpenAPIV3.Document {
  return 'openapi' in doc && doc.openapi.startsWith('3.0');
}

export function isOpenAPIV3_1Document(doc: OpenAPIDocument): doc is OpenAPIV3_1.Document {
  return 'openapi' in doc && doc.openapi.startsWith('3.1');
}
```

##### Layer 2: Intermediate Representation (コード生成用に最適化)

```typescript
// コード生成に特化した中間表現
export interface IntermediateRepresentation {
  metadata: APIMetadata;
  
  // フラットなコンポーネントリスト（完全に解決済み）
  models: Model[];           // すべてのモデル定義
  enums: Enum[];            // すべてのEnum定義
  unions: UnionType[];      // すべてのUnion型定義
  
  // サービスごとにグループ化されたエンドポイント
  services: Service[];       // タグごとにグループ化されたAPI
  
  // グローバル設定
  servers: Server[];
  security?: SecurityScheme[];
}

// APIメタデータ
export interface APIMetadata {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
}

// モデル定義（完全に解決済み、$ref無し）
export interface Model {
  name: string;
  description?: string;
  properties: Property[];
  required: string[];
  extends?: string[];        // 継承元モデル
  
  // コード生成用のメタデータ
  imports: string[];         // このモデルが依存する他のモデル
  validation: ValidationRules;
  examples?: Record<string, any>;
}

// プロパティ定義（完全に解決済み）
export interface Property {
  name: string;
  type: ResolvedType;        // 完全に解決された型
  required: boolean;
  nullable: boolean;
  description?: string;
  example?: any;
  default?: any;
  deprecated?: boolean;
  
  // バリデーション（フラット化）
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  format?: string;           // email, uri, uuid, date, date-time, etc.
}

// 解決済みの型定義（$ref無し、すべて解決済み）
export interface ResolvedType {
  kind: 'primitive' | 'model' | 'enum' | 'array' | 'map' | 'union' | 'any';
  
  // primitive types
  primitive?: 'string' | 'number' | 'integer' | 'boolean' | 'null';
  format?: string;           // date, date-time, uuid, email, uri, etc.
  
  // reference types (名前で参照)
  modelName?: string;        // Modelへの参照
  enumName?: string;         // Enumへの参照
  unionName?: string;        // Unionへの参照
  
  // complex types
  arrayType?: ResolvedType;  // 配列の要素型
  mapValueType?: ResolvedType; // Mapの値の型
  unionTypes?: ResolvedType[]; // Union内の型リスト
}

// Enum定義
export interface Enum {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'integer';
  values: EnumValue[];
}

export interface EnumValue {
  name: string;              // コードで使用する名前
  value: string | number;    // 実際の値
  description?: string;
}

// Union型定義
export interface UnionType {
  name: string;
  description?: string;
  types: ResolvedType[];     // Unionを構成する型
  discriminator?: string;    // 判別子プロパティ名
}

// サービス定義（タグごとにグループ化）
export interface Service {
  name: string;               // タグ名またはdefault
  description?: string;
  basePath?: string;          // 共通パス（あれば）
  endpoints: Endpoint[];
}

// エンドポイント定義（完全に解決済み）
export interface Endpoint {
  operationId: string;        // ユニークな関数名
  method: string;              // HTTP method (uppercase)
  path: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  
  // パラメータ（型は完全に解決済み）
  pathParams: Parameter[];
  queryParams: Parameter[];
  headerParams: Parameter[];
  cookieParams: Parameter[];
  
  // ボディ（型は完全に解決済み）
  requestBody?: RequestBodyResolved;
  
  // レスポンス（型は完全に解決済み）
  responses: ResponseResolved[];
  
  // セキュリティ
  security?: string[];
  
  // コード生成用メタデータ
  imports: string[];          // このエンドポイントが使用する型
}

// パラメータ定義（完全に解決済み）
export interface Parameter {
  name: string;
  type: ResolvedType;
  required: boolean;
  description?: string;
  example?: any;
  default?: any;
  deprecated?: boolean;
  
  // バリデーション
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

// リクエストボディ（解決済み）
export interface RequestBodyResolved {
  required: boolean;
  description?: string;
  contentType: string;        // "application/json", "multipart/form-data", etc.
  type: ResolvedType;
  examples?: Record<string, any>;
}

// レスポンス（解決済み）
export interface ResponseResolved {
  status: number | 'default';
  description: string;
  contentType?: string;
  type?: ResolvedType;
  examples?: Record<string, any>;
}

// HTTPメソッド (Layer 1で定義済み)

// バリデーションルール
export interface ValidationRules {
  required?: string[];
  minLength?: Record<string, number>;
  maxLength?: Record<string, number>;
  pattern?: Record<string, string>;
  minimum?: Record<string, number>;
  maximum?: Record<string, number>;
  email?: string[];
  url?: string[];
  uuid?: string[];
}
```

##### Layer 3: Generator Configuration

```typescript
// 生成設定
export interface GeneratorConfig {
  input: string | URL;
  output: string;
  language: 'typescript' | 'dart';
  options?: LanguageOptions;
}

// 言語固有オプション
export interface LanguageOptions {
  typescript?: TypeScriptOptions;
  dart?: DartOptions;
}

// TypeScriptオプション
export interface TypeScriptOptions {
  validator: 'valibot' | 'zod';
  runtime: 'fetch' | 'axios';
  module: 'esm' | 'cjs';
  strictNullChecks: boolean;
  generateComments: boolean;
}

// Dartオプション
export interface DartOptions {
  serialization: 'json_serializable' | 'freezed';
  httpClient: 'http' | 'dio';
  nullSafety: boolean;
  generateEquatable: boolean;
}
```

#### 1.2 parser.ts - OpenAPIパーサー（簡素化版）

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';
import { consola } from 'consola';
import type { OpenAPIDocument } from './types';

export class OpenAPIParser {
  private logger = consola.withTag('parser');

  /**
   * OpenAPI仕様書をパースしてバンドル
   * bundleメソッドを使用して$refを内部参照として保持
   * これによりコンポーネント名を保持したままコード生成が可能
   */
  async parse(input: string | URL): Promise<OpenAPIDocument> {
    this.logger.info(`Parsing OpenAPI document from: ${input}`);
    
    try {
      // bundleメソッド: $refを内部参照として保持
      // バリデーションも同時に実行される
      const api = await SwaggerParser.bundle(input);
      
      // OpenAPIバージョン確認
      const openapiVersion = (api as any).openapi;
      if (!openapiVersion || !openapiVersion.startsWith('3.')) {
        throw new ParserError(`Invalid OpenAPI version: ${openapiVersion}. Only OpenAPI 3.x is supported.`);
      }
      
      return api as OpenAPIDocument;
    } catch (error) {
      this.logger.error('Failed to parse OpenAPI document:', error);
      throw new ParserError(`Failed to parse OpenAPI document: ${error.message}`);
    }
  }
  
  // YAGNI原則に基づき、以下のメソッドは実装しない:
  // - parseFromString: ファイルパースで十分
  // - dereference: bundleでコンポーネント名を保持
}

export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParserError';
  }
}
```

#### 1.3 validator.ts - バリデーション（スキップ）

```typescript
// YAGNI原則に基づき、独立したバリデーターは実装しない
// @apidevtools/swagger-parserがbundle()メソッド内で
// OpenAPI仕様のバリデーションを自動的に実行してくれる
// 
// 必要になった場合のみ、カスタムバリデーションを追加
// 例: 特定の命名規則チェック、カスタムルールなど
```

#### 1.4 resolver.ts - 参照解決（スキップ）

```typescript
// YAGNI原則に基づき、独立したResolverクラスは実装しない
// 
// 参照解決の機能は：
// 1. bundle()メソッドが$refを内部参照として保持
// 2. Transformer内で必要に応じて$refを解決
//    - コンポーネント名を保持しながら解決
//    - ヘルパー関数で十分
// 
// 例: Transformer内のヘルパー関数
// private resolveRef(ref: string, doc: OpenAPIDocument): { name: string, schema: any } {
//   const name = ref.split('/').pop();
//   // componentsからスキーマを取得
//   return { name, schema };
// }
```

#### 1.5 transformer.ts - 中間表現への変換

```typescript
import type {
  OpenAPIDocument,
  PathsObject,
  ComponentsObject,
  SchemaObject,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  HTTPMethod,
  isReferenceObject,
  IntermediateRepresentation,
  Model,
  Enum,
  UnionType,
  Service,
  Endpoint,
  ResolvedType,
  Property,
  Parameter,
} from './types';
import { ReferenceResolver } from './resolver';
import type { OpenAPIV3_1 } from 'openapi-types';

export class AdvancedTransformer {
  private models: Map<string, Model> = new Map();
  private enums: Map<string, Enum> = new Map();
  private unions: Map<string, UnionType> = new Map();
  private typeRegistry: Map<string, ResolvedType> = new Map();

  constructor() {
    // Resolverクラスは不要、bundle()後のドキュメントを処理
  }

  /**
   * OpenAPIドキュメントを中間表現に変換
   * bundle()メソッドで$refが内部参照として保持されたドキュメントを処理
   */
  transform(doc: OpenAPIDocument): IntermediateRepresentation {
    // 1. components配下を探索してモデル・型を収集
    
    // 2. スキーマからモデル、Enum、Unionを抽出
    this.extractComponents(doc.components);
    
    // 3. パスをサービスごとにグループ化
    const services = this.groupIntoServices(doc.paths);
    
    // 4. 各エンドポイントの型を完全に解決
    services.forEach(service => {
      service.endpoints.forEach(endpoint => {
        this.resolveEndpointTypes(endpoint);
      });
    });
    
    // 5. 依存関係を解析
    this.analyzeDependencies();
    
    return {
      metadata: {
        title: doc.info.title,
        version: doc.info.version,
        description: doc.info.description,
        baseUrl: doc.servers?.[0]?.url,
      },
      models: Array.from(this.models.values()),
      enums: Array.from(this.enums.values()),
      unions: Array.from(this.unions.values()),
      services,
      servers: doc.servers || [],
      security: this.extractSecuritySchemes(doc.components),
    };
  }

  /**
   * コンポーネントを抽出（モデル、Enum、Union）
   * bundle()後のcomponentsには全てのコンポーネントが定義されている
   */
  private extractComponents(components?: ComponentsObject): void {
    if (!components?.schemas) return;

    Object.entries(components.schemas).forEach(([name, schemaOrRef]) => {
      // bundle()後なので、components内に$refは存在しない
      // 名前付きでスキーマを処理
      if (!isReferenceObject(schemaOrRef)) {
        this.processSchema(name, schemaOrRef as SchemaObject);
      }
    });
  }

  /**
   * スキーマを処理
   */
  private processSchema(name: string, schema: SchemaObject): void {
    // Enumの場合
    if (schema.enum) {
      this.enums.set(name, this.createEnum(name, schema));
      return;
    }

    // Union型の場合（oneOf, anyOf）
    if (schema.oneOf || schema.anyOf) {
      this.unions.set(name, this.createUnion(name, schema));
      return;
    }

    // 通常のモデル
    if (schema.type === 'object' || schema.properties) {
      this.models.set(name, this.createModel(name, schema));
    }
  }

  /**
   * モデルを作成
   */
  private createModel(name: string, schema: SchemaObject): Model {
    const properties: Property[] = [];
    const required = schema.required || [];
    const imports: string[] = [];

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
        const property = this.createProperty(propName, propSchema, required.includes(propName));
        properties.push(property);
        
        // 依存する型を収集
        this.collectImports(property.type, imports);
      });
    }

    return {
      name,
      description: schema.description,
      properties,
      required,
      extends: schema.allOf ? this.extractExtends(schema.allOf) : undefined,
      imports: [...new Set(imports)],
      validation: this.extractValidationRules(schema),
      examples: schema.examples,
    };
  }

  /**
   * プロパティを作成
   */
  private createProperty(name: string, schema: SchemaObject, isRequired: boolean): Property {
    const type = this.resolveType(schema);
    
    return {
      name,
      type,
      required: isRequired,
      nullable: schema.nullable || false,
      description: schema.description,
      example: schema.example,
      default: schema.default,
      deprecated: schema.deprecated,
      // バリデーション
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
      minimum: schema.minimum,
      maximum: schema.maximum,
      enum: schema.enum,
      format: schema.format,
    };
  }

  /**
   * 型を解決
   * bundle()後でも$refは内部参照として残っているため、
   * コンポーネント名を抽出して型を解決
   */
  private resolveType(schema: SchemaObject | OpenAPIV3_1.ReferenceObject): ResolvedType {
    // キャッシュチェック
    const cacheKey = JSON.stringify(schema);
    if (this.typeRegistry.has(cacheKey)) {
      return this.typeRegistry.get(cacheKey)!;
    }

    let resolvedType: ResolvedType;

    // 参照の場合（#/components/schemas/Pet など）
    if (schema.$ref) {
      const refName = this.extractRefName(schema.$ref); // "Pet"を抽出
      // コンポーネント名を保持したまま型を解決
      if (this.models.has(refName)) {
        resolvedType = { kind: 'model', modelName: refName };
      } else if (this.enums.has(refName)) {
        resolvedType = { kind: 'enum', enumName: refName };
      } else if (this.unions.has(refName)) {
        resolvedType = { kind: 'union', unionName: refName };
      } else {
        resolvedType = { kind: 'any' };
      }
    }
    // 配列の場合
    else if (schema.type === 'array') {
      resolvedType = {
        kind: 'array',
        arrayType: this.resolveType(schema.items || {}),
      };
    }
    // オブジェクト（Map）の場合
    else if (schema.type === 'object' && schema.additionalProperties) {
      resolvedType = {
        kind: 'map',
        mapValueType: this.resolveType(schema.additionalProperties),
      };
    }
    // Union型の場合
    else if (schema.oneOf || schema.anyOf) {
      const unionTypes = (schema.oneOf || schema.anyOf).map((s: any) => this.resolveType(s));
      resolvedType = {
        kind: 'union',
        unionTypes,
      };
    }
    // プリミティブ型の場合
    else if (schema.type) {
      resolvedType = {
        kind: 'primitive',
        primitive: schema.type as any,
        format: schema.format,
      };
    }
    // その他
    else {
      resolvedType = { kind: 'any' };
    }

    this.typeRegistry.set(cacheKey, resolvedType);
    return resolvedType;
  }

  /**
   * パスをサービスごとにグループ化
   */
  private groupIntoServices(paths: PathsObject): Service[] {
    const serviceMap = new Map<string, Endpoint[]>();

    Object.entries(paths).forEach(([path, pathItem]) => {
      const methods: HTTPMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      
      methods.forEach(method => {
        const operation = pathItem[method] as OperationObject | undefined;
        if (operation) {
          const tag = operation.tags?.[0] || 'default';
          
          if (!serviceMap.has(tag)) {
            serviceMap.set(tag, []);
          }

          const endpoint = this.createEndpoint(method.toUpperCase(), path, operation);
          serviceMap.get(tag)!.push(endpoint);
        }
      });
    });

    return Array.from(serviceMap.entries()).map(([name, endpoints]) => ({
      name,
      description: `${name} service`,
      endpoints,
    }));
  }

  /**
   * エンドポイントを作成
   */
  private createEndpoint(method: string, path: string, operation: OperationObject): Endpoint {
    const { pathParams, queryParams, headerParams, cookieParams } = this.extractParameters(operation.parameters);
    
    return {
      operationId: operation.operationId || this.generateOperationId(method, path),
      method: method.toUpperCase(),
      path,
      summary: operation.summary,
      description: operation.description,
      deprecated: operation.deprecated,
      pathParams,
      queryParams,
      headerParams,
      cookieParams,
      requestBody: this.extractRequestBody(operation.requestBody),
      responses: this.extractResponses(operation.responses),
      security: operation.security?.map((s: any) => Object.keys(s)[0]),
      imports: [],
    };
  }

  /**
   * Enumを作成
   */
  private createEnum(name: string, schema: SchemaObject): Enum {
    const type = schema.type || 'string';
    const values = schema.enum.map((value: any, index: number) => ({
      name: this.toEnumName(value, index),
      value,
      description: schema['x-enum-descriptions']?.[index],
    }));

    return {
      name,
      description: schema.description,
      type,
      values,
    };
  }

  /**
   * Union型を作成
   */
  private createUnion(name: string, schema: SchemaObject): UnionType {
    const types = (schema.oneOf || schema.anyOf).map((s: any) => this.resolveType(s));
    
    return {
      name,
      description: schema.description,
      types,
      discriminator: schema.discriminator?.propertyName,
    };
  }

  /**
   * パラメータを抽出して分類
   */
  private extractParameters(parameters?: (ParameterObject | OpenAPIV3_1.ReferenceObject)[]): {
    pathParams: Parameter[];
    queryParams: Parameter[];
    headerParams: Parameter[];
    cookieParams: Parameter[];
  } {
    const result = {
      pathParams: [] as Parameter[],
      queryParams: [] as Parameter[],
      headerParams: [] as Parameter[],
      cookieParams: [] as Parameter[],
    };

    if (!parameters) return result;

    parameters.forEach(paramOrRef => {
      // 参照の場合はスキップ（resolverで解決済みのはず）
      if (isReferenceObject(paramOrRef)) return;
      
      const param = paramOrRef as ParameterObject;
      const parameter: Parameter = {
        name: param.name,
        type: this.resolveType(param.schema || { type: 'string' }),
        required: param.required || false,
        description: param.description,
        example: param.example,
        default: param.default,
        deprecated: param.deprecated,
        minLength: param.schema?.minLength,
        maxLength: param.schema?.maxLength,
        pattern: param.schema?.pattern,
        minimum: param.schema?.minimum,
        maximum: param.schema?.maximum,
      };

      switch (param.in) {
        case 'path':
          result.pathParams.push(parameter);
          break;
        case 'query':
          result.queryParams.push(parameter);
          break;
        case 'header':
          result.headerParams.push(parameter);
          break;
        case 'cookie':
          result.cookieParams.push(parameter);
          break;
      }
    });

    return result;
  }

  /**
   * operationIdを生成
   */
  private generateOperationId(method: string, path: string): string {
    const pathSegments = path
      .split('/')
      .filter(s => s && !s.startsWith('{'))
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    return method + pathSegments.join('');
  }

  /**
   * リクエストボディを抽出
   */
  private extractRequestBody(requestBody?: RequestBodyObject | OpenAPIV3_1.ReferenceObject): RequestBodyResolved | undefined {
    if (!requestBody) {
      return undefined;
    }

    // サポートするコンテンツタイプを優先順位で処理
    const contentTypes = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
    let content: any;
    let contentType: string | undefined;

    for (const ct of contentTypes) {
      if (requestBody.content?.[ct]) {
        content = requestBody.content[ct];
        contentType = ct;
        break;
      }
    }

    if (!content || !contentType) {
      return undefined;
    }

    return {
      required: requestBody.required || false,
      description: requestBody.description,
      contentType,
      type: this.resolveType(content.schema),
      examples: content.examples,
    };
  }

  /**
   * レスポンスを抽出
   */
  private extractResponses(responses?: OpenAPIV3_1.ResponsesObject): ResponseResolved[] {
    if (!responses) {
      return [];
    }

    return Object.entries(responses).map(([status, responseOrRef]) => {
      // 参照の場合はスキップ（resolverで解決済みのはず）
      if (isReferenceObject(responseOrRef)) {
        return {
          status: status === 'default' ? 'default' : parseInt(status, 10),
          description: 'Response reference',
          contentType: undefined,
          type: undefined,
          examples: undefined,
        };
      }
      
      const response = responseOrRef as ResponseObject;
      const content = response.content?.['application/json'];
      
      return {
        status: status === 'default' ? 'default' : parseInt(status, 10),
        description: response.description || '',
        contentType: content ? 'application/json' : undefined,
        type: content ? this.resolveType(content.schema) : undefined,
        examples: content?.examples,
      };
    });
  }

  /**
   * 依存関係を解析
   */
  private analyzeDependencies(): void {
    // モデル間の依存関係を解析
    this.models.forEach(model => {
      const imports = new Set<string>();
      
      model.properties.forEach(prop => {
        this.collectImports(prop.type, imports);
      });
      
      model.imports = Array.from(imports);
    });

    // サービスの依存関係を解析
    // (エンドポイントが使用する型を収集)
  }

  /**
   * 型から依存をする型名を収集
   */
  private collectImports(type: ResolvedType, imports: Set<string>): void {
    switch (type.kind) {
      case 'model':
        if (type.modelName) imports.add(type.modelName);
        break;
      case 'enum':
        if (type.enumName) imports.add(type.enumName);
        break;
      case 'union':
        if (type.unionName) {
          imports.add(type.unionName);
        } else if (type.unionTypes) {
          type.unionTypes.forEach(t => this.collectImports(t, imports));
        }
        break;
      case 'array':
        if (type.arrayType) this.collectImports(type.arrayType, imports);
        break;
      case 'map':
        if (type.mapValueType) this.collectImports(type.mapValueType, imports);
        break;
    }
  }

  /**
   * ヘルパーメソッド群
   */
  private extractRefName(ref: string): string {
    return ref.split('/').pop() || '';
  }

  private toEnumName(value: any, index: number): string {
    if (typeof value === 'string' && /^[A-Z][A-Z0-9_]*$/.test(value)) {
      return value;
    }
    return `VALUE_${index}`;
  }

  private extractExtends(allOf: (SchemaObject | OpenAPIV3_1.ReferenceObject)[]): string[] {
    return allOf
      .filter(item => item.$ref)
      .map(item => this.extractRefName(item.$ref));
  }

  private extractValidationRules(schema: SchemaObject): ValidationRules {
    const rules: ValidationRules = {};
    
    if (schema.required) rules.required = schema.required;
    
    // プロパティごとのバリデーションルールを収集
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, propOrRef]) => {
        if (isReferenceObject(propOrRef)) return;
        const prop = propOrRef as SchemaObject;
        if (prop.minLength !== undefined) {
          if (!rules.minLength) rules.minLength = {};
          rules.minLength[name] = prop.minLength;
        }
        if (prop.maxLength !== undefined) {
          if (!rules.maxLength) rules.maxLength = {};
          rules.maxLength[name] = prop.maxLength;
        }
        if (prop.pattern) {
          if (!rules.pattern) rules.pattern = {};
          rules.pattern[name] = prop.pattern;
        }
        if (prop.minimum !== undefined) {
          if (!rules.minimum) rules.minimum = {};
          rules.minimum[name] = prop.minimum;
        }
        if (prop.maximum !== undefined) {
          if (!rules.maximum) rules.maximum = {};
          rules.maximum[name] = prop.maximum;
        }
      });
    }
    
    return rules;
  }

  private extractSecuritySchemes(components?: ComponentsObject): any[] {
    if (!components?.securitySchemes) return [];
    
    return Object.entries(components.securitySchemes).map(([name, schemeOrRef]) => {
      if (isReferenceObject(schemeOrRef)) {
        return { name, type: 'reference' };
      }
      
      const scheme = schemeOrRef as SecuritySchemeObject;
      return {
      name,
      type: scheme.type,
      description: scheme.description,
      scheme: scheme.scheme,
      bearerFormat: scheme.bearerFormat,
      flows: scheme.flows,
    }));
  }

  private resolveEndpointTypes(endpoint: Endpoint): void {
    const imports = new Set<string>();
    
    // パラメータの型を収集
    [...endpoint.pathParams, ...endpoint.queryParams, ...endpoint.headerParams, ...endpoint.cookieParams]
      .forEach(param => this.collectImports(param.type, imports));
    
    // リクエストボディの型を収集
    if (endpoint.requestBody) {
      this.collectImports(endpoint.requestBody.type, imports);
    }
    
    // レスポンスの型を収集
    endpoint.responses.forEach(response => {
      if (response.type) {
        this.collectImports(response.type, imports);
      }
    });
    
    endpoint.imports = Array.from(imports);
  }
}
```

### 2. CLI Interface (`packages/core/src/cli/`)

#### 2.1 commands.ts - コマンド定義

```typescript
import { defineCommand } from 'citty';
import { consola } from 'consola';
import { resolve } from 'pathe';
import { loadConfig } from './config';
import { generateCode } from '../generator';

export const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate code from OpenAPI specification',
  },
  args: {
    input: {
      type: 'string',
      description: 'Path or URL to OpenAPI specification',
      required: true,
    },
    output: {
      type: 'string',
      description: 'Output directory for generated code',
      required: true,
    },
    language: {
      type: 'string',
      description: 'Target language (typescript, dart)',
      required: true,
    },
    config: {
      type: 'string',
      description: 'Path to configuration file',
    },
    watch: {
      type: 'boolean',
      description: 'Watch for changes and regenerate',
      default: false,
    },
    dry: {
      type: 'boolean',
      description: 'Dry run without writing files',
      default: false,
    },
  },
  async run({ args }) {
    const logger = consola.withTag('cli');
    
    try {
      // 設定をロード
      const config = await loadConfig(args.config);
      
      // コマンドライン引数で上書き
      const finalConfig = {
        ...config,
        input: args.input || config.input,
        output: args.output || config.output,
        language: args.language || config.language,
        options: {
          ...config.options,
          dry: args.dry,
        },
      };

      logger.info('Generating code...');
      logger.info(`Input: ${finalConfig.input}`);
      logger.info(`Output: ${finalConfig.output}`);
      logger.info(`Language: ${finalConfig.language}`);

      // コード生成を実行
      await generateCode(finalConfig);

      logger.success('Code generation completed successfully!');
    } catch (error) {
      logger.error('Code generation failed:', error);
      process.exit(1);
    }
  },
});

export const validateCommand = defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate OpenAPI specification',
  },
  args: {
    input: {
      type: 'string',
      description: 'Path or URL to OpenAPI specification',
      required: true,
    },
  },
  async run({ args }) {
    const logger = consola.withTag('cli');
    
    try {
      logger.info('Validating OpenAPI specification...');
      
      const parser = new OpenAPIParser();
      const validator = new SchemaValidator();
      
      const doc = await parser.parse(args.input);
      const result = validator.validateDocument(doc);
      
      if (result.valid) {
        logger.success('Validation passed!');
      } else {
        logger.error('Validation failed:');
        result.errors.forEach(error => {
          logger.error(`  - ${error.path}: ${error.message}`);
        });
      }
      
      if (result.warnings.length > 0) {
        logger.warn('Warnings:');
        result.warnings.forEach(warning => {
          logger.warn(`  - ${warning.path}: ${warning.message}`);
        });
      }
    } catch (error) {
      logger.error('Validation failed:', error);
      process.exit(1);
    }
  },
});
```

#### 2.2 config.ts - 設定管理

```typescript
import { loadConfig as loadC12 } from 'c12';
import { defu } from 'defu';
import type { GeneratorConfig } from '../types';

export interface CLIConfig extends GeneratorConfig {
  defaultLanguage?: 'typescript' | 'dart';
  typescript?: TypeScriptConfig;
  dart?: DartConfig;
}

export interface TypeScriptConfig {
  validator?: 'valibot' | 'zod';
  runtime?: 'fetch' | 'axios';
  module?: 'esm' | 'cjs';
  prettier?: boolean;
}

export interface DartConfig {
  serialization?: 'json_serializable' | 'freezed';
  httpClient?: 'http' | 'dio';
  nullSafety?: boolean;
  formatter?: boolean;
}

const defaultConfig: CLIConfig = {
  input: './openapi.yaml',
  output: './generated',
  language: 'typescript',
  defaultLanguage: 'typescript',
  typescript: {
    validator: 'valibot',
    runtime: 'fetch',
    module: 'esm',
    prettier: true,
  },
  dart: {
    serialization: 'json_serializable',
    httpClient: 'http',
    nullSafety: true,
    formatter: true,
  },
};

/**
 * 設定ファイルをロード
 */
export async function loadConfig(configPath?: string): Promise<CLIConfig> {
  const { config } = await loadC12<CLIConfig>({
    name: 'xcgen',
    configFile: configPath,
    defaults: defaultConfig,
  });

  return config;
}

/**
 * 設定をマージ
 */
export function mergeConfig(
  config: Partial<CLIConfig>,
  defaults: CLIConfig = defaultConfig
): CLIConfig {
  return defu(config, defaults);
}
```

#### 2.3 utils.ts - CLIユーティリティ

```typescript
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'pathe';
import { consola } from 'consola';

export const logger = consola.withTag('openapi-xcgen');

/**
 * ディレクトリを作成（再帰的）
 */
export function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * パスを解決
 */
export function resolvePath(path: string, base?: string): string {
  if (base) {
    return resolve(base, path);
  }
  return resolve(path);
}

/**
 * URLかどうか判定
 */
export function isURL(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイルが存在するか確認
 */
export function fileExists(path: string): boolean {
  return existsSync(path);
}
```

### 3. Code Generators インターフェース

#### 3.1 Generator基底インターフェース

```typescript
// packages/core/src/generator.ts

export interface CodeGenerator {
  /**
   * コードを生成
   */
  generate(ir: IntermediateRepresentation): Promise<GeneratedFiles>;
  
  /**
   * 設定を検証
   */
  validateConfig(config: any): boolean;
  
  /**
   * サポートする機能
   */
  capabilities(): GeneratorCapabilities;
}

export interface GeneratorCapabilities {
  supportsStreaming: boolean;
  supportsWebSockets: boolean;
  supportsFileUpload: boolean;
  supportsCustomFormats: boolean;
}

export interface GeneratedFiles {
  files: GeneratedFile[];
  summary: GenerationSummary;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'model' | 'service' | 'client' | 'config' | 'util';
}

export interface GenerationSummary {
  totalFiles: number;
  models: number;
  services: number;
  endpoints: number;
  language: string;
  timestamp: Date;
}
```

#### 3.2 Generator Registry

```typescript
// packages/core/src/generator-registry.ts

export class GeneratorRegistry {
  private generators = new Map<string, CodeGenerator>();

  /**
   * ジェネレーターを登録
   */
  register(language: string, generator: CodeGenerator): void {
    this.generators.set(language, generator);
  }

  /**
   * ジェネレーターを取得
   */
  get(language: string): CodeGenerator | undefined {
    return this.generators.get(language);
  }

  /**
   * サポートする言語一覧
   */
  supportedLanguages(): string[] {
    return Array.from(this.generators.keys());
  }
}

// シングルトンインスタンス
export const registry = new GeneratorRegistry();
```

### 4. データフローと処理シーケンス

#### 4.1 メイン処理フロー

```typescript
// packages/core/src/index.ts

import { OpenAPIParser } from './parser';
import { SchemaValidator } from './validator';
import { AdvancedTransformer } from './transformer';
import { registry } from './generator-registry';
import { writeFiles } from './file-writer';
import type { GeneratorConfig } from './types';

/**
 * コード生成のメインエントリーポイント
 * シンプルな3層アーキテクチャ
 */
export async function generateCode(config: GeneratorConfig): Promise<void> {
  // Layer 1: Parse
  // OpenAPI仕様書をパースしてbundle
  // バリデーションは@apidevtools/swagger-parserが内部で実行
  const parser = new OpenAPIParser();
  const document = await parser.parse(config.input); // bundle() + バリデーション
  
  // Layer 2: Transform
  // 生のOpenAPI構造をコード生成に最適化された中間表現に変換
  const transformer = new AdvancedTransformer();
  const ir = transformer.transform(document);
  
  console.log('Intermediate Representation created:');
  console.log(`  - Models: ${ir.models.length}`);
  console.log(`  - Enums: ${ir.enums.length}`);
  console.log(`  - Unions: ${ir.unions.length}`);
  console.log(`  - Services: ${ir.services.length}`);
  console.log(`  - Total Endpoints: ${ir.services.reduce((sum, s) => sum + s.endpoints.length, 0)}`);
  
  // Layer 3: Generate
  // 中間表現から言語固有のコードを生成
  const generator = registry.get(config.language);
  if (!generator) {
    throw new Error(`Unsupported language: ${config.language}`);
  }
  
  const files = await generator.generate(ir);
  
  // ファイル出力
  if (!config.options?.dry) {
    await writeFiles(files, config.output);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### 4.2 ファイル書き込み

```typescript
// packages/core/src/file-writer.ts

import { writeFile } from 'fs/promises';
import { join } from 'pathe';
import { ensureDir } from './cli/utils';
import type { GeneratedFiles } from './types';

/**
 * 生成されたファイルを書き込み
 */
export async function writeFiles(
  generated: GeneratedFiles,
  outputDir: string
): Promise<void> {
  for (const file of generated.files) {
    const fullPath = join(outputDir, file.path);
    ensureDir(fullPath);
    await writeFile(fullPath, file.content, 'utf-8');
  }
  
  // サマリーを出力
  console.log('Generation Summary:');
  console.log(`  Total files: ${generated.summary.totalFiles}`);
  console.log(`  Models: ${generated.summary.models}`);
  console.log(`  Services: ${generated.summary.services}`);
  console.log(`  Endpoints: ${generated.summary.endpoints}`);
}
```

## 実装順序とタスク分割

### Phase 1: Core基盤 (タスク009)

1. **基本型定義** (`types.ts`)
   - OpenAPI型定義
   - 中間表現型定義
   - 設定型定義

2. **パーサー実装** (`parser.ts`)
   - SwaggerParser統合
   - エラーハンドリング

3. **バリデーター実装** (`validator.ts`)
   - スキーマ検証
   - 警告・エラー収集

### Phase 2: 変換処理 (タスク010)

4. **リゾルバー実装** (`resolver.ts`)
   - $ref参照解決
   - コンポーネント解決

5. **トランスフォーマー実装** (`transformer.ts`)
   - モデル抽出
   - サービス抽出
   - 中間表現生成

### Phase 3: CLI基盤 (タスク011)

6. **CLIコマンド** (`cli/commands.ts`)
   - generateコマンド
   - validateコマンド

7. **設定管理** (`cli/config.ts`)
   - 設定ファイル読み込み
   - デフォルト設定

8. **ユーティリティ** (`cli/utils.ts`)
   - ファイル操作
   - ログ出力

### Phase 4: Generator統合 (タスク012)

9. **Generatorインターフェース**
   - 基底インターフェース定義
   - レジストリ実装

10. **メイン処理フロー**
    - 全体の統合
    - エラーハンドリング

## 依存関係

```
@openapi-xcgen/core
├── @apidevtools/swagger-parser (OpenAPIパース)
├── openapi-types (OpenAPI型定義)
├── citty (CLIフレームワーク)
├── consola (ログ出力)
├── defu (設定マージ)
└── pathe (パス操作)

@openapi-xcgen/generator-typescript
├── @openapi-xcgen/core
├── change-case (命名変換)
├── handlebars (テンプレートエンジン)
└── valibot (バリデーション)

@openapi-xcgen/generator-dart
├── @openapi-xcgen/core
├── change-case (命名変換)
└── handlebars (テンプレートエンジン)
```

## テスト戦略

1. **ユニットテスト**
   - 各モジュールの個別テスト
   - モックを使用した依存性の分離

2. **統合テスト**
   - エンドツーエンドのフロー検証
   - 実際のOpenAPIファイルでのテスト

3. **スナップショットテスト**
   - 生成コードの一貫性確認
   - リグレッション防止

## まとめ

この設計により、openapi-xcgenは以下の特徴を持つツールとなります：

- **モジュラー**: 各コンポーネントが独立して開発・テスト可能
- **拡張可能**: 新しい言語のGeneratorを簡単に追加可能
- **型安全**: TypeScriptの型システムを最大限活用
- **保守性**: 明確な責務分離とインターフェース定義
- **パフォーマンス**: 大規模なOpenAPI仕様書にも対応

次のステップでは、この設計に基づいて実際の実装を進めていきます。
