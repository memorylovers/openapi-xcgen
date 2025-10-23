# 014: ディレクトリベース構造へのリファクタリング

## 概要

TypeScript生成器（xcgen-ts）の出力構造を、現在の単一ファイル構造からディレクトリベース構造に変更します。

**目的:**

- 要件定義書（`_docs/001-requirements.md`）との整合性確保
- 保守性・可読性の向上
- 大規模API対応の準備

**優先度:** 中 - Phase 1の基本機能は動作しているが、要件定義との乖離を解消

## 背景

### 要件定義書の記載（本来あるべき姿）

```
generated/
├── models/       # 型定義（個別ファイル）
│   ├── User.ts
│   ├── Post.ts
│   └── index.ts
├── schemas/      # Valibotスキーマ
│   ├── UserSchema.ts
│   ├── PostSchema.ts
│   └── index.ts
├── services/     # API関数
│   ├── users.ts
│   ├── posts.ts
│   └── index.ts
├── client.ts     # 基本リクエスト関数
├── types.ts      # 共通型定義
└── index.ts      # エクスポート
```

### 現在の実装（暫定的な単一ファイル構造）

```
generated/
├── types.ts      # すべての型定義（単一ファイル）
├── schemas.ts    # すべてのValibotスキーマ（単一ファイル）
├── services.ts   # すべてのAPI関数（単一ファイル）
├── client.ts     # 基本リクエスト関数
├── package.json
└── tsconfig.json
```

### 判断の経緯

要件定義書と実装の差異を検討した結果、以下の理由により要件定義に合わせることを決定：

- 初期実装では単純化のため単一ファイル構造を採用していた
- 要件定義で示されたディレクトリ構造の方が、長期的な保守性が高い
- ファイル分割により、コードの可読性と管理が向上
- 大規模API（100+エンドポイント）への対応が容易

## 現状分析

### コード生成の流れ

```
generate(options)
├── parse(openapi.yaml) → OpenAPI Document
├── transform(document) → XcgenIR
└── Code Generation (4 files):
    ├── generateTypes(ir) → types.ts
    ├── generateSchemas(ir) → schemas.ts
    ├── generateServices(ir) → services.ts
    └── generateClient(ir) → client.ts
```

### 主要な実装ファイル

| ファイル | 役割 | 変更の必要性 |
|---------|------|------------|
| `packages/xcgen-ts/src/generator.ts` | メインオーケストレーター | ⭐ 大幅修正 |
| `packages/xcgen-ts/src/generators/types/types.ts` | 型定義生成 | ⭐ 大幅修正 |
| `packages/xcgen-ts/src/generators/schemas/schemas.ts` | スキーマ生成 | ⭐ 大幅修正 |
| `packages/xcgen-ts/src/generators/services/services.ts` | サービス関数生成 | ⭐ 修正 |
| `packages/xcgen-ts/src/generators/client/client.ts` | クライアント生成 | 変更なし |
| `packages/xcgen-ts/tests/e2e/fixtures/*/expected/` | E2Eテスト期待値 | ⭐ 全更新 |

### 影響を受けるテストフィクスチャ

以下の14+個のE2Eテストフィクスチャの期待値を更新する必要があります：

```
tests/e2e/fixtures/
├── general/
│   ├── petstore/
│   ├── complex-schema/
│   ├── allof/
│   ├── readonly-writeonly/
│   └── hey-api/
│       ├── discriminator-all-of/
│       ├── discriminator-any-of/
│       └── discriminator-one-of/
└── models/
    ├── complex-structures/
    ├── data-types/
    ├── inline-schemas/
    ├── metadata-model/
    ├── nullable-model/
    ├── ref-model/
    └── validation-model/
```

## 目標構造（詳細）

### ディレクトリレイアウト

```
generated/
├── index.ts                   # トップレベルのエクスポート
│
├── types.ts                   # 共通型定義（RequestInit等）
│
├── models/                    # データモデルの型定義
│   ├── Pet.ts                 # export interface Pet { ... }
│   ├── User.ts                # export interface User { ... }
│   ├── Error.ts               # export interface Error { ... }
│   ├── GetPetsParams.ts       # パラメータ型
│   ├── GetPets200Response.ts  # レスポンス型
│   └── index.ts               # export * from './Pet.ts'
│
├── schemas/                   # Valibotバリデーションスキーマ
│   ├── PetSchema.ts           # export const PetSchema = v.object({ ... })
│   ├── UserSchema.ts          # export const UserSchema = v.object({ ... })
│   ├── GetPets200ResponseSchema.ts
│   └── index.ts               # export * from './PetSchema.ts'
│
├── services/                  # API関数（エンドポイント別）
│   ├── pets.ts                # listPets, createPet, ...
│   ├── users.ts               # getUser, updateUser, ...
│   └── index.ts               # export * from './pets.ts'
│
└── client.ts                  # HTTPクライアントユーティリティ
    ├── XcgenApiError クラス
    ├── ApiConfig インターフェース
    ├── setConfig 関数
    └── request 関数
```

