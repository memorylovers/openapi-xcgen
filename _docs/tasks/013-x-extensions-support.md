# タスク013: OpenAPI x-extensions サポート

## 概要

OpenAPIの拡張構文（x-プレフィックス）をサポートし、言語固有の型やバリデーションを柔軟に指定できるようにする機能の実装。

関連issue: #6

## ステータス

- 状態: 実装中

## 前提条件

- タスク009（Coreパッケージのソースコード実装）が完了していること
- タスク010（TypeScript生成器のソースコード実装）が完了していること

## 背景と目的

### OpenAPI拡張構文とは

- `x-`プレフィックスで独自フィールドを定義可能
- 各言語生成器が独自の型やバリデーションを指定するために使用
- 標準仕様では表現できない言語固有の情報を保持

### ユースケース

- TypeScript固有の型指定（`x-typescript-type`）
- Kotlin/Java用のパッケージ指定（`x-package`）
- カスタムバリデーション（`x-validation`）
- カスタムフォーマット（`x-format`）

## サポート対象の拡張フィールド

### x-type

カスタム型指定

- 言語固有の型名を指定（例: TypeScript の `EmailAddress`、Kotlin の `UserId`）
- OpenAPI標準の型では表現できない、より具体的な型情報を提供

### x-format

カスタムフォーマット

- OpenAPI標準のformatを拡張（例: `rfc5322` による厳密なメールフォーマット）
- 標準format（uuid, date-time等）では不足する場合に使用

### x-validation

追加バリデーション

- OpenAPI標準のバリデーション（minLength等）では表現できない複雑なルール
- 言語生成器がカスタムバリデーションロジックを生成するための情報

## OpenAPI定義での使用例

```yaml
components:
  schemas:
    Email:
      type: string
      format: email
      x-type: "EmailAddress"      # TypeScript独自型
      x-format: "rfc5322"         # より厳密なフォーマット
      x-validation:               # 追加バリデーション
        domain: "example.com"
        allowSubdomains: true

    User:
      type: object
      x-type: "UserModel"         # モデル全体のカスタム型
      properties:
        id:
          type: string
          x-type: "UserId"        # プロパティ個別の型
```

## 期待する振る舞い

### アーキテクチャ

**Core（@openapi-xcgen/core）の責務**:

- OpenAPIの`x-`フィールドをIRに保持
- `extensions?: Record<string, unknown>` として全拡張フィールドを保存
- 拡張フィールドの解釈はしない（そのまま渡す）

**Generator（xcgen-ts/xcgen-dart）の責務**:

- IRから拡張フィールドを読み取り、コード生成時に処理
- Hook機構を通じて拡張フィールドを処理
- 言語固有の変換ロジックを実装

### 処理の流れ

1. OpenAPIファイルに`x-type`等を記述
2. Coreが拡張フィールドをIRに保持
3. Generatorがコード生成時にHookを呼び出し
4. Hookが拡張フィールドを処理（型名変更、バリデーション追加等）

## 実装内容

### Phase 1: Core - IR への extensions フィールド追加

#### 対象ファイル

- `packages/core/src/types/ir/models/property.ts` - IRProperty に extensions 追加
- `packages/core/src/types/ir/endpoints/parameter.ts` - IRParameter に extensions 追加
- `packages/core/src/types/ir/models/base.ts` - 各モデル型に extensions 追加

#### 実装タスク

- [ ] IR型定義に `extensions?: Record<string, unknown>` を追加
- [ ] Transformer の visitor で OpenAPI の `x-*` フィールドを抽出
- [ ] In-source テストで extensions の保持を検証

### Phase 2: xcgen-ts - Hook 機構の導入

#### 対象ファイル

- `packages/xcgen-ts/src/hooks/types.ts` - Hook 型定義
- `packages/xcgen-ts/src/hooks/hookable.ts` - hookable 統合
- `packages/xcgen-ts/src/config.ts` - c12 設定読み込み
- `packages/xcgen-ts/src/generator.ts` - Hook 呼び出しポイント統合

#### 実装タスク

- [ ] `hookable` と `c12` の依存関係を追加
- [ ] Hook 定義と型を作成
- [ ] Generator に Hook 呼び出しポイントを統合
- [ ] 設定ファイル (`xcgen.config.ts`) の読み込み機構を実装

### Phase 3: xcgen-ts - デフォルト Hooks 実装

#### 対象ファイル

- `packages/xcgen-ts/src/hooks/default/x-type.ts` - x-type 処理
- `packages/xcgen-ts/src/hooks/default/x-format.ts` - x-format 処理
- `packages/xcgen-ts/src/hooks/default/x-validation.ts` - x-validation 処理
- `packages/xcgen-ts/tests/e2e/x-extensions/` - E2E テスト

#### 実装タスク

- [ ] `x-type` のデフォルト処理（カスタム型名での生成）
- [ ] `x-format` のデフォルト処理（カスタムフォーマットバリデーション）
- [ ] `x-validation` のデフォルト処理（追加バリデーションロジック）
- [ ] E2E テストで動作確認

## 実装方針

### デフォルト処理（設定不要）

**提供される基本機能**:

- `x-type`: 指定された型名でコード生成
- `x-format`: カスタムフォーマットに基づくバリデーション生成
- `x-validation`: 追加バリデーションロジックの生成

**ユーザーメリット**:

- 設定ファイル不要で基本的な拡張フィールドが動作
- 90%のユースケースをカバー

### カスタマイズ（任意）

**設定方法**:

- c12設定ファイル（`xcgen.config.ts`）でHook関数を定義
- TypeScriptで型安全にカスタマイズ可能
- デフォルト処理を上書き、または独自Hookを追加

**カスタマイズ例**:

- 特定のプロパティのみ処理を変更
- 独自の`x-`フィールドのサポート追加
- 生成コードの形式を調整

**技術実装**:

- [hookable](https://github.com/unjs/hookable)ライブラリを使用（unjs製）
- デフォルトHook + ユーザーHookの2層構造
- 既存のc12インフラと統合

### TDD アプローチ

各ステップで Red → Green → Refactor サイクルを守る：

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: コードを改善（テストは常にGreen）

## 検証

- [ ] ビルドが正常に完了すること（`pnpm build`）
- [ ] 型チェックが通ること（`pnpm typecheck`）
- [ ] 全テストがパスすること（`pnpm test`）
- [ ] Lintエラーがないこと（`pnpm lint`）
- [ ] E2Eテストで x-extensions を含む OpenAPI からコード生成できること
- [ ] 生成されたコードが期待通りの型・バリデーションを含むこと

## 参考資料

- [OpenAPI Specification - Specification Extensions](https://spec.openapis.org/oas/v3.0.3#specification-extensions)
- [OpenAPI Generator - Vendor Extensions](https://openapi-generator.tech/docs/templating/#vendor-extensions)
- [hookable - Awaitable Hooks System](https://github.com/unjs/hookable)
- [c12 - Smart Configuration Loader](https://github.com/unjs/c12)
