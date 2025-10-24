# タスク013-2: xcgen-ts - Hook 機構の導入

## 概要

xcgen-ts（TypeScript生成器）に Hook 機構を導入し、x-extensions 処理の基盤を整えます。hookable と c12 を使用して、ユーザーがコード生成をカスタマイズできる拡張ポイントを提供します。

親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)

## ステータス

- 状態: 未実施

## 前提条件

- タスク013-1（Core - IR への extensions フィールド追加）が完了していること
- タスク010（TypeScript生成器のソースコード実装）が完了していること

## 背景と目的

### Hook機構とは

**定義**: コード生成の特定のタイミングで実行されるカスタム処理を登録できる仕組み

**目的**:

- ユーザーが独自の x-extensions を処理できるようにする
- デフォルト処理（Phase 3）を提供しつつ、カスタマイズも可能にする
- 生成されるコードを柔軟にカスタマイズできる拡張ポイントを提供

**ユースケース**:

- プロパティの型をカスタマイズ（`x-type: "EmailAddress"` → `EmailAddress` 型に変換）
- バリデーションロジックを追加（`x-validation` → カスタムバリデータ生成）
- フォーマット変換（`x-format: "rfc5322"` → 厳密なメールバリデーション）
- 独自の x-extensions を処理（`x-custom-field` → カスタムコード生成）

### なぜ hookable を使うのか