### ファイルの内容例

#### `models/Pet.ts`

```typescript
/**
 * Pet model
 * Auto-generated from OpenAPI specification
 */

export interface Pet {
  id: number;
  name: string;
  tag?: string | undefined;
}
```

#### `models/index.ts`

```typescript
/**
 * Model type definitions
 * Auto-generated from OpenAPI specification
 */

export * from './Pet.js';
export * from './User.js';
export * from './Error.js';
export * from './GetPetsParams.js';
export * from './GetPets200Response.js';
```

#### `schemas/PetSchema.ts`

```typescript
/**
 * Valibot validation schema for Pet
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
  tag: v.optional(v.string()),
});
```

#### `services/pets.ts`

```typescript
/**
 * Pet service functions
 * Auto-generated from OpenAPI specification
 */

import type {
  GetPetsParams,
  GetPets200Response,
  CreatePetRequestBody,
  CreatePet201Response,
} from "../models/index.js";
import { request } from "../client.js";

/**
 * List all pets
 */
export async function listPets(
  options: GetPetsParams,
  init?: RequestInit,
): Promise<GetPets200Response> {
  return request({
    method: "GET",
    path: "/pets",
    options,
    init,
  });
}

/**
 * Create a pet
 */
export async function createPet(
  body: CreatePetRequestBody,
  init?: RequestInit,
): Promise<CreatePet201Response> {
  return request({
    method: "POST",
    path: "/pets",
    body,
    init,
  });
}
```

#### `index.ts` (トップレベル)

```typescript
/**
 * API Client
 * Auto-generated from OpenAPI specification
 */

export * from "./types.js";
export * from "./models/index.js";
export * from "./schemas/index.js";
export * from "./services/index.js";
export { setConfig, XcgenApiError, type ApiConfig } from "./client.js";
```

## 実装計画

### Phase 2: 生成器の修正（ディレクトリベース構造への変更）

#### Step 1: 型定義の追加

`packages/xcgen-ts/src/types.ts` に `FileToWrite` インターフェースを追加：

```typescript
/**
 * 書き込むファイルの情報
 */
export interface FileToWrite {
  /** 相対パス（例: "models/Pet.ts", "schemas/PetSchema.ts"） */
  path: string;
  /** ファイルの内容 */
  content: string;
}
```

既存の `GeneratedTypes`、`GeneratedSchemas`、`GeneratedServices` インターフェースは削除（後方互換性不要）。

#### Step 2: Types生成器の修正

`packages/xcgen-ts/src/generators/types/types.ts` を修正：

**変更内容:**

1. **戻り値の型変更:** `GeneratedTypes` → `FileToWrite[]`
2. **新関数追加:**
   - `generateModelFile(model: IRModel): string` - 個別モデルファイル生成
   - `generateModelsIndex(models: IRModel[]): string` - models/index.ts生成
3. **ファイル構成:**
   - 各モデル → `models/{ModelName}.ts`
   - インデックス → `models/index.ts`
   - types.ts は削除（Task 015で空のため不要）
4. **インポートパス:** 拡張子なし（例: `export * from './Pet'`）

```typescript
export function generateTypes(ir: XcgenIR): FileToWrite[] {
  const files: FileToWrite[] = [];

  // 各モデルを個別ファイルとして生成
  for (const model of ir.models) {
    const content = generateModelFile(model);
    files.push({
      path: `models/${model.name}.ts`,
      content,
    });
  }

  // models/index.ts 生成
  const indexContent = generateModelsIndex(ir.models);
  files.push({
    path: 'models/index.ts',
    content: indexContent,
  });

  return files;
}

function generateModelFile(model: IRModel): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${model.name} model`);
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  // 依存する他のモデルがあればimport追加
  // const imports = extractModelImports(model);
  // if (imports.length > 0) {
  //   for (const imp of imports) {
  //     lines.push(`import type { ${imp} } from "./${imp}";`);
  //   }
  //   lines.push('');
  // }

  const typeCode = generateModel(model);
  lines.push(typeCode);
  return lines.join('\n');
}

