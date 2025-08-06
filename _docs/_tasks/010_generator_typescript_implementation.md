# タスク010: TypeScript生成器実装

## 概要

`@openapi-xcgen/generator-typescript`パッケージのソースコード実装を行います。

## ステータス

- 状態: 未実施

## 前提条件

- タスク004（TypeScript生成器環境構築）が完了していること
- タスク009（Coreパッケージのソースコード実装）が完了していること

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

### テンプレート（オプション）

- `src/templates/model.hbs` - Handlebarsテンプレート

## 実装方針

- Tree-shaking対応のため関数ベースのエクスポート
- Valibotをデフォルトのバリデーターとして使用
- エラーハンドリングはシンプルなオブジェクトベース
- 各APIエンドポイントは個別の関数として生成

## 検証

- ビルドが正常に完了すること
- 型チェックが通ること
- CLIコマンドが実行できること