[hookable](https://github.com/unjs/hookable) は unjs エコシステムのライブラリで、以下の特徴があります：

**技術的メリット**:

- ✅ **TypeScript完全対応**: 型安全な Hook 定義
- ✅ **非同期対応**: async/await で Hook を記述可能
- ✅ **並列/直列実行**: Hook の実行順序を制御可能
- ✅ **エラーハンドリング**: Hook 内のエラーを適切に処理
- ✅ **軽量**: 依存関係が少なく、バンドルサイズが小さい

**採用実績**:

- Nuxt 3 のコアライブラリ
- UnJS エコシステムで広く使用
- 活発なメンテナンス

### なぜ c12 を使うのか

[c12](https://github.com/unjs/c12) は unjs の設定ファイルローダーで、以下の特徴があります：

**技術的メリット**:

- ✅ **TypeScript設定ファイル対応**: `.ts` ファイルを直接読み込める
- ✅ **デフォルト値マージ**: ユーザー設定 + デフォルト設定を統合
- ✅ **複数形式対応**: `.ts`, `.mts`, `.js`, `.mjs`, `.json`, `.yaml` をサポート
- ✅ **型補完**: `defineConfig()` ヘルパーで IDE 補完が効く

**採用実績**:

- Nuxt 3 の設定読み込み
- Nitro の設定読み込み
- UnJS エコシステムの標準

**既存の実装**:

- xcgen-ts はすでに c12 を依存関係に持っている（`package.json` で確認済み）
- `defineConfig()` ヘルパーが既に存在（`src/types.ts`）

## アーキテクチャ

### Hook 機構の全体フロー

```
┌──────────────────────────────────────────────────────────────┐
│ 1. 設定ファイル読み込み（c12）                                     │
│    xcgen.config.ts → GeneratorOptions + Hooks                │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. hookable 初期化                                            │
│    createHooks() → HookableInstance                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Hook 登録                                                  │
│    ┌──────────────────────────────────────────┐              │
│    │ デフォルトHook（Phase 3で実装）           │              │
│    │  - x-type 処理                           │              │
│    │  - x-format 処理                         │              │
│    │  - x-validation 処理                     │              │
│    └──────────────────────────────────────────┘              │
│    ┌──────────────────────────────────────────┐              │
│    │ ユーザー定義Hook（xcgen.config.ts）       │              │
│    │  - カスタム処理                           │              │
│    │  - デフォルト処理の上書き                 │              │
│    └──────────────────────────────────────────┘              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. コード生成（Generator）                                      │
│                                                              │
│  parse() → transform() → IR（extensions含む）                │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────┐                │
│  │ Types生成                                │                │
│  │  ├─ IRProperty → TypeScript型定義        │                │
│  │  │   └─ callHook('property:generate')   │ ← Hook呼び出し │
│  │  ├─ IRParameter → 関数パラメータ         │                │
│  │  │   └─ callHook('parameter:generate')  │ ← Hook呼び出し │
│  │  └─ IRModel → interface/type定義        │                │
│  │      └─ callHook('model:generate')      │ ← Hook呼び出し │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │ Schemas生成（Valibot）                   │                │
│  │  ├─ IRProperty → Valibot schema         │                │
│  │  │   └─ callHook('validation:transform') │ ← Hook呼び出し │
│  │  └─ IRValidation → カスタムバリデーション│                │
│  │      └─ callHook('validation:transform') │ ← Hook呼び出し │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │ Services生成                             │                │
│  │  └─ IREndpoint → API関数                │                │
│  │      └─ callHook('endpoint:generate')   │ ← Hook呼び出し │
│  └─────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. 生成されたコード                                             │
│    - カスタム型名（x-type による変換）                          │
│    - カスタムバリデーション（x-validation による変換）           │
│    - カスタムフォーマット（x-format による変換）                 │
└──────────────────────────────────────────────────────────────┘
```

### データ変換の段階

本プロジェクトは **2段階変換** を採用しています：

#### 第1段階: OpenAPI → IR（Core パッケージ）

```
OpenAPI YAML/JSON
  ↓ parse() + transform()
IR (Intermediate Representation)
  - IRProperty（extensions含む）
  - IRParameter（extensions含む）
  - IRModel（extensions含む）
  - IREndpoint（extensions含む）
```

**特徴**:

- 言語非依存の中間表現
- x-extensions を保持（パススルー）
- TypeScript/Dart など複数言語で共有

#### 第2段階: IR → TypeScript Code（xcgen-ts パッケージ）

```
IR
  ↓ generateTypes() / generateSchemas() / generateServices()
Code Generation Process
  ├─ 1. IR読み込み
  ├─ 2. TsCodeProperty作成（コード生成モデル）
  ├─ 3. Hook呼び出し（ctx.tsCode変更可能）
  └─ 4. TypeScript文字列生成
  ↓
TypeScript Code
```

**特徴**:

- 言語固有のコード生成
- Hook による柔軟なカスタマイズ
- TsCodeProperty は「コード生成モデル」を表す

#### TsCodeProperty の役割

**TsCodeProperty は「Code の IR」ではなく「コード生成モデル」**:

```typescript
// コード生成の流れ
function generateProperty(property: IRProperty): string {
  // 1. IR から初期状態を作成
  const tsCode: TsCodeProperty = {
    typeName: mapIRType(property.type),  // "string"
    optional: !property.required,
    nullable: property.nullable,
  };

  // 2. Hook呼び出し（tsCode を変更可能）
  await hooks.callHook('property:generate', {
    property,
    model,
    tsCode,  // ← Hookがこれを変更できる
    extensions: property.extensions
  });

  // 3. tsCode の最終状態から TypeScript コードを生成
  return `${property.name}${tsCode.optional ? '?' : ''}: ${tsCode.typeName}${tsCode.nullable ? ' | null' : ''};`;
}
```

**なぜ TsCodeProperty が必要か**:

1. **Hook が変更できる形式が必要**
   - IR は読み取り専用（不変）
   - tsCode はミュータブル（Hook が変更可能）

2. **生成中の状態を保持**
   - IR: `type: { kind: "primitive", type: "string" }`
   - tsCode: `typeName: "string"`（生成しやすい形）

3. **段階的な変換**
   - 複数の Hook が順番に tsCode を変更可能
   - 最終的な tsCode から文字列を生成

#### 比較: 「Code の IR」を導入する場合（不採用）

もし「Code の IR」を導入すると：

```
OpenAPI YAML → IR (Core) → Code IR (xcgen-ts) → TypeScript Code
                                ↑
                             Hook介入点
```

**不採用の理由**:

- ✗ 複雑性が増す（3段階の変換）
- ✗ Code IR の定義が必要
- ✗ Hook の呼び出しタイミングが限定される
- ✗ パフォーマンスオーバーヘッド

**現在の設計（採用）**:

```
OpenAPI YAML → IR (Core) → TypeScript Code (xcgen-ts)
                              ↑
                         Hook介入点
                      （tsCode を操作）
```

**採用の理由**:

- ✓ シンプル（2段階の変換）
- ✓ TsCodeProperty はコード生成モデル（軽量）
- ✓ Hook のタイミングが柔軟
- ✓ パフォーマンスが良い

#### まとめ: データフロー全体像

| 段階 | 形式 | パッケージ | 役割 |
|------|------|-----------|------|
| 入力 | OpenAPI YAML/JSON | - | API仕様 |
| ↓ | | | |
| 中間 | IR | @openapi-xcgen/core | 言語非依存の中間表現 |
| ↓ | | | |
| 生成中 | TsCodeProperty（コード生成モデル） | @openapi-xcgen/xcgen-ts | Hook介入ポイント |
| ↓ | | | |
| 出力 | TypeScript Code | @openapi-xcgen/xcgen-ts | 最終的なコード |

**重要**: TsCodeProperty は「完全な IR」ではなく、「コード生成モデル」です。

### Hook 種別の定義

本タスクで実装する Hook の種類：

| Hook名 | タイミング | 用途 | Phase |
|--------|-----------|------|-------|
| `property:generate` | プロパティ生成時 | 型名のカスタマイズ、プロパティレベルの拡張 | Phase 2（基盤）/ Phase 3（実装） |
| `parameter:generate` | パラメータ生成時 | パラメータ型のカスタマイズ | Phase 2（基盤）/ Phase 3（実装） |
| `model:generate` | モデル生成時 | モデルレベルの拡張、インポート追加 | Phase 2（基盤）/ Phase 3（実装） |
| `endpoint:generate` | エンドポイント生成時 | API関数のカスタマイズ | Phase 2（基盤）/ Phase 3（実装） |
| `type:transform` | 型変換時 | IR型 → TypeScript型への変換カスタマイズ | Phase 2（基盤）/ Phase 3（実装） |
| `validation:transform` | バリデーション変換時 | IRValidation → Valibot schemaへの変換カスタマイズ | Phase 2（基盤）/ Phase 3（実装） |

**Phase 2の範囲**: Hook の呼び出し基盤のみ（実際の処理は Phase 3）

### Hook Context の設計

各 Hook に渡される情報（Context）:

```typescript
// プロパティ生成Hook
interface PropertyGenerateContext {
  property: IRProperty;           // IR プロパティ定義
  model: IRModel;                 // 所属モデル
  tsCode: TsCodeProperty;         // 生成される型定義
  extensions?: Extensions;        // x-extensions
}

// パラメータ生成Hook
interface ParameterGenerateContext {
  parameter: IRParameter;         // IR パラメータ定義
  endpoint: IREndpoint;           // 所属エンドポイント
  tsCode: TsCodeParameter;        // 生成されるパラメータ定義
  extensions?: Extensions;        // x-extensions
}

// モデル生成Hook
interface ModelGenerateContext {
  model: IRModel;                 // IR モデル定義
  tsCode: TsCodeModel;            // 生成されるモデル定義
  extensions?: Extensions;        // x-extensions
}

// エンドポイント生成Hook
interface EndpointGenerateContext {
  endpoint: IREndpoint;           // IR エンドポイント定義
  tsCode: TsCodeEndpoint;         // 生成される API 関数
  extensions?: Extensions;        // x-extensions
}

// 型変換Hook
interface TypeTransformContext {
  type: IRType;                   // IR 型
  tsCode: TsCodeType;             // 生成される TypeScript 型文字列
  extensions?: Extensions;        // x-extensions
}

// バリデーション変換Hook
interface ValidationTransformContext {
  validation: IRValidation;       // IR バリデーション
  type: IRType;                   // 対象の型
  tsCode: TsCodeValidation;       // 生成される Valibot schema 文字列
  extensions?: Extensions;        // x-extensions
}
```

**重要な設計判断**:

- Hook は `tsCode` を変更することでコード生成をカスタマイズ
- `extensions` を参照して x-extensions に基づいた処理を実装
- Phase 2 では Hook 呼び出しのみ、Phase 3 で実際の処理を実装

### Hook Handler の型定義

```typescript
// Hook Handler の基本形
type HookHandler<T> = (context: T) => void | Promise<void>;

// 各Hookの型
type PropertyGenerateHandler = HookHandler<PropertyGenerateContext>;
type ParameterGenerateHandler = HookHandler<ParameterGenerateContext>;
type ModelGenerateHandler = HookHandler<ModelGenerateContext>;
type EndpointGenerateHandler = HookHandler<EndpointGenerateContext>;
type TypeTransformHandler = HookHandler<TypeTransformContext>;
type ValidationTransformHandler = HookHandler<ValidationTransformContext>;

// すべてのHookをまとめた型
interface Hooks {
  'property:generate'?: PropertyGenerateHandler | PropertyGenerateHandler[];
  'parameter:generate'?: ParameterGenerateHandler | ParameterGenerateHandler[];
  'model:generate'?: ModelGenerateHandler | ModelGenerateHandler[];
  'endpoint:generate'?: EndpointGenerateHandler | EndpointGenerateHandler[];
  'type:transform'?: TypeTransformHandler | TypeTransformHandler[];
  'validation:transform'?: ValidationTransformHandler | ValidationTransformHandler[];
}
```

## Hook種別ごとの使用例

このセクションでは、各Hookの具体的な使用例を示します。**Phase 2では基盤のみ実装し、Phase 3でこれらの実装を追加します。**

### 1. property:generate - プロパティ生成Hook

**ユースケース**: `x-type` でカスタム型名を指定

#### 1-1. OpenAPI YAML

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        email:
          type: string
          format: email
          x-type: "EmailAddress"  # カスタム型名を指定
        userId:
          type: string
          x-type: "UserId"
```

#### 1-2. Hook実装 (xcgen.config.ts)

```typescript
import { defineConfig } from '@openapi-xcgen/xcgen-ts';

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'property:generate': async (ctx) => {
      // x-type が指定されている場合、型名を変更
      const xType = ctx.extensions?.['x-type'];
      if (xType && typeof xType === 'string') {
        ctx.tsCode.typeName = xType;
      }
    }
  }
});
```

#### 1-3. 生成コード比較

```typescript
// ❌ Before (Hook無し)
export interface User {
  email?: string;
  userId?: string;
}