function generateModelsIndex(models: IRModel[]): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * Model type definitions');
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  for (const model of models) {
    lines.push(`export * from './${model.name}';`);
  }

  return lines.join('\n');
}
```

#### Step 3: Schemas生成器の修正

`packages/xcgen-ts/src/generators/schemas/schemas.ts` を修正：

**変更内容:**

1. **戻り値の型変更:** `GeneratedSchemas` → `FileToWrite[]`
2. **新関数追加:**
   - `generateSchemaFile(model: IRModel): string` - 個別スキーマファイル生成
   - `generateSchemasIndex(models: IRModel[]): string` - schemas/index.ts生成
3. **ファイル構成:**
   - 各スキーマ → `schemas/{ModelName}Schema.ts`
   - インデックス → `schemas/index.ts`
4. **依存関係:** `sortModelsByDependencies()` を維持

```typescript
export function generateSchemas(ir: XcgenIR): FileToWrite[] {
  const files: FileToWrite[] = [];

  // 依存関係順にソート
  const sortedModels = sortModelsByDependencies(ir.models);

  // 各スキーマを個別ファイルとして生成
  for (const model of sortedModels) {
    const content = generateSchemaFile(model);
    files.push({
      path: `schemas/${model.name}Schema.ts`,
      content,
    });
  }

  // schemas/index.ts 生成
  const indexContent = generateSchemasIndex(sortedModels);
  files.push({
    path: 'schemas/index.ts',
    content: indexContent,
  });

  return files;
}

function generateSchemaFile(model: IRModel): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * Valibot validation schema for ${model.name}`);
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');
  lines.push('import * as v from "valibot";');

  // 他のスキーマへの依存があればimport追加
  // const deps = extractSchemaDependencies(model);
  // if (deps.length > 0) {
  //   for (const dep of deps) {
  //     lines.push(`import { ${dep}Schema } from "./${dep}Schema";`);
  //   }
  // }

  lines.push('');
  const schemaCode = generateSchemaModel(model);
  lines.push(schemaCode);
  return lines.join('\n');
}

function generateSchemasIndex(models: IRModel[]): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * Valibot validation schemas');
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  for (const model of models) {
    lines.push(`export * from './${model.name}Schema';`);
  }

  return lines.join('\n');
}
```

#### Step 4: Services生成器の修正

`packages/xcgen-ts/src/generators/services/services.ts` を修正：

**変更内容:**

1. **戻り値の型変更:** `GeneratedServices` → `FileToWrite[]`
2. **新関数追加:**
   - `groupEndpointsByTag(endpoints): Record<string, IREndpoint[]>` - タグ別グループ化
   - `generateServiceFile(tag, endpoints): string` - タグ別サービスファイル生成
   - `generateServicesIndex(tags): string` - services/index.ts生成
3. **ファイル構成:**
   - タグ別 → `services/{tag-name}.ts`（kebab-case）
   - タグなし → `services/default.ts`
   - インデックス → `services/index.ts`

