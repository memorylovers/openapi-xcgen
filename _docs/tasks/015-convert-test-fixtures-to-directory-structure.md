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

**注:** `types.ts` は削除（空の場合は不要、業界標準に準拠）

## 設計決定事項

### export パターン

**決定:** `export *` パターンを採用

```typescript
// models/index.ts
export * from './Pet';
export * from './User';
```

**理由:**

- 業界標準（Orval、openapi-ts）で広く採用されている
- シンプルで保守性が高い
- 現代のバンドラー（Vite、Rollup、webpack）は効果的にTree-shakingを実行
- 名前付きre-exportのメンテナンスオーバーヘッドを回避

**却下した選択肢:**

- 名前付きre-export（`export { Pet } from './Pet'`）- Tree-shakingの僅かな利点 vs 大きなメンテナンスコスト

### インポート拡張子

**決定:** 拡張子なし（バンドラー前提）

```typescript
// ✅ 採用
import { Pet } from "./Pet";

// ❌ 不採用
import { Pet } from "./Pet.js";
```

**理由:**

- CLAUDE.mdの明確な区分に従う
  - 生成器コード（packages/xcgen-ts/src/）: `.js` 拡張子使用（ESM対応）
  - 生成されるコード（期待値ファイル）: 拡張子なし（バンドラー前提）
- 業界標準（Orval、openapi-ts）に準拠
- ユーザー環境はバンドラー使用を前提

### types.ts の扱い

**決定:** 空の `types.ts` は削除

**理由:**

- Orval標準：必要な場合のみ作成
- 不要なファイルを排除してプロジェクトをクリーンに保つ
- 空ファイルは TypeScript の "not a module" エラーの原因
- 共通型が必要になった場合のみ作成する

## 注意事項

### インポートパスの拡張子

バンドラーベースのアプローチを採用し、拡張子は**付けない**：

```typescript
// ✅ 正しい（バンドラー前提）
import { Pet } from "./Pet";

// ❌ 間違い（生成器コードの書き方）
import { Pet } from "./Pet.js";
```

**理由:**

- 業界標準（Orval、openapi-ts）に準拠
- ユーザーコードはバンドラー（webpack/Vite/Rollup）を使用する前提
- CLAUDE.mdの「生成されるコード：拡張子なし（バンドラー前提）」に従う

### 相対パスの深さ

```typescript
// models/Pet.ts から他のモデル
import { Tag } from "./Tag";

// services/pets.ts からモデル
import { Pet } from "../models/index";

// services/pets.ts からクライアント
import { request } from "../client";
```

### 依存関係の順序

スキーマで他のスキーマを参照する場合、先に参照されるスキーマを定義：

```typescript
// PetSchema.ts（依存なし）
export const PetSchema = v.object({ ... });

// GetPets200ResponseSchema.ts（PetSchemaに依存）
import { PetSchema } from "./PetSchema";
export const GetPets200ResponseSchema = v.array(PetSchema);
```

### 命名規則

- **モデルファイル**: `PascalCase.ts` (例: `Pet.ts`, `GetPetsParams.ts`)
- **スキーマファイル**: `PascalCaseSchema.ts` (例: `PetSchema.ts`)
- **サービスファイル**: `kebab-case.ts` (例: `pets.ts`, `user-profile.ts`)
- **インデックスファイル**: 常に `index.ts`

## 次のアクション

Task 015 は完了しました。次は **Task 014 Phase 2: Generator実装** に進みます：

1. ✅ Phase 1: テストフィクスチャ変換（本タスク）
2. 🔄 **Phase 2: Generator実装** ← 次のステップ
   - `packages/xcgen-ts/src/generator/` の修正
   - ディレクトリベース構造の出力実装
   - TDD Green状態の達成
3. ⏳ Phase 3: リファクタリング・最適化

## 参考資料

- [014-refactor-to-directory-based-code-generation.md](./014-refactor-to-directory-based-code-generation.md) - メインリファクタリングタスク
- `packages/xcgen-ts/tests/e2e/fixtures/general/petstore/expected/` - 完成例（基準）
- `packages/xcgen-ts/tests/e2e/test-helper.ts` - テスト比較ロジック