// ✅ After (Hook有り - x-type が反映される)
export interface User {
  email?: EmailAddress;
  userId?: UserId;
}
```

**効果**: OpenAPI定義で `x-type` を使用することで、生成されるTypeScriptコードで厳密な型を使用できます。

---

### 2. parameter:generate - パラメータ生成Hook

**ユースケース**: パラメータに `x-format: "uuid-v7"` を指定して型をカスタマイズ

#### 2-1. OpenAPI YAML

```yaml
paths:
  /users/{userId}:
    get:
      operationId: getUser
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
          x-format: "uuid-v7"  # UUID v7形式を指定
      responses:
        '200':
          description: Success
```

#### 2-2. Hook実装 (xcgen.config.ts)

```typescript
export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'parameter:generate': async (ctx) => {
      // x-format が uuid-v7 の場合、UUIDv7 型に変換
      const xFormat = ctx.extensions?.['x-format'];
      if (xFormat === 'uuid-v7') {
        ctx.tsCode.typeName = 'UUIDv7';
      }
    }
  }
});
```

#### 2-3. 生成コード比較

```typescript
// ❌ Before (Hook無し)
export async function getUser(userId: string): Promise<User> {
  // ...
}

// ✅ After (Hook有り - x-format が反映される)
export async function getUser(userId: UUIDv7): Promise<User> {
  // ...
}
```

**効果**: API関数のパラメータ型をより厳密に指定できます。

---

### 3. model:generate - モデル生成Hook

**ユースケース**: モデルに `x-import` で外部型をインポート

#### 3-1. OpenAPI YAML

```yaml
components:
  schemas:
    UserProfile:
      type: object
      x-import:  # 外部型のインポート指定
        - from: "@/types/common"
          types: ["Timestamp", "UserId"]
        - from: "@/types/branding"
          types: ["Branded"]
      properties:
        id:
          type: string
          x-type: "UserId"
        createdAt:
          type: string
          x-type: "Timestamp"
        displayName:
          type: string
```

#### 3-2. Hook実装 (xcgen.config.ts)

```typescript
export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'model:generate': async (ctx) => {
      // x-import からインポート文を生成
      const xImport = ctx.extensions?.['x-import'];
      if (Array.isArray(xImport)) {
        for (const imp of xImport) {
          if (typeof imp === 'object' && imp !== null) {
            const from = imp.from;
            const types = imp.types;
            if (typeof from === 'string' && Array.isArray(types)) {
              ctx.tsCode.imports.push(
                `import type { ${types.join(', ')} } from '${from}';`
              );
            }
          }
        }
      }
    }
  }
});
```

#### 3-3. 生成コード比較

```typescript
// ❌ Before (Hook無し)
export interface UserProfile {
  id?: string;
  createdAt?: string;
  displayName?: string;
}

// ✅ After (Hook有り - x-import が反映される)
import type { Timestamp, UserId } from '@/types/common';
import type { Branded } from '@/types/branding';

export interface UserProfile {
  id?: UserId;
  createdAt?: Timestamp;
  displayName?: string;
}
```

**効果**: 外部の型定義を自動的にインポートし、型安全性を向上させます。

---

### 4. endpoint:generate - エンドポイント生成Hook

**ユースケース**: エンドポイントに `x-rate-limit` でレート制限情報を追加

#### 4-1. OpenAPI YAML

```yaml
paths:
  /users:
    post:
      operationId: createUser
      x-rate-limit:  # レート制限情報
        max: 10
        window: 60
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Created
```

#### 4-2. Hook実装 (xcgen.config.ts)

```typescript
export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'endpoint:generate': async (ctx) => {
      // x-rate-limit からレート制限情報をJSDocに追加
      const xRateLimit = ctx.extensions?.['x-rate-limit'];
      if (xRateLimit && typeof xRateLimit === 'object') {
        const max = xRateLimit.max;
        const window = xRateLimit.window;
        if (typeof max === 'number' && typeof window === 'number') {
          ctx.tsCode.comment =
            `${ctx.tsCode.comment || ''}\n@rateLimit ${max} requests per ${window}s`;
        }
      }
    }
  }
});
```

#### 4-3. 生成コード比較

```typescript
// ❌ Before (Hook無し)
/**
 * Create a new user
 */
export async function createUser(
  data: CreateUserRequest
): Promise<User> {
  // ...
}

// ✅ After (Hook有り - x-rate-limit が反映される)
/**
 * Create a new user
 * @rateLimit 10 requests per 60s
 */
