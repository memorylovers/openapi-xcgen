# タスク010: TypeScript生成器実装

## 概要

`@openapi-xcgen/generator-typescript`パッケージのソースコード実装を行います。

## ステータス

- **状態**: Phase 1完了（基本機能実装済み）
- **次のステップ**: Phase 2（Valibotスキーマ生成）、CLI実装

## 前提条件

- ✅ タスク004（TypeScript生成器環境構築）完了
- ✅ タスク009（Coreパッケージのソースコード実装）完了
  - Phase 1-4完了（allOf, anyOf, oneOf, discriminator対応）
  - IR型定義完備（9種類のIRModel対応）

## 実装ファイル（Phase 1完了）

### ✅ 実装済み（基本ファイル）

- `src/types.ts` - TypeScript生成器の型定義
- `src/generator.ts` - メインジェネレーター関数
- `src/index.ts` - パッケージのエクスポート

### ✅ 実装済み（ジェネレーター - ultrathink原則：1関数1ファイル）

#### Types Generator（型定義生成）

- `src/generators/types/types.ts` - Orchestrator（型生成の統合）
- `src/generators/types/types-object.ts` - IRObjectModel → interface
- `src/generators/types/types-enum.ts` - IREnumModel → enum/union type
- `src/generators/types/types-allof.ts` - IRAllOfModel → intersection type
- `src/generators/types/types-anyof.ts` - IRAnyOfModel → union type
- `src/generators/types/types-union.ts` - IRUnionModel → discriminated union
- `src/generators/types/types-array.ts` - IRArrayModel → `Array<T>`
- `src/generators/types/types-map.ts` - IRMapModel → `Record<string, T>`
- `src/generators/types/types-parameter.ts` - IRParameterModel → {OperationId}Data型
- `src/generators/types/types-property.ts` - プロパティ生成（readonly, optional, nullable対応）

#### Services Generator（API関数生成）

- `src/generators/services/services.ts` - Orchestrator（サービス生成の統合）
- `src/generators/services/services-header.ts` - ファイルヘッダーコメント
- `src/generators/services/services-imports.ts` - import文生成
- `src/generators/services/services-function.ts` - API関数生成
- `src/generators/services/services-response-type.ts` - レスポンス型抽出

#### Client Generator（HTTPクライアント生成）

- `src/generators/client/client.ts` - Orchestrator（クライアント生成の統合）
- `src/generators/client/client-header.ts` - ファイルヘッダーコメント
- `src/generators/client/client-error.ts` - XcgenApiErrorクラス
- `src/generators/client/client-api-config-interface.ts` - ApiConfig型定義
- `src/generators/client/client-global-config.ts` - グローバル設定変数
- `src/generators/client/client-set-config.ts` - setConfig()関数
- `src/generators/client/client-request.ts` - Orchestrator（request関数統合）
  - `client-request-signature.ts` - 関数シグネチャ
  - `client-request-url.ts` - URL構築（path/query params）
  - `client-request-headers.ts` - ヘッダーマージング
  - `client-request-fetch.ts` - fetch実行
  - `client-request-error.ts` - エラーハンドリング
  - `client-request-response.ts` - レスポンスパース（204/Binary/JSON/Text）

#### Helpers（共通ヘルパー）

- `src/helpers/naming.ts` - 命名変換（toTypeName, toFunctionName, toPropertyName）
- `src/helpers/type-mapper.ts` - IR型 → TypeScript型マッピング

### ❌ 未実装（Phase 2以降）

#### Schemas Generator（バリデーションスキーマ生成）

- `src/generators/schemas/` - Valibotスキーマ生成（Phase 2予定）

#### CLI

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

### アーキテクチャ（Phase 1実装済み）

- **ultrathink原則**: 1関数1ファイルの徹底（モジュール性最大化）
- **Orchestratorパターン**: 各メインファイル（types.ts, services.ts, client.ts）は部品を組み立てるだけ
- **関数ベース**: Tree-shaking対応のため関数ベースのエクスポート（クラス不使用）
- **純粋関数**: 副作用のない変換関数
- **3ファイル生成**: types.ts / services.ts / client.ts（schemas.tsはPhase 2で追加予定）
- **バレルファイル不使用**: Tree-shaking最適化のためindex.tsは生成しない

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

