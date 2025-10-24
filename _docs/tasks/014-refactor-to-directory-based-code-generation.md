# 014: ディレクトリベース構造へのリファクタリング

## 概要

TypeScript生成器（xcgen-ts）の出力構造を、現在の単一ファイル構造からディレクトリベース構造に変更します。

**目的:**

- 要件定義書（`_docs/001-requirements.md`）との整合性確保
- 保守性・可読性の向上
- 大規模API対応の準備

## 目標構造

```
generated/
├── index.ts                   # トップレベルのエクスポート
├── models/                    # データモデルの型定義
│   ├── Pet.ts
│   ├── User.ts
│   ├── GetPetsParams.ts       # パラメータ型
│   ├── GetPets200Response.ts  # レスポンス型
│   └── index.ts
├── schemas/                   # Valibotバリデーションスキーマ
│   ├── PetSchema.ts
│   ├── UserSchema.ts
│   └── index.ts
├── services/                  # API関数（タグ別）
│   ├── pets.ts
│   ├── users.ts
│   └── index.ts
└── client.ts                  # HTTPクライアントユーティリティ
```

## 設計方針

### アーキテクチャ概要

**改善されたFileWriterベースの設計**を採用し、以下の利点を実現：

#### 1. パフォーマンス最適化

- **並列ファイル書き込み**: `Promise.all()` で複数ファイルを同時書き込み
- **ストリーミング方式**: IR→Code→書き込みを一連の処理として実行（メモリ効率向上）
- **メモリ効率**: 大規模APIでも全ファイル内容をメモリに保持せず、生成後即座に書き込み

#### 2. 関数型設計

- **純粋関数とI/Oの分離**:
  - `generateModelFile(model): string` - 純粋関数（IR→Code）
  - `writer.write(path, content)` - I/O処理（Code→書き込み）
- **テスタビリティ**: 純粋関数は単体テストが容易、I/OはMock化可能

#### 3. 依存性注入

- **IFileWriterインターフェース**: 抽象化により実装を差し替え可能
- **FileWriter**: 本番用（実ファイルシステム）
- **MockFileWriter**: テスト用（メモリ内Map）

### 処理フロー

```
IR (中間表現)
  ↓
純粋関数 (generateModelFile等)
  ↓
Code (string)
  ↓
IFileWriter.write() ← 並列実行
  ↓
ファイルシステム
```

### 設計の利点

#### 1. パフォーマンス

- **並列書き込み**: 100モデルの場合、並列処理で大幅な時間短縮
- **メモリ効率**: 全ファイル内容を保持せず、生成→即書き込み
- **ストリーミング**: 大規模API（1000+ モデル）でもメモリ使用量が一定

**例:** 100モデルの場合

```
旧設計（逐次処理）:  100 × 10ms = 1000ms
新設計（並列処理）:  max(10ms) ≈ 10ms  （100倍高速化）
```

#### 2. テスタビリティ

- **純粋関数**: `generateModelFile()` 等は入出力がない単純関数
  - モック不要で単体テスト可能
  - 副作用がなく予測可能
- **I/Oのモック化**: `MockFileWriter` でファイルシステムをモック
  - 高速なテスト実行
  - ファイルシステムに依存しない

#### 3. 保守性

- **関心の分離**: コード生成（純粋関数）とI/O（副作用）を分離
- **再利用性**: 純粋関数は他の出力形式にも流用可能
- **依存性注入**: インターフェースベースで実装を差し替え可能

## 実装計画

### Phase 2: 生成器の修正（ディレクトリベース構造への変更）

#### Step 1: FileWriterの実装

`packages/xcgen-ts/src/helpers/file-writer.ts` を新規作成：