export async function createUser(
  data: CreateUserRequest
): Promise<User> {
  // ...
}
```

**効果**: API関数のドキュメントにレート制限情報を含めることができます。

---

### 5. type:transform - 型変換Hook

**ユースケース**: IR型を変換する際に `x-nullable` を考慮

#### 5-1. OpenAPI YAML

```yaml
components:
  schemas:
    UserSettings:
      type: object
      properties:
        theme:
          type: string
          x-nullable: true  # null許容
        timezone:
          type: string
          x-nullable: true
```

#### 5-2. Hook実装 (xcgen.config.ts)

```typescript
export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'type:transform': async (ctx) => {
      // x-nullable が true の場合、 | null を追加
      const xNullable = ctx.extensions?.['x-nullable'];
      if (xNullable === true) {
        ctx.tsCode.typeString = `${ctx.tsCode.typeString} | null`;
      }
    }
  }
});
```

#### 5-3. 生成コード比較

```typescript
// ❌ Before (Hook無し)
export interface UserSettings {
  theme?: string;
  timezone?: string;
}

// ✅ After (Hook有り - x-nullable が反映される)
export interface UserSettings {
  theme?: string | null;
  timezone?: string | null;
}
```

**効果**: TypeScriptの `strict: true` 環境で、undefinedとnullを区別できます。

---

### 6. validation:transform - バリデーション変換Hook

**ユースケース**: `x-validation` でカスタムバリデーションを追加

#### 6-1. OpenAPI YAML

```yaml
components:
  schemas:
    EmployeeEmail:
      type: object
      properties:
        email:
          type: string
          format: email
          x-validation:  # カスタムバリデーション
            domain: "example.com"
            maxLength: 100
```

#### 6-2. Hook実装 (xcgen.config.ts)

```typescript
export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  validator: 'valibot',
  hooks: {
    'validation:transform': async (ctx) => {
      // x-validation からカスタムバリデーションを追加
      const xValidation = ctx.extensions?.['x-validation'];
      if (xValidation && typeof xValidation === 'object') {
        const domain = xValidation.domain;
        const maxLength = xValidation.maxLength;

        let schema = ctx.tsCode.schemaString;

        // ドメイン制限
        if (typeof domain === 'string') {
          schema = `v.pipe(${schema}, v.endsWith('@${domain}'))`;
        }

        // 最大長制限
        if (typeof maxLength === 'number') {
          schema = `v.pipe(${schema}, v.maxLength(${maxLength}))`;
        }

        ctx.tsCode.schemaString = schema;
      }
    }
  }
});
```

#### 6-3. 生成コード比較

```typescript
// ❌ Before (Hook無し - Valibot)
export const EmployeeEmailSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email()))
});

// ✅ After (Hook有り - x-validation が反映される)
export const EmployeeEmailSchema = v.object({
  email: v.optional(
    v.pipe(
      v.pipe(v.pipe(v.string(), v.email()), v.endsWith('@example.com')),
      v.maxLength(100)
    )
  )
});
```

**効果**: OpenAPI標準のバリデーションでは表現できない、ビジネスロジック固有のバリデーションを追加できます。

---

### 7. 複数Hookの組み合わせ例

実践的な例として、複数のHookを組み合わせた設定例：

#### 7-1. OpenAPI YAML

```yaml
openapi: 3.0.3
info:
  title: Complete Example API
  version: 1.0.0

paths:
  /users/{userId}:
    get:
      operationId: getUser
      x-rate-limit:
        max: 100
        window: 60
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
          x-format: "uuid-v7"
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      x-import:
        - from: "@/types/ids"
          types: ["UserId", "UUIDv7"]
        - from: "@/types/time"
          types: ["Timestamp"]
      properties:
        id:
          type: string
          x-type: "UserId"
        email:
          type: string
          format: email
          x-validation:
            domain: "example.com"
        createdAt:
          type: string
          x-type: "Timestamp"
```

#### 7-2. Hook実装 (xcgen.config.ts)

```typescript
import { defineConfig } from '@openapi-xcgen/xcgen-ts';

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  validator: 'valibot',
  hooks: {
    // 1. プロパティの型をカスタマイズ
    'property:generate': async (ctx) => {
      const xType = ctx.extensions?.['x-type'];
      if (xType && typeof xType === 'string') {
        ctx.tsCode.typeName = xType;
      }
    },

    // 2. パラメータの型をカスタマイズ
    'parameter:generate': async (ctx) => {
      const xFormat = ctx.extensions?.['x-format'];
      if (xFormat === 'uuid-v7') {
        ctx.tsCode.typeName = 'UUIDv7';
      }
    },

    // 3. モデルにインポートを追加
    'model:generate': async (ctx) => {
      const xImport = ctx.extensions?.['x-import'];
      if (Array.isArray(xImport)) {
        for (const imp of xImport) {
          if (typeof imp === 'object' && imp !== null) {
            const from = imp.from;
            const types = imp.types;
            if (typeof from === 'string' && Array.isArray(types)) {
              ctx.tsCode.imports.push(
                `import type { ${types.join(', ')} } from '${from}';`
              );
            }
          }
        }
      }
    },

    // 4. エンドポイントにレート制限情報を追加
    'endpoint:generate': async (ctx) => {
      const xRateLimit = ctx.extensions?.['x-rate-limit'];
      if (xRateLimit && typeof xRateLimit === 'object') {
        const max = xRateLimit.max;
        const window = xRateLimit.window;
        if (typeof max === 'number' && typeof window === 'number') {
          ctx.tsCode.comment =
            `${ctx.tsCode.comment || ''}\n@rateLimit ${max} requests per ${window}s`;
        }
      }
    },

    // 5. バリデーションをカスタマイズ
    'validation:transform': async (ctx) => {
      const xValidation = ctx.extensions?.['x-validation'];
      if (xValidation && typeof xValidation === 'object') {
        const domain = xValidation.domain;
        if (typeof domain === 'string') {
          ctx.tsCode.schemaString =
            `v.pipe(${ctx.tsCode.schemaString}, v.endsWith('@${domain}'))`;
        }
      }
    }
  }
});
```

#### 7-3. 生成コード (統合結果)

**models/User.ts**:

```typescript
// ✅ x-import が反映されたインポート
import type { UserId, UUIDv7 } from '@/types/ids';
import type { Timestamp } from '@/types/time';

// ✅ x-type が反映された型定義
export interface User {
  id?: UserId;
  email?: string;
  createdAt?: Timestamp;
}
```

**schemas/User.ts**:

```typescript
import * as v from 'valibot';

