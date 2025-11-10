# Core パッケージ アーキテクチャ

## 概要

`@openapi-xcgen/core` は、OpenAPI仕様書（YAML/JSON）を言語非依存のコード生成向け中間表現（IR: Intermediate Representation）に変換する責務を持つコアライブラリです。

本パッケージは、TypeScript/Dart等の各言語生成器（`xcgen-ts`、`xcgen-dart`）が共通して利用する基盤を提供します。

## 全体フロー

coreパッケージは、以下の2段階でOpenAPIからIRへの変換を担当します:

```
OpenAPI YAML/JSON
    ↓
[Parser] parse()
    ↓
OpenAPIDocument
    ↓
[Transformer] transform()
    ↓
XcgenIR (中間表現)
    ↓
(coreの責務はここまで)
    ↓
[各言語生成器] xcgen-ts / xcgen-dart
    ↓
TypeScript/Dart コード
```

## モジュール構成

coreパッケージは以下の3つの主要モジュールから構成されます。

- **parser/**: OpenAPI仕様書のパース。`@apidevtools/swagger-parser`の薄いラッパー
- **transformer/**: OpenAPIDocumentを中間表現（IR）に変換（3層アーキテクチャ）
- **types/ir/**: コード生成向けに抽象化した中間表現。言語固有の詳細を排除

## 設計原則

- **関数ベース**: Tree-shakingに配慮し、純粋関数で実装
- **1ファイル1関数**: in-source testingに対応するため
- **責務分離**: 3層アーキテクチャで型判定・訪問・変換を明確に分離

---

## Parser 設計

### 責務

OpenAPIDocument を言語非依存の XcgenIR に変換する前準備として、YAML/JSON形式のOpenAPI仕様書を解析・検証します。

### なぜ bundle() を使うか？

`@apidevtools/swagger-parser` には `dereference()` と `bundle()` の2つの参照解決方法がありますが、本プロジェクトでは **bundle()** を採用しています。

**bundle()の利点**:

- **$refを保持してコンポーネント名を維持**: `#/components/schemas/User` → `User` として意味のある名前を使用可能
- **循環参照のサポート**: 相互参照するモデルにも対応
- **コード生成時の型名に活用**: IR変換時に元の名前を活用できる

**dereference()を使わない理由**:

- すべての参照がインライン展開され、元の構造と名前が失われる
- 循環参照がある場合に無限ループの可能性

---

## Transformer 設計

### 3層アーキテクチャ

Transformerは **3層アーキテクチャ（Dispatcher/Traverser/Transformer）** により、型判定・子要素訪問・変換処理の責務を明確に分離しています。

```
┌─────────────────────────────────────────┐
│  Dispatcher Layer (型判定とルーティング)  │
│  - dispatchSchema()                     │
│  - dispatchOperation()                  │
└─────────────────┬───────────────────────┘
                  │ 委譲
┌─────────────────▼───────────────────────┐
│  Traverser Layer (子要素の訪問)          │
│  - traverseObjectProperties()           │
│  - traverseArrayItem()                  │
│  - traverseComposition()                │
└─────────────────┬───────────────────────┘
                  │ 再帰呼び出し
┌─────────────────▼───────────────────────┐
│  Transformer Layer (変換処理)            │
│  - transformObject()                    │
│  - transformEnum()                      │
│  - transformArray()                     │
└─────────────────────────────────────────┘
```

**各層の責務**:

| 層 | 責務 | 例 |
|----|------|-----|
| **Dispatcher** | 型判定とルーティング | SchemaObjectの型を判定し、適切なtraverserを選択 |
| **Traverser** | 子要素の訪問 | objectのプロパティをイテレートし、dispatcherを再帰呼び出し |
| **Transformer** | 変換処理 | OpenAPIスキーマをIRModelに変換（子要素訪問はtraverserに委譲） |

詳細は [004_core_transformer_architecture.md](./004_core_transformer_architecture.md) を参照してください。

### 設計方針

#### 関数ベースアーキテクチャ

**原則**: クラスを使用せず、純粋関数で実装

**理由**:

- Tree-shakingによるバンドルサイズ削減
- 不要なインスタンス管理の排除
- 純粋関数による予測可能な動作
- テスト容易性の向上

#### エラーハンドリング戦略

**原則**: Transformerでは`throw`を使用せず、警告とnull返却

**実装方針**:

- 無効なスキーマに遭遇 → `consola.warn()`で警告し`null`を返す
- エラーメッセージには"Invalid"を使用（明確で実行可能）
- 下位Traverser/Transformerが`null`を返した場合、上位も`null`を伝播
- 関数の戻り値型は`IRType | null`のようなnull許容型

**理由**:

- 部分的なスキーマエラーでも処理を継続
- エラー箇所を特定しやすい
- 段階的なスキーマ修正が可能

#### Trust the types（型システムを信頼）

**原則**: TypeScriptの型システムが保証する範囲では追加チェック不要

**実装方針**:

- swagger-parserが入力データを検証・保証
- TypeScriptの型システムで不正な値を排除
- **型が安全を保証している場合は追加チェック不要**
- **型が `undefined` の可能性を示す場合はチェックが必要**
- YAGNI原則: 型システムが保証する範囲では追加チェック不要
- **非null assertion (`!`) の禁止**: 型システムを無視する危険な回避策

### データフロー

```
OpenAPIDocument
  ↓
transform() エントリポイント
  ├─ transformMetadata() → IRMetadata
  ├─ transformTags() → IRTag[]
  ├─ transformComponents() → IRComponent[]
  │   └─ dispatchSchema() (再帰的)
  │       ├─ traverse*() (子要素訪問)
  │       └─ transform*() (IR変換)
  ├─ transformPaths() → IREndpoint[] + IRComponent[]
  │   └─ dispatchOperation()
  │       ├─ traverseParameters()
  │       ├─ traverseContent() (requestBody)
  │       └─ traverseResponses()
  └─ transformServers() → IRServer[]
  ↓
XcgenIR
```

**処理戦略の使い分け**:

トップレベルの要素は、構造の性質によって処理戦略が異なります。

| 要素 | 構造 | 処理方法 | 理由 |
|------|------|----------|------|
| `info` | 固定 | `transformMetadata()` | 常に`title`, `version`等の決まった構造 |
| `tags` | 固定 | `transformTags()` | 常に`name`, `description`の配列 |
| `servers` | 固定 | `transformServers()` | 常に`url`, `description`の配列 |
| `components.schemas` | 可変 | `dispatchSchema()` | object/array/enum/primitive等、多様な型 |
| `paths.*.*.requestBody` | 可変 | `dispatchSchema()` | schemaは様々な型を取る |
| `paths.*.*.responses` | 可変 | `dispatchSchema()` | schemaは様々な型を取る |

**設計方針**: OpenAPI仕様で構造が固定されている要素は直接transformerを呼び出し、可変構造の要素（schema等）のみDispatcherで型判定を行います。これにより、不要なオーバーヘッドを避けつつ、必要な箇所で柔軟性を確保しています。

### 拡張性

#### Hooks機能

変換フローへの介入が可能です:

- `validation:transform`: バリデーション変換のカスタマイズ
- `endpoint:generate`: エンドポイント生成のカスタマイズ

**活用例**:

- カスタムバリデーションの追加（Dayjs、ULID等）
- エンドポイント名のカスタマイズ
- 独自の型変換ロジック

詳細は [tasks/013-2-x-extensions-xcgen-ts-hooks.md](./tasks/013-2-x-extensions-xcgen-ts-hooks.md) を参照してください。

---

## IR 設計

中間表現（IR）の詳細は [003_core_ir_design.md](./003_core_ir_design.md) を参照してください。

## 参考資料

### 関連ドキュメント

- [001-requirements.md](./001-requirements.md) - プロジェクト全体の要件定義
- [003_core_ir_design.md](./003_core_ir_design.md) - IR型設計の詳細
- [004_core_transformer_architecture.md](./004_core_transformer_architecture.md) - Transformer実装詳細（3層アーキテクチャ）
- [tasks/012-unsupported-features.md](./tasks/012-unsupported-features.md) - 制約事項・未実装機能
- [tasks/013-2-x-extensions-xcgen-ts-hooks.md](./tasks/013-2-x-extensions-xcgen-ts-hooks.md) - Hooks機能
- [CLAUDE.md](../CLAUDE.md) - 開発ガイドライン全般

### 外部仕様

- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [@apidevtools/swagger-parser](https://apitools.dev/swagger-parser/docs/)