```typescript
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * ファイル書き込み抽象化インターフェース
 */
export interface IFileWriter {
  /**
   * ファイルを書き込む（ディレクトリは自動作成）
   */
  write(path: string, content: string): Promise<void>;

  /**
   * ディレクトリを作成する
   */
  mkdir(dir: string): Promise<void>;
}

/**
 * 実ファイルシステムへの書き込み
 */
export class FileWriter implements IFileWriter {
  constructor(private baseDir: string) {}

  async write(path: string, content: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  }

  async mkdir(dir: string): Promise<void> {
    const fullPath = join(this.baseDir, dir);
    await mkdir(fullPath, { recursive: true });
  }
}

/**
 * テスト用のメモリ内書き込み
 */
export class MockFileWriter implements IFileWriter {
  readonly files = new Map<string, string>();
  readonly directories: string[] = [];

  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async mkdir(dir: string): Promise<void> {
    this.directories.push(dir);
  }

  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  clear(): void {
    this.files.clear();
    this.directories.length = 0;
  }
}
```

#### Step 2: 型定義の追加

`packages/xcgen-ts/src/types.ts` に戻り値型を追加：

```typescript
/**
 * 生成結果
 */
export interface GenerationResult {
  /** 書き込まれたファイルパスの配列 */
  files: string[];
  /** 生成されたファイル数 */
  count: number;
}
```

既存の `GeneratedTypes`、`GeneratedSchemas`、`GeneratedServices` インターフェースは削除（後方互換性不要）。

#### Step 3: Types生成器の修正

`packages/xcgen-ts/src/generators/types/types.ts` を修正：

**変更内容:**

1. **関数シグネチャ変更:** `generateTypes(ir, writer)` - writerを受け取る
2. **戻り値の型変更:** `Promise<GenerationResult>`
3. **純粋関数の追加:**
   - `generateModelFile(model: IRModel): string` - IR→Code（純粋関数）
   - `generateModelsIndex(models: IRModel[]): string` - IR→Code（純粋関数）
4. **並列書き込み:** `Promise.all()` で複数ファイルを同時書き込み
5. **インポートパス:** 拡張子なし（例: `export * from './Pet'`）

```typescript
import type { XcgenIR, IRModel } from '@openapi-xcgen/core';
import type { IFileWriter } from '../../helpers/file-writer.js';
import type { GenerationResult } from '../../types.js';

export async function generateTypes(
  ir: XcgenIR,
  writer: IFileWriter,
): Promise<GenerationResult> {
  const files: string[] = [];

  // Step 1: IR → Code (純粋関数による変換)
  const modelFiles = ir.models.map(model => ({
    path: `models/${model.name}.ts`,
    content: generateModelFile(model),
  }));

  // Step 2: Code → Write (並列書き込み)
  await Promise.all(
    modelFiles.map(file => writer.write(file.path, file.content))
  );

  files.push(...modelFiles.map(f => f.path));

  // Step 3: models/index.ts 生成・書き込み
  const indexContent = generateModelsIndex(ir.models);
  await writer.write('models/index.ts', indexContent);
  files.push('models/index.ts');

  return {
    files,
    count: ir.models.length,
  };
}

/**
 * 純粋関数: IRModel → TypeScript型定義コード
 */
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

/**
 * 純粋関数: IRModel[] → models/index.ts コード
 */
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

#### Step 4: Schemas生成器の修正

`packages/xcgen-ts/src/generators/schemas/schemas.ts` を修正：

**変更内容:**

1. **関数シグネチャ変更:** `generateSchemas(ir, writer)` - writerを受け取る
2. **戻り値の型変更:** `Promise<GenerationResult>`
3. **純粋関数の追加:**
   - `generateSchemaFile(model: IRModel): string` - IR→Code（純粋関数）
   - `generateSchemasIndex(models: IRModel[]): string` - IR→Code（純粋関数）
4. **並列書き込み:** `Promise.all()` で複数ファイルを同時書き込み
5. **依存関係:** `sortModelsByDependencies()` を維持

```typescript
import type { XcgenIR, IRModel } from '@openapi-xcgen/core';
import type { IFileWriter } from '../../helpers/file-writer.js';
import type { GenerationResult } from '../../types.js';
import { sortModelsByDependencies } from './helpers/sort-models.js';