// ✅ x-validation が反映されたバリデーション
export const UserSchema = v.object({
  id: v.optional(v.string()),
  email: v.optional(
    v.pipe(v.pipe(v.string(), v.email()), v.endsWith('@example.com'))
  ),
  createdAt: v.optional(v.string())
});
```

**services/users.ts**:

```typescript
import type { User } from '../models/User';
import type { UUIDv7 } from '@/types/ids';

/**
 * Get user by ID
 * @rateLimit 100 requests per 60s
 */
// ✅ x-format と x-rate-limit が反映
export async function getUser(userId: UUIDv7): Promise<User> {
  // ...
}
```

**効果**: 複数のHookを組み合わせることで、型安全性、ドキュメント、バリデーションを包括的にカスタマイズできます。

---

### Hook使用時のベストプラクティス

#### 1. 型ガードを使用する

```typescript
// ✅ Good: 型チェックを行う
const xType = ctx.extensions?.['x-type'];
if (xType && typeof xType === 'string') {
  ctx.tsCode.typeName = xType;
}

// ❌ Bad: 型チェックなし
ctx.tsCode.typeName = ctx.extensions?.['x-type'];
```

#### 2. 複数の値を扱う場合は構造を検証

```typescript
// ✅ Good: 構造を検証
const xValidation = ctx.extensions?.['x-validation'];
if (xValidation && typeof xValidation === 'object') {
  const domain = xValidation.domain;
  if (typeof domain === 'string') {
    // 処理
  }
}
```

#### 3. Hookは並列実行されるため、順序に依存しない

```typescript
// ✅ Good: 独立した処理
'property:generate': async (ctx) => {
  // このHookは他のHookに依存しない
}

// ❌ Bad: 他のHookの結果に依存
'model:generate': async (ctx) => {
  // property:generate の結果を期待（保証されない）
}
```

#### 4. エラーハンドリングを適切に行う

```typescript
// ✅ Good: エラーを適切に処理
'property:generate': async (ctx) => {
  try {
    const xType = ctx.extensions?.['x-type'];
    if (xType && typeof xType === 'string') {
      ctx.tsCode.typeName = xType;
    }
  } catch (error) {
    console.error('Error in property:generate hook:', error);
    // エラーを投げずに続行
  }
}
```

---

### まとめ

- **Phase 2**: これらのHookが呼び出される基盤を実装
- **Phase 3**: デフォルトHook（x-type, x-format, x-validation）を実装
- **ユーザーカスタマイズ**: xcgen.config.ts でこれらのサンプルを参考に独自のHookを定義可能

## 実装対象

### Phase 0: 依存関係の追加

#### Phase 0 - 対象ファイル

- `packages/xcgen-ts/package.json` - hookable を dependencies に追加

#### Phase 0 - 実装内容

```json
{
  "dependencies": {
    "@openapi-xcgen/core": "workspace:*",
    "c12": "^3.3.1",
    "hookable": "^5.5.3",  // ← 追加
    "citty": "^0.1.6",
    "consola": "^3.4.2",
    // ...
  }
}
```

### Phase 1: Hook 型定義の作成

#### Phase 1 - 対象ファイル

- `packages/xcgen-ts/src/hooks/types.ts` (新規作成)
- `packages/xcgen-ts/src/hooks/index.ts` (新規作成)

#### Phase 1 - 実装内容

**packages/xcgen-ts/src/hooks/types.ts**:

```typescript
/**
 * Hook型定義
 *
 * コード生成の各タイミングで実行される Hook の型定義。
 * ユーザーが xcgen.config.ts で Hook を定義する際に型補完が効く。
 */

import type {
  Extensions,
  IREndpoint,
  IRModel,
  IRParameter,
  IRProperty,
  IRType,
  IRValidation,
} from "@openapi-xcgen/core";

/**
 * プロパティ生成Hook の Context
 *
 * IRProperty から TypeScript プロパティ定義を生成する際に呼び出される。
 *
 * @example
 * ```yaml
 * properties:
 *   email:
 *     type: string
 *     x-type: "EmailAddress"
 * ```
 *
 * @example Hook実装
 * ```typescript
 * hooks: {
 *   'property:generate': async (ctx) => {
 *     // x-type があれば型名を変換
 *     if (ctx.extensions?.['x-type']) {
 *       ctx.tsCode.typeName = ctx.extensions['x-type'] as string;
 *     }
 *   }
 * }
 * ```
 */
