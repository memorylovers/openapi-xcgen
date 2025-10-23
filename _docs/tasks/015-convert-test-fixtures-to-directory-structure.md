# 015: E2Eテストフィクスチャのディレクトリ構造変換

## 概要

タスク014（ディレクトリベース構造へのリファクタリング）の一環として、既存のE2Eテストフィクスチャの期待値をディレクトリベース構造に変換します。

**目的:**

- 実装前にテストケース（期待値）を更新
- TDD (Test-Driven Development) のRed状態を作る
- 全15フィクスチャを新構造に変換

**関連タスク:** [014-refactor-to-directory-based-code-generation.md](./014-refactor-to-directory-based-code-generation.md)

## 現状と目標

### 現在の構造（単一ファイル）

```
expected/
├── types.ts      ← 全ての型定義
├── schemas.ts    ← 全てのValibotスキーマ
├── services.ts   ← 全てのサービス関数
├── client.ts
├── package.json
└── tsconfig.json
```

### 目標構造（ディレクトリベース）

```
expected/
├── index.ts           # 新規：トップレベルエクスポート
├── types.ts           # 変更：共通型のみ
├── models/            # 新規ディレクトリ
│   ├── Pet.ts        # 個別モデル
│   ├── User.ts
│   └── index.ts      # models re-export
├── schemas/           # 新規ディレクトリ
│   ├── PetSchema.ts  # 個別スキーマ
│   ├── UserSchema.ts
│   └── index.ts      # schemas re-export
├── services/          # 新規ディレクトリ
│   ├── pets.ts       # タグごとのサービス
│   ├── users.ts
│   └── index.ts      # services re-export
├── client.ts          # 変更なし
├── package.json       # 変更なし
└── tsconfig.json      # 変更なし
```

## 対象フィクスチャ一覧（15個）

### ✅ 完了済み (1/15)

- [x] `general/petstore` - 最もシンプル（基準フィクスチャ）

### Simple - 優先度高 (2個)

- [ ] `validation/validation` - バリデーション特化
- [ ] `models/data-types` - データ型バリエーション

### Medium - 優先度中 (7個)

- [ ] `general/readonly-writeonly` - readonly/writeonly修飾子
- [ ] `general/allof` - allOf（継承）
- [ ] `general/complex-schema` - 複雑なスキーマ
- [ ] `models/complex-structures` - 複雑な構造
- [ ] `models/inline-schemas` - インラインスキーマ
- [ ] `models/metadata-model` - メタデータ
- [ ] `models/nullable-model` - nullable型

### Complex - 優先度低 (5個)

- [ ] `general/hey-api/discriminator-all-of` - discriminator + allOf
- [ ] `general/hey-api/discriminator-any-of` - discriminator + anyOf
- [ ] `general/hey-api/discriminator-one-of` - discriminator + oneOf
- [ ] `models/ref-model` - $ref参照
- [ ] `models/validation-model` - バリデーション（複雑）

## 変換手順（標準パターン）

### ステップ1: 現状分析

```bash
cd packages/xcgen-ts/tests/e2e/fixtures/[fixture-path]/expected
ls -la
```

確認項目：

- `types.ts` - モデル、パラメータ、レスポンス型
- `services.ts` - サービス関数
- `schemas.ts` - Valibotスキーマ（validator使用時のみ）

### ステップ2: ディレクトリ作成

```bash
mkdir -p models schemas services
```

### ステップ3: types.ts の分割

#### 3.1 モデル型を抽出

```typescript
// types.ts から
export interface Pet {
  id: number;
  name: string;
}

// ↓ models/Pet.ts へ
/**
 * Pet model
 * Auto-generated from OpenAPI specification
 */

export interface Pet {
  id: number;
  name: string;
}
```

#### 3.2 パラメータ型を抽出

```typescript
// types.ts から
export interface GetPetsParams {
  query: { limit?: number };
}

// ↓ models/GetPetsParams.ts へ
/**
 * Parameters for GET /pets
 * Auto-generated from OpenAPI specification
 */

export interface GetPetsParams {
  query: { limit?: number };
}
```

#### 3.3 レスポンス型を抽出

```typescript
// types.ts から
export type GetPets200Response = Array<Pet>;

// ↓ models/GetPets200Response.ts へ
/**
 * GetPets200Response type
 * Auto-generated from OpenAPI specification
 */

import type { Pet } from "./Pet.js";

export type GetPets200Response = Array<Pet>;
```

**注意:** インポートパスは `.js` 拡張子を使用（ESM要件）

### ステップ4: schemas.ts の分割

```typescript
// schemas.ts から
export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
});

// ↓ schemas/PetSchema.ts へ
/**
 * Valibot validation schema for Pet
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
});
```

**依存関係のあるスキーマ:**

```typescript
// schemas/GetPets200ResponseSchema.ts
import * as v from "valibot";
import { PetSchema } from "./PetSchema.js";

export const GetPets200ResponseSchema = v.array(PetSchema);
```

### ステップ5: services.ts の分割

タグごとにファイルを分割（Petstoreの場合、タグなしなので `pets.ts`）:

```typescript
// services/pets.ts
/**
 * Pet service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client.js";
import type { XcgenApiError as _XcgenApiError } from "../client.js";
import type { GetPetsParams, GetPets200Response, Pet } from "../models/index.js";

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
```

**インポートパスの更新:**

- `"./types"` → `"../models/index.js"`
- `"./client"` → `"../client.js"`

### ステップ6: index.ts ファイル作成

#### models/index.ts

```typescript
/**
 * Model type definitions
 * Auto-generated from OpenAPI specification
 */

export * from './Pet.js';
export * from './GetPetsParams.js';
export * from './GetPets200Response.js';
```

