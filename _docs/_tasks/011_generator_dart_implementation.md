# タスク011: Dart生成器実装

## 概要

`@openapi-xcgen/generator-dart`パッケージのソースコード実装を行います。

## 前提条件

- タスク005（Dart生成器環境構築）が完了していること
- タスク009（Coreパッケージのソースコード実装）が完了していること

## 実装対象ファイル

### 基本ファイル

- `src/types.ts` - Dart生成器の型定義
- `src/generator.ts` - メインジェネレータークラス
- `src/index.ts` - パッケージのエクスポート

### ジェネレーター

- `src/generators/models.ts` - モデルクラスの生成
- `src/generators/services.ts` - APIサービスクラスの生成
- `src/generators/client.ts` - HTTPクライアントの生成
- `src/generators/pubspec.ts` - pubspec.yamlの生成
- `src/generators/exports.ts` - エクスポートファイルの生成

### CLI

- `src/cli.ts` - CLIエントリーポイント
- `bin/cli.mjs` - 実行可能ファイル

## 実装方針

- Dart 3.0以上のNull Safety対応
- json_serializableをデフォルトのシリアライゼーションとして使用
- httpとdioの両方のHTTPクライアントをサポート
- Sealed classによるUnion型の実装

## 検証

- ビルドが正常に完了すること
- 型チェックが通ること
- CLIコマンドが実行できること
- 生成されたDartコードが有効であること