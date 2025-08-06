# タスク003a: Coreパッケージのソースコード実装

## 概要

@openapi-xcgen/coreパッケージの各種機能を実装します。

## 前提条件

- タスク003（Coreパッケージ環境設定）が完了していること

## 実装対象ファイル

### 基本機能

- `src/types.ts` - 共通型定義
- `src/parser.ts` - OpenAPIドキュメントのパース
- `src/validator.ts` - バリデーション機能
- `src/resolver.ts` - スキーマ・パス解決

### ユーティリティ

- `src/utils/index.ts` - ユーティリティのエクスポート
- `src/utils/string.ts` - 文字列処理
- `src/utils/case.ts` - ケース変換

### CLI基盤

- `src/cli/index.ts` - CLI機能のエクスポート
- `src/cli/commands.ts` - コマンド定義ヘルパー
- `src/cli/utils.ts` - CLIユーティリティ

### メインエクスポート

- `src/index.ts` - パッケージの主要エクスポート

## 実装方針

- 詳細な実装内容は別途検討
- 各生成器パッケージで共通利用できる機能を提供
- ESM/CJS両対応を考慮

## 検証

- ビルドが正常に完了すること
- 型チェックが通ること
