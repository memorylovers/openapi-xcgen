# タスク010: TypeScript生成器 - 残りタスク

## 概要

`@openapi-xcgen/generator-typescript`パッケージの残りタスク管理。
Phase 1-3（コア機能）は完了済み。

## ステータス

- ✅ Phase 1完了: types, services, client生成
- ✅ Phase 2完了: Valibotスキーマ生成
- ✅ Phase 2.5完了: 品質改善、Examples統合
- ✅ Phase 3完了: E2Eテスト、型チェックテスト（243 tests passed）
- 🔄 **Phase 4進行中**: CLI実装、制限事項解消
- ⏳ Phase 5予定: 実用段階（ドキュメント、npm公開）
- ⏳ Phase 6予定: 拡張機能（オプション）

## 完了済み機能（Phase 1-3）

### コア機能

- **TypeScript型定義生成**: 9種類のIRModel対応
  - Object, Enum, AllOf, AnyOf, Union, Array, Map, Parameter, Property
  - readonly, optional, nullable対応
  - JSDocコメント生成
- **API関数生成**: 構造化パラメータ、fetch API使用
  - エラーハンドリング（XcgenApiError）
  - カスタムfetch対応（インターセプター代替）
- **HTTPクライアント**: ゼロ依存、グローバル設定（setConfig）
- **Valibotスキーマ生成**: `--validator=valibot` オプション
  - 11種類のスカラー型、全validation対応
  - allOf, anyOf, oneOf, discriminator完全サポート

### テスト・品質

- **243 tests passed** (49 files)
  - Unit tests: ~183
  - E2E tests: 24 (12 fixtures × 2)
  - Type check tests: 36 (12 fixtures × 3)
- **E2Eテスト**: 12 fixtures（petstore, train-travel等）
- **型チェックテスト**: strictモード検証
- **Examples統合**: petstore, train-travel

### 技術スタック

- TypeScript 5.0+、関数ベース、ultrathink原則（1関数1ファイル）
- In-sourceテスティング（Vitest）
- ESM/CJS両対応（unbuild）
- Lint, typecheck, test全てパス

---

## 既知の制限事項

Phase 3までに実装されたコア機能は実用可能ですが、以下の制限事項があります。

### 1. CLI未実装

**状態**: ドキュメント化されているが未実装

**詳細**:

- `src/cli.ts`, `bin/cli.mjs` ファイルが存在しない
- package.jsonに`bin`エントリがない
- 依存関係（c12, citty）はインストール済みだが未使用

**現在の使用方法**: プログラマティックAPIのみ

```typescript
// プログラマティックAPIを使用
import { generate } from '@openapi-xcgen/generator-typescript';

await generate({
  input: './openapi.yaml',
  output: './src/generated',
  validator: 'valibot',
});
```

**対応予定**: Phase 4で実装

### 2. 統合パラメータインターフェース未対応

**状態**: 既知の制限（`services-function.ts:62-70`にTODOコメントあり）

**問題**: pathパラメータとrequestBodyの両方を持つエンドポイントで、正しい型定義を生成できない

**現在の動作**: pathパラメータ型のみ生成、requestBodyは無視される

**影響例**: train-travel の `POST /bookings/{bookingId}/payment`

- 必要: `path: { bookingId: string }` + `body: CardPayment | BankTransferPayment`
- 生成: `path: { bookingId: string }` のみ（bodyプロパティが欠落）

**現在生成されるコード例（不完全）**:

```typescript
// types.ts
export type PostBookingsBookingIdPaymentRequestBody = CardPayment | BankTransferPayment;

export interface PostBookingsBookingIdPaymentParams {
  path: {
    bookingId: string;
  };
  // MISSING: body property
}
```

**期待される生成コード（Phase 4で対応予定）**:

```typescript
export interface PostBookingsBookingIdPaymentParams {
  path: {
    bookingId: string;
  };
  body: CardPayment | BankTransferPayment;
}
```

**対応予定**: Phase 4で統合型生成機能を実装

### 3. Union型はサポート済み

注意: train-travelのpayment examplesがコメントアウトされているのは、Union型のサポート不足ではありません。
Core、TypeScript generatorともにallOf, anyOf, oneOf, discriminatorを完全サポートしています。
payment examplesは上記の「統合パラメータインターフェース」の制限により無効化されています。

**サポート状況**:

- ✅ allOf → TypeScript intersection types (`A & B`) + Valibot `v.intersect()`
- ✅ anyOf → TypeScript union types (`A | B`) + Valibot `v.union()`
- ✅ oneOf → TypeScript discriminated unions + Valibot `v.variant()`
- ✅ discriminator → 完全サポート（JSDocコメント、Valibotマッピング）

---

## Phase 4タスク: 制限事項解消

**優先度: 高**

