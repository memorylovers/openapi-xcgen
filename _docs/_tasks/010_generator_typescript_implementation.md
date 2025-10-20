# タスク010: TypeScript生成器 - 残りタスク

## 概要

`@openapi-xcgen/generator-typescript`パッケージの残りタスク管理。

## 現在のステータス

### 完了済み機能

**Core機能**:

- ✅ OpenAPIパーサー（3.0.x / 3.1.x対応）
- ✅ IR変換器（oneOf/anyOf/allOf/discriminator完全サポート）
- ✅ 421テスト全てパス

**TypeScript Generator**:

- ✅ TypeScript型定義生成（Object, Enum, AllOf, AnyOf, Union, Array, Map）
- ✅ API関数生成（統合パラメータ、discriminated union対応）
- ✅ HTTPクライアント（ゼロ依存、グローバル設定、カスタムfetch対応）
- ✅ Valibotスキーマ生成（v.variant()によるdiscriminator対応）
- ✅ CLI実装（citty + c12、引数パース、設定ファイル対応）
- ✅ 252テスト全てパス

**Examples**:

- ✅ petstore: 基本的なCRUD操作
- ✅ train-travel: 複雑なユースケース（discriminated union、統合パラメータ）

---

## Phase 5: 実用段階への移行

**優先度**: 高

### タスク5.1: ドキュメント整備

- [ ] _guides/ディレクトリ作成
- [ ] Getting Started
  - [ ] _guides/getting-started.md（英語・インストール、基本的な使い方）
  - [ ] _guides/getting-started.ja.md（日本語）
- [ ] CLI Guide
  - [ ] _guides/cli.md（英語・CLIコマンド詳細）
  - [ ] _guides/cli.ja.md（日本語）
- [ ] Specification
  - [ ] _guides/spec.md（英語・Type System、変換仕様等）
  - [ ] _guides/spec.ja.md（日本語）
- [ ] README更新
  - [ ] README.md（簡潔版、_guides/へのリンク、100行程度）
  - [ ] README.ja.md（日本語版）

### タスク5.2: npm公開準備

- [ ] lerna-lite導入（モノレポバージョン管理）
- [ ] CHANGELOG自動生成（conventional-changelog）
- [ ] リリース自動化（lerna version + lerna publish）
- [ ] ライセンス確認
- [ ] package.jsonメタデータ整備

### タスク5.3: CI/CD統合

- [ ] GitHub Actions設定（test, release）
- [ ] カバレッジレポート生成（Codecov/Coveralls）
- [ ] リリース自動化（タグベース、npm publish）

---

## Phase 6: 拡張機能（オプション）

**優先度**: 低（需要に応じて）

### タスク6.2: x-extensions サポート

- [ ] カスタム拡張プロパティのサポート
- [ ] プラグインシステム設計

---

## 参考情報

### コマンド

```bash
# 開発
pnpm dev          # 開発モード（watch）
pnpm build        # ビルド

# テスト
pnpm test         # Core: 421 tests, Generator: 252 tests
pnpm test:watch   # watchモード
pnpm test:coverage # カバレッジ

# 品質
pnpm check        # lint + typecheck + test
pnpm lint         # ESLint + Prettier + markdownlint
pnpm typecheck    # TypeScript型チェック
```

### 技術スタック

- **言語**: TypeScript 5.0+、関数ベース
- **テスト**: Vitest（In-sourceテスティング）
- **ビルド**: unbuild（ESM/CJS両対応）
- **CLI**: c12, citty
- **Validator**: Valibot v1（オプション）

### 関連ドキュメント

- `CLAUDE.md`: 開発ガイドライン
- `examples/petstore/`: 基本的なCRUD例
- `examples/train-travel/`: 複雑なユースケース例
