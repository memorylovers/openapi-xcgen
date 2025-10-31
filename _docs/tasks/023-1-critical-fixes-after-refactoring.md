# Task 023-1: Task 023リファクタリング後の重大問題修正

**Status**: 🔴 未着手
**Priority**: Critical（即時対応必須）
**Created**: 2025-10-31
**Parent Task**: Task 023 (Visitor Architecture Refactoring)

## 概要

Task 023 (3層アーキテクチャ導入) のリファクタリング後に発覚した3つの重大な問題を修正します。
いずれもIR生成の正確性・完全性に関わる重大な問題であり、PRマージ前の対応が必須です。

---

## 問題1: PathItem/Operation parametersの重複 🔴

### 現状の問題

**ファイル**: `packages/core/src/transformer/transformers/traversers/operation-traverser.ts:75-81`

```typescript
const filteredPathParams = (pathItemParameters || []).filter(
  (p): p is ParameterObject => !("$ref" in p),
);
const filteredOpParams = (operation.parameters || []).filter(
  (p): p is ParameterObject => !("$ref" in p),
);
const mergedParameters = [...filteredPathParams, ...filteredOpParams]; // ← 単純結合
```

### 原因

PathItemレベルとOperationレベルのparametersを単純に結合しているため、同じ`name+in`の組み合わせが重複します。

OpenAPI仕様では、**operation側のパラメータがpathItem側を上書きする**べきですが、現在は両方が残ります。

### 影響範囲

**例**: `GET /pets/{id}` で両方に`id`パラメータが定義される場合

```yaml
paths:
  /pets/{id}:
    parameters:
      - name: id
        in: path
        schema:
          type: string
    get:
      parameters:
        - name: id
          in: path
          schema:
            type: integer  # ← operation側で上書き
```

**期待**: `GetPetsIdParams` に `id: integer` が1件
**実際**: `GetPetsIdParams` に `id: string` と `id: integer` が2件（重複）

**影響**:

- TypeScript/Dart生成時にコンパイルエラー（同名プロパティ）
- 型定義の不整合
- 予期しない動作

### 修正方針

1. `mergedParameters` 生成時に重複除去を実装
2. `name+in` の組み合わせでMap化し、operation側を優先
3. テストケース追加

**修正箇所**:

- `packages/core/src/transformer/transformers/traversers/operation-traverser.ts`

**テスト**:

- PathItem/Operation両方にパラメータがある場合のテスト追加
- operation側が優先されることを確認

---

## 問題2: IRRequestBodyModel/IRResponseModelのkind不整合 🔴

### 現状の問題

**E2E期待値**: `packages/core/tests/e2e/fixtures/general/orval/petstore-basic.expected.json:152`

```json
{
  "kind": "object",  // ← 本来は "requestBody" であるべき
  "name": "PostPetsRequestBody",
  "referencePath": "#/paths/::pets/post/requestBody/content/application::json/schema",
  "properties": [...]
}
```

### 原因

`content-traverser.ts` は `kind: "requestBody"` のコンテキストを作成しますが、`schema-dispatcher.ts` がそれを無視して常に `transformObject()` を呼び出すため、すべて `kind: "object"` になります。

**IR型定義では以下が定義されている**:

- `IRRequestBodyModel` (kind: "requestBody", required?)
- `IRResponseModel` (kind: "response", statusCode, headers?)

しかし実際には使用されていません。

### 影響範囲

**requestBodyの場合**:

- `required` フラグが `IRRequestBodyModel.required` ではなく `RequestBodyObject.required` にしか存在しない
- IRモデルから `required` 情報が取得できない（IREndpoint.requestBodyには存在）
- xcgen-ts/dartでモデル生成時に文脈情報が失われる

**responseの場合**:

- `statusCode` が `IRResponseModel` に含まれない
- `headers` 情報が失われる
- IRモデルからどのステータスコードのレスポンスか判別不可

**IR仕様違反**:

- `packages/core/src/types/ir/models/operation.ts:72-87, 111-128` で定義された型が使われていない
- IRModel判別共用体に含まれているが、実際には生成されない

### 修正方針

#### 方針A: schema-dispatcherでコンテキストを判定

`schema-dispatcher.ts` でコンテキストを見て、requestBody/response文脈では専用transformerを呼ぶ。

```typescript
export function dispatchSchema(schema, context) {
  // requestBody文脈の場合
  if (context.kind === "requestBody" && schema.type === "object") {
    return transformRequestBodyObject(schema, context);
  }

  // response文脈の場合
  if (context.kind === "response" && schema.type === "object") {
    return transformResponseObject(schema, context);
  }

  // 通常のobject
  if (schema.type === "object") {
    return transformObject(schema, context);
  }
}
```

#### 方針B: content-traverser内で特別処理

`traverseContent()` が `requiresSpecialModel: true` を返した時、親のtransformer側で専用モデルを生成。

**採用**: 方針A（dispatcher層で判定するのが3層アーキテクチャに沿う）

### 修正箇所

1. `packages/core/src/transformer/transformers/dispatchers/schema-dispatcher.ts`
   - コンテキストkindを判定してルーティング

2. `packages/core/src/transformer/transformers/transformers/request-body-transformer.ts`
   - `transformRequestBodyObject()` を修正してIRRequestBodyModelを返す