### タスク4.1: CLI実装

**目的**: コマンドライン実行環境の提供

**実装内容**:

#### 4.1.1 CLIエントリーポイント実装

- [ ] `src/cli.ts` 作成
  - citty使用（既存依存関係）
  - 引数パース（-i, -o, --validator）
  - エラーハンドリング
  - ヘルプメッセージ

#### 4.1.2 実行可能ファイル作成

- [ ] `bin/cli.mjs` 作成

```javascript
#!/usr/bin/env node
import { runCli } from '../dist/cli.mjs';
runCli();
```

#### 4.1.3 package.json更新

- [ ] `bin` エントリ追加

```json
{
  "bin": {
    "xcgen-ts": "./bin/cli.mjs"
  }
}
```

#### 4.1.4 設定ファイル対応

- [ ] c12使用（既存依存関係）
- [ ] `xcgen.config.ts` でdefineConfig()サポート
- [ ] CLI引数 > 設定ファイル > デフォルト値の優先順位

**基本コマンド**:

```bash
# 基本形式
xcgen-ts -i <input> -o <output> [--validator=valibot]

# 設定ファイル使用
xcgen-ts
```

**設定ファイル例**:

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/generator-typescript';

export default defineConfig({
  input: './openapi.yaml',
  output: './src/generated',
  validator: 'valibot',
});
```

**検証項目**:

- [ ] CLIコマンドが実行できる
- [ ] 引数パースが正しく動作する
- [ ] 設定ファイルが読み込まれる
- [ ] エラーメッセージが適切に表示される
- [ ] ヘルプメッセージが表示される（`xcgen-ts --help`）
- [ ] バージョン表示が動作する（`xcgen-ts --version`）

### タスク4.2: 統合パラメータインターフェース実装

**目的**: path + body両方持つエンドポイントの型生成

**実装内容**:

#### 4.2.1 services-function.ts修正

- [ ] `src/generators/services/services-function.ts` のTODO解消（62-70行）
  - 現在: pathパラメータ型のみ使用
  - 改善: 統合インターフェース生成

#### 4.2.2 types-parameter.ts拡張

- [ ] `src/generators/types/types-parameter.ts` 拡張
  - path + body統合型の生成ロジック
  - 例: `{ path: {...}, body: {...} }`
  - query, header パラメータも考慮

#### 4.2.3 train-travel payment examples有効化

- [ ] `examples/train-travel/src/index.ts` のコメント解除
  - examplePayWithCard()
  - examplePayWithBankTransfer()

#### 4.2.4 テスト追加

- [ ] E2Eテスト追加（path + body両方持つendpoint）
- [ ] 型チェックテスト追加
- [ ] train-travel examples実行確認

**期待される生成コード**:

```typescript
// types.ts
export interface PostBookingsBookingIdPaymentParams {
  path: {
    bookingId: string;
  };
  body: CardPayment | BankTransferPayment;
}

