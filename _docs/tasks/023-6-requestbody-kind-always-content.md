# Task 023-6: requestBody の kind が常に "content" になる問題の修正

**Status**: ✅ 完了
**Priority**: High（データ品質の後退）
**Created**: 2025-11-01
**Completed**: 2025-11-01
**Parent Task**: Task 023 (Visitor Architecture Refactoring)

## 概要

Task 023の3層アーキテクチャリファクタリング時に、IRRequestBody の kind が常に "content" で固定され、$ref 参照型の場合も "content" になってしまう問題が発生しました。

operation-transformer.ts が transformRequestBody() を呼ばずに IRRequestBody を直接構築しており、isReferenceObject() の判定が行われていませんでした。

## 問題箇所

### operation-transformer.ts:226-241（修正前）

```typescript
if (traversalResult?.requestBodyResult) {
  const { required, description, content } =
    traversalResult.requestBodyResult;

  // IRRequestContentに変換
  const irRequestContent: IRRequestContent[] = content.content.map((c) => ({
    mimeType: c.mimeType as MimeType,
    schema: c.schema,
  }));

  endpointRequestBody = {
    kind: "content",    // ❌ 常に "content" で固定！
    ...(required && { required: true }),
    ...(description && { description }),
    content: irRequestContent,
  };
}
```

**影響**:

- $ref requestBody の場合も `kind: "content"` になる
- IRRequestBody の型判別が正しく機能しない
- petstore.yaml の `/pet` POST などで `kind: "ref"` であるべきが `kind: "content"` になる

## 正しい実装

request-body-transformer.ts では transformRequestBody() が正しく実装されていました：

```typescript
export function transformRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  context: VisitorContext,
  contentResult: ContentTraversalResult,
): TransformResult {
  // ReferenceObjectの場合
  if (isReferenceObject(requestBody)) {
    const ref: IRRef = { kind: "ref", name: requestBody.$ref };
    const irRequestBody: IRRequestBody = { kind: "ref", ref };
    return { type: irRequestBody as any, models: [] };
  }

  // RequestBodyObjectとして処理
  const requestBodyObj = requestBody as RequestBodyObject;
  // ...
  const irRequestBody: IRRequestBody = {
    kind: "content",
    content: irContent,
    ...(requestBodyObj.required && { required: true }),
    ...(requestBodyObj.description && { description: requestBodyObj.description }),
  };
  return { type: irRequestBody as any, models: contentResult.childModels };
}
```

## 修正内容

### 1. operation-transformer.ts修正

transformRequestBody() を呼び出すように変更：

```typescript
if (operation.requestBody && traversalResult?.requestBodyResult) {
  const requestBodyContext: VisitorContext = {
    documentPath: [...context.documentPath, "requestBody"],
    rootSegment: context.rootSegment,
  };

  // transformRequestBody()を呼び出して、$ref/inlineを正しく判定
  const requestBodyTransformResult = transformRequestBody(
    operation.requestBody, // ReferenceObject | RequestBodyObject
    requestBodyContext,
    traversalResult.requestBodyResult.content,
  );

  if (requestBodyTransformResult.type) {
    // NOTE: IRRequestBodyはIRTypeに含まれないが、Operation系の特別な型として扱う
    endpointRequestBody =
      requestBodyTransformResult.type as unknown as IRRequestBody;
  }
}
```

**ポイント**:

- operation.requestBody を transformRequestBody() に渡す
- isReferenceObject() で $ref/inline を判定
- $ref の場合は `kind: "ref"` を設定
- inline の場合は `kind: "content"` を設定

### 2. IRRequestContent インポート削除

operation-transformer.ts で使用されなくなったため削除。

### 3. In-sourceテスト修正・追加

- "should process requestBody" → "should process requestBody with inline content" に名前変更
- operation.requestBody を追加（transformRequestBody() に必要）
- "should process requestBody with $ref" テスト追加（kind: "ref" を検証）

### 4. E2E期待値更新

全E2Eテストの期待値を再生成。petstore.yaml の以下のエンドポイントで正しく `kind: "ref"` が設定される：

- `/pet` POST: `#/components/requestBodies/Pet`
- `/pet` PUT: `#/components/requestBodies/Pet`
- `/user/createWithArray` POST: `#/components/requestBodies/UserArray`
- `/user/createWithList` POST: `#/components/requestBodies/UserArray`

## テスト結果

- ✅ 全530テストが成功（1テスト追加）
- ✅ Lint/TypeCheck成功
- ✅ E2E期待値が正しく更新された

## 影響

- ✅ $ref requestBody の kind が正しく "ref" になる
- ✅ inline requestBody の kind が正しく "content" になる
- ✅ IRRequestBody の型判別が正しく機能
- ✅ コード生成時に正しい参照が行われる

## 関連ファイル

### 修正対象

- `packages/core/src/transformer/transformers/transformers/operation-transformer.ts`

### 参考実装

- `packages/core/src/transformer/transformers/transformers/request-body-transformer.ts` (transformRequestBody関数)

## 関連タスク

- Task 023-4: $ref requestBody 欠落の修正（operation-traverser.ts）
- Task 023-5: Request/Response metadata loss

## 学び

- 3層アーキテクチャ（Dispatcher → Traverser → Transformer）では、既存のTransformer関数を活用すべき
- operation.requestBody の型判定（ReferenceObject | RequestBodyObject）は transformRequestBody() に委譲
- 型キャストは `as unknown as TargetType` を使用（ESLintエラー回避）
