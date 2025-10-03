# Core Package Review

## 未実装・改善項目

### 優先度: 低（制限事項）

**1. discriminatorパターン未対応**

- oneOf/allOf/anyOfパターンが未サポート
- 3つのE2Eテスト（discriminator-one-of.yaml、discriminator-all-of.yaml、discriminator-any-of.yaml）が失敗
- CLAUDE.mdの制限事項に明記済み

## テスト方針

各修正に対してTDDサイクルを適用：

1. **Red**: 失敗するテストを先に書く
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コード品質を改善

In-sourceテストを使用し、各visitorファイル内で単体テストを実装。

## 完了済みタスク

### 2024年実装

- **PathItem共通parameters継承**: PathItemレベルのparametersをOperationに継承し、同一name+inの場合はOperationレベルが優先される仕組みを実装（`parameters-visitor.ts:44-69`）
- **RequestBody/Responseの$ref簡略化**: $ref参照を解決せず、ResponseObject/RequestBodyObjectとして扱うように変更。schema-level（`visitRef`）での処理に委譲（`response-visitor.ts:79`、`request-body-visitor.ts:77`）

### 2025年実装

- **Security対応**: Operation/PathレベルのsecurityとcomponentsのsecuritySchemesを完全対応。APIKey、HTTP(Basic/Bearer)、OAuth2、OpenID Connectの全認証タイプをサポート（`operation-visitor.ts:150-176`、`security-schemes-visitor.ts`、`components-visitor.ts:62-67`）
- **グローバルセキュリティ対応**: OpenAPI仕様書のルートレベル`security`をIRの`globalSecurity`フィールドに変換する機能を実装。全エンドポイントのデフォルト認証要件をサポート（`transformer.ts:126-138`、`types/ir/index.ts:30`）
- **components.responses対応**: components.responsesセクションの完全サポートを実装。$ref参照を保持し、IRResponseとして変換（`responses-components-visitor.ts`、`components-visitor.ts:78-82`）
- **IRRequestBody/IRResponse Discriminated Union化**: content/refの相互排他性を型システムで表現。型安全性向上とメモリ効率化を実現（`request.ts`、`response.ts`）
- **パラメータバリデーション対応**: `IRParameter`に`validation`フィールドを追加し、`extractValidation`ヘルパーを統合。OpenAPI 3.0.x/3.1形式の両方をサポート（`parameter.ts:52`、`parameter-visitor.ts:97`、`create-parameter-model.ts:158`、`extract-validation.ts:62-77`）
- **レスポンスヘッダー対応**: `visitResponse`でheadersを処理し、`IRResponseWithContent`に格納。Location、Rate-Limit等の重要なヘッダー情報をIRに取り込み（`response-visitor.ts:194-223`、`response.ts:110`）
- **Header Visitor分離**: ヘッダー処理を専用の`header-visitor.ts`に分離し、単一責任原則に準拠。`HeaderContext`型を追加し、`visitHeader`関数で処理を実装（`header-visitor.ts`、`types.ts:131-145`）

### 実装済みcomponentsセクション

✅ `components.schemas` - スキーマ定義（完全対応）
✅ `components.responses` - 再利用可能なレスポンス定義（完全対応）
✅ `components.requestBodies` - 再利用可能なリクエストボディ定義（完全対応）
✅ `components.securitySchemes` - 認証スキーム定義（完全対応）

※ 以下のcomponentsセクションは基本的なコード生成には不要なため未実装：
`components.parameters`、`components.examples`、`components.headers`、`components.links`、`components.callbacks`
