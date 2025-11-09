# タスク013-2: xcgen-ts - Hook 機構の導入

## 概要

xcgen-ts（TypeScript生成器）に同期型のHook機構を導入し、x-extensions処理の基盤を整えます。ユーザーがコード生成をカスタマイズできる拡張ポイントを提供します。

親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)

## ステータス

- **状態**: 完了
- **進捗**: 100% (5/5 実用Hook実装完了、E2Eフィクスチャ完成、インポートハンドラ実装完了)

## 実装状況

### ✅ 完了した実装

#### Hook基盤システム

- `src/hooks/types.ts` - 全Hook Context型とTsCode型定義
  - `SchemaFileGenerateContext` と `TsCodeSchema` を追加
  - `schemaFile:generate` フックをサポート
- `src/hooks/create-hooks.ts` - 同期Hookシステム（純粋関数のみ）
  - ジェネリック型推論による型安全性
  - 例外処理（Fail-fast原則）
  - in-sourceテスト 7個
- `src/hooks/index.ts` - エクスポート
- `src/helpers/import-handler.ts` - カスタムインポート処理
  - `processImports()` - フルインポート文と型名の分離
  - `generateTypeImports()` - import type/import の生成（useTypeKeyword パラメータ）
  - in-sourceテスト 11個

#### Generator統合

- `src/config.ts` - xcgen.config.ts 読み込み（c12使用）
- `src/types.ts` - `GeneratorOptions` に `hooks?` フィールド追加
- `src/generator.ts` - Hookシステム統合
  - `createHooks(config.hooks)` でインスタンス作成
  - 各生成器に hooks を渡す

#### Generator実装

- `src/generators/types/types.ts` - `generateTypes(ir, writer, hooks?)`
- `src/generators/types/types-property.ts` - `property:generate` Hook呼び出し実装
- `src/generators/types/types-parameter-property.ts` - `parameter:generate` Hook呼び出し実装
- `src/generators/types/helpers/generate-model-file.ts` - `modelFile:generate` Hook呼び出し実装
  - カスタムインポート処理（processImports、generateTypeImports）
  - `import type` を使用
- `src/generators/services/services-endpoint.ts` - `endpoint:generate` Hook呼び出し実装（旧 services-function.ts）
- `src/generators/services/helpers/generate-service-file.ts` - エンドポイントインポート収集・処理
  - 全エンドポイントから `tsCode.imports` を収集
  - カスタムインポート処理
- `src/generators/services/services.ts` - hooks パラメータ対応
- `src/generators/schemas/schemas-validation.ts` - `validation:transform` Hook呼び出し実装
- `src/generators/schemas/schemas-type-mapper.ts` - hooks パラメータ伝播
- `src/generators/schemas/schemas-array.ts` - hooks パラメータ伝播
- `src/generators/schemas/schemas-model.ts` - hooks パラメータ伝播
- `src/generators/schemas/helpers/generate-schema-file.ts` - `schemaFile:generate` Hook呼び出し実装
  - カスタムインポート処理（`useTypeKeyword: false` でバリュー import）
  - 実際のスキーマコードを生成してから Hook を呼び出す
- `src/generators/schemas/schemas.ts` - スキーマファイル生成のオーケストレーション
- その他の生成器も hooks パラメータ対応済み

#### テスト

##### 単体テスト

- `tests/unit/hooks/property-generate.test.ts` - 13個のテスト
- `tests/unit/hooks/parameter-generate.test.ts` - 18個のテスト
- `tests/unit/hooks/model-generate.test.ts` - 16個のテスト
- `tests/unit/hooks/schema-generate.test.ts` - 8個のテスト（schemaFile:generate フック）
- `tests/unit/hooks/endpoint-generate.test.ts` - 12個のテスト
- `tests/unit/hooks/validation-transform.test.ts` - 12個のテスト

##### E2Eフィクスチャ

- `tests/e2e/fixtures/hooks/x-type-custom/` - property:generate Hook（カスタム型）
  - `xcgen.config.ts` - x-type 処理
  - `expected-valibot/` - 期待値ファイル
  - `_userdefs/index.ts` - UserId, EmailAddress, PhoneNumber 型定義
- `tests/e2e/fixtures/hooks/x-function-name/` - endpoint:generate Hook（関数名）
  - `xcgen.config.ts` - x-function-name 処理
  - `expected-valibot/` - 期待値ファイル（listAllUsers, addNewUser, fetchByUserId）
- `tests/e2e/fixtures/hooks/x-validation-custom/` - validation:transform Hook（カスタムバリデーション）
  - `xcgen.config.ts` - x-validation 処理
  - `expected-valibot/` - 期待値ファイル
  - `_userdefs/index.ts` - validateSKUFormat, validatePositivePrice, validateBusinessEmail

##### テストインフラ

