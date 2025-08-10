# openapi-xcgen 開発ガイドライン

## プロジェクト概要

openapi-xcgenは、TypeSpecから生成されたOpenAPI仕様書（YAML/JSON）を入力として、TypeScript/Dartのクライアントコードを自動生成するクロスランゲージコード生成ライブラリです。

## 開発原則・設計思想

### 基本原則

- **Tree-shaking対応**: 関数ベースのアーキテクチャを採用し、クラスは使用しない
- **YAGNI原則** (You Aren't Gonna Need It): 必要になるまで実装しない
- **DRY原則** (Don't Repeat Yourself): 重複を避ける
- **KISS原則** (Keep It Simple, Stupid): シンプルに保つ
- **単一責任原則**: 各モジュール・関数は1つの責任のみを持つ
- **純粋関数**: 副作用のない関数型プログラミングを採用

## 開発手法

### TDD (Test-Driven Development)

t-wada推奨のRed-Green-Refactorサイクルに従う：

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: コードを改善（テストは常にGreen）

### 実装アプローチ

- 外側から内側へ（インターフェースから実装詳細へ）
- 依存関係の少ないものから実装
- 単純なものから複雑なものへ
- 小さなステップで確実に進める
- ドキュメントコメントに仕様を記載

## 技術的な設計方針

### TypeScript設定

- **strict mode**: 型安全性を最大限に活用
- **ESNext target**: 最新のJavaScript機能を活用
- **NodeNext module**: Node.jsの最新モジュールシステムに対応

### 型設計

- **判別共用体** (discriminated union): 型安全性の向上
- **IRType**: kind属性で型を判別する設計

```typescript
export type IRType = IRPrimitive | IRRef | IRArray | IRMap | IRAny;
```

### OpenAPI処理

- **bundle()メソッド**: $refを内部参照として保持（dereference()ではない）
- **コンポーネント名の保持**: コード生成時に意味のある名前を維持
- **インラインスキーマ**: 適切な命名戦略で独立したモデルとして抽出

### モジュール設計

- **機能分離**: extractorsディレクトリで単一責任を実現
- **簡潔な命名**: `parser.ts`、`transformer.ts`など（冗長な命名を避ける）
- **関数ベース**: Tree-shaking効率化のためクラスを使用しない

## コード品質管理

### 必須チェック

開発中は以下のコマンドを定期的に実行：

```bash
# 全チェック実行（コミット前に必須）
pnpm check

# 個別実行
pnpm lint        # ESLint + Prettier + markdownlint
pnpm typecheck   # TypeScript型チェック
pnpm test        # Vitestによるテスト

# 修正
pnpm lint:fix    # Lintエラーの自動修正
```

### コーディング規約

- ESLintとPrettierの設定に従う
- markdownlintでドキュメント品質を維持
- インポートパスは`.js`拡張子を使用（ESM対応）
- エラーメッセージは具体的で実行可能な内容にする

## プロジェクト要件

### 環境要件

- **Node.js**: v20以上
- **TypeScript**: 5.0以上
- **パッケージマネージャー**: pnpm 10.13.1
- **モノレポ管理**: Turbo

### 対応形式

- **モジュール**: ESM/CJS両対応（unbuild使用）
- **OpenAPI**: 3.0.x / 3.1.x
- **出力言語**: TypeScript、Dart

## ディレクトリ構成

```
packages/
├── core/                      # パーサー、変換器、共通機能
│   ├── src/
│   │   ├── parser/           # OpenAPIパーサー
│   │   │   └── parser.ts     # parse()関数
│   │   ├── transformer/      # IR変換器
│   │   │   ├── transformer.ts
│   │   │   └── extractors/   # 機能別抽出器
│   │   └── types/
│   │       └── ir/           # 中間表現型定義
│   └── tests/                # Vitestテスト
├── generator-typescript/      # TypeScript生成器
└── generator-dart/           # Dart生成器
```

## 重要なコマンド

### 開発コマンド

```bash
# 開発
pnpm dev          # 開発モード（watch）
pnpm build        # ビルド

# テスト
pnpm test         # テスト実行
pnpm test:watch   # watchモードでテスト
pnpm test:coverage # カバレッジ付きテスト

# 品質チェック
pnpm check        # lint + typecheck + test
pnpm lint         # Lintチェック
pnpm lint:fix     # Lint自動修正
pnpm typecheck    # 型チェック

# パッケージ別実行
cd packages/core && pnpm test
```

## コミット規約

Conventional Commitsに従う：

- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント更新
- `chore`: ビルド・設定変更

## 実装優先順位

1. **Phase 1**: Core実装（Parser、Transformer）
2. **Phase 2**: TypeScript生成器（Valibot対応）
3. **Phase 3**: Dart生成器（json_serializable対応）
4. **Phase 4**: 拡張機能（Zod対応、x-拡張対応）

## 設計決定の記録

### なぜ関数ベースか？

- Tree-shakingによるバンドルサイズ削減
- 不要なインスタンス管理の排除
- 純粋関数による予測可能な動作

### なぜbundle()を使うか？

- $refを保持してコンポーネント名を維持
- コード生成時に意味のある名前を使用可能
- 循環参照のサポート

### なぜ判別共用体か？

- TypeScriptの型システムを最大限活用
- switch文での網羅的なチェック
- 実行時エラーの削減

## トラブルシューティング

### よくある問題と解決方法

1. **インポートエラー**: `.js`拡張子を付け忘れていないか確認
2. **型エラー**: `pnpm typecheck`で詳細を確認
3. **テスト失敗**: `pnpm test -- --reporter=verbose`で詳細表示
4. **Lintエラー**: `pnpm lint:fix`で自動修正を試す

## 参考資料

- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [@apidevtools/swagger-parser](https://apitools.dev/swagger-parser/docs/)
- [Vitest Documentation](https://vitest.dev/)
