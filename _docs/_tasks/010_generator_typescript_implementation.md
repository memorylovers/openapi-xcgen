# タスク010: TypeScript生成器実装

## 概要

`@openapi-xcgen/generator-typescript`パッケージのソースコード実装を行います。

## ステータス

- **状態**: 要件定義完了
- **次のステップ**: 実装開始

## 前提条件

- ✅ タスク004（TypeScript生成器環境構築）完了
- ✅ タスク009（Coreパッケージのソースコード実装）完了
  - Phase 1-4完了（allOf, anyOf, oneOf, discriminator対応）
  - IR型定義完備（9種類のIRModel対応）

## 実装対象ファイル

### 基本ファイル

- `src/types.ts` - TypeScript生成器の型定義
- `src/generator.ts` - メインジェネレータークラス
- `src/index.ts` - パッケージのエクスポート

### ジェネレーター

- `src/generators/models.ts` - 型定義の生成
- `src/generators/schemas.ts` - Valibotスキーマの生成
- `src/generators/services.ts` - APIサービス関数の生成
- `src/generators/client.ts` - HTTPクライアントの生成
- `src/generators/index-file.ts` - インデックスファイルの生成

### CLI

- `src/cli.ts` - CLIエントリーポイント
- `bin/cli.mjs` - 実行可能ファイル

**CLI使用例**:

```bash
# 基本形式
xcgen-ts -i ./openapi.yaml -o ./generated

# Valibotスキーマ含めて生成
xcgen-ts -i ./openapi.yaml -o ./generated --validator=valibot

# 設定ファイル使用（xcgen.config.ts）
xcgen-ts
```

**設定ファイル例**:

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/generator-typescript';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/generated',
  validator: 'valibot',
});
```

### テンプレート（オプション）

- `src/templates/model.hbs` - Handlebarsテンプレート

---

## 実装スコープ（決定事項）

### 選択: **B. 基本機能**

**Phase 2で実装する機能:**

#### ✅ 含む機能

1. **TypeScript型定義生成**
   - IRModel → TypeScript interface/type
   - 全9種類のモデル対応
     - IRObjectModel → interface
     - IREnumModel → enum or union type
     - IRAllOfModel → intersection type (`A & B`)
     - IRAnyOfModel → union type (`A | B`)
     - IRUnionModel → discriminated union
     - IRArrayModel → `Array<T>`
     - IRMapModel → `Record<string, T>`
     - IRParameterModel, IRRequestBodyModel, IRResponseModel

2. **Valibotスキーマ生成**
   - オプション機能として提供（`--validator=valibot`フラグ）
   - Phase 2方針「Valibot対応」に合致
   - IR Validation → Valibotスキーマのマッピング

3. **APIクライアント関数生成**
   - IREndpoint → TypeScript関数
   - 型安全なAPI呼び出し
   - path/query/header/body パラメータ対応

4. **HTTPクライアント統合**
   - fetch API使用（依存なし、軽量）
   - Node.js 18+ / ブラウザ標準対応

#### ❌ Phase 3以降に延期

- モック生成（MSW等）
- 複数HTTPクライアント対応（Axios, ky等）
- フレームワーク統合（React Query, SWR等）
- Zod対応（Phase 4で予定）

### 生成コード構成

```
generated/
├── types.ts             # 全TypeScript型定義（Pet, User, Order...）
├── schemas.ts           # 全Valibotスキーマ（--validator=valibot時のみ）
├── services.ts          # 全API関数（getPet, createUser...）
└── client.ts            # HTTPクライアント設定（ApiConfig, setConfig）
```

**注**: バレルファイル（index.ts）は生成しません（Tree-shaking最適化のため）。

**使用例**:

```typescript
// 型定義のインポート
import type { Pet, GetPetData, FindPetsData } from './generated/types.js';

// API関数のインポート
import { getPet, findPets, createPet } from './generated/services.js';

// 設定
import { setConfig } from './generated/client.js';

setConfig({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
});

