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

### Phase 1: ファイル分割ロジックの実装

#### 1.1 新しいヘルパー関数の作成

`packages/xcgen-ts/src/helpers/file-organizer.ts` を新規作成：

```typescript
import type { XcgenIR, IRModel } from '@openapi-xcgen/core';

export interface FileGroup {
  filename: string;
  content: string;
  path: string; // 相対パス（例: "models/Pet.ts"）
}

/**
 * IRモデルをファイルごとにグループ化
 */
export function groupModelsByFile(models: IRModel[]): FileGroup[] {
  return models.map(model => ({
    filename: `${model.name}.ts`,
    content: '', // 後で生成
    path: `models/${model.name}.ts`,
  }));
}

/**
 * インデックスファイルの内容を生成
 */
export function generateIndexFile(filenames: string[]): string {
  const lines = [
    '/**',
    ' * Auto-generated from OpenAPI specification',
    ' */',
    '',
  ];

  for (const filename of filenames) {
    const importPath = `./${filename.replace('.ts', '.js')}`;
    lines.push(`export * from '${importPath}';`);
  }

  return lines.join('\n');
}
```

#### 1.2 ディレクトリ作成ユーティリティ

`packages/xcgen-ts/src/helpers/file-writer.ts` を新規作成：

```typescript
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface FileToWrite {
  path: string; // 相対パス
  content: string;
}

/**
 * ディレクトリ構造を作成してファイルを書き込む
 */
export async function writeFiles(
  outputDir: string,
  files: FileToWrite[],
): Promise<void> {
  for (const file of files) {
    const fullPath = join(outputDir, file.path);
    const dir = dirname(fullPath);

    // ディレクトリ作成（再帰的）
    await mkdir(dir, { recursive: true });

    // ファイル書き込み
    await writeFile(fullPath, file.content, 'utf-8');
  }
}
```

### Phase 2: 生成器の修正

#### 2.1 型定義生成器の分割

`packages/xcgen-ts/src/generators/types/types.ts` を修正：

**変更前:**

```typescript
export function generateTypes(ir: XcgenIR): string {
  // 単一ファイルの文字列を返す
  const lines: string[] = [];
  // ...すべての型をlinesに追加
  return lines.join('\n');
}
```

**変更後:**

```typescript
import type { FileToWrite } from '../../helpers/file-writer.js';

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

  // インデックスファイル生成
  const indexContent = generateModelsIndex(ir.models);
  files.push({
    path: 'models/index.ts',
    content: indexContent,
  });

  // 共通型定義ファイル生成
  const typesContent = generateCommonTypes(ir);
  files.push({
    path: 'types.ts',
    content: typesContent,
  });

  return files;
}

/**
 * 単一モデルのファイル内容を生成
 */
function generateModelFile(model: IRModel): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${model.name} model`);
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  // モデルの型定義を生成
  const typeCode = generateModelType(model);
  lines.push(typeCode);

  return lines.join('\n');
}

/**
 * models/index.ts の内容を生成
 */
function generateModelsIndex(models: IRModel[]): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Model type definitions');
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  for (const model of models) {
    lines.push(`export * from './${model.name}.js';`);
  }

  return lines.join('\n');
}
```

#### 2.2 スキーマ生成器の分割

`packages/xcgen-ts/src/generators/schemas/schemas.ts` を同様に修正：

```typescript
export function generateSchemas(ir: XcgenIR): FileToWrite[] {
  const files: FileToWrite[] = [];

  // 依存関係順にソート（既存ロジック活用）
  const sortedModels = sortModelsByDependencies(ir.models);

  // 各スキーマを個別ファイルとして生成
  for (const model of sortedModels) {
    const content = generateSchemaFile(model);
    files.push({
      path: `schemas/${model.name}Schema.ts`,
      content,
    });
  }

  // インデックスファイル生成
  const indexContent = generateSchemasIndex(sortedModels);
  files.push({
    path: 'schemas/index.ts',
    content: indexContent,
  });

  return files;
}
```

#### 2.3 サービス生成器の修正

`packages/xcgen-ts/src/generators/services/services.ts` を修正：

```typescript
export function generateServices(ir: XcgenIR): FileToWrite[] {
  const files: FileToWrite[] = [];

  // タグごとにサービスをグループ化
  const servicesByTag = groupEndpointsByTag(ir.endpoints);

  for (const [tag, endpoints] of Object.entries(servicesByTag)) {
    const content = generateServiceFile(tag, endpoints);
    const filename = toKebabCase(tag || 'default');
    files.push({
      path: `services/${filename}.ts`,
      content,
    });
  }

  // インデックスファイル生成
  const indexContent = generateServicesIndex(Object.keys(servicesByTag));
  files.push({
    path: 'services/index.ts',
    content: indexContent,
  });

  return files;
}