export async function generateSchemas(
  ir: XcgenIR,
  writer: IFileWriter,
): Promise<GenerationResult> {
  const files: string[] = [];

  // 依存関係順にソート
  const sortedModels = sortModelsByDependencies(ir.models);

  // Step 1: IR → Code (純粋関数による変換)
  const schemaFiles = sortedModels.map(model => ({
    path: `schemas/${model.name}Schema.ts`,
    content: generateSchemaFile(model),
  }));

  // Step 2: Code → Write (並列書き込み)
  await Promise.all(
    schemaFiles.map(file => writer.write(file.path, file.content))
  );

  files.push(...schemaFiles.map(f => f.path));

  // Step 3: schemas/index.ts 生成・書き込み
  const indexContent = generateSchemasIndex(sortedModels);
  await writer.write('schemas/index.ts', indexContent);
  files.push('schemas/index.ts');

  return {
    files,
    count: sortedModels.length,
  };
}

/**
 * 純粋関数: IRModel → Valibotスキーマコード
 */
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

/**
 * 純粋関数: IRModel[] → schemas/index.ts コード
 */
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

#### Step 5: Services生成器の修正

`packages/xcgen-ts/src/generators/services/services.ts` を修正：

**変更内容:**

1. **関数シグネチャ変更:** `generateServices(ir, writer)` - writerを受け取る
2. **戻り値の型変更:** `Promise<GenerationResult>`
3. **純粋関数の追加:**
   - `groupEndpointsByTag(endpoints): Record<string, IREndpoint[]>` - タグ別グループ化（純粋関数）
   - `generateServiceFile(tag, endpoints): string` - IR→Code（純粋関数）
   - `generateServicesIndex(tags): string` - IR→Code（純粋関数）
4. **並列書き込み:** `Promise.all()` で複数ファイルを同時書き込み
5. **ファイル構成:**
   - タグ別 → `services/{tag-name}.ts`（kebab-case）
   - タグなし → `services/default.ts`
   - インデックス → `services/index.ts`

```typescript
import type { XcgenIR, IREndpoint } from '@openapi-xcgen/core';
import type { IFileWriter } from '../../helpers/file-writer.js';
import type { GenerationResult } from '../../types.js';
import { toKebabCase } from '../../helpers/case-conversion.js';

export async function generateServices(
  ir: XcgenIR,
  writer: IFileWriter,
): Promise<GenerationResult> {
  const files: string[] = [];

  // タグごとにグループ化
  const servicesByTag = groupEndpointsByTag(ir.endpoints);

  // Step 1: IR → Code (純粋関数による変換)
  const serviceFiles = Object.entries(servicesByTag).map(([tag, endpoints]) => {
    const filename = toKebabCase(tag || 'default');
    return {
      path: `services/${filename}.ts`,
      content: generateServiceFile(tag, endpoints),
    };
  });

  // Step 2: Code → Write (並列書き込み)
  await Promise.all(
    serviceFiles.map(file => writer.write(file.path, file.content))
  );

  files.push(...serviceFiles.map(f => f.path));

  // Step 3: services/index.ts 生成・書き込み
  const tags = Object.keys(servicesByTag);
  const indexContent = generateServicesIndex(tags);
  await writer.write('services/index.ts', indexContent);
  files.push('services/index.ts');

  return {
    files,
    count: serviceFiles.length,
  };
}

/**
 * 純粋関数: エンドポイントをタグ別にグループ化
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

/**
 * 純粋関数: IREndpoint[] → サービス関数コード
 */
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

/**
 * 純粋関数: タグ配列 → services/index.ts コード
 */
function generateServicesIndex(tags: string[]): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * API service functions');
  lines.push(' * Auto-generated from OpenAPI specification');
  lines.push(' */');
  lines.push('');

  // エンドポイントがない場合の処理
  if (tags.length === 0) {
    lines.push('// No services defined for this API');
    lines.push('export {};');
    return lines.join('\n');
  }

  for (const tag of tags) {
    const filename = toKebabCase(tag || 'default');
    lines.push(`export * from './${filename}';`);
  }

  return lines.join('\n');
}
```

#### Step 6: メインジェネレーターの修正

`packages/xcgen-ts/src/generator.ts` を修正：

**変更内容:**

