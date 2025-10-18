# タスク010: TypeScript生成器実装

## 概要

`@openapi-xcgen/generator-typescript`パッケージのソースコード実装を行います。

## ステータス

- **状態**: Phase 3完了（コア機能実装完了、一部機能は Phase 4 へ延期）
  - ✅ Phase 1完了（types, services, client生成）
  - ✅ Phase 2完了（Valibotスキーマ生成、型エラー修正、実例検証）
  - ✅ Phase 2.5完了（品質改善、Examples統合）
  - ✅ Phase 3完了（E2Eテスト、型チェックテスト）
  - ⚠️ **既知の制限事項**: CLI未実装、統合パラメータインターフェース未対応
- **次のステップ**: Phase 4（CLI実装、制限事項解消）→ 実用段階（ドキュメント整備、npm公開準備）

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

### ✅ Phase 2完了（Valibotスキーマ生成）

#### Schemas Generator（バリデーションスキーマ生成）

**✅ 実装済み（14ファイル、ultrathink原則: 1関数1ファイル）:**

- `src/generators/schemas/schemas.ts` - **Orchestrator（実装完了）**
  - IRModel配列を走査してスキーマ定義を統合
  - ultrathink原則に従い109行に最適化
- `src/generators/schemas/schemas-model.ts` - **IRModel → 完全なスキーマ定義**
  - 各IRModel.kindに応じたスキーマ生成
  - JSDocコメント生成
- `src/generators/schemas/schemas-type-mapper.ts` - **IRType → Valibotスキーマ + validation**
  - IRType（scalar/ref/array/map）をスキーマに変換
  - バリデーションパイプ適用
- `src/generators/schemas/schemas-type-ref.ts` - **IRType → スキーマ参照**
  - allOf/anyOf用のスキーマ参照文字列生成
- `src/generators/schemas/schemas-header.ts` - ファイルヘッダーコメント
- `src/generators/schemas/schemas-imports.ts` - import文生成（`import * as v from "valibot"`）
- `src/generators/schemas/schemas-primitive.ts` - IRScalarType → Valibot primitives
  - 全11スカラー型対応（int, long, float, double, string, boolean, null, date, datetime, byte, binary）
  - **binary型**: `v.instance(Blob)` でTypeScript型（Blob）との整合性確保
- `src/generators/schemas/schemas-validation.ts` - IRValidation → Valibot pipes
  - minLength, maxLength, pattern, minimum, maximum対応
  - format対応（email, uuid, url/uri, date-time, date）
- `src/generators/schemas/schemas-enum.ts` - IREnumModel → `v.picklist()`
- `src/generators/schemas/schemas-array.ts` - IRArrayModel → `v.array()`
- `src/generators/schemas/schemas-object.ts` - IRObjectModel → `v.object()`
  - optional, nullable, readOnly対応
- `src/generators/schemas/schemas-allof.ts` - IRAllOfModel → `v.intersect()`
- `src/generators/schemas/schemas-anyof.ts` - IRAnyOfModel → `v.union()`
- `src/generators/schemas/schemas-union.ts` - IRUnionModel → `v.variant()`（discriminated union）

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

**実績（Phase 2完了時点）**:

- **45テストファイル** × **171テスト**（全てパス）
  - Phase 1: 31ファイル × 103テスト
  - Phase 2追加: 14ファイル × 68テスト（schemas関連）
- **テストスタイル統一**: `toEqual` + `trim()` パターン
  - schemas.ts, schemas-model.ts, types.ts
  - 完全な出力検証でリグレッション防止
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

### 検証項目

#### ✅ Phase 1完了項目

- ✅ ビルドが正常に完了すること（`pnpm build`）
- ✅ 型チェックが通ること（`pnpm typecheck`）
- ✅ Lintが通ること（`pnpm lint`）
- ✅ Unit Testが全てパスすること（31ファイル × 103テスト）
- ✅ In-sourceテスティングが機能すること
- ✅ テストフォーマットが統一されていること（Template literal + `.trim()`）

#### ✅ Phase 2完了項目（100%）

**実装完了:**

- ✅ Valibotスキーマ生成が完全実装されていること（14ファイル）
  - schemas.ts orchestrator実装完了
  - ultrathink原則による4ファイル分割（schemas.ts, schemas-model.ts, schemas-type-mapper.ts, schemas-type-ref.ts）
- ✅ 全IRScalarTypeがサポートされていること（11種類）
- ✅ binary型がTypeScript型定義と整合性があること（`v.instance(Blob)`）
- ✅ Unit Testが追加されていること（+14ファイル × +68テスト = 45ファイル × 171テスト）
- ✅ テストスタイルが統一されていること（toEqual + trim パターン）

**統合・検証完了:**