- `tests/e2e/generate-expected.ts` - フィクスチャ期待値生成スクリプト
  - generate-hooks-expected.ts を統合
  - xcgen.config.ts 自動検出（c12用にprocess.chdir）
  - hooks フィクスチャは valibot のみ生成
- `tests/e2e/test-helper.ts` - テストヘルパー
  - xcgen.config.ts 検出と process.chdir() 対応
- `tests/e2e/generator.test.ts` - E2E生成テスト
  - 3つの hooks テストケース追加（33テスト → 36テスト予定、現在33テスト）
- `tests/e2e/type-check.test.ts` - 型チェックテスト
  - 6つの hooks テストケース追加（36テスト → 42テスト）
  - _userdefs/ ディレクトリのコピー対応

### ✅ 完了

すべての作業が完了しました。

## Hook機構の設計

### 基本原則

**同期・純粋関数のみ**:

- Promise/async/await は使用しない
- 副作用のない純粋関数を推奨
- エラーは呼び出し元に伝播（Fail-fast）

**型安全性**:

- ジェネリック型パラメータによる Hook名とContext型の対応
- `as any` を最小化（ジェネリック関数で型推論）

### Hook種別

| Hook名 | タイミング | 用途 |
|--------|-----------|------|
| `property:generate` | プロパティ生成時 | 型名のカスタマイズ、プロパティレベルの拡張 |
| `parameter:generate` | パラメータ生成時 | パラメータ型のカスタマイズ |
| `modelFile:generate` | モデル型ファイル生成時 | 型定義ファイルのインポート追加 |
| `schemaFile:generate` | スキーマファイル生成時 | Valibotスキーマファイルのインポート追加 |
| `endpoint:generate` | エンドポイント生成時 | API関数のカスタマイズ |
| `validation:transform` | バリデーション変換時 | IRValidation → Valibot schemaへの変換カスタマイズ |

### Hook Context の例

```typescript
// プロパティ生成Hook
interface PropertyGenerateContext {
  property: IRProperty;      // IR プロパティ定義（読み取り専用）
  component: IRComponent;    // 所属コンポーネント（読み取り専用）
  tsCode: TsCodeProperty;    // 生成される型定義（Hook で変更可能）
  extensions?: Extensions;   // x-extensions
}

// プロパティのコード生成モデル（ミュータブル）
interface TsCodeProperty {
  typeName: string;          // 型名（例: "string", "EmailAddress"）
  optional: boolean;         // オプショナルかどうか
  nullable: boolean;         // nullable かどうか
  defaultValue?: string;     // デフォルト値
  comment?: string;          // コメント（JSDoc）
}
```

### 使用例

#### 基本例: property:generate Hook

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/xcgen-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'property:generate': (ctx) => {
      // x-type があれば型名を変換
      if (ctx.extensions?.['x-type']) {
        ctx.tsCode.typeName = ctx.extensions['x-type'] as string;
      }
    }
  }
})
```

#### カスタムインポート例: modelFile:generate Hook

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/xcgen-ts'
import type { HookContext } from '@openapi-xcgen/xcgen-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'property:generate': (ctx: HookContext<'property:generate'>) => {
      // カスタム型を使用
      if (ctx.extensions?.['x-type']) {
        ctx.tsCode.typeName = ctx.extensions['x-type'] as string;
      }
    },
    'modelFile:generate': (ctx: HookContext<'modelFile:generate'>) => {
      // モデル内のカスタム型を収集
      const customTypes: string[] = [];
      const modelProperties = 'properties' in ctx.model ? ctx.model.properties : [];

      for (const prop of modelProperties) {
        const xType = prop.extensions?.['x-type'];
        if (xType) {
          customTypes.push(xType as string);
        }
      }

      // グループ化されたインポート文を追加（ソート済み）
      if (customTypes.length > 0) {
        const sorted = [...new Set(customTypes)].sort();
        ctx.tsCode.imports.push(
          `import type { ${sorted.join(', ')} } from '../_userdefs'`
        );
      }
    }
  }
})
```

#### 出力例（型ファイル）

```typescript
// generated/models/User.ts
/**
 * User model
 * Auto-generated from OpenAPI specification
 */

import type { EmailAddress, PhoneNumber, UserId } from '../_userdefs'

export interface User {
  /** User ID */ userId: UserId;
  /** Email address */ email: EmailAddress;
  /** Username (no custom type) */ username: string;
  /** Optional phone number */ phoneNumber?: PhoneNumber | undefined;
}
```

#### カスタムバリデータ例: schemaFile:generate Hook

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/xcgen-ts'
import type { HookContext } from '@openapi-xcgen/xcgen-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  hooks: {
    'schemaFile:generate': (ctx: HookContext<'schemaFile:generate'>) => {
      // スキーマファイル生成時に実際のスキーマコードを確認できる
      if (ctx.tsCode.code.includes('email: v.string()')) {
        // カスタムバリデータ関数のインポートを追加
        ctx.tsCode.imports.push(
          "import { validateEmail } from '../validators/email'"
        );
      }

      // x-extensions を使った条件分岐
      if (ctx.extensions?.['x-validator'] === 'custom') {
        const validatorName = ctx.model.name.toLowerCase();
        ctx.tsCode.imports.push(
          `import { validate${ctx.model.name} } from '../validators/${validatorName}'`
        );
      }
    }
  }
})
```

#### 出力例（スキーマファイル）

```typescript
// generated/schemas/UserSchema.ts
/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { validateEmail } from '../validators/email';