### テスト戦略（Phase 1実装済み）

**In-sourceテスティング**を採用（Phase 1完了）:

#### ✅ 実装済み: Unit Test（単体テスト）

**手法**: In-sourceテスティング（`import.meta.vitest`）

**実績**:

- **31テストファイル** × **103テスト**（全てパス）
- テストフォーマット統一: Template literal + `.trim()` 形式
- カバレッジ: 全主要関数をカバー

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

**カバレッジ実績**: 全主要関数をカバー

#### ❌ 未実装: E2E Test（統合テスト）

**手法**: Coreパッケージと同様の`.expected.ts`ファイル比較（Phase 2で実装予定）

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

#### ❌ 未実装: Generated Code Test（生成コードテスト）

**型チェックテスト（必須）** - Phase 2で実装予定:

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

### 検証項目（Phase 1実績）

#### ✅ Phase 1完了項目

- ✅ ビルドが正常に完了すること（`pnpm build`）
- ✅ 型チェックが通ること（`pnpm typecheck`）
- ✅ Lintが通ること（`pnpm lint`）
- ✅ Unit Testが全てパスすること（31ファイル × 103テスト）
- ✅ In-sourceテスティングが機能すること
- ✅ テストフォーマットが統一されていること（Template literal + `.trim()`）

#### ❌ Phase 2以降の項目

- ❌ E2E Testで主要ユースケースが網羅されていること
- ❌ 生成コードがTypeScript型チェックを通ること
- ❌ Valibotスキーマ生成が動作すること
- ❌ CLIコマンドが実行できること
- ❌ CI/CDパイプラインが通ること

---

## Phase 1実装サマリー

### 完了した機能

1. **型生成（types.ts）**
   - 9種類のIRModel対応（Object, Enum, AllOf, AnyOf, Union, Array, Map, Parameter, Property）
   - readonly, optional, nullable対応
   - JSDocコメント生成

2. **サービス生成（services.ts）**
   - API関数生成（IREndpoint → TypeScript関数）
   - 構造化パラメータ型（{OperationId}Data）
   - エラーハンドリング（XcgenApiError）

3. **クライアント生成（client.ts）**
   - fetch API使用（ゼロ依存）
   - グローバル設定（setConfig）
   - カスタムfetch対応（インターセプター的処理）
   - エラークラス（XcgenApiError）

4. **アーキテクチャ**
   - ultrathink原則（1関数1ファイル）
   - Orchestratorパターン
   - 31ファイル × 103テスト（全てパス）

### 生成コード例

```typescript
// types.ts
export interface Pet {
  readonly id: string;
  name: string;
  age?: number | null;
}

export interface GetPetData {
  path: { petId: string };
}

// services.ts
export async function getPet(
  options: GetPetData,
  init?: RequestInit
): Promise<Pet>;

// client.ts
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export function setConfig(config: ApiConfig): void;
export class XcgenApiError extends Error { /* ... */ }
```

### 技術スタック

- **実装**: TypeScript 5.0+、関数ベース、純粋関数
- **テスト**: Vitest（In-sourceテスティング）、31ファイル × 103テスト
- **品質**: ESLint、Prettier、markdownlint
- **ビルド**: unbuild（ESM/CJS両対応）

---

## Phase 2計画

### 優先度1: Valibotスキーマ生成

- `src/generators/schemas/` ディレクトリ作成
- IRValidation → Valibot変換ロジック
- schemas.ts生成機能
- `--validator=valibot` フラグ対応

### 優先度2: E2Eテスト

- `.expected.ts` ファイル比較テスト
- 主要ユースケースの網羅
- 生成コードの型チェックテスト

### 優先度3: CLI実装

- `src/cli.ts` 実装
- `bin/cli.mjs` 実行可能ファイル
- `xcgen-ts` コマンド
- 設定ファイル対応（`xcgen.config.ts`）

### 優先度4: CI/CD

- GitHub Actions設定
- 自動テスト、ビルド、型チェック
- カバレッジレポート