// API呼び出し（エラーハンドリング）
try {
  // 構造化パラメータ
  const pet = await getPet({
    path: { petId: '123' }
  });
  console.log(pet.name);

  // クエリパラメータ
  const pets = await findPets({
    query: {
      status: 'available',
      limit: 10,
    }
  });

  // リクエストボディ
  const newPet = await createPet({
    body: {
      name: 'Fluffy',
      status: 'available',
    }
  });
} catch (error) {
  if (error instanceof XcgenApiError) {
    console.error(`API Error: ${error.status}`);
  }
}
```

### 根拠

- **業界標準**: hey-api, orvalなど主要ツールは「型 + APIクライアント + バリデーション」を標準装備
- **Core準備完了**: IREndpointに必要な情報が全て揃っている
- **CLAUDE.md方針**: Phase 2は「TypeScript生成器（Valibot対応）」
- **実用性**: 型だけでは不十分、API関数があって初めて実用的
- **Tree-shaking最適化**: バレルファイル（index.ts）なしで完全なtree-shakingを実現

---

## 実装方針

### アーキテクチャ

- **関数ベース**: Tree-shaking対応のため関数ベースのエクスポート
- **純粋関数**: 副作用のない変換関数
- **4ファイル統合**: types/schemas/services/clientの4ファイルで管理（バレルなし）

### 技術選定

#### 依存関係（dependencies）

- **@openapi-xcgen/core**: OpenAPIパース、IR変換
- **c12** (^2.0.1): 設定ファイル管理（`xcgen.config.ts`サポート）
- **citty** (^0.1.6): CLIフレームワーク（Coreと統一）
- **handlebars** (^4.7.8): テンプレートエンジン（複雑なコード生成用）
- **change-case** (^5.4.4): 命名変換（PascalCase, camelCase）
- **consola** (^3.4.2): ロギング（Coreと統一）

#### 開発依存関係（devDependencies）

- **jiti** (^2.4.2): TypeScript直接実行（デバッグ、`.expected.ts`生成）
- **typescript** (^5.0.0): TypeScript 5.0+の機能活用
- **vitest** (^3.2.4): テストフレームワーク（In-sourceテスティング）
- **unbuild** (^3.6.0): ビルドツール
- **valibot** (^1.0.0): スキーマ生成のテスト用

#### ユーザー側依存（peerDependencies）

- **typescript** (^5.0.0): 必須（生成コードの型チェック用）
- **valibot** (^1.0.0): オプション（`--validator=valibot`使用時のみ）

#### 生成コードの依存

**ゼロ依存**:

- **HTTPクライアント**: fetch API（グローバル、依存なし）
  - **Node.js v22以上**とブラウザ標準（Active LTS、完全安定版）
  - `setConfig()`でbaseURL/headers/カスタムfetch設定
  - インターセプター: ユーザー側でカスタムfetch実装
- **バリデーション**: Valibot v1.x（ユーザーがインストール）
  - `--validator=valibot`フラグで生成（デフォルトは生成しない）
  - Phase 4でZod対応予定（プラガブル化）

#### Engines要件

- **Node.js**: v22以上（fetch API完全サポート、Active LTS）

### コード生成方針

- **Export形式**: named exportのみ使用（default exportは使用しない）
  - Tree-shaking最適化、IDEリファクタリング対応
- **JSDocコメント**: 常に生成
  - OpenAPIのdescription, deprecated, summaryから自動生成
  - バリデーション情報（minimum, maximum, pattern等）も含む
- **命名規則**: PascalCase（型/モデル名）、camelCase（関数/プロパティ名）
- **API関数設計**: 構造化型定義 + シングルオブジェクト引数
  - IRParameterModelから独立した型定義を生成（`{OperationId}Data`）
  - `getPet(options: GetPetData)` 形式（hey-api標準）
  - path/query/header/bodyを構造化したパラメータ型
  - 型の再利用性とIDEサポート向上
- **型修飾子**:
  - `readonly`: OpenAPIの`readOnly: true`プロパティに適用
  - `?`: optional（requiredでないプロパティ）
  - `| null`: nullable（`nullable: true`プロパティ）
  - `?: T | null`: optional + nullable
- **nullable処理**: OpenAPI 3.0/3.1両対応
  - `nullable: true` → `| null`
  - required配列なし → `?:`
  - `undefined`と`null`を明確に区別
- **型インポート**: 内部的に`import type`を使用（ビルド時間最適化）
- **エラーハンドリング**: try-catch前提（`XcgenApiError`クラスをthrow）
  - TypeScript/JavaScript標準的なエラー処理
  - React Query、SWR等との統合が容易
  - カスタムfetchでグローバルエラーハンドリング可能
- **型安全性**: strictモード対応、null/undefined区別

### バリデーションスキーマ生成方針

**Valibot v1.x**を使用したスキーマ生成（オプション機能）

**生成条件**:

- `--validator=valibot`フラグ指定時のみ生成
- デフォルトは型定義のみ（schemas.ts生成なし）

**命名規則**:

- スキーマ: `{ModelName}Schema`（例: `PetSchema`, `UserSchema`）
- Valibot公式推奨のサフィックス方式

**生成例**:

```typescript
// schemas.ts
import * as v from 'valibot';

/**
 * Schema for Pet
 */
