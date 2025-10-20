# タスク010: TypeScript生成器 - 残りタスク

## 概要

`@openapi-xcgen/xcgen-ts`パッケージの未完了タスク管理。

---

## Phase 5: 実用段階への移行

**優先度**: 高

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

### タスク6.1: 追加バリデーター

- [ ] Zod対応（--validator=zod）
- [ ] Yup対応（--validator=yup）

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
pnpm test         # 全テスト実行
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
- `_guides/spec.md`: 型システムと仕様
- `examples/petstore/`: 基本的なCRUD例
- `examples/train-travel/`: 複雑なユースケース例
