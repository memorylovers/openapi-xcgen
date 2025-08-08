# タスク009: Coreパッケージのソースコード実装

## 概要

@openapi-xcgen/coreパッケージの各種機能を実装します。

## ステータス

- 状態: 実施中
  - 型ガード関数: 完了
  - HTTPユーティリティ: 完了
  - パスユーティリティ: 完了
  - OpenAPIパーサー: 完了
  - エラークラス: 完了

## 前提条件

- タスク003（Coreパッケージ環境設定）が完了していること

## 実装対象ファイル

### 基本機能

- `src/types.ts` - 共通型定義
- `src/parser.ts` - OpenAPIドキュメントのパース（bundleメソッド使用）
- `src/transformer.ts` - 中間表現への変換（$ref解決を含む）
- ~~`src/validator.ts`~~ - スキップ（@apidevtools/swagger-parserが提供）
- ~~`src/resolver.ts`~~ - スキップ（transformer内で処理）

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

- YAGNI原則に基づき、必要最小限の機能を実装
- @apidevtools/swagger-parserの機能を最大限活用
- 各生成器パッケージで共通利用できる機能を提供
- ESM/CJS両対応を考慮

## 検証

- ビルドが正常に完了すること
- 型チェックが通ること
