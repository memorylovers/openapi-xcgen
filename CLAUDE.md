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

### テスト戦略

#### In-sourceテスティング

実装とテストを同じファイルに配置し、`import.meta.vitest`を使用：

```typescript
// src/transformer/helpers/is-primitive-type.ts
export function isPrimitiveType(type: unknown): boolean {
  return ["string", "number", "integer", "boolean"].includes(type as string);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe("isPrimitiveType", () => {
    it("should return true for primitive types", () => {
      expect(isPrimitiveType("string")).toBe(true);
    });
  });
}
```

#### 外部依存のモック化

```typescript
// consolaのモック化例
const { vi } = import.meta.vitest;

it("should warn for invalid types", () => {
  const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
  
  const result = visitPrimitive({ type: "array" });
  
  expect(result).toBe(null);
  expect(warnSpy).toHaveBeenCalledWith("Invalid type for primitive visitor: array");
  
  warnSpy.mockRestore(); // クリーンアップ
});
```

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
- インポートパス：
  - 生成器のソースコード：`.js`拡張子を使用（ESM対応）
  - 生成されるコード：拡張子なし（バンドラー前提）
- エラーメッセージは具体的で実行可能な内容にする

### 命名規約

#### 関数命名

- **Visitor関数**: `visit〇〇` (例: `visitPrimitive`, `visitType`)
- **Helper関数**: 動詞で始まる (例: `isPrimitiveType`, `extractRefName`)
- **変換関数**: `〇〇To△△` (例: `schemaToIR`)

#### ファイル命名

- **Visitor**: `〇〇-visitor.ts` (例: `primitive-visitor.ts`)
- **Helper**: 機能を表す動詞句 (例: `is-primitive-type.ts`)
- kebab-caseを使用

#### 型定義

- **インターフェース**: `I〇〇` は使わず、素直な名前 (例: `SchemaObject`)
- **型エイリアス**: 互換性のための拡張時は`With〇〇` (例: `SchemaObjectWithNullable`)
- **IR型**: `IR〇〇` プレフィックス (例: `IRPrimitive`, `IRType`)

#### ドキュメントコメント

```typescript
/**
 * プリミティブ型のSchemaObjectをIRPrimitiveに変換
 * @param schema - 変換対象のスキーマ
 * @returns IRPrimitive型の結果、無効な場合はnull
 * 
 * @example OpenAPI YAML
 * ```yaml
 * name:
 *   type: string
 * ```
 */
```

### エラーハンドリング戦略

- **例外を投げない**: `throw`の代わりに`consola.warn`で警告を出し、`null`を返す
- **エラーメッセージ**: "Invalid"を使用（"Expected"より明確で実行可能）
- **null伝播**: 下位のvisitorが`null`を返した場合、上位も`null`を返す
- **戻り値の型**: Visitor関数は`IRType | null`のようなnull許容型を返す

```typescript
// ❌ Bad: 例外を投げる
if (!isPrimitiveType(schema.type)) {
  throw new Error(`Expected primitive type, got: ${schema.type}`);
}

// ✅ Good: 警告とnull返却
if (!isPrimitiveType(schema.type)) {
  consola.warn(`Invalid type for primitive visitor: ${schema.type}`);
  return null;
}
```

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
│   │   │   ├── visitors/     # Visitorパターン実装（1非終端記号1ファイル）
│   │   │   │   ├── primitive-visitor.ts  # プリミティブ型処理
│   │   │   │   ├── type-visitor.ts       # 汎用型解決
│   │   │   │   └── ...                   # その他のvisitor
│   │   │   ├── helpers/      # 共通ヘルパー関数（1関数1ファイル）
│   │   │   │   ├── is-primitive-type.ts  # プリミティブ型判定
│   │   │   │   ├── extract-ref-name.ts   # $ref名抽出
│   │   │   │   └── ...                   # その他のヘルパー
│   │   │   ├── context.ts    # Visitorコンテキスト管理
│   │   │   ├── types.ts      # Visitor型定義
│   │   │   └── index.ts      # エクスポート
│   │   └── types/
│   │       └── ir/           # 中間表現型定義
│   └── tests/                # 統合テストのみ（単体テストはin-source）
├── xcgen-ts/                  # TypeScript生成器
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

# E2E期待値再生成
pnpm regenerate:expected  # E2E期待値ファイルを再生成（coreまたはxcgen-ts）

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

## 現在の制限事項

### 未対応のOpenAPI機能

以下の機能は現バージョンでは未対応です（基本機能の安定化を優先）：

#### Union型とスキーママージ

- **oneOf**: 排他的Union（exactly one）
- **anyOf**: 包含的Union（one or more）
- **allOf**: スキーママージ
- **discriminator**: ポリモーフィズムのヒント

#### 高度なバリデーション

- **not**: 否定スキーマ
- **additionalProperties**: 追加プロパティ制約
- **patternProperties**: パターンプロパティ
- **if/then/else**: 条件付きスキーマ

#### その他

- **multipleOf**: 数値の倍数制約
- **contentMediaType/contentEncoding**: コンテンツエンコーディング
- **$id/$anchor**: スキーマ識別子
- **空のスキーマ `{}`**: any型相当（すべての型を許可）
- **typeプロパティなし**: 暗黙的なany型

#### Paths/Operations機能

- **レスポンスヘッダー**: headers処理（Rate-Limit情報等）
- **共通パラメータ**: PathItemレベルの共通parameters
- **セキュリティ定義**: security/securitySchemes処理
- **パラメータバリデーション**: minimum/maximum等の詳細なバリデーション情報

これらの機能は使用頻度が低く（全体の5-10%）、基本的な型処理（object、array、primitive、enum、$ref）で90%以上のAPIに対応可能です。また、基本的なコード生成には不要であり、実装優先度を下げています。

注: any型のサポートは意図的に除外しています。型安全性を重視し、明示的な型定義を推奨します。

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
