# openapi-xcgen

[English](./README.md) | [日本語](./README.ja.md)

OpenAPI仕様から型安全なコードを生成するコードジェネレーターです。  

## 特徴

- ✅ **クロスランゲージ対応** - TypeScript、Dart（計画中）
- ✅ **OpenAPI 3.0/3.1** - 仕様に完全対応
- ✅ **型安全なコード生成** - 各言語のネイティブな型システムを活用
- ✅ **高度な機能サポート** - oneOf/anyOf/allOf、discriminator対応
- ✅ **インラインスキーマ自動抽出** - 再利用可能なモデルに変換
- ✅ **バリデーション統合** - 主要バリデーションライブラリに対応

## TypeScript (xcgen-ts)

現在利用可能：

- **ゼロランタイム依存** - fetch-basedの軽量HTTPクライアント
- **Valibot統合** - オプショナルなランタイム検証
- **Tree-shakeable** - 関数ベースアーキテクチャ

## クイックスタート

### インストール

```bash
# グローバルインストール
npm install -g @openapi-xcgen/xcgen-ts

# または開発依存としてインストール
npm install --save-dev @openapi-xcgen/xcgen-ts
```

### クライアント生成

```bash
# 基本的な生成
xcgen-ts -i openapi.yaml -o ./generated

# Valibot検証付き
xcgen-ts -i openapi.yaml -o ./generated --validator=valibot
```

### 生成されたクライアントの使用

```typescript
import { listUsers } from "./generated/services";
import { setConfig } from "./generated/client";

setConfig({ baseUrl: "https://api.example.com" });

const users = await listUsers();
```

## CLI使い方

### 基本コマンド

```bash
xcgen-ts -i <input> -o <output> [options]
```

### オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `-i, --input <path>` | 入力OpenAPIファイル（YAML/JSON） | `-i openapi.yaml` |
| `-o, --output <path>` | 出力ディレクトリ | `-o ./generated` |
| `--validator <lib>` | バリデーションライブラリ（valibot） | `--validator=valibot` |
| `-c, --config <path>` | 設定ファイルのパス | `-c ./xcgen.config.ts` |

### 生成されるファイル

ジェネレーターは以下のファイルを生成します：

- **`types.ts`** - TypeScript型定義
- **`client.ts`** - HTTPクライアントとエラーハンドリング
- **`services.ts`** - APIサービス関数
- **`schemas.ts`** - 検証スキーマ（`--validator`指定時）

### 設定ファイル

プロジェクトルートに`xcgen.config.ts`を作成：

```typescript
import { defineConfig } from "@openapi-xcgen/xcgen-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./src/generated",
  validator: "valibot",
});
```

実行: `xcgen-ts`（設定ファイルを自動的に使用）

## Hooks（拡張機能）

xcgen.config.ts で Hooks を定義することで、コード生成をカスタマイズできます。

**例: x-type でカスタム型を使用**

```typescript
// xcgen.config.ts
export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "property:generate": (ctx) => {
      if (ctx.extensions?.["x-type"]) {
        ctx.tsCode.typeName = ctx.extensions["x-type"];
      }
    },
  },
});
```

**利用可能な Hook:**

- `property:generate` - プロパティの型をカスタマイズ
- `endpoint:generate` - API関数をカスタマイズ
- `modelFile:generate` - インポート追加、ファイルレベルの拡張
- `validation:transform` - バリデーションロジックをカスタマイズ

詳細は [Hooks ガイド](./_guides/hooks.ja.md) を参照してください。

## ドキュメント

- **[仕様書](./_guides/spec.ja.md)** - 型システムと制限事項
- **[Examples](./examples/)** - 動作するコード例

## パッケージ

- **[@openapi-xcgen/core](./packages/core/)** - OpenAPIパーサーとIR変換器
- **[@openapi-xcgen/xcgen-ts](./packages/xcgen-ts/)** - TypeScriptコードジェネレーター
- **@openapi-xcgen/xcgen-dart** - Dartジェネレーター（計画中）

## 開発

### 必要な環境

- Node.js v20+
- pnpm 10.13.1

### セットアップ

```bash
# 依存関係をインストール
pnpm install

# 全パッケージをビルド
pnpm build

# テストを実行
pnpm test

# コード品質をチェック (lint + typecheck + test)
pnpm check
```

### コマンド

```bash
# 開発
pnpm dev              # Watchモード
pnpm build            # パッケージビルド

# テスト
pnpm test             # 全テスト実行
pnpm test:watch       # Watchモード
pnpm test:coverage    # カバレッジレポート

# 品質チェック
pnpm check            # 全チェック実行
pnpm lint             # Lintチェック
pnpm lint:fix         # Lint自動修正
pnpm typecheck        # TypeScript型チェック

# バージョン管理とリリース
pnpm lerna:version    # パッケージバージョンアップ（Conventional Commits使用）
pnpm lerna:publish    # npm公開
```

詳細な開発ガイドラインは[CLAUDE.md](./CLAUDE.md)を参照してください。

## よくある問題

### "xcgen-ts: command not found"

ローカルインストール（グローバルインストールではない）した場合、以下の方法があります：

1. **npxを使用**：

   ```bash
   npx xcgen-ts -i openapi.yaml -o generated
   ```

2. **package.jsonのスクリプトに追加**（推奨）：

   ```json
   {
     "scripts": {
       "generate": "xcgen-ts -i openapi.yaml -o generated"
     }
   }
   ```

   実行: `npm run generate`

3. **グローバルインストール**：

   ```bash
   npm install -g @openapi-xcgen/xcgen-ts
   ```

### 生成されたコードに型エラーがある

`tsconfig.json`に以下が含まれていることを確認してください：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

完全な動作設定は `examples/petstore/tsconfig.json` を参照してください。

## ライセンス

[MIT License](/LICENSE) / [©Memory Lovers, LLC](https://memory-lovers.com)

## 作者

- [GitHub(@memory-lovers)](https://github.com/memory-lovers)
- [Blog(くらげになりたい。)](https://memory-lovers.blog/)
- [Twitter/X(@kira_puka)](https://twitter.com/kira_puka)