export interface PropertyGenerateContext {
  /** IR プロパティ定義 */
  property: IRProperty;
  /** 所属モデル */
  model: IRModel;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeProperty;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * プロパティのコード生成モデル
 *
 * Hook が介入してこのモデルを変更することで、生成されるコードをカスタマイズできます。
 */
export interface TsCodeProperty {
  /** 型名（例: "string", "EmailAddress"） */
  typeName: string;
  /** オプショナルかどうか */
  optional: boolean;
  /** nullable かどうか */
  nullable: boolean;
  /** デフォルト値（存在する場合） */
  defaultValue?: string;
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * パラメータ生成Hook の Context
 */
export interface ParameterGenerateContext {
  /** IR パラメータ定義 */
  parameter: IRParameter;
  /** 所属エンドポイント */
  endpoint: IREndpoint;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeParameter;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * パラメータのコード生成モデル
 */
export interface TsCodeParameter {
  /** パラメータ名 */
  name: string;
  /** 型名 */
  typeName: string;
  /** オプショナルかどうか */
  optional: boolean;
  /** デフォルト値（存在する場合） */
  defaultValue?: string;
}

/**
 * モデル生成Hook の Context
 */
export interface ModelGenerateContext {
  /** IR モデル定義 */
  model: IRModel;
  /** 生成される型定義（Hookで変更可能） */
  tsCode: TsCodeModel;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * モデルのコード生成モデル
 */
export interface TsCodeModel {
  /** モデル名 */
  name: string;
  /** 生成される型定義コード */
  code: string;
  /** 追加インポート（Hookで追加可能） */
  imports: string[];
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * エンドポイント生成Hook の Context
 */
export interface EndpointGenerateContext {
  /** IR エンドポイント定義 */
  endpoint: IREndpoint;
  /** 生成される API 関数（Hookで変更可能） */
  tsCode: TsCodeEndpoint;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * エンドポイントのコード生成モデル
 */
export interface TsCodeEndpoint {
  /** 関数名 */
  functionName: string;
  /** 生成される関数コード */
  code: string;
  /** 追加インポート（Hookで追加可能） */
  imports: string[];
  /** コメント（JSDoc） */
  comment?: string;
}

/**
 * 型変換Hook の Context
 */
export interface TypeTransformContext {
  /** IR 型 */
  type: IRType;
  /** 生成される TypeScript 型文字列（Hookで変更可能） */
  tsCode: TsCodeType;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * 型変換のコード生成モデル
 */
export interface TsCodeType {
  /** 型文字列（例: "string", "EmailAddress"） */
  typeString: string;
}

/**
 * バリデーション変換Hook の Context
 */
export interface ValidationTransformContext {
  /** IR バリデーション */
  validation: IRValidation;
  /** 対象の型 */
  type: IRType;
  /** 生成される Valibot schema 文字列（Hookで変更可能） */
  tsCode: TsCodeValidation;
  /** x-extensions（存在する場合） */
  extensions?: Extensions;
}

/**
 * バリデーションのコード生成モデル
 */
export interface TsCodeValidation {
  /** Valibot schema 文字列 */
  schemaString: string;
}

/**
 * Hook Handler の基本型
 *
 * 各 Hook は Context を受け取り、void または Promise<void> を返す
 */
export type HookHandler<T> = (context: T) => void | Promise<void>;

/**
 * プロパティ生成Hook の Handler 型
 */
export type PropertyGenerateHandler = HookHandler<PropertyGenerateContext>;

/**
 * パラメータ生成Hook の Handler 型
 */
export type ParameterGenerateHandler = HookHandler<ParameterGenerateContext>;

/**
 * モデル生成Hook の Handler 型
 */
export type ModelGenerateHandler = HookHandler<ModelGenerateContext>;

/**
 * エンドポイント生成Hook の Handler 型
 */
export type EndpointGenerateHandler = HookHandler<EndpointGenerateContext>;

/**
 * 型変換Hook の Handler 型
 */
export type TypeTransformHandler = HookHandler<TypeTransformContext>;

/**
 * バリデーション変換Hook の Handler 型
 */
export type ValidationTransformHandler =
  HookHandler<ValidationTransformContext>;

/**
 * すべての Hook をまとめた型
 *
 * xcgen.config.ts で定義する Hook の型定義
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@openapi-xcgen/xcgen-ts'
 *
 * export default defineConfig({
 *   input: './openapi.yaml',
 *   output: './generated',
 *   hooks: {
 *     'property:generate': async (ctx) => {
 *       // プロパティ生成時の処理
 *     },
 *     'validation:transform': async (ctx) => {
 *       // バリデーション変換時の処理
 *     }
 *   }
 * })
 * ```
 */
export interface Hooks {
  /**
   * プロパティ生成時に呼び出される Hook
   *
   * 単一または配列で複数の Handler を登録可能
   */
  "property:generate"?:
    | PropertyGenerateHandler
    | PropertyGenerateHandler[];

  /**
   * パラメータ生成時に呼び出される Hook
   */
  "parameter:generate"?:
    | ParameterGenerateHandler
    | ParameterGenerateHandler[];

  /**
   * モデル生成時に呼び出される Hook
   */
  "model:generate"?: ModelGenerateHandler | ModelGenerateHandler[];

  /**
   * エンドポイント生成時に呼び出される Hook
   */
  "endpoint:generate"?: EndpointGenerateHandler | EndpointGenerateHandler[];

  /**
   * 型変換時に呼び出される Hook
   */
  "type:transform"?: TypeTransformHandler | TypeTransformHandler[];

