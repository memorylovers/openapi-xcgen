# アーキテクチャ概要

## 概要

openapi-xcgenプロジェクトの新しいアーキテクチャは、各言語生成器が独立したCLIを持つ設計になっています。これにより、必要な生成器のみをインストールして使用できます。

## アーキテクチャ設計

### パッケージ構成

```
openapi-xcgen/
├── packages/
│   ├── core/                      # 共通機能とCLI基盤
│   ├── generator-typescript/      # TypeScript生成器（独自CLI付き）
│   └── generator-dart/           # Dart生成器（独自CLI付き）
```

### 依存関係

```
@openapi-xcgen/generator-typescript
    └── @openapi-xcgen/core

@openapi-xcgen/generator-dart
    └── @openapi-xcgen/core

@openapi-xcgen/core (依存なし)
```

## 各パッケージの役割

### @openapi-xcgen/core

**責務:**

- OpenAPIドキュメントのパース（@apidevtools/swagger-parserのbundleメソッド使用）
  - bundle()メソッドにより$refを内部参照として保持
  - コンポーネント名を保存したままコード生成が可能
- CLI基盤機能（cittyベース）
- 共通ユーティリティ（文字列変換、ファイル書き込み等）
- 再利用可能なCLIコマンド定義
- 中間表現（XcgenIR）への変換

**主要なエクスポート:**

```typescript
// パーサー（bundleメソッドで$refを内部参照として保持）
export { OpenAPIParser } from "./parser/openapi-parser.js";

// 中間表現（IR）型定義
export type {
  XcgenIR,
  IRModel,
  IREnum,
  IRService,
  IREndpoint,
  IRType,
  // ... その他のIR型
} from "./types/ir/index.js";

// CLI基盤
export { createGenerateCommand, createValidateCommand } from "./cli/commands.js";
export { writeGeneratedFiles, getPackageInfo } from "./cli/utils.js";

// ユーティリティ
export { toPascalCase, toCamelCase, toKebabCase } from "./utils/case.js";
```

**中間表現（XcgenIR）の構造:**

```typescript
export interface XcgenIR {
  metadata: IRMetadata;        // API基本情報
  models: IRModel[];           // データモデル
  enums: IREnum[];            // 列挙型
  services: IRService[];      // APIサービス（タグでグループ化）
  servers: IRServer[];        // サーバー情報
  security?: IRSecurityScheme[]; // セキュリティ定義
}
```

IR型は判別共用体（discriminated union）を採用し、型安全性を向上させています。

### @openapi-xcgen/generator-typescript

**責務:**

- TypeScriptクライアントコードの生成
- Valibotによるランタイムバリデーション
- Tree-shaking対応の関数ベースAPI

**CLIコマンド:**

```bash
npm install -g @openapi-xcgen/generator-typescript
openapi-xcgen-ts generate api.yaml -o ./generated
```

**主な機能:**

- モデル（型定義）の生成
- Valibotスキーマの生成
- APIサービス関数の生成
- Fetch APIベースのクライアント

### @openapi-xcgen/generator-dart

**責務:**

- Dartクライアントコードの生成
- json_serializable/freezed対応
- Null Safety完全対応

**CLIコマンド:**

```bash
npm install -g @openapi-xcgen/generator-dart
openapi-xcgen-dart generate api.yaml -o ./generated
```

**主な機能:**

- モデルクラスの生成
- APIサービスクラスの生成
- http/dio選択可能なHTTPクライアント
- pubspec.yamlの自動生成

## 使用例

### TypeScriptクライアントの生成

```bash
# インストール
npm install -g @openapi-xcgen/generator-typescript

# 生成
openapi-xcgen-ts generate petstore.yaml -o ./src/api

# オプション付き
openapi-xcgen-ts generate petstore.yaml \
  -o ./src/api \
  --validator valibot \
  --enum-style union \
  --date-type string
```

### Dartクライアントの生成

```bash
# インストール
npm install -g @openapi-xcgen/generator-dart

# 生成
openapi-xcgen-dart generate petstore.yaml -o ./lib/api

# オプション付き
openapi-xcgen-dart generate petstore.yaml \
  -o ./lib/api \
  --serialization json_serializable \
  --http-client dio \
  --package-name petstore_client
```

## 利点

### 1. 最小限のインストール

- 必要な言語の生成器のみをインストール
- 依存関係の削減
- バンドルサイズの最適化

### 2. 独立した開発・リリース

- 各生成器を独立してバージョン管理
- 言語固有の機能追加が容易
- リリースサイクルの柔軟性

### 3. 拡張性

- 新しい言語生成器の追加が簡単
- coreパッケージのCLI基盤を再利用
- 一貫したインターフェース

## 開発者向け情報

### 新しい生成器の追加方法

1. `packages/generator-[言語名]`ディレクトリを作成
2. `@openapi-xcgen/core`に依存
3. CLI実装で`createGenerateCommand`を使用
4. 独自のCLIコマンド名を設定（例: `openapi-xcgen-go`）

### モノレポ管理

- **pnpm workspace**: パッケージ管理
- **turbo**: ビルド・テストの並列実行
- **unbuild**: ESM/CJS両対応のビルド

### コマンド

```bash
# 全パッケージのビルド
pnpm build

# 全パッケージのテスト
pnpm test

# 型チェック
pnpm typecheck

# 特定パッケージの開発
cd packages/generator-typescript
pnpm dev
```

## まとめ

新アーキテクチャにより、openapi-xcgenは以下を実現します：

1. **モジュラー設計**: 必要な機能のみを使用
2. **独立性**: 各生成器が独自のCLIを持つ
3. **再利用性**: coreパッケージによる共通機能
4. **拡張性**: 新しい言語の追加が容易

この設計により、ユーザーは必要最小限のツールをインストールして、効率的にクライアントコードを生成できます。
