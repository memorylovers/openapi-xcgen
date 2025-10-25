# タスク013-2: xcgen-ts - Hook 機構の導入

## 概要

xcgen-ts（TypeScript生成器）に同期型のHook機構を導入し、x-extensions処理の基盤を整えます。ユーザーがコード生成をカスタマイズできる拡張ポイントを提供します。

親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)

## ステータス

- **状態**: 実装中（基盤完了、Hookテスト追加中）
- **進捗**: 70% (6/6 Hook types定義完了、1/6 Hookテスト完了)

## 実装状況

### ✅ 完了した実装

#### Hook基盤システム

- `src/hooks/types.ts` - 全Hook Context型とTsCode型定義
- `src/hooks/create-hooks.ts` - 同期Hookシステム（純粋関数のみ）
  - ジェネリック型推論による型安全性
  - 例外処理（Fail-fast原則）
  - in-sourceテスト 7個
- `src/hooks/index.ts` - エクスポート

#### Generator統合

- `src/config.ts` - xcgen.config.ts 読み込み（c12使用）
- `src/types.ts` - `GeneratorOptions` に `hooks?` フィールド追加
- `src/generator.ts` - Hookシステム統合
  - `createHooks(config.hooks)` でインスタンス作成
  - 各生成器に hooks を渡す

#### Generator実装

- `src/generators/types/types.ts` - `generateTypes(ir, writer, hooks?)`
- `src/generators/types/types-property.ts` - `property:generate` Hook呼び出し実装
- その他の生成器も hooks パラメータ対応済み

#### テスト

- `tests/unit/hooks/property-generate.test.ts` - 13個のテスト（パラメータ化テスト含む）
- E2Eフィクスチャ準備: `tests/e2e/fixtures/hooks/`

### 🔄 残り作業

#### Hookテスト追加（優先）

- [ ] `parameter:generate` Hook のテスト追加
- [ ] `model:generate` Hook のテスト追加
- [ ] `endpoint:generate` Hook のテスト追加
- [ ] `type:transform` Hook のテスト追加
- [ ] `validation:transform` Hook のテスト追加

#### 最終検証

- [ ] E2E期待値の生成（`pnpm regenerate:expected`）
- [ ] 全テスト実行（`pnpm test`）
- [ ] ビルド（`pnpm build`）
- [ ] 型チェック（`pnpm typecheck`）
- [ ] Lint（`pnpm lint`）

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
| `model:generate` | モデル生成時 | モデルレベルの拡張、インポート追加 |
| `endpoint:generate` | エンドポイント生成時 | API関数のカスタマイズ |
| `type:transform` | 型変換時 | IR型 → TypeScript型への変換カスタマイズ |
| `validation:transform` | バリデーション変換時 | IRValidation → Valibot schemaへの変換カスタマイズ |

### Hook Context の例

```typescript
// プロパティ生成Hook
interface PropertyGenerateContext {
  property: IRProperty;      // IR プロパティ定義（読み取り専用）
  model: IRModel;            // 所属モデル（読み取り専用）
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

## テスト戦略

### 単体テスト（tests/unit/hooks/）

各Hookごとにテストファイルを作成:

1. **property-generate.test.ts** ✅ (13テスト)
   - カスタム型変換（x-type）
   - 複数Hook実行順序
   - optional/nullable制御
   - コメント追加
   - 例外処理

2. **parameter-generate.test.ts** ⬜
   - パラメータ名のカスタマイズ
   - 型変換
   - デフォルト値制御

3. **model-generate.test.ts** ⬜
   - モデル名のカスタマイズ
   - インポート追加
   - コード変更

4. **endpoint-generate.test.ts** ⬜
   - 関数名のカスタマイズ
   - コード変更
   - インポート追加

5. **type-transform.test.ts** ⬜
   - IR型 → TypeScript型変換のカスタマイズ

6. **validation-transform.test.ts** ⬜
   - IRValidation → Valibot schema変換のカスタマイズ

### E2Eテスト

- `tests/e2e/fixtures/hooks/` に準備済み
- `pnpm regenerate:expected` で期待値を生成
- 既存のE2Eテストフレームワークで検証

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