export const UserSchema = v.object({
  userId: v.string(),
  email: v.string(),
  username: v.string(),
  phoneNumber: v.optional(v.string()),
});
```

**注意**:

- `modelFile:generate` は型ファイル（models/*.ts）生成時に呼ばれます
- `schemaFile:generate` はスキーマファイル（schemas/*Schema.ts）生成時に呼ばれます
- 両者は別のタイミングで呼ばれるため、用途に応じて使い分けてください

## 制限事項

### validation:transform Hook の対応範囲

- ✅ プロパティレベルのバリデーション (`IRProperty.validation`)
- ✅ 配列要素のバリデーション (`minItems`/`maxItems`)
- ❌ allOf/anyOf/union レベルのバリデーション

**理由**:

- allOf/anyOf/union モデルには `validation` プロパティが存在しない（IR型定義の制約）
- これらは `irTypeToValibotSchemaRef()` で処理され、バリデーションパイプを生成しない
- ほとんどのユースケースはプロパティレベルのバリデーションで対応可能

**将来の対応**:
allOf/anyOf/union でカスタムバリデーションが必要な場合は Issue で相談してください。最小限の対応（extensions のみ Hook に渡す）を検討できます。

## テスト戦略

### 単体テスト（tests/unit/hooks/）

各Hookごとにテストファイルを作成:

1. **property-generate.test.ts** ✅ (13テスト)
   - カスタム型変換（x-type）
   - 複数Hook実行順序
   - optional/nullable制御
   - コメント追加
   - 例外処理

2. **parameter-generate.test.ts** ✅ (18テスト)
   - パラメータ名のカスタマイズ
   - 型変換
   - デフォルト値制御
   - 複数Hook実行
   - optional/nullable制御

3. **model-generate.test.ts** ✅ (16テスト)
   - モデル名のカスタマイズ
   - インポート追加
   - コード変更
   - コメント変更
   - 複数Hook実行
   - 各モデル種別対応

4. **endpoint-generate.test.ts** ✅ (12テスト)
   - 関数名のカスタマイズ（x-function-name）
   - コード変更（部分・完全置換）
   - 複数Hook実行
   - 異なるHTTPメソッド対応
   - 複雑なシナリオ（description/summary、deprecated）

5. **validation-transform.test.ts** ✅ (12テスト)
   - カスタムバリデーションパイプ追加
   - バリデーションパイプ置換・削除
   - 複数Hook実行
   - 異なるバリデーション型対応（number, format, pattern）
   - 複雑なシナリオ（型に基づく条件付きバリデーション）

### E2Eテスト

実装完了：

- `tests/e2e/fixtures/hooks/x-type-custom/` - カスタム型のテスト
- `tests/e2e/fixtures/hooks/x-function-name/` - カスタム関数名のテスト
- `tests/e2e/fixtures/hooks/x-validation-custom/` - カスタムバリデーションのテスト
- 各フィクスチャに xcgen.config.ts、expected-valibot/、_userdefs/ を含む
- `pnpm regenerate:expected` で期待値を生成（33回実行）
- generator.test.ts に 3テスト追加（計33テスト）
- type-check.test.ts に 6テスト追加（計42テスト）

## 例外処理の仕様

**Fail-fast原則**:

- Hook内で例外が発生 → 呼び出し元に伝播
- CLI レベルでキャッチ → エラーメッセージ表示 → `process.exit(1)`
- **コード生成全体が停止**（部分的な成功を避ける）

**複数Hook登録時**:

- 最初の例外で処理中断
- 後続のHookは実行されない

**メリット**:

- ユーザーのバグを早期発見
- 予測可能な動作
- 意図しない部分的成功を防ぐ

## 非機能要件

### パフォーマンス

- Hook呼び出しのオーバーヘッドを最小化
- Hook未登録時はほぼゼロコスト

### エラーメッセージ

- Hook内のエラーは明確なメッセージを表示
- スタックトレースでデバッグ可能

## 次のタスク

**タスク013-3** (予定): デフォルトHooks実装

- x-type 処理（カスタム型名での生成）
- x-format 処理（カスタムフォーマットバリデーション）
- x-validation 処理（追加バリデーションロジック）
- E2E テストで動作確認

## 参考資料

- [c12 - Smart Configuration Loader](https://github.com/unjs/c12)
- 親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)
- 前提タスク: [013-1-x-extensions-core.md](./013-1-x-extensions-core.md)