3. `packages/core/src/transformer/transformers/transformers/response-transformer.ts`
   - `transformResponseObject()` を追加（新規）してIRResponseModelを返す

4. E2E期待値の更新
   - `kind: "object"` → `kind: "requestBody"` / `kind: "response"`

### テスト

- requestBodyのインラインobjectがIRRequestBodyModelになることを確認
- responseのインラインobjectがIRResponseModelになることを確認
- statusCode, headersが正しく設定されることを確認

---

## 問題3: security/extensionsの欠落 🔴

### 現状の問題

**IREndpoint型定義**: `packages/core/src/types/ir/endpoints/endpoint.ts:74, 76`

```typescript
export interface IREndpoint {
  // ...
  security?: IRSecurityRequirement[];  // ← 定義されているが設定されない
  extensions?: IRExtensions;           // ← 定義されているが設定されない
}
```

**operation-transformer.ts:232-243** でIREndpoint生成時:

```typescript
const endpoint: IREndpoint = {
  path: pathTemplate,
  method,
  // ...
  responses: endpointResponses,
  // security と extensions が設定されていない！
};
```

### 原因

新しい3層アーキテクチャ実装で、`operation.security` と PathItem/Operationの `x-*` 拡張フィールドが転記されていません。

### 影響範囲

**security欠落**:

- 認証情報が完全に消失
- xcgen-ts/dartでクライアント生成時に認証処理を組み立てられない
- APIキー、OAuth、Bearer tokenなどのセキュリティ要件が不明

**extensions欠落**:

- OpenAPIのカスタム拡張（`x-*`）が消失
- Hooksシステムで利用する拡張情報が取得できない
- ユーザー独自の拡張仕様が全て失われる

### 修正方針

1. `operation.security` をIREndpointに設定
2. PathItem/Operationの `x-*` 拡張を `extractExtensions()` でマージ（Operation優先）
3. IREndpoint生成時に設定

**既存ヘルパー**:

- `packages/core/src/transformer/helpers/extract-extensions.ts` が存在するか確認
- なければ新規実装

### 修正箇所

1. `packages/core/src/transformer/transformers/transformers/operation-transformer.ts`
   - `operation.security` の転記
   - PathItem/Operationの拡張マージ
   - IREndpoint生成時に設定

2. ヘルパー関数（必要に応じて新規作成）
   - `extractExtensions()` - x-系フィールドの抽出
   - `mergeExtensions()` - PathItemとOperationの拡張マージ

### テスト

- securityが設定されたエンドポイントのテスト
- x-拡張フィールドが正しくマージされることを確認
- Operation優先でPathItemが上書きされることを確認

---

## タスク優先順位

| 問題 | 重大度 | 優先度 | 理由 |
|------|--------|--------|------|
| 1. parameters重複 | 🔴 高 | 1 | コンパイルエラーの原因、即座に問題が顕在化 |
| 2. kind不整合 | 🔴 高 | 2 | IR仕様違反、ダウンストリーム実装時に問題発覚 |
| 3. security/extensions欠落 | 🔴 高 | 3 | セキュリティ要件の消失、重大だが検出が遅れる |

**推奨アプローチ**: 3つまとめて1つのPRで対応

---

## 実装チェックリスト

### 問題1: parameters重複

- [ ] `operation-traverser.ts` で重複除去実装
- [ ] operation側優先のロジック実装
- [ ] テストケース追加（PathItem + Operation重複）
- [ ] E2Eテスト実行

### 問題2: kind不整合

- [ ] `schema-dispatcher.ts` でコンテキスト判定追加
- [ ] `transformRequestBodyObject()` 修正
- [ ] `transformResponseObject()` 新規実装
- [ ] E2E期待値更新（kind変更）
- [ ] 全テスト実行（427件）

### 問題3: security/extensions欠落

- [ ] `extractExtensions()` ヘルパー確認/実装
- [ ] `operation-transformer.ts` でsecurity設定
- [ ] `operation-transformer.ts` でextensions設定
- [ ] テストケース追加（security, x-extensions）
- [ ] E2Eテスト実行

---

## 関連ファイル

### 修正対象

- `packages/core/src/transformer/transformers/traversers/operation-traverser.ts`
- `packages/core/src/transformer/transformers/dispatchers/schema-dispatcher.ts`
- `packages/core/src/transformer/transformers/transformers/request-body-transformer.ts`
- `packages/core/src/transformer/transformers/transformers/response-transformer.ts`
- `packages/core/src/transformer/transformers/transformers/operation-transformer.ts`
- `packages/core/src/transformer/helpers/extract-extensions.ts` (要確認)

### テスト対象

- `packages/core/tests/e2e/fixtures/general/orval/petstore-basic.expected.json`
- その他E2E期待値ファイル（kind変更の影響範囲）

---

## 参考資料

- [OpenAPI Specification 3.0 - Parameter Object](https://spec.openapis.org/oas/v3.0.3#parameter-object)
- [OpenAPI Specification 3.0 - Security Requirement Object](https://spec.openapis.org/oas/v3.0.3#security-requirement-object)
- [Task 023](./023-visitor-architecture-refactoring.md) - 親タスク（削除済み、git履歴参照）
- [004_core_transformer_architecture.md](../004_core_transformer_architecture.md) - 3層アーキテクチャ