1. **FileWriterの初期化:** `new FileWriter(options.output)`
2. **生成器に`writer`を渡す:** 各生成器が内部で並列書き込み実行
3. **client.ts/index.tsを並列書き込み:** `Promise.all()` で最適化
4. **戻り値の型変更:** ファイルパスのみ返す（contentは返さない）

```typescript
import consola from 'consola';
import { join } from 'node:path';
import { parse } from './parser/parser.js';
import { transform } from './transformer/transformer.js';
import { generateTypes } from './generators/types/types.js';
import { generateSchemas } from './generators/schemas/schemas.js';
import { generateServices } from './generators/services/services.js';
import { generateClient } from './generators/client/client.js';
import { FileWriter } from './helpers/file-writer.js';
import type { GeneratorOptions, GenerationResult } from './types.js';

export async function generate(options: GeneratorOptions): Promise<GenerationResult> {
  consola.start('Parsing OpenAPI specification...');
  const openapi = await parse(options.input);

  consola.start('Transforming to IR...');
  const ir = transform(openapi);

  consola.start('Generating code...');
  const writer = new FileWriter(options.output);
  const allFiles: string[] = [];

  // Types生成（内部で並列書き込み）
  consola.info('Generating types...');
  const typesResult = await generateTypes(ir, writer);
  allFiles.push(...typesResult.files);

  // Schemas生成（内部で並列書き込み）
  let schemasResult;
  if (options.validator === 'valibot') {
    consola.info('Generating schemas...');
    schemasResult = await generateSchemas(ir, writer);
    allFiles.push(...schemasResult.files);
  }

  // Services生成（内部で並列書き込み）
  consola.info('Generating services...');
  const servicesResult = await generateServices(ir, writer);
  allFiles.push(...servicesResult.files);

  // client.ts と index.ts を並列書き込み
  consola.info('Generating client and index...');
  const clientCode = generateClient(ir);
  const indexCode = generateTopLevelIndex(ir, options);

  await Promise.all([
    writer.write('client.ts', clientCode.code),
    writer.write('index.ts', indexCode),
  ]);

  allFiles.push('client.ts', 'index.ts');

  consola.success(`Generated ${allFiles.length} files`);

  return {
    files: allFiles.map(f => join(options.output, f)),
    typesCount: typesResult.count,
    schemasCount: schemasResult?.count,
    servicesCount: servicesResult.count,
  };
}

/**
 * 純粋関数: トップレベルindex.ts コード生成
 */
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

### テスト例: MockFileWriterの使用

生成器のテストでは`MockFileWriter`を使用してファイルI/Oをモック化：

```typescript
import { describe, it, expect } from 'vitest';
import { generateTypes } from './types.js';
import { MockFileWriter } from '../../helpers/file-writer.js';
import type { XcgenIR } from '@openapi-xcgen/core';

describe('generateTypes', () => {
  it('should generate model files in parallel', async () => {
    const ir: XcgenIR = {
      metadata: { title: 'Test API', version: '1.0.0' },
      models: [
        {
          kind: 'object',
          name: 'Pet',
          referencePath: '#/components/schemas/Pet',
          properties: [
            { name: 'id', type: { kind: 'primitive', type: 'int' }, required: true },
            { name: 'name', type: { kind: 'primitive', type: 'string' }, required: true },
          ],
        },
        {
          kind: 'object',
          name: 'User',
          referencePath: '#/components/schemas/User',
          properties: [
            { name: 'id', type: { kind: 'primitive', type: 'int' }, required: true },
          ],
        },
      ],
      tags: [],
      endpoints: [],
    };

    const writer = new MockFileWriter();
    const result = await generateTypes(ir, writer);

    // 戻り値の検証
    expect(result.files).toEqual(['models/Pet.ts', 'models/User.ts', 'models/index.ts']);
    expect(result.count).toBe(2);

    // ファイル内容の検証（純粋関数の出力）
    const petFile = writer.getFile('models/Pet.ts');
    expect(petFile).toContain('export interface Pet');
    expect(petFile).toContain('id: number;');
    expect(petFile).toContain('name: string;');

    const userFile = writer.getFile('models/User.ts');
    expect(userFile).toContain('export interface User');

    // index.tsの検証
    const indexFile = writer.getFile('models/index.ts');
    expect(indexFile).toContain("export * from './Pet';");
    expect(indexFile).toContain("export * from './User';");
  });

  it('should handle empty models array', async () => {
    const ir: XcgenIR = {
      metadata: { title: 'Test API', version: '1.0.0' },
      models: [],
      tags: [],
      endpoints: [],
    };

    const writer = new MockFileWriter();
    const result = await generateTypes(ir, writer);

    expect(result.files).toEqual(['models/index.ts']);
    expect(result.count).toBe(0);
  });
});
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