export const PetSchema = v.object({
  /** Unique identifier */
  id: v.string(),

  /** Pet name (minLength: 1, maxLength: 100) */
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),

  /** Pet age (minimum: 0, maximum: 100) */
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
});
```

**バリデーションマッピング**:

| OpenAPI | Valibot |
|---------|---------|
| minLength | `v.pipe(v.string(), v.minLength(n))` |
| maxLength | `v.pipe(v.string(), v.maxLength(n))` |
| pattern | `v.pipe(v.string(), v.regex(/pattern/))` |
| minimum | `v.pipe(v.number(), v.minValue(n))` |
| maximum | `v.pipe(v.number(), v.maxValue(n))` |
| format: email | `v.pipe(v.string(), v.email())` |
| format: uuid | `v.pipe(v.string(), v.uuid())` |
| enum | `v.picklist(['a', 'b', 'c'])` |

**生成ファイル**:

- `--validator`なし: types.ts, services.ts, client.ts（3ファイル）
- `--validator=valibot`: types.ts, schemas.ts, services.ts, client.ts（4ファイル）

---

### HTTP Client API設計

生成される設定インターフェース:

```typescript
// 生成されるグローバル設定型
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch; // カスタムfetch関数（インターセプター代替）
}

export function setConfig(config: ApiConfig): void;
export function getConfig(): ApiConfig;

// エラークラス
export class XcgenApiError extends Error {
  readonly response: Response;
  readonly body?: unknown;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
}
```

生成されるパラメータ型とAPI関数:

```typescript
// types.ts - IRParameterModelから生成
export interface GetPetData {
  path: {
    petId: string;
  };
}

export interface CreatePetData {
  body: CreatePetRequest;
}

// services.ts - 生成されたAPI関数
export async function getPet(
  options: GetPetData,
  init?: RequestInit
): Promise<Pet>;

export async function createPet(
  options: CreatePetData,
  init?: RequestInit
): Promise<Pet>;
```

ユーザー側の使用例:

```typescript
import { setConfig, getPet } from './generated';

// 基本設定
setConfig({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
});

// カスタムfetch（インターセプター的処理）
setConfig({
  fetch: async (url, init) => {
    console.log('Request:', url);
    const res = await fetch(url, init);
    if (!res.ok) {
      // カスタムエラーハンドリング
    }
    return res;
  },
});

// API呼び出し（エラーハンドリング）
try {
  // 構造化パラメータ
  const pet = await getPet({
    path: { petId: '123' }
  });
  console.log(pet.name);
} catch (error) {
  if (error instanceof XcgenApiError) {
    console.error(`API Error: ${error.status}`);
  }
}
```

---

## 検証

### テスト戦略

**3段階テスト戦略**を採用:

#### 1. Unit Test（単体テスト）

**手法**: In-sourceテスティング（`import.meta.vitest`）

```typescript
// src/generators/helpers/to-pascal-case.ts
export function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("toPascalCase", () => {
    it("should convert to PascalCase", () => {
      expect(toPascalCase("pet")).toBe("Pet");
    });
  });
}
```

**対象範囲**:

- ヘルパー関数（命名変換、型マッピング）
- IRModel → TypeScript型変換ロジック
- IRValidation → Valibotスキーマ変換ロジック

**カバレッジ目標**: 80%以上

#### 2. E2E Test（統合テスト）

**手法**: Coreパッケージと同様の`.expected.ts`ファイル比較

```
packages/generator-typescript/tests/
├── e2e/
│   ├── fixtures/
│   │   ├── petstore/
│   │   │   ├── openapi.yaml
│   │   │   ├── types.expected.ts
│   │   │   ├── schemas.expected.ts
│   │   │   ├── services.expected.ts
│   │   │   └── client.expected.ts
│   │   └── complex-models/
│   ├── generator.test.ts
│   └── test-helper.ts
```

**対象ユースケース**:

- 基本的なCRUD（petstore）
- 複雑なモデル（allOf, anyOf, oneOf）
- バリデーション付き
- readOnly/writeOnly
- enum型

#### 3. Generated Code Test（生成コードテスト）

**型チェックテスト（必須）**:

```typescript
describe("Generated Code: Type Check", () => {
  it("should pass TypeScript type checking", () => {
    execSync("tsc --noEmit --project tests/generated-code/tsconfig.json");
  });
});
```

**ランタイムテスト（オプション）**:

```typescript
describe("Generated Code: Runtime Validation", () => {
  it("should validate with Valibot schema", () => {
    const validPet = { id: "1", name: "Fluffy" };
    expect(() => v.parse(PetSchema, validPet)).not.toThrow();
  });
});
```

### CI/CD統合

GitHub Actionsで自動実行:

```bash
pnpm lint        # Lint + Prettier + markdownlint
pnpm typecheck   # TypeScript型チェック
pnpm test        # Unit + E2E + Generated Code Test
pnpm test:coverage  # カバレッジ計測
```

### 検証項目

- ✅ ビルドが正常に完了すること（`pnpm build`）
- ✅ 型チェックが通ること（`pnpm typecheck`）
- ✅ Unit Testが80%以上のカバレッジを達成すること
- ✅ E2E Testで主要ユースケースが網羅されていること
- ✅ 生成コードがTypeScript型チェックを通ること
- ✅ CLIコマンドが実行できること
- ✅ CI/CDパイプラインが通ること