// services.ts
export async function payForBooking(
  options: PostBookingsBookingIdPaymentParams,
  init?: RequestInit
): Promise<PaymentConfirmation>;
```

**検証項目**:

- [ ] path + body統合型が正しく生成される
- [ ] path + query + body統合型が正しく生成される
- [ ] train-travel payment examplesが動作する
- [ ] E2Eテストがパスする
- [ ] 型チェックがパスする

---

## Phase 5タスク: 実用段階への移行

**優先度: 中**（Phase 4完了後）

### タスク5.1: ドキュメント整備

**目的**: ユーザー向けドキュメントの完成

#### 5.1.1 README更新

- [ ] インストール手順
- [ ] クイックスタート
- [ ] 使用例（CLI、プログラマティックAPI）
- [ ] 機能一覧
- [ ] 対応OpenAPIバージョン
- [ ] バッジ追加（npm version, tests, coverage）

#### 5.1.2 CLI使用ガイド

- [ ] オプション詳細（-i, -o, --validator）
- [ ] 設定ファイル（xcgen.config.ts）
- [ ] 環境変数
- [ ] 実行例

#### 5.1.3 トラブルシューティング

- [ ] よくある問題と解決策
- [ ] デバッグ方法
- [ ] Issue報告テンプレート

#### 5.1.4 Migration guide

- [ ] 他ツールからの移行（hey-api, orval, openapi-typescript）
- [ ] 差分比較表
- [ ] 移行手順

#### 5.1.5 API Reference

- [ ] 生成されるコードの仕様
- [ ] ApiConfig インターフェース
- [ ] XcgenApiError クラス
- [ ] カスタムfetch使用例
- [ ] Valibotスキーマ使用例

### タスク5.2: npm公開準備

**目的**: npmパッケージとして公開可能な状態にする

#### 5.2.1 CHANGELOG生成

- [ ] semantic-release設定
- [ ] Conventional Commits準拠
- [ ] 自動バージョニング設定

#### 5.2.2 バージョニング戦略

- [ ] semver準拠（0.x系 → 1.0.0）
- [ ] Breaking changes明記
- [ ] Deprecation policy策定

#### 5.2.3 リリースノート作成

- [ ] 主要機能の説明
- [ ] Known limitations
- [ ] Migration guide
- [ ] 今後のロードマップ

#### 5.2.4 ライセンス確認

- [ ] MIT License（既存）
- [ ] 依存関係のライセンス確認
- [ ] NOTICE/LICENSE.txt整備

#### 5.2.5 package.json メタデータ整備

- [ ] description
- [ ] keywords（openapi, typescript, generator, codegen等）
- [ ] repository
- [ ] homepage
- [ ] bugs
- [ ] author
- [ ] contributors

### タスク5.3: CI/CD統合

**目的**: 自動化されたテストとリリースパイプライン

#### 5.3.1 GitHub Actions設定

- [ ] `.github/workflows/test.yml` 作成
  - Lint, typecheck, test, build自動実行
  - Node.js マトリックステスト（v20, v22, v23）
  - examples テスト実行
- [ ] `.github/workflows/release.yml` 作成
  - semantic-release自動化
  - npm publish自動化
  - Git tag作成

#### 5.3.2 カバレッジレポート生成

- [ ] Codecov / Coveralls統合
- [ ] カバレッジ閾値設定（80%以上推奨）
- [ ] バッジ追加（README）

#### 5.3.3 リリース自動化

- [ ] タグベースリリース
- [ ] GitHub Releases自動作成
- [ ] npm publish権限設定（NPM_TOKEN）
- [ ] Changelogの自動GitHub Releases連携

---

## Phase 6タスク（オプション）: 拡張機能

**優先度: 低**（Phase 5完了後、需要に応じて）

### タスク6.1: Zod対応

- [ ] バリデーションライブラリの選択肢拡大
- [ ] `--validator=zod` フラグ実装
- [ ] Valibotと同等の機能サポート
- [ ] E2Eテスト追加

### タスク6.2: x-extensions サポート

- [ ] カスタム拡張プロパティのサポート
- [ ] ユーザー定義コード生成フック
- [ ] プラグインシステム設計

### タスク6.3: パフォーマンス最適化

- [ ] 大規模API（1000+ endpoints）への対応
- [ ] 並列処理実装
- [ ] キャッシュ機能追加
- [ ] メモリ使用量最適化

### タスク6.4: 追加HTTPクライアント対応

- [ ] Axios, ky等のアダプター
- [ ] カスタムHTTPクライアントプラグイン
- [ ] インターセプター統合

### タスク6.5: Mock生成

- [ ] MSW（Mock Service Worker）統合
- [ ] テストデータ生成
- [ ] faker.js統合
- [ ] モックサーバー起動機能

---

## 参考情報

### ファイル構成

```
packages/generator-typescript/
├── src/
│   ├── generators/        # ✅ 実装済み（types, services, client, schemas）
│   ├── helpers/          # ✅ 実装済み（naming, type-mapper）
│   ├── types.ts          # ✅ 実装済み
│   ├── generator.ts      # ✅ 実装済み
│   ├── cli.ts           # ❌ 未実装（Phase 4.1）
│   └── index.ts         # ✅ 実装済み
├── bin/
│   └── cli.mjs          # ❌ 未実装（Phase 4.1）
├── tests/
│   └── e2e/             # ✅ 実装済み（12 fixtures, 60 tests）
└── package.json         # ⚠️ bin エントリ追加必要（Phase 4.1）
```

### 技術スタック（確立済み）

- **言語**: TypeScript 5.0+
- **テスト**: Vitest（In-sourceテスティング）
- **ビルド**: unbuild（ESM/CJS両対応）
- **CLI**: c12, citty（未使用）
- **ユーティリティ**: change-case, consola

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

### 関連ドキュメント

- `CLAUDE.md`: 開発ガイドライン
- `_docs/_tasks/004_generator_typescript_setup.md`: 環境構築（完了）
- `_docs/_tasks/009_core_implementation.md`: Coreパッケージ実装（完了）
- `examples/petstore/`: 基本的なCRUD例
- `examples/train-travel/`: 複雑なユースケース例

### 生成コード例

```typescript
// types.ts
export interface Pet {
  readonly id: string;
  name: string;
  age?: number | null;
}

export interface GetPetParams {
  path: { petId: string };
}

// services.ts
export async function getPet(
  options: GetPetParams,
  init?: RequestInit
): Promise<Pet>;

// client.ts
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export function setConfig(config: ApiConfig): void;
export class XcgenApiError extends Error { /* ... */ }
```