- ✅ generator.tsが`--validator=valibot`フラグに対応していること（既存実装を発見）
- ✅ 型チェックが通ること（client.ts型エラー修正完了）
- ✅ 全テストがパスすること（171/171 passed）
- ✅ Valibotスキーマ生成が実例で動作すること（petstore: 4スキーマ, train-travel: 25スキーマ）

#### ❌ Phase 3以降の項目

- ❌ E2E Testで主要ユースケースが網羅されていること
- ❌ .expected.tsファイル比較テスト実装
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
   - 31ファイル × 103テスト（Phase 1完了時点、全てパス）

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

### 技術スタック（Phase 1）

- **実装**: TypeScript 5.0+、関数ベース、純粋関数
- **テスト**: Vitest（In-sourceテスティング）、31ファイル × 103テスト
- **品質**: ESLint、Prettier、markdownlint
- **ビルド**: unbuild（ESM/CJS両対応）

### 技術スタック（Phase 2完了時点）

- **実装**: TypeScript 5.0+、関数ベース、純粋関数、ultrathink原則
- **テスト**: Vitest（In-sourceテスティング）、45ファイル × 171テスト
- **品質**: ESLint、Prettier、markdownlint（全てパス）、統一テストスタイル
- **ビルド**: unbuild（ESM/CJS両対応）

---

## Phase 2実装サマリー（100%完了）

### 完了した機能（100%）

1. **Valibotスキーマ生成完全実装**
   - 14個のファイル実装完了（11コンポーネント + 3分割ファイル）
   - **schemas.ts orchestrator実装完了**
     - IRModel配列を走査してスキーマ定義を統合
     - ultrathink原則による最適化（109行）
   - **ultrathink原則による4ファイル分割**
     - schemas.ts (orchestrator)
     - schemas-model.ts (IRModel → 完全なスキーマ定義)
     - schemas-type-mapper.ts (IRType → スキーマ + validation)
     - schemas-type-ref.ts (IRType → スキーマ参照)
   - 全IRModel型のValibot変換ロジック実装
   - 68個のテストケース（全てパス）

2. **スカラー型サポート**
   - 全11種類のIRScalarType対応
   - **重要な型整合性**: `binary`型を`v.instance(Blob)`でマッピング
     - TypeScript型定義: `Blob`
     - Valibotスキーマ: `v.instance(Blob)`
     - 完全な型整合性を実現

3. **バリデーションサポート**
   - minLength, maxLength, pattern
   - minimum, maximum
   - format（email, uuid, url/uri, date-time, date）
   - `v.pipe()`による合成

4. **複合型サポート**
   - Object（optional, nullable, readOnly対応）
   - Enum（picklist生成）
   - Array（アイテム型 + validation）
   - AllOf（intersection）
   - AnyOf（union）
   - Union（discriminated union, variant）

5. **テストスタイル統一**
   - `toEqual` + `trim()` パターンに統一
   - schemas.ts, schemas-model.ts, types.ts
   - 完全な出力検証でリグレッション防止強化

### Phase 2完了確認

1. **generator.ts**
   - ✅ `--validator=valibot`フラグ対応済み（既存実装を発見）
   - ✅ schemas.ts生成の統合済み

2. **型エラー修正**
   - ✅ client-request-response.ts: `response.json()`に型キャスト追加
   - ✅ petstore exampleで型チェックパス確認

3. **実例検証**
   - ✅ petstore example: 4スキーマ生成（628 bytes）
   - ✅ train-travel example: 25スキーマ生成（214 lines）
   - ✅ UUID, regex, nested, minValue/maxValue対応確認

### Phase 3以降の作業

1. **E2Eテスト**
   - `.expected.ts`ファイル比較
   - 生成コードの型チェック自動化

### 生成コード例（Phase 2）

```typescript
// schemas.ts
import * as v from "valibot";

/**
 * Schema for Pet
 * Generated from: Pet API 1.0.0
 */
export const PetSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  age: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
  status: v.picklist(["available", "pending", "sold"]),
});

/**
 * Schema for binary data (images, PDFs)
 */
export const ImageSchema = v.object({
  data: v.instance(Blob), // TypeScript型との整合性
  filename: v.string(),
});
```

### テスト実績

```bash
✅ Lint: 全パッケージでパス
✅ Typecheck: エラーなし
✅ Tests: 171/171 passed
  - 45 test files
  - Duration: ~915ms
✅ Test Style: toEqual + trim 統一
```

---

## Phase 2.5実装サマリー（品質改善・Examples統合）

**実装期間**: 2025-10-15 ~ 2025-10-18

### Phase 2.5完了項目

