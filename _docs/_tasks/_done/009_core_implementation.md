# タスク009: Coreパッケージのソースコード実装

## 概要

@openapi-xcgen/coreパッケージの各種機能を実装します。

## ステータス

- 状態: ✅ 完了
  - 型ガード関数: ✅ 完了
  - HTTPユーティリティ: ✅ 完了
  - パスユーティリティ: ✅ 完了
  - OpenAPIパーサー: ✅ 完了
  - エラークラス: ✅ 完了
  - IR型定義: ✅ 完了
  - Transformer実装: ✅ 完了（Visitorパターン）
  - E2Eテスト: ✅ 完了（216テスト全て合格）

## 前提条件

- タスク003（Coreパッケージ環境設定）が完了していること

## 実装対象ファイル

### 基本機能

- `src/types/index.ts` - OpenAPI型エイリアス ✅
- `src/types/guards.ts` - 型ガード関数 ✅
- `src/types/ir/` - 中間表現型定義 ✅
  - `index.ts` - XcgenIRルート型
  - `data.ts` - データモデル関連（IRModel, IREnum, IRUnion, IRType等）
  - `api.ts` - API関連（IRService, IREndpoint, IRParameter等）
  - `config.ts` - 設定関連（IRMetadata, IRServer, IRSecurityScheme等）
- `src/parser/openapi-parser.ts` - OpenAPIパーサー（bundleメソッド使用） ✅
- `src/parser/error.ts` - エラークラス ✅
- `src/transformer/transformer.ts` - XcgenIRへの変換 ✅
- `src/transformer/visitors/` - Visitorパターン実装 ✅
  - primitive-visitor.ts, enum-visitor.ts, object-visitor.ts
  - schema-visitor.ts, components-visitor.ts
  - parameter-visitor.ts, response-visitor.ts, request-body-visitor.ts
  - operation-visitor.ts, path-item-visitor.ts, paths-visitor.ts
- ~~`src/validator.ts`~~ - スキップ（@apidevtools/swagger-parserが提供）
- ~~`src/resolver.ts`~~ - スキップ（transformer内で処理）

### ユーティリティ

- `src/utils/http.ts` - HTTPユーティリティ ✅
- `src/utils/path.ts` - パスユーティリティ ✅
- `src/utils/string.ts` - 文字列処理（未実装）
- `src/utils/case.ts` - ケース変換（未実装）

### CLI基盤

- `src/cli/index.ts` - CLI機能のエクスポート（未実装）
- `src/cli/commands.ts` - コマンド定義ヘルパー（未実装）
- `src/cli/utils.ts` - CLIユーティリティ（未実装）

### メインエクスポート

- `src/index.ts` - パッケージの主要エクスポート ✅

## 実装方針

- YAGNI原則に基づき、必要最小限の機能を実装
- @apidevtools/swagger-parserのbundle()メソッドを使用
- 判別共用体（discriminated union）で型安全性を向上
- インラインスキーマの自動命名をサポート
- ESM/CJS両対応を考慮

## 検証

- ビルドが正常に完了すること ✅
- 型チェックが通ること ✅
- テストが通ること ✅

## 次のステップ

- ✅ OpenAPITransformerの実装（完了: transformer.tsとVisitorパターンで実装）
- CLI基盤の実装（Phase 7）
- ユーティリティ関数の拡充（必要に応じて）

## 実装成果

- **Visitorパターン実装**: 関数ベースのVisitorパターンでOpenAPI → IR変換を実装
- **全216テスト合格**: in-sourceテストとE2Eテストで完全なカバレッジ
- **Tree-shaking対応**: クラスを使用せず関数ベースで実装
- **型安全性**: TypeScriptの型システムを最大限活用（判別共用体、型ガード）
