# Core Transformer 設計

## 概要

Transformer は、OpenAPIDocument を言語非依存の XcgenIR に変換する責務を持ちます。

## Transformer設計

### Transformer の責務

OpenAPIDocumentを言語非依存のXcgenIRに変換

### Visitorパターンの採用

**選択理由**:

- **OpenAPIスキーマの再帰的な構造**に適合
- **処理ロジックの明確な分離**: 1Visitor = 1責務
- **拡張性の確保**: 新しいスキーマ型への対応が容易

**代替案の検討**:

- ストラテジーパターン: 単純な型変換には過剰
- ビルダーパターン: 再帰的構造に不向き
- Visitorパターンが最適

### 階層設計

**トップダウン処理**:

OpenAPI仕様の構造に合わせて段階的に委譲

1. **トップレベル** (`transform()`):
   - visitMetadata、visitTags、visitComponents、visitPaths、visitServers

2. **中間レベル**:
   - visitPathItem、visitOperation

3. **下位レベル**:
   - visitParameters、visitRequestBody、visitResponses
   - visitSchema → visitObject / visitEnum / visitArray / visitMap

**階層分離の基準**:

- **OpenAPI仕様の構造に対応**: components、paths、operations、schema
- **単一責任原則**: 各Visitorは1つの責務のみ
- **再利用性**: schema処理はcomponentsとpaths内のインラインスキーマで共通利用

### コンテキスト伝播

**VisitorContext**:

```typescript
interface VisitorContext {
  documentPath: string[];  // YAMLパス配列
  rootSegment: "components" | "paths";
}
```

**役割**:

- **インラインスキーマの命名**: documentPathから一意な名前を生成
- **参照パス構築**: $ref形式の参照を組み立て
- **由来の識別**: components由来かpaths由来かを判別

**例**:

- documentPath: `["paths", "/users", "post", "requestBody"]`
- 生成モデル名: `PostUsersRequestBody`
- 参照パス: `#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody`

詳細は `005-visitor-context-mapping.md` を参照してください。

## 設計方針

### 関数ベースアーキテクチャ

**原則**: クラスを使用せず、純粋関数で実装

**理由**:

- Tree-shakingによるバンドルサイズ削減
- 不要なインスタンス管理の排除
- 純粋関数による予測可能な動作
- テスト容易性の向上

**実装例**:

- `transform(document)` - 純粋関数
- `visitSchema(schema, context)` - 純粋関数

### エラーハンドリング戦略

**原則**: Transformerでは`throw`を使用せず、警告とnull返却

**実装方針**:

- 無効なスキーマに遭遇 → `consola.warn()`で警告し`null`を返す
- エラーメッセージには"Invalid"を使用（明確で実行可能）
- 下位Visitorが`null`を返した場合、上位も`null`を伝播
- Visitor関数の戻り値型は`IRType | null`のようなnull許容型

**理由**:

- 部分的なスキーマエラーでも処理を継続
- エラー箇所を特定しやすい
- 段階的なスキーマ修正が可能

### ヘルパー関数の設計

**1関数1ファイル原則**:

- 可読性の向上
- Tree-shaking最適化
- 責務の明確化

**純粋関数**:

- 副作用なし
- テスト容易
- 予測可能な動作

**分類**:

- **命名関連**: モデル名構築、列挙型名生成
- **参照パス関連**: $ref参照パス構築、ドキュメントパス構築
- **型変換関連**: OpenAPI型からIR型への変換
- **バリデーション関連**: バリデーション情報の抽出と構造化
- **拡張対応**: x-フィールド抽出、MIMEタイプ処理

## データフロー

### Transform フェーズ

```
OpenAPIDocument
  ↓
transform() エントリポイント
  ├─ visitMetadata() → IRMetadata
  ├─ visitTags() → IRTag[]
  ├─ visitComponents() → IRModel[] + securitySchemes + commonResponses/RequestBodies
  │   └─ visitSchema() (再帰的)
  ├─ visitPaths() → IREndpoint[] + IRModel[]
  │   └─ visitOperation()
  │       ├─ visitParameters()
  │       ├─ visitRequestBody()
  │       └─ visitResponses()
  └─ visitServers() → IRServer[]
  ↓
XcgenIR
```

**出力**: 言語非依存のXcgenIR

## 拡張性

### 新しいOpenAPI機能への対応

1. Transformerに新Visitorを追加
2. IR型に新フィールドを追加
3. 各言語生成器で対応を実装

### Hooks機能（issue #6実装済み）

**変換フローへの介入**:

- `validation:transform`: バリデーション変換のカスタマイズ
- `endpoint:generate`: エンドポイント生成のカスタマイズ

**活用例**:

- カスタムバリデーションの追加（Dayjs、ULID等）
- エンドポイント名のカスタマイズ
- 独自の型変換ロジック

詳細は `_docs/tasks/013-2-x-extensions-xcgen-ts-hooks.md` を参照してください。

## 設計判断の記録

### なぜ Visitorパターンか？

**代替案**: 単純なswitch文による分岐

**Visitorを選択した理由**:

- 再帰的なスキーマ処理に適合
- 各Visitorの責務が明確
- 新しい型への拡張が容易
- テストが容易（Visitor単位でテスト可能）

### なぜ コンテキスト伝播か？

**代替案**: グローバル状態での管理

**コンテキスト伝播を選択した理由**:

- 純粋関数を維持
- 並列処理への拡張可能性
- デバッグ容易性（コンテキストが明示的）

### なぜ エラーハンドリングでthrowを避けるか？

**代替案**: エラー時に即座にthrow

**null返却を選択した理由**:

- 部分的なエラーでも処理を継続
- エラー箇所の特定が容易
- ユーザーフレンドリー（段階的な修正が可能）

## 参考資料

- 関連ドキュメント
  - [002_core_architecture.md](./002_core_architecture.md) - Core全体アーキテクチャ
  - [003_core_ir_design.md](./003_core_ir_design.md) - IR型設計
  - [005-visitor-context-mapping.md](./005-visitor-context-mapping.md) - Visitor実装マッピング
  - [tasks/013-2-x-extensions-xcgen-ts-hooks.md](./tasks/013-2-x-extensions-xcgen-ts-hooks.md) - Hooks機能

- 実装
  - `packages/core/src/transformer/` - Transformer実装
