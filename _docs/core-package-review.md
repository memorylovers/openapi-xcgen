# Core Package Review

## 未実装・改善項目

### 優先度: 中

**2. レスポンスヘッダーのIR未取り込み**

- `visitResponse`で完全に無視されている（`packages/core/src/transformer/visitors/operations/response-visitor.ts:191-198`）
- `IRResponse`と`IRResponseHeader`インターフェースは定義済み（`packages/core/src/types/ir/endpoints/response.ts:34,110`）、実装のみ必要
- E2Eテスト（museum-api.yaml、train-travel-api.yaml）で実際に使用されている
- Rate Limit情報やLocationヘッダーなど重要な情報を含む

### 優先度: 低（制限事項）

**3. discriminatorパターン未対応**

- oneOf/allOf/anyOfパターンが未サポート
- 3つのE2Eテスト（discriminator-one-of.yaml、discriminator-all-of.yaml、discriminator-any-of.yaml）が失敗
- CLAUDE.mdの制限事項に明記済み

## 詳細な実装計画

### 1. レスポンスヘッダーのIR取り込み

#### 1-1. 問題詳細

Rate-Limit情報などの重要なヘッダー情報がIRに含まれない。

#### 1-2. 実装箇所

- `response-visitor.ts:191-198` - ヘッダー処理のスキップ箇所（TODOコメントあり）

#### 1-3. 実装方法

```typescript
// response-visitor.tsで
let headers: IRResponseHeader[] | undefined;
if (responseObj.headers) {
  headers = [];
  for (const [headerName, headerDef] of Object.entries(responseObj.headers)) {
    if (isReferenceObject(headerDef)) {
      consola.warn(`Reference header not supported yet: ${headerDef.$ref}`);
      continue;
    }

    if (headerDef.schema) {
      const type = visitType(headerDef.schema, {
        documentPath: [...context.documentPath, "headers", headerName, "schema"],
        rootSegment: context.rootSegment,
      });

      if (type) {
        headers.push({
          name: headerName,
          type,
          ...(headerDef.description && { description: headerDef.description }),
          ...(headerDef.deprecated && { deprecated: headerDef.deprecated }),
        });
      }
    }
  }
}
```

## テスト方針

各修正に対してTDDサイクルを適用：

1. **Red**: 失敗するテストを先に書く
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コード品質を改善

In-sourceテストを使用し、各visitorファイル内で単体テストを実装。

## 実装順序

1. レスポンスヘッダー対応（優先度: 中 - Rate Limit、Location等の重要情報取り込み）

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

### 実装済みcomponentsセクション

✅ `components.schemas` - スキーマ定義（完全対応）
✅ `components.responses` - 再利用可能なレスポンス定義（完全対応）
✅ `components.requestBodies` - 再利用可能なリクエストボディ定義（完全対応）
✅ `components.securitySchemes` - 認証スキーム定義（完全対応）

※ 以下のcomponentsセクションは基本的なコード生成には不要なため未実装：
`components.parameters`、`components.examples`、`components.headers`、`components.links`、`components.callbacks`