```typescript
export function generateServices(ir: XcgenIR): FileToWrite[] {
  const files: FileToWrite[] = [];

  // タグごとにグループ化
  const servicesByTag = groupEndpointsByTag(ir.endpoints);

  for (const [tag, endpoints] of Object.entries(servicesByTag)) {
    const content = generateServiceFile(tag, endpoints);
    const filename = toKebabCase(tag || 'default');
    files.push({
      path: `services/${filename}.ts`,
      content,
    });
  }

  // services/index.ts 生成
  const tags = Object.keys(servicesByTag);
  const indexContent = generateServicesIndex(tags);
  files.push({
    path: 'services/index.ts',
    content: indexContent,
  });

  return files;
}

function groupEndpointsByTag(endpoints: IREndpoint[]): Record<string, IREndpoint[]> {
  const groups: Record<string, IREndpoint[]> = {};

  for (const endpoint of endpoints) {
    const tag = endpoint.tags?.[0] || 'default';
    if (!groups[tag]) {
      groups[tag] = [];
    }
    groups[tag].push(endpoint);
  }

  return groups;
}

function generateServiceFile(tag: string, endpoints: IREndpoint[]): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${tag} service functions`);
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  // imports生成（既存ロジック活用）
  lines.push(generateServicesImports(endpoints));
  lines.push('');

  // 各エンドポイントを関数に変換
  for (const endpoint of endpoints) {
    if (endpoint.operationId) {
      const functionCode = generateServiceFunction(endpoint);
      lines.push(functionCode);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateServicesIndex(tags: string[]): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * API service functions');
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  for (const tag of tags) {
    const filename = toKebabCase(tag || 'default');
    lines.push(`export * from './${filename}';`);
  }

  return lines.join('\n');
}
```

#### Step 5: メインジェネレーターの修正

`packages/xcgen-ts/src/generator.ts` を修正：

**変更内容:**

1. **FileToWrite配列を集約**
2. **ディレクトリ作成 + ファイル書き込み** を一括処理
3. **トップレベルindex.ts生成**

```typescript
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { FileToWrite } from './types.js';

export async function generate(options: GeneratorOptions): Promise<GenerationResult> {
  // ...parse & transform

  const filesToWrite: FileToWrite[] = [];

  // 型定義ファイル群
  const typeFiles = generateTypes(ir);
  filesToWrite.push(...typeFiles);

  // スキーマファイル群（オプション）
  if (options.validator === 'valibot') {
    const schemaFiles = generateSchemas(ir);
    filesToWrite.push(...schemaFiles);
  }

  // サービスファイル群
  const serviceFiles = generateServices(ir);
  filesToWrite.push(...serviceFiles);

  // クライアントファイル
  const clientCode = generateClient(ir);
  filesToWrite.push({
    path: 'client.ts',
    content: clientCode.code,
  });

  // トップレベルindex.ts
  const indexCode = generateTopLevelIndex(ir, options);
  filesToWrite.push({
    path: 'index.ts',
    content: indexCode,
  });

  // 一括書き込み
  for (const file of filesToWrite) {
    const fullPath = join(options.output, file.path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf-8');
  }

  return {
    files: filesToWrite.map(f => join(options.output, f.path)),
    typesCount: typeFiles.length,
    schemasCount: options.validator === 'valibot' ? schemaFiles.length : undefined,
    servicesCount: serviceFiles.length,
  };
}

function generateTopLevelIndex(ir: XcgenIR, options: GeneratorOptions): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * API Client`);
  lines.push(` * Generated from: ${ir.metadata.title} ${ir.metadata.version}`);
  lines.push(' * DO NOT EDIT - This file is auto-generated');
  lines.push(' */');
  lines.push('');

  lines.push("export * from './models/index';");

  if (options.validator === 'valibot') {
    lines.push("export * from './schemas/index';");
  }

  lines.push("export * from './services/index';");
  lines.push("export { setConfig, XcgenApiError, type ApiConfig } from './client';");

  return lines.join('\n');
}
```

### Phase 3: E2Eテスト実行と検証

#### テスト実行

```bash
cd packages/xcgen-ts

# ビルド
pnpm build

# E2Eテスト実行（TDD Green状態確認）
pnpm test

# 型チェック
pnpm typecheck

# Lint
pnpm lint
```

**期待結果:**

- Task 015で作成した期待値と一致（31件のテスト失敗 → 全テストパス）
- TDD Red → Green 達成

## 技術的な詳細

### インポートパスの解決

#### 拡張子なし（バンドラー前提）

生成されるコードは拡張子なしのインポートを使用（Task 015準拠）：

```typescript
// models/GetPets200Response.ts から Pet を参照
import type { Pet } from "./Pet";

// services/pets.ts から models/ を参照
import type { GetPetsParams } from "../models/index";

// services/pets.ts から client を参照
import { request } from "../client";
```

**理由:**

- 業界標準（Orval、openapi-ts）に準拠
- ユーザー環境はバンドラー使用を前提
- CLAUDE.mdの「生成されるコード：拡張子なし（バンドラー前提）」に従う

**注:** 生成器のソースコード（`packages/xcgen-ts/src/`）は `.js` 拡張子を使用（ESM対応）

### 依存関係の順序

#### スキーマの依存関係

現在の実装では `sortModelsByDependencies()` が依存関係を解決しており、ファイル分割後も同じロジックを使用：

```typescript
// 依存関係: UserSchema → AddressSchema
// 生成順序: AddressSchema.ts → UserSchema.ts → index.ts

// schemas/AddressSchema.ts
export const AddressSchema = v.object({ ... });

// schemas/UserSchema.ts
import { AddressSchema } from './AddressSchema';
export const UserSchema = v.object({
  address: AddressSchema,
  ...
});

// schemas/index.ts
export * from './AddressSchema';
export * from './UserSchema';
```

### ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|----------|-----|
| モデル型 | PascalCase | `Pet.ts`, `User.ts` |
| パラメータ型 | PascalCase + Params | `GetPetsParams.ts` |
| レスポンス型 | PascalCase + Response | `GetPets200Response.ts` |
| スキーマ | PascalCase + Schema | `PetSchema.ts` |
| サービス | kebab-case（タグ名） | `pets.ts`, `user-profile.ts` |
| インデックス | 常に `index.ts` | `models/index.ts` |

### Tree-shaking

個別インポートが可能で、Tree-shakingの効果を最大化：

```typescript
// 必要な型のみインポート
import { Pet, User } from '@example/api-client/models';

// 必要なサービスのみインポート
import { listPets, createPet } from '@example/api-client/services/pets';

// トップレベルからもインポート可能
import { Pet, listPets } from '@example/api-client';
```

## リスクと対策

### リスク: 実装ミスによる不具合

**リスク:**

- 複数の生成器を同時に修正するため、不具合が発生する可能性
- インポートパスの誤りによる型解決失敗

**対策:**

- TDD手法（Task 015で期待値作成済み）
- ステップごとにテスト実行
- TypeScript型チェック（`pnpm typecheck`）でインポートパス検証
- Git で細かくコミット、問題があれば revert 可能

## 実装チェックリスト

### Phase 2: 生成器の修正

- [ ] **Step 1: 型定義の追加**
  - [ ] `src/types.ts` に `FileToWrite` インターフェース追加
  - [ ] 旧インターフェース削除（`GeneratedTypes`, `GeneratedSchemas`, `GeneratedServices`）

- [ ] **Step 2: Types生成器の修正**
  - [ ] `generateTypes()` 戻り値を `FileToWrite[]` に変更
  - [ ] `generateModelFile()` 実装
  - [ ] `generateModelsIndex()` 実装
  - [ ] インポートパス: 拡張子なし

- [ ] **Step 3: Schemas生成器の修正**
  - [ ] `generateSchemas()` 戻り値を `FileToWrite[]` に変更
  - [ ] `generateSchemaFile()` 実装
  - [ ] `generateSchemasIndex()` 実装
  - [ ] 依存関係ソート維持

- [ ] **Step 4: Services生成器の修正**
  - [ ] `generateServices()` 戻り値を `FileToWrite[]` に変更
  - [ ] `groupEndpointsByTag()` 実装
  - [ ] `generateServiceFile()` 実装
  - [ ] `generateServicesIndex()` 実装

- [ ] **Step 5: メインジェネレーターの修正**
  - [ ] `FileToWrite[]` 集約ロジック実装
  - [ ] ディレクトリ作成 + ファイル書き込み実装
  - [ ] `generateTopLevelIndex()` 実装

### Phase 3: E2Eテスト実行と検証

- [ ] `pnpm build` が成功することを確認
- [ ] `pnpm test` が成功することを確認（TDD Green）
- [ ] `pnpm typecheck` が成功することを確認
- [ ] `pnpm lint` が成功することを確認

## 完了条件

- [ ] 全E2Eテストがパス（TDD Red → Green 達成）
- [ ] 型チェック・Lintがエラーなし
- [ ] タスクファイルを `_done/` に移動

## 参考資料

- [_docs/001-requirements.md](../001-requirements.md) - 要件定義書（目標構造）
- [packages/xcgen-ts/src/generator.ts](../../packages/xcgen-ts/src/generator.ts) - メインジェネレーター
- [packages/xcgen-ts/tests/e2e/](../../packages/xcgen-ts/tests/e2e/) - E2Eテスト

## 注意事項

- **TDD手法:** Task 015で期待値作成済み（Red状態）→ 実装でGreen状態を目指す
- **インポートパス:** 拡張子なし（Task 015準拠、業界標準）
- **コミット:** ステップごとに細かくコミット、問題があればrevert可能に
- **後方互換性:** 不要（0.x.x開発版のため）

## 次のアクション

1. Step 1から順に実装
2. 各ステップ完了時にチェックリスト更新
3. Phase 3でTDD Green達成確認
4. タスク完了後、`_done/` に移動