1. **生成器品質改善**
   - 未使用インポート削減（成功レスポンス2xxのみ）
     - `services-imports.ts`: 重要なリファクタリング（111行変更）
     - エラーレスポンス型の不要なインポートを削減
   - **.js拡張子削除**（バンドラー前提設計）
     - 生成コードから`.js`拡張子を削除
     - バンドラー最適化（Tree-shaking向上）
   - **48個のE2E expected files更新**
     - 全テストケースで期待値を再生成
     - 品質改善を全体に適用

2. **Examples統合**
   - **petstore example**: 基本的なCRUD操作
   - **train-travel example**: 複雑なモデル、バリデーション
     - 30モデル、7エンドポイント
     - 6実装例（駅検索、旅程検索、予約作成、一覧取得、詳細取得）
     - 2コメントアウト例（未実装機能の参考コード）
   - **自動テスト対象化**（`pnpm check`）
     - turbo.json統合
     - examples/*/package.json に test スクリプト追加
   - **厳格なESLint適用**（no 'as any'）
     - eslint.config.mjs でexamples統合
     - 型安全性の強化

3. **テスト強化**
   - services-imports.ts: 4テスト追加
   - **テスト総数: 243 passed (49 files)**
     - Phase 2完了時: 171 tests (45 files)
     - Phase 2.5追加: +72 tests (+4 files)

4. **ドキュメント更新**
   - CLAUDE.md: バンドラー前提設計の明記
   - 完了タスクのクリーンアップ

### コミット履歴

1. `03c269e`: fix(generator-typescript): resolve ESLint and TypeScript errors
2. `7abde48`: feat(examples): add TypeScript generator examples
3. `95cb2db`: fix(generator-typescript): add type cast for response.json()
4. `4ffdc69`: feat: include petstore example in automated testing
5. `6912e1f`: feat(generator-typescript): improve code generation and integrate examples

### 検証結果

```bash
✅ Lint: 全パッケージでパス
✅ Typecheck: エラーなし（packages + examples）
✅ Tests: 243/243 passed (49 files)
✅ Examples: petstore, train-travel 生成成功
```

---

## Phase 3実装サマリー（100%完了）

**実装期間**: 2025-10-14 ~ 2025-10-15

### 実装した機能（100%）

#### 1. E2Eテスト実装

**12 fixtures実装:**

- **general (4)**: allof, complex-schema, petstore, readonly-writeonly
- **models (7)**: complex-structures, data-types, inline-schemas, metadata-model, nullable-model, ref-model, validation-model
- **validation (1)**: validation

**テストファイル:**

- `generator.test.ts`: .expected.ts比較テスト（24テスト）
- `type-check.test.ts`: 型チェックテスト（36テスト）
- `test-helper.ts`: テストヘルパー実装
- `generate-expected.ts`: 期待値生成スクリプト

**ディレクトリ構成:**

```
packages/generator-typescript/tests/e2e/
├── fixtures/
│   ├── general/
│   │   ├── allof/
│   │   ├── complex-schema/
│   │   ├── petstore/
│   │   └── readonly-writeonly/
│   ├── models/
│   │   ├── complex-structures/
│   │   ├── data-types/
│   │   ├── inline-schemas/
│   │   ├── metadata-model/
│   │   ├── nullable-model/
│   │   ├── ref-model/
│   │   └── validation-model/
│   └── validation/
├── generator.test.ts
├── type-check.test.ts
├── test-helper.ts
└── generate-expected.ts
```

#### 2. 型チェックテスト実装

**自動化された型検証:**

- 生成コードの型チェック自動化
- 12 fixtures × 3 variants = 36 tests
  1. should type-check expected files
  2. should pass type checking (without validator)
  3. should pass type checking (with valibot)
- strictモード検証

#### 3. Examples実証

**petstore example:**

- 基本的なCRUD操作
- 6モデル、3エンドポイント
- 型定義、サービス、クライアント生成

**train-travel example:**

- 複雑なユースケース
- 30モデル、7エンドポイント
- バリデーション、ネスト、discriminated union

### Phase 3テスト実績

```bash
✅ Test Files: 49 passed
✅ Tests: 243 passed
  - Unit tests: ~183
  - E2E tests: 24 (12 fixtures × 2)
  - Type check tests: 36 (12 fixtures × 3)
✅ Duration: ~48s
```

### 主要ユースケース網羅

- ✅ 基本的なCRUD（petstore）
- ✅ 複雑なモデル（allOf, anyOf, oneOf, discriminator）
- ✅ バリデーション付き（minLength, pattern, format等）
- ✅ readOnly/writeOnly プロパティ
- ✅ enum型、配列型、マップ型
- ✅ ネストした構造
- ✅ Valibotスキーマ生成

---

## 既知の制限事項

Phase 3までに実装されたコア機能は実用可能ですが、以下の制限事項があります。

### 1. CLI未実装

- **状態**: ドキュメント化されているが未実装
- **詳細**:
  - `src/cli.ts`, `bin/cli.mjs` ファイルが存在しない
  - package.jsonに`bin`エントリがない
  - 依存関係（c12, citty）はインストール済みだが未使用
- **現在の使用方法**: プログラマティックAPI（`import { generate } from '@openapi-xcgen/generator-typescript'`）のみ利用可能
- **影響**: CLIコマンド（`xcgen-ts -i ./openapi.yaml -o ./generated`）は使用不可
- **対応予定**: Phase 4で実装

**回避策**:

```typescript
// プログラマティックAPIを使用
import { generate } from '@openapi-xcgen/generator-typescript';

await generate({
  input: './openapi.yaml',
  output: './src/generated',
  validator: 'valibot',
});
```

### 2. 統合パラメータインターフェース未対応

- **状態**: 既知の制限（`services-function.ts:62-70`にTODOコメントあり）
- **問題**: pathパラメータとrequestBodyの両方を持つエンドポイントで、正しい型定義を生成できない
- **現在の動作**: pathパラメータ型のみ生成、requestBodyは無視される
- **影響**: train-travelのpayment endpointがこの制限の対象
  - `POST /bookings/{bookingId}/payment`
  - 必要: `path: { bookingId: string }` + `body: CardPayment | BankTransferPayment`
  - 生成: `path: { bookingId: string }` のみ（bodyプロパティが欠落）
- **対応予定**: Phase 4で統合型生成機能を実装

**現在生成されるコード例（不完全）**:

```typescript
// types.ts
export type PostBookingsBookingIdPaymentRequestBody = CardPayment | BankTransferPayment;

export interface PostBookingsBookingIdPaymentParams {
  path: {
    bookingId: string;
  };
  // MISSING: body property
}
```

**期待される生成コード（Phase 4で対応予定）**:

```typescript
export interface PostBookingsBookingIdPaymentParams {
  path: {
    bookingId: string;
  };
  body: CardPayment | BankTransferPayment;
}
```

### 3. Union型はサポート済み

注意: train-travelのpayment examplesがコメントアウトされているのは、Union型のサポート不足ではありません。
Core、TypeScript generatorともにallOf, anyOf, oneOf, discriminatorを完全サポートしています。
payment examplesは上記の「統合パラメータインターフェース」の制限により無効化されています。

**サポート状況**:

- ✅ allOf → TypeScript intersection types (`A & B`) + Valibot `v.intersect()`
- ✅ anyOf → TypeScript union types (`A | B`) + Valibot `v.union()`
- ✅ oneOf → TypeScript discriminated unions + Valibot `v.variant()`
- ✅ discriminator → 完全サポート（JSDocコメント、Valibotマッピング）

---

## 次のステップ

Phase 3完了により、generator-typescriptのコア機能は実用可能な状態になりました。

### Phase 4: 制限事項解消

**優先度：高**

1. **CLI実装**
   - `src/cli.ts` - CLIエントリーポイント実装
   - `bin/cli.mjs` - 実行可能ファイル作成
   - package.jsonに`bin`エントリ追加
   - c12（設定ファイル）、citty（CLI framework）の活用
   - 基本コマンド: `xcgen-ts -i <input> -o <output> [--validator=valibot]`
   - 設定ファイル対応: `xcgen.config.ts` でdefineConfig()使用

2. **統合パラメータインターフェース実装**
   - `services-function.ts` のTODO解消
   - pathパラメータ + requestBodyの統合型生成
   - train-travel payment examplesの有効化
   - E2Eテスト追加（path + body両方持つエンドポイント）

### 実用段階への移行

Phase 4完了後:

### 優先度1: ドキュメント整備

- README更新（使用例、機能一覧、インストール手順）
- CLI使用ガイド（オプション詳細、設定ファイル）
- トラブルシューティング（よくある問題と解決策）
- Migration guide（他ツールから移行）
- API Reference（生成されるコードの仕様）

### 優先度2: npm公開準備

- CHANGELOG生成（semantic-release）
- バージョニング戦略（semver）
- リリースノート作成
- ライセンス確認（MIT）
- package.json メタデータ整備

### 優先度3: CI/CD統合

- GitHub Actions設定
  - Lint, typecheck, test, buildの自動実行
  - マトリックステスト（Node.js複数バージョン）
- カバレッジレポート生成
  - Codecov / Coveralls統合
  - バッジ追加
- リリース自動化
  - semantic-release設定
  - npm publish自動化

### Phase 5: 拡張機能（オプション）

Phase 4完了後、さらなる機能拡張を検討:

- **Zod対応**: バリデーションライブラリの選択肢拡大
- **x-extensions サポート**: カスタム拡張プロパティのサポート
- **パフォーマンス最適化**: 大規模APIへの対応
- **追加HTTPクライアント対応**: Axios, ky等（オプション）
- **Mock生成**: MSW等によるモック生成
