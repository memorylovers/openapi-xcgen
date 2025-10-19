# タスク010: TypeScript生成器 - 残りタスク

## 概要

`@openapi-xcgen/generator-typescript`パッケージの残りタスク管理。

## 現在のステータス

### 完了済み（Phase 1-4 一部）

- ✅ **Phase 1**: TypeScript型定義、API関数、HTTPクライアント生成
- ✅ **Phase 2**: Valibotスキーマ生成（discriminator自動生成、v1対応）
- ✅ **Phase 3**: E2Eテスト、型チェックテスト（49 files, 243 tests passed）
- ✅ **Phase 4.1**: CLI実装（citty + c12、引数パース、設定ファイル対応）

### 主要機能

- TypeScript型定義生成（Object, Enum, AllOf, AnyOf, Union, Array, Map）
- API関数生成（構造化パラメータ、エラーハンドリング）
- HTTPクライアント（ゼロ依存、グローバル設定、カスタムfetch対応）
- Valibotスキーマ生成（`--validator=valibot`）
  - 11種類のスカラー型、全validation対応
  - allOf, anyOf, oneOf, discriminator完全サポート
  - discriminator自動生成（const値からmapping生成）
  - Valibot v1 variant()構文対応

### 品質

- **49 test files, 243 tests passed**
- E2Eテスト: 12 fixtures（petstore, train-travel等）
- 型チェックテスト: strictモード検証
- Examples統合: petstore, train-travel

---

## 既知の制限事項

### 1. 統合パラメータインターフェース未対応

**問題**: pathパラメータとrequestBodyの両方を持つエンドポイントで、bodyプロパティが生成されない

**影響例**: `POST /bookings/{bookingId}/payment`

**現在**:

```typescript
export interface PostBookingsBookingIdPaymentParams {
  path: { bookingId: string };
  // bodyプロパティが欠落
}
```

**期待される動作**:

```typescript
export interface PostBookingsBookingIdPaymentParams {
  path: { bookingId: string };
  body: CardPayment | BankTransferPayment;
}
```

**対応予定**: タスク4.2で実装

---

## Phase 4: 統合パラメータ対応

**優先度**: 高

### タスク4.2: 統合パラメータインターフェース実装

**実装内容**:

1. **services-function.ts修正**
   - TODOコメント解消（62-70行）
   - 統合インターフェース生成

2. **types-parameter.ts拡張**
   - path + body統合型の生成ロジック
   - query, header パラメータも考慮

3. **train-travel payment examples有効化**
   - `examples/train-travel/src/index.ts`のコメント解除

4. **テスト追加**
   - E2Eテスト（path + body両方持つendpoint）
   - 型チェックテスト
   - train-travel examples実行確認

**検証項目**:

- [ ] path + body統合型が正しく生成される
- [ ] path + query + body統合型が正しく生成される
- [ ] train-travel payment examplesが動作する
- [ ] E2Eテストがパスする
- [ ] 型チェックがパスする

---

## Phase 5: 実用段階への移行

**優先度**: 中（Phase 4完了後）

### タスク5.1: ドキュメント整備

- [ ] README更新（インストール、クイックスタート、機能一覧）
- [ ] CLI使用ガイド
- [ ] トラブルシューティング
- [ ] Migration guide（他ツールからの移行）
- [ ] API Reference

### タスク5.2: npm公開準備

- [ ] CHANGELOG生成（semantic-release）
- [ ] バージョニング戦略（semver準拠）
- [ ] リリースノート作成
- [ ] ライセンス確認
- [ ] package.jsonメタデータ整備

### タスク5.3: CI/CD統合

- [ ] GitHub Actions設定（test, release）
- [ ] カバレッジレポート生成（Codecov/Coveralls）
- [ ] リリース自動化（タグベース、npm publish）

---

## Phase 6: 拡張機能（オプション）

**優先度**: 低（Phase 5完了後、需要に応じて）

### タスク6.1: Zod対応

- [ ] `--validator=zod`フラグ実装
- [ ] Valibotと同等の機能サポート

### タスク6.2: x-extensions サポート

- [ ] カスタム拡張プロパティのサポート
- [ ] プラグインシステム設計

### タスク6.3: パフォーマンス最適化

- [ ] 大規模API（1000+ endpoints）への対応
- [ ] 並列処理実装

### タスク6.4: 追加HTTPクライアント対応

- [ ] Axios, ky等のアダプター
- [ ] カスタムHTTPクライアントプラグイン

### タスク6.5: Mock生成

- [ ] MSW（Mock Service Worker）統合
- [ ] テストデータ生成（faker.js統合）

---

## 参考情報

### コマンド

```bash
# 開発
pnpm dev          # 開発モード（watch）
pnpm build        # ビルド

# テスト
pnpm test         # 243 tests
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

### 関連ドキュメント

- `CLAUDE.md`: 開発ガイドライン
- `examples/petstore/`: 基本的なCRUD例
- `examples/train-travel/`: 複雑なユースケース例
