# タスク010: TypeScript生成器 - 残りタスク

## 概要

`@openapi-xcgen/xcgen-ts`パッケージの未完了タスク管理。

---

## 残りタスク

### 拡張機能（オプション）

**優先度**: 低（需要に応じて）

- [ ] x-extensions サポート（カスタム拡張プロパティ）
- [ ] プラグインシステム設計

---

## 開発コマンド

```bash
# 開発
pnpm dev          # 開発モード（watch）
pnpm build        # ビルド

# テスト
pnpm test         # 全テスト実行
pnpm test:watch   # watchモード
pnpm test:coverage # カバレッジ

# 品質
pnpm check        # lint + typecheck + test
pnpm lint         # ESLint + Prettier + markdownlint
pnpm typecheck    # TypeScript型チェック

# リリース
pnpm release      # バージョンアップ＆タグpush（→GitHub Actionsで自動npm公開）
```

## 技術スタック

- **言語**: TypeScript 5.0+、関数ベース
- **テスト**: Vitest（In-sourceテスティング）
- **ビルド**: unbuild（ESM/CJS両対応）
- **CLI**: c12, citty
- **Validator**: Valibot v1（オプション）
- **モノレポ**: Turbo + lerna-lite

## 関連ドキュメント

- `CLAUDE.md`: 開発ガイドライン
- `_guides/spec.md`: 型システムと仕様
- `examples/petstore/`: 基本的なCRUD例
- `examples/train-travel/`: 複雑なユースケース例