  /**
   * バリデーション変換時に呼び出される Hook
   */
  "validation:transform"?:
    | ValidationTransformHandler
    | ValidationTransformHandler[];
}
```

**packages/xcgen-ts/src/hooks/index.ts**:

```typescript
/**
 * Hooks module
 *
 * コード生成をカスタマイズする Hook 機構のエントリーポイント
 */

export * from "./types";
// Phase 2: create-hooks.ts も export（後続ステップで実装）
// export { createHooks } from './create-hooks';
```

#### Phase 1 - テスト戦略

- Phase 1 では型定義のみなので、in-sourceテストは不要
- 型チェック（`pnpm typecheck`）でコンパイルエラーがないことを確認

### Phase 2: hookable 統合

#### Phase 2 - 対象ファイル

- `packages/xcgen-ts/src/hooks/create-hooks.ts` (新規作成)

#### Phase 2 - 実装内容

```typescript
/**
 * Hook インスタンスの作成
 *
 * hookable を使用して Hook システムを初期化する
 */

import { createHooks as createHookable } from "hookable";
import type { Hookable } from "hookable";
import type { Hooks } from "./types";

/**
 * hookable インスタンスの型
 *
 * hookable の Hookable<Hooks> 型を使用
 */
export type HookableInstance = Hookable<Hooks>;

/**
 * Hook システムを初期化
 *
 * @param userHooks - ユーザー定義の Hook（xcgen.config.ts から読み込まれる）
 * @returns hookable インスタンス
 *
 * @example
 * ```typescript
 * const hooks = createHooks({
 *   'property:generate': async (ctx) => {
 *     // カスタム処理
 *   }
 * });
 *
 * // Hook呼び出し
 * await hooks.callHook('property:generate', context);
 * ```
 */
export function createHooks(userHooks?: Hooks): HookableInstance {
  const hooks = createHookable<Hooks>();

  // ユーザー定義 Hook を登録
  if (userHooks) {
    for (const [name, handler] of Object.entries(userHooks)) {
      if (handler) {
        // 配列の場合は各Handlerを登録
        if (Array.isArray(handler)) {
          for (const h of handler) {
            hooks.hook(name as keyof Hooks, h);
          }
        } else {
          hooks.hook(name as keyof Hooks, handler);
        }
      }
    }
  }

  // TODO: Phase 3 でデフォルトHookを登録
  // registerDefaultHooks(hooks);

  return hooks;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("createHooks", () => {
    it("should create hookable instance without user hooks", () => {
      const hooks = createHooks();
      expect(hooks).toBeDefined();
      expect(typeof hooks.callHook).toBe("function");
    });

    it("should register user hooks", async () => {
      let called = false;
      const hooks = createHooks({
        "property:generate": async () => {
          called = true;
        },
      });

      await hooks.callHook("property:generate", {
        property: {} as any,
        model: {} as any,
        tsCode: { typeName: "string", optional: false, nullable: false },
      });

      expect(called).toBe(true);
    });

    it("should register multiple hooks for same event", async () => {
      const calls: string[] = [];
      const hooks = createHooks({
        "property:generate": [
          async () => {
            calls.push("hook1");
          },
          async () => {
            calls.push("hook2");
          },
        ],
      });

      await hooks.callHook("property:generate", {
        property: {} as any,
        model: {} as any,
        tsCode: { typeName: "string", optional: false, nullable: false },
      });

      expect(calls).toEqual(["hook1", "hook2"]);
    });

    it("should allow hooks to modify context tsCode", async () => {
      const hooks = createHooks({
        "property:generate": async (ctx) => {
          ctx.tsCode.typeName = "CustomType";
        },
      });

      const context = {
        property: {} as any,
        model: {} as any,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      await hooks.callHook("property:generate", context);

      expect(context.tsCode.typeName).toBe("CustomType");
    });

    it("should support async hooks", async () => {
      const hooks = createHooks({
        "property:generate": async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          ctx.tsCode.typeName = "AsyncType";
        },
      });

      const context = {
        property: {} as any,
        model: {} as any,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      await hooks.callHook("property:generate", context);

      expect(context.tsCode.typeName).toBe("AsyncType");
    });

    it("should handle hooks without user hooks gracefully", async () => {
      const hooks = createHooks();

      const context = {
        property: {} as any,
        model: {} as any,
        tsCode: { typeName: "string", optional: false, nullable: false },
      };

      // Hook呼び出しはエラーを投げない
      await expect(
        hooks.callHook("property:generate", context),
      ).resolves.toBeUndefined();
    });
  });
}
```

#### Phase 2 - テスト戦略

- 6個の in-sourceテストで動作を検証
- hookable の基本動作（登録、呼び出し、非同期対応）を確認

### Phase 3: c12 設定読み込みの実装

#### Phase 3 - 対象ファイル

- `packages/xcgen-ts/src/config.ts` (新規作成)
- `packages/xcgen-ts/src/types.ts` (拡張)

#### Phase 3 - 実装内容

**packages/xcgen-ts/src/config.ts**:

```typescript
/**
 * 設定ファイルの読み込み
 *
 * c12 を使用して xcgen.config.ts を読み込む
 */

import { loadConfig } from "c12";
import type { GeneratorOptions } from "./types";

/**
 * xcgen.config.ts から設定を読み込む
 *
 * @param options - CLIまたはAPIから渡されたオプション（優先される）
 * @returns マージされた設定
 *
 * @example
 * ```typescript
 * // CLI から呼び出し
 * const config = await loadGeneratorConfig({
 *   input: './openapi.yaml',
 *   output: './generated'
 * });
 *
 * // config.hooks にはユーザー定義Hookが含まれる
 * ```
 */
export async function loadGeneratorConfig(
  options: Partial<GeneratorOptions>,
): Promise<GeneratorOptions> {
  // c12 で xcgen.config.ts を読み込む
  const { config } = await loadConfig<GeneratorOptions>({
    name: "xcgen",
    defaults: {
      validator: undefined,
      templatesDir: undefined,
      hooks: undefined,
    } as Partial<GeneratorOptions>,
    overrides: options as GeneratorOptions,
    // TypeScript設定ファイルを読み込むために jiti を使用
    // （c12が自動的に処理）
  });

  // 必須フィールドの検証
  if (!config.input) {
    throw new Error("input is required");
  }
  if (!config.output) {
    throw new Error("output is required");
  }

  return config as GeneratorOptions;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("loadGeneratorConfig", () => {
    it("should load config with required fields", async () => {
      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
      });

      expect(config.input).toBe("./openapi.yaml");
      expect(config.output).toBe("./generated");
    });

    it("should throw error if input is missing", async () => {
      await expect(
        loadGeneratorConfig({ output: "./generated" }),
      ).rejects.toThrow("input is required");
    });

    it("should throw error if output is missing", async () => {
      await expect(
        loadGeneratorConfig({ input: "./openapi.yaml" }),
      ).rejects.toThrow("output is required");
    });

    it("should accept optional validator", async () => {
      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
        validator: "valibot",
      });

      expect(config.validator).toBe("valibot");
    });

    it("should accept optional hooks", async () => {
      const hooks = {
        "property:generate": async () => {},
      };

      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
        hooks,
      });