/**
 * タグごとにエンドポイントをグループ化
 */
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
```

#### 2.4 メインジェネレーターの修正

`packages/xcgen-ts/src/generator.ts` を修正：

**変更前:**

```typescript
export async function generate(options: GeneratorOptions): Promise<void> {
  // ...parse & transform

  // 4つのファイルを生成
  const typesCode = generateTypes(ir);
  await writeFile(join(outputDir, 'types.ts'), typesCode);

  const schemasCode = generateSchemas(ir);
  await writeFile(join(outputDir, 'schemas.ts'), schemasCode);

  // ...
}
```

**変更後:**

```typescript
import { writeFiles } from './helpers/file-writer.js';

export async function generate(options: GeneratorOptions): Promise<void> {
  // ...parse & transform

  const filesToWrite: FileToWrite[] = [];

  // 型定義ファイル群を生成
  const typeFiles = generateTypes(ir);
  filesToWrite.push(...typeFiles);

  // スキーマファイル群を生成
  if (options.validator === 'valibot') {
    const schemaFiles = generateSchemas(ir);
    filesToWrite.push(...schemaFiles);
  }

  // サービスファイル群を生成
  const serviceFiles = generateServices(ir);
  filesToWrite.push(...serviceFiles);

  // クライアントファイル生成
  const clientCode = generateClient(ir);
  filesToWrite.push({
    path: 'client.ts',
    content: clientCode,
  });

  // トップレベルインデックス生成
  const indexCode = generateTopLevelIndex(ir, options);
  filesToWrite.push({
    path: 'index.ts',
    content: indexCode,
  });

  // 一括書き込み
  await writeFiles(options.output, filesToWrite);

  // package.json, tsconfig.json は従来通り
  await writePackageJson(options.output);
  await writeTsConfig(options.output);
}
```

### Phase 3: インデックスファイル生成

#### 3.1 トップレベルインデックスの生成

```typescript
function generateTopLevelIndex(
  ir: XcgenIR,
  options: GeneratorOptions,
): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${ir.metadata.title}`);
  lines.push(` * Version: ${ir.metadata.version}`);
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  // 共通型
  lines.push("export * from './types.js';");

  // モデル型
  lines.push("export * from './models/index.js';");

  // スキーマ（オプション）
  if (options.validator === 'valibot') {
    lines.push("export * from './schemas/index.js';");
  }

  // サービス関数
  lines.push("export * from './services/index.js';");

  // クライアント（選択的エクスポート）
  lines.push("export { setConfig, XcgenApiError, type ApiConfig } from './client.js';");

  return lines.join('\n');
}
```

### Phase 4: E2Eテスト更新

#### 4.1 期待値再生成スクリプトの実行

```bash
cd packages/xcgen-ts
pnpm regenerate:expected
```

このスクリプトは `tests/e2e/generate-expected.ts` を実行し、すべてのフィクスチャの期待値を再生成します。

#### 4.2 テスト実行ロジックの確認

`tests/e2e/index.test.ts` で、ディレクトリ構造の比較ロジックが正しく動作するか確認：

- 単一ファイルの比較から、ディレクトリツリーの比較に変更
- すべてのファイルを再帰的に比較
- ファイル数の一致も確認

#### 4.3 新しいテストケースの追加（オプション）

- ディレクトリ構造が正しいことを検証するテスト
- インデックスファイルのエクスポートが正しいことを検証するテスト

### Phase 5: 検証とドキュメント更新

#### 5.1 動作検証

```bash
# ビルド
pnpm build

# テスト実行
pnpm test

# 型チェック
pnpm typecheck

# Lint
pnpm lint
```

#### 5.2 E2Eテストの実行

```bash
cd packages/xcgen-ts
pnpm test
```

すべてのE2Eテストがパスすることを確認。

#### 5.3 実際のOpenAPIでの動作確認

```bash
# Petstore APIで生成テスト
pnpm xcgen-ts \
  --input tests/e2e/fixtures/general/petstore/openapi.yaml \
  --output /tmp/test-output

# 生成されたコードの確認
tree /tmp/test-output
cat /tmp/test-output/index.ts
cat /tmp/test-output/models/index.ts
```

#### 5.4 ドキュメント更新

以下のドキュメントを更新：

1. **要件定義書** (`_docs/001-requirements.md`)
   - Section 2 の生成コード構成を確認（既に正しい構造が記載されている）
   - 実装が要件に一致したことを記載