## 実装上の注意点

### インポートパス

拡張子なし（Task 015準拠、業界標準）：

```typescript
import type { Pet } from "./Pet";              // ✅
import type { Pet } from "./Pet.js";           // ❌
```

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| モデル | PascalCase | `Pet.ts` |
| スキーマ | PascalCase + Schema | `PetSchema.ts` |
| サービス | kebab-case（タグ名） | `pets.ts` |
| インデックス | `index.ts` | `models/index.ts` |

### 依存関係

スキーマの依存関係は `sortModelsByDependencies()` で解決済み

## 実装チェックリスト

### ステップ1〜6: 生成器の修正

- [ ] **Step 1: FileWriterの実装**
  - [ ] `src/helpers/file-writer.ts` 新規作成
  - [ ] `IFileWriter` インターフェース実装
  - [ ] `FileWriter` クラス実装（実ファイルシステム）
  - [ ] `MockFileWriter` クラス実装（テスト用）
  - [ ] in-source テスト追加（`MockFileWriter`の動作確認）

- [ ] **Step 2: 型定義の追加**
  - [ ] `src/types.ts` に `GenerationResult` インターフェース追加
  - [ ] 旧インターフェース削除（`GeneratedTypes`, `GeneratedSchemas`, `GeneratedServices`）

- [ ] **Step 3: Types生成器の修正**
  - [ ] `generateTypes(ir, writer)` シグネチャ変更
  - [ ] 戻り値を `Promise<GenerationResult>` に変更
  - [ ] `generateModelFile()` 実装（純粋関数: IR→Code）
  - [ ] `generateModelsIndex()` 実装（純粋関数: IR→Code）
  - [ ] 並列書き込み実装（`Promise.all()`）
  - [ ] インポートパス: 拡張子なし

- [ ] **Step 4: Schemas生成器の修正**
  - [ ] `generateSchemas(ir, writer)` シグネチャ変更
  - [ ] 戻り値を `Promise<GenerationResult>` に変更
  - [ ] `generateSchemaFile()` 実装（純粋関数: IR→Code）
  - [ ] `generateSchemasIndex()` 実装（純粋関数: IR→Code）
  - [ ] 並列書き込み実装（`Promise.all()`）
  - [ ] 依存関係ソート維持

- [ ] **Step 5: Services生成器の修正**
  - [ ] `generateServices(ir, writer)` シグネチャ変更
  - [ ] 戻り値を `Promise<GenerationResult>` に変更
  - [ ] `groupEndpointsByTag()` 実装（純粋関数）
  - [ ] `generateServiceFile()` 実装（純粋関数: IR→Code）
  - [ ] `generateServicesIndex()` 実装（純粋関数: IR→Code）
  - [ ] 並列書き込み実装（`Promise.all()`）
  - [ ] エンドポイントがない場合の処理（`export {}`）

- [ ] **Step 6: メインジェネレーターの修正**
  - [ ] `FileWriter` の初期化実装
  - [ ] 各生成器に `writer` を渡すよう修正
  - [ ] client.ts/index.ts の並列書き込み実装
  - [ ] `generateTopLevelIndex()` 実装（純粋関数）
  - [ ] 戻り値型を `GenerationResult` に統一

### テスト実行と検証

- [ ] `pnpm build` が成功することを確認
- [ ] `pnpm test` が成功することを確認（TDD Green - 31件失敗→全パス）
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