#### schemas/index.ts

```typescript
/**
 * Valibot validation schemas
 * Auto-generated from OpenAPI specification
 */

export * from './PetSchema.js';
export * from './GetPets200ResponseSchema.js';
```

#### services/index.ts

```typescript
/**
 * API service functions
 * Auto-generated from OpenAPI specification
 */

export * from './pets.js';
```

### ステップ7: トップレベルファイル更新

#### index.ts（新規作成）

```typescript
/**
 * API Client
 * Generated from: [API Name] [Version]
 * DO NOT EDIT - This file is auto-generated
 */

export * from "./types.js";
export * from "./models/index.js";
export * from "./schemas/index.js";
export * from "./services/index.js";
export { setConfig, XcgenApiError, type ApiConfig } from "./client.js";
```

#### types.ts（共通型のみに変更）

```typescript
/**
 * Common type definitions
 * Generated from: [API Name] [Version]
 * DO NOT EDIT - This file is auto-generated
 */

// No common types for this API
// または共通型がある場合は記載
```

### ステップ8: 検証

```bash
# ディレクトリ構造確認
tree expected/

# ファイル数確認
find expected/ -name "*.ts" | wc -l
```

期待されるファイル数の目安：

- モデル数 × 1 + パラメータ数 × 1 + レスポンス数 × 1
- スキーマ数（モデル + レスポンス）
- サービス関数数（タグで分割）
- インデックスファイル（3-4個）

## 変換テンプレート

### モデルファイル

```typescript
/**
 * [ModelName] model
 * Auto-generated from OpenAPI specification
 */

// インポートがあれば追加
import type { OtherModel } from "./OtherModel.js";

export interface [ModelName] {
  // プロパティ
}
```

### スキーマファイル

```typescript
/**
 * Valibot validation schema for [ModelName]
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
// 依存スキーマがあれば追加
import { OtherSchema } from "./OtherSchema.js";

export const [ModelName]Schema = v.object({
  // スキーマ定義
});
```

### サービスファイル

```typescript
/**
 * [Tag] service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client.js";
import type { XcgenApiError as _XcgenApiError } from "../client.js";
import type { /* types */ } from "../models/index.js";

// サービス関数
```

## チェックリスト（各フィクスチャ）

各フィクスチャ変換時のチェック項目：

- [ ] ディレクトリ作成（models, schemas, services）
- [ ] models/ - 全てのモデル・パラメータ・レスポンス型を分割
- [ ] models/index.ts - 全てのモデルをre-export
- [ ] schemas/ - 全てのスキーマを分割
- [ ] schemas/index.ts - 全てのスキーマをre-export
- [ ] services/ - タグごとにサービスを分割
- [ ] services/index.ts - 全てのサービスをre-export
- [ ] types.ts - 共通型のみに変更
- [ ] index.ts - トップレベルエクスポート作成
- [ ] インポートパス - `.js` 拡張子を使用
- [ ] 依存関係 - import順序が正しい

## 注意事項

### インポートパスの`.js`拡張子

ESMモジュール解決のため、TypeScriptソースコードでも `.js` 拡張子が必要：

```typescript
// ✅ 正しい
import { Pet } from "./Pet.js";

// ❌ 間違い
import { Pet } from "./Pet";
```

### 相対パスの深さ

```typescript
// models/Pet.ts から他のモデル
import { Tag } from "./Tag.js";

// services/pets.ts からモデル
import { Pet } from "../models/index.js";

// services/pets.ts からクライアント
import { request } from "../client.js";
```

### 依存関係の順序

スキーマで他のスキーマを参照する場合、先に参照されるスキーマを定義：

```typescript
// PetSchema.ts（依存なし）
export const PetSchema = v.object({ ... });

// GetPets200ResponseSchema.ts（PetSchemaに依存）
import { PetSchema } from "./PetSchema.js";
export const GetPets200ResponseSchema = v.array(PetSchema);
```

### 命名規則

- **モデルファイル**: `PascalCase.ts` (例: `Pet.ts`, `GetPetsParams.ts`)
- **スキーマファイル**: `PascalCaseSchema.ts` (例: `PetSchema.ts`)
- **サービスファイル**: `kebab-case.ts` (例: `pets.ts`, `user-profile.ts`)
- **インデックスファイル**: 常に `index.ts`

## トラブルシューティング

### 問題1: 型の依存関係が複雑

**対策:**

1. まず依存のない基本型から作成
2. 依存する型を後から作成
3. 循環参照がないか確認

### 問題2: インポートパスの間違い

**対策:**

- 相対パスの深さを確認（`../` の数）
- `.js` 拡張子を必ず付ける
- TypeScript の型チェックで検証

### 問題3: 大量のファイル作成

**対策:**

- シンプルなフィクスチャから開始
- パターンに慣れてから複雑なものに進む
- 中間チェックポイントでコミット

## 完了条件

- [ ] 全15フィクスチャの変換完了
- [ ] 各フィクスチャでチェックリスト項目全てクリア
- [ ] ファイル構造の一貫性確認
- [ ] 次のステップ（テスト比較ロジック更新）への準備完了

## 次のアクション

変換完了後：

1. テスト比較ロジックを更新（`test-helper.ts`）
2. テスト実行（Red状態確認）
3. 実装（Generator修正）
4. テスト実行（Green状態確認）

## 参考資料

- [014-refactor-to-directory-based-code-generation.md](./014-refactor-to-directory-based-code-generation.md) - メインリファクタリングタスク
- `packages/xcgen-ts/tests/e2e/fixtures/general/petstore/expected/` - 完成例（基準）
- `packages/xcgen-ts/tests/e2e/test-helper.ts` - テスト比較ロジック