2. **README** (該当する場合)
   - 生成されるファイル構造の説明を更新

## 技術的な詳細

### インポートパスの解決

#### 相対インポートの使用

```typescript
// models/Pet.ts から schemas/PetSchema.ts を参照する場合
import type { Pet } from '../models/Pet.js';

// services/pets.ts から models/ を参照する場合
import type { GetPetsParams } from '../models/index.js';
```

#### `.js` 拡張子の使用

- TypeScriptのソースコードでは `.js` 拡張子を使用（ESM要件）
- `tsconfig.json` の `moduleResolution: "NodeNext"` により正しく解決される

### 依存関係の順序

#### スキーマの依存関係

現在の実装では `sortModelsByDependencies()` が依存関係を解決していますが、ファイル分割後も同じロジックを使用：

```typescript
// 依存関係: UserSchema → AddressSchema
// 生成順序: AddressSchema.ts → UserSchema.ts → index.ts

// schemas/AddressSchema.ts
export const AddressSchema = v.object({ ... });

// schemas/UserSchema.ts
import { AddressSchema } from './AddressSchema.js';
export const UserSchema = v.object({
  address: AddressSchema,
  ...
});

// schemas/index.ts
export * from './AddressSchema.js';
export * from './UserSchema.js';
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

### Tree-shaking の維持

#### 個別インポートが可能

```typescript
// ✅ 必要な型のみインポート（Tree-shaking効果大）
import { Pet, User } from '@example/api-client/models';

// ✅ 必要なサービスのみインポート
import { listPets, createPet } from '@example/api-client/services/pets';

// ✅ トップレベルからもインポート可能（後方互換性）
import { Pet, listPets } from '@example/api-client';
```

## 互換性の考慮

### パブリックAPIの変更なし

#### 使用例（変更なし）

```typescript
// 従来通りの使い方が可能
import { setConfig, listPets, type Pet } from './generated';

setConfig({ baseUrl: 'https://api.example.com' });
const pets = await listPets({ query: { limit: 10 } });
```

### マイグレーションパス

ユーザーは段階的に移行可能：

```typescript
// Step 1: トップレベルから全てインポート（変更なし）
import { Pet, listPets } from './generated';

// Step 2: 個別ディレクトリからインポート（最適化）
import { Pet } from './generated/models';
import { listPets } from './generated/services/pets';
```

## テスト戦略

### E2Eテストの更新

#### フィクスチャの構造変更

**変更前:**

```
tests/e2e/fixtures/general/petstore/expected/
├── types.ts
├── schemas.ts
├── services.ts
├── client.ts
├── package.json
└── tsconfig.json
```

**変更後:**

```
tests/e2e/fixtures/general/petstore/expected/
├── index.ts
├── types.ts
├── models/
│   ├── Pet.ts
│   ├── Pets.ts
│   ├── Error.ts
│   ├── GetPetsParams.ts
│   └── index.ts
├── schemas/
│   ├── PetSchema.ts
│   ├── PetsSchema.ts
│   ├── ErrorSchema.ts
│   └── index.ts
├── services/
│   ├── pets.ts
│   └── index.ts
├── client.ts
├── package.json
└── tsconfig.json
```

#### テスト実行の確認

```bash
# すべてのE2Eテストを実行
pnpm test

# 特定のフィクスチャのみテスト
pnpm test petstore
```

### 回帰テストの追加

新しいテストケースを追加して、ディレクトリ構造が正しいことを検証：

```typescript
// tests/e2e/directory-structure.test.ts
import { describe, it, expect } from 'vitest';
import { readdir } from 'node:fs/promises';