      expect(config.hooks).toBe(hooks);
    });
  });
}
```

**packages/xcgen-ts/src/types.ts** (拡張):

```typescript
// 既存のコードの後に追加

import type { Hooks } from "./hooks";

/**
 * 生成器設定オプション（Hook対応版）
 */
export interface GeneratorOptions {
  /** 入力ファイルパス（OpenAPI YAML/JSON） */
  input: string;
  /** 出力ディレクトリパス */
  output: string;
  /** バリデーションライブラリ（オプション） */
  validator?: "valibot";
  /** カスタムテンプレートディレクトリ（オプション） */
  templatesDir?: string;
  /** コード生成をカスタマイズするHook（オプション） */
  hooks?: Hooks;
}

/**
 * 生成器設定を定義するヘルパー関数（Hook対応版）
 *
 * @example
 * ```typescript
 * // xcgen.config.ts
 * import { defineConfig } from '@openapi-xcgen/xcgen-ts';
 *
 * export default defineConfig({
 *   input: './openapi.yaml',
 *   output: './generated',
 *   validator: 'valibot',
 *   hooks: {
 *     'property:generate': async (ctx) => {
 *       // カスタム処理
 *     }
 *   }
 * });
 * ```
 */
export function defineConfig(options: GeneratorOptions): GeneratorOptions {
  return options;
}
```

#### Phase 3 - テスト戦略

- 5個の in-sourceテストで設定読み込みを検証
- 必須フィールドのバリデーション
- オプションフィールドの処理

### Phase 4: Generator への統合

#### Phase 4 - 対象ファイル

- `packages/xcgen-ts/src/generator.ts` (拡張)

#### Phase 4 - 実装内容

**generator.ts の変更**:

```typescript
// 既存のインポートに追加
import { loadGeneratorConfig } from "./config";
import { createHooks, type HookableInstance } from "./hooks";

/**
 * TypeScriptコードを生成する（ディレクトリベース構造）
 * @param options - 生成器オプション
 * @returns 生成結果
 */
export async function generate(
  options: GeneratorOptions,
): Promise<GenerationResult> {
  // 0. 設定ファイルを読み込み
  const config = await loadGeneratorConfig(options);

  // 1. Hook システムを初期化
  const hooks = createHooks(config.hooks);

  consola.start(`Generating TypeScript code from ${config.input}...`);

  // 2. Parse OpenAPI document
  consola.info("Parsing OpenAPI document...");
  const document = await parse(config.input);

  // 3. Transform to IR
  consola.info("Transforming to intermediate representation...");
  const ir: XcgenIR = transform(document);

  consola.info(
    `Found ${ir.models.length} models, ${ir.endpoints.length} endpoints`,
  );

  // 4. Generate code with directory-based structure
  consola.info("Generating code...");
  const writer = new FileWriter(config.output);
  const allFiles: string[] = [];

  // 4.1 Types生成（Hookインスタンスを渡す）
  consola.info("Generating types...");
  const typesResult = await generateTypes(ir, writer, hooks);
  allFiles.push(...typesResult.files);
  consola.success(`Generated ${typesResult.count} types → models/ directory`);

  // 4.2 Schemas生成（Hookインスタンスを渡す）
  let schemasResult;
  if (config.validator === "valibot") {
    consola.info("Generating Valibot schemas...");
    schemasResult = await generateSchemas(ir, writer, hooks);
    allFiles.push(...schemasResult.files);
    consola.success(
      `Generated ${schemasResult.count} schemas → schemas/ directory`,
    );
  }

  // 4.3 Services生成（Hookインスタンスを渡す）
  consola.info("Generating services...");
  const servicesResult = await generateServices(ir, writer, hooks);
  allFiles.push(...servicesResult.files);
  consola.success(
    `Generated ${servicesResult.count} services → services/ directory`,
  );

  // 4.4 client.ts と index.ts を並列書き込み
  consola.info("Generating client and index...");
  const clientCode = generateClient(ir);
  const indexCode = generateTopLevelIndex(ir, config);

  await Promise.all([
    writer.write("client.ts", clientCode.code),
    writer.write("index.ts", indexCode),
  ]);

  allFiles.push("client.ts", "index.ts");
  consola.success("Generated client.ts and index.ts");

  consola.success(
    `✅ Successfully generated ${allFiles.length} files in ${config.output}`,
  );

  return {
    files: allFiles.map((f) => join(config.output, f)),
    typesCount: typesResult.count,
    schemasCount: schemasResult?.count,
    servicesCount: servicesResult.count,
  };
}

// generateTopLevelIndex() は変更なし（既存のまま）
```

#### Phase 4 - テスト戦略

- E2Eテストで動作を確認（次のPhaseで実装）
- Phase 2 では Hook 呼び出しの基盤のみ
- 実際の Hook 処理は Phase 3 で実装

### Phase 5: E2E テストの準備

#### Phase 5 - 対象ファイル

- `packages/xcgen-ts/tests/e2e/fixtures/hooks/` (新規ディレクトリ)
- `packages/xcgen-ts/tests/e2e/fixtures/hooks/openapi.yaml` (新規)
- `packages/xcgen-ts/tests/e2e/fixtures/hooks/xcgen.config.ts` (新規)

#### Phase 5 - 実装内容

**openapi.yaml** (最小限の定義):

```yaml
openapi: 3.0.3
info:
  title: Hooks Test API
  version: 1.0.0
paths:
  /test:
    get:
      operationId: getTest
      responses:
        '200':
          description: Success
components:
  schemas:
    TestModel:
      type: object
      properties:
        id:
          type: string
```

**xcgen.config.ts** (Hook登録例):

```typescript
import { defineConfig } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./expected",
  validator: "valibot",
  hooks: {
    "property:generate": async (ctx) => {
      // Phase 2: Hookは呼び出されるが、処理は空
      // Phase 3: x-type などの処理を実装
    },
  },
});
```

#### Phase 5 - テスト戦略

- Phase 2 では Hook が呼び出されることのみ確認
- Phase 3 で実際の x-extensions 処理を追加

## 検証項目

- [ ] hookable 依存関係が package.json に追加されている
- [ ] Hook 型定義（types.ts）がすべて作成されている
- [ ] createHooks() の in-sourceテスト（6個）がすべてパス
- [ ] loadGeneratorConfig() の in-sourceテスト（5個）がすべてパス
- [ ] xcgen.config.ts から設定を読み込めること
- [ ] Generator 内で Hook インスタンスが作成されること
- [ ] Generator から各生成器に Hook インスタンスが渡されること
- [ ] ビルドが成功すること（`pnpm build`）
- [ ] 型チェックが通ること（`pnpm typecheck`）
- [ ] 全テストがパスすること（`pnpm test`）
- [ ] Lintエラーがないこと（`pnpm lint`）

## 非機能要件

### パフォーマンス

- Hook 呼び出しのオーバーヘッドを最小化すること
- Hook が登録されていない場合、呼び出しコストをゼロに近づける

### 後方互換性

- `hooks` フィールドが未指定でも従来通り動作すること
- 既存の E2E テストが引き続きパスすること

### エラーハンドリング

- Hook 内でエラーが発生した場合、適切なエラーメッセージを出力
- 設定ファイルが見つからない場合、デフォルト設定で動作

## 制約事項

### Phase 2 の範囲

**✅ Phase 2 で実装**:

- hookable と c12 の統合
- Hook 型定義
- Hook 呼び出しの基盤（createHooks, loadGeneratorConfig）
- Generator への Hook インスタンス渡し

**❌ Phase 2 では実装しない**:

- デフォルト Hook（x-type, x-format, x-validation 処理）
- 実際の x-extensions 処理
- Generator 内での Hook 呼び出し（callHook）

これらは Phase 3 で実装します。

### 技術的制約

- hookable 5.5.3 以上を使用（TypeScript 5.0 対応版）
- c12 は既存の依存関係を使用（3.3.1）
- Node.js 20 以上が必須（既存の要件）

## 次のタスク

- **タスク013-3** (予定): デフォルト Hooks 実装
  - x-type 処理（カスタム型名での生成）
  - x-format 処理（カスタムフォーマットバリデーション）
  - x-validation 処理（追加バリデーションロジック）
  - E2E テストで動作確認

## 参考資料

- [hookable - Awaitable Hooks System](https://github.com/unjs/hookable)
- [c12 - Smart Configuration Loader](https://github.com/unjs/c12)
- [Nuxt 3 Hooks](https://nuxt.com/docs/api/advanced/hooks) - hookable の使用例
- 親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)
- 前提タスク: [013-1-x-extensions-core.md](./013-1-x-extensions-core.md)