describe('Generated directory structure', () => {
  it('should create models/ directory', async () => {
    const files = await readdir('path/to/generated/models');
    expect(files).toContain('index.ts');
    expect(files).toContain('Pet.ts');
  });

  it('should create schemas/ directory', async () => {
    const files = await readdir('path/to/generated/schemas');
    expect(files).toContain('index.ts');
    expect(files).toContain('PetSchema.ts');
  });

  // ...
});
```

## リスクと対策

### リスク1: 大規模な変更による不具合

**リスク:**

- 多数のファイルを修正するため、予期しない不具合が発生する可能性
- E2Eテスト全体の更新が必要

**対策:**

- Phase ごとに段階的に実装・テスト
- 各 Phase 完了時に全テストを実行
- Git で細かくコミット、問題があれば revert 可能に

### リスク2: テストフィクスチャの更新漏れ

**リスク:**

- 14+個のフィクスチャすべてを手動更新すると、漏れが発生する可能性

**対策:**

- `pnpm regenerate:expected` スクリプトで自動再生成
- スクリプト実行前後で diff を確認
- CI/CD で期待値との一致を検証

### リスク3: パフォーマンスの低下

**リスク:**

- ファイル数が増えることで、生成速度が低下する可能性

**対策:**

- 並列書き込みの導入（Promise.all）
- ベンチマークテストで性能を測定
- 大規模APIでのパフォーマンステスト

### リスク4: インポートパスの問題

**リスク:**

- 相対パスの誤りにより、型解決やバンドルに失敗する可能性

**対策:**

- TypeScript の型チェックで検証（`pnpm typecheck`）
- E2Eテストで実際にインポートできるか確認
- 生成されたコードを実際にビルドして動作確認

## 実装チェックリスト

### 1. ファイル分割ロジック（Phase 1）

- [ ] `src/helpers/file-organizer.ts` を作成
  - [ ] `groupModelsByFile()` 実装
  - [ ] `generateIndexFile()` 実装
- [ ] `src/helpers/file-writer.ts` を作成
  - [ ] `writeFiles()` 実装
  - [ ] ディレクトリ作成ロジック実装
- [ ] In-source テスト追加

### 2. 生成器の修正（Phase 2）

- [ ] `src/generators/types/types.ts` を修正
  - [ ] `generateTypes()` を複数ファイル返却に変更
  - [ ] `generateModelFile()` 実装
  - [ ] `generateModelsIndex()` 実装
  - [ ] `generateCommonTypes()` 実装
- [ ] `src/generators/schemas/schemas.ts` を修正
  - [ ] `generateSchemas()` を複数ファイル返却に変更
  - [ ] `generateSchemaFile()` 実装
  - [ ] `generateSchemasIndex()` 実装
- [ ] `src/generators/services/services.ts` を修正
  - [ ] `generateServices()` を複数ファイル返却に変更
  - [ ] `groupEndpointsByTag()` 実装
  - [ ] `generateServiceFile()` 実装
  - [ ] `generateServicesIndex()` 実装
- [ ] `src/generator.ts` を修正
  - [ ] 複数ファイル生成に対応
  - [ ] `writeFiles()` を使用
  - [ ] `generateTopLevelIndex()` 実装

### 3. インデックスファイル生成（Phase 3）

- [ ] トップレベル `index.ts` 生成ロジック実装
- [ ] 各ディレクトリの `index.ts` 生成ロジック実装
- [ ] インポートパスが正しいか検証

### 4. E2Eテスト更新（Phase 4）

- [ ] `pnpm regenerate:expected` で期待値再生成
- [ ] diff を確認し、意図通りの変更か検証
- [ ] すべてのE2Eテストがパスすることを確認
- [ ] 新しいテストケースを追加（ディレクトリ構造検証）

### 5. 検証とドキュメント更新（Phase 5）

- [ ] `pnpm build` が成功することを確認
- [ ] `pnpm test` が成功することを確認
- [ ] `pnpm typecheck` が成功することを確認
- [ ] `pnpm lint` が成功することを確認
- [ ] 実際のOpenAPIで動作確認
- [ ] `_docs/001-requirements.md` を確認（既に正しい構造が記載されている）
- [ ] このタスクファイルを `_done/` に移動

## 完了条件

- [ ] すべてのE2Eテストがパス
- [ ] 型チェック・Lintがエラーなし
- [ ] 実際のOpenAPIでの動作確認完了
- [ ] ドキュメントが更新されている

## 参考資料

- [_docs/001-requirements.md](../001-requirements.md) - 要件定義書（目標構造）
- [packages/xcgen-ts/src/generator.ts](../../packages/xcgen-ts/src/generator.ts) - メインジェネレーター
- [packages/xcgen-ts/tests/e2e/](../../packages/xcgen-ts/tests/e2e/) - E2Eテスト

## 注意事項

### 破壊的変更ではない

- パブリックAPIは変更なし
- トップレベルからのインポートは引き続き可能
- 既存のユーザーコードに影響なし

### 段階的な実装

- 一度にすべて変更せず、Phase ごとに進める
- 各 Phase 完了時にテストを実行
- 問題があれば前の Phase に戻れるようにする

### コミット戦略

- Phase ごとにコミット
- コミットメッセージは明確に（例: `refactor(xcgen-ts): implement Phase 1 - file organizer helpers`）
- 必要に応じて feature ブランチで作業

## 次のアクション

1. このタスクファイルをレビュー
2. 実装方針に問題がなければ、Phase 1 から着手
3. 各 Phase 完了時にチェックリストを更新
4. すべて完了したら、Gap Analysis タスクを更新
