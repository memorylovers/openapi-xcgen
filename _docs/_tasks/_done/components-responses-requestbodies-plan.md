# components.responses/requestBodies 実装計画

## 概要

OpenAPI 3.0/3.1の`components.responses`および`components.requestBodies`のサポートを実装し、共通のレスポンス/リクエストボディ定義の再利用を可能にする。

## 背景

- **現状**: 警告を出してスキップ
- **影響**: 3つのe2eテストファイルで実際に使用されている
- **優先度**: 中〜高（実際の使用例があり、DRY原則に基づく重要な機能）

## 現状分析

### ✅ 既存実装（活用可能）

- `response-visitor.ts`: $ref参照の処理パターン実装済み
- `IRResponse`: `ref?: IRRef`フィールド定義済み
- `visitSchema`: スキーマ処理のロジック実装済み

### ❌ 未実装・要修正

- `IRRequestBody`: `ref`フィールド未定義
- `request-body-visitor.ts`: $ref処理にバグ
- `XcgenIR`: 共通定義フィールド未定義
- componentsレベルの処理: 未実装

## 実装計画

### Phase 1: 型定義の拡張

#### 1-1. IRRequestBodyの拡張

**ファイル**: `packages/core/src/types/ir/endpoints/request.ts`

```typescript
export interface IRRequestBody {
  description?: string;
  required?: true;
  content: IRRequestContent[];
  ref?: IRRef;  // 追加
  referencePath?: string;  // 追加（オプション）
}
```

#### 1-2. XcgenIRの拡張

**ファイル**: `packages/core/src/types/ir/index.ts`

```typescript
export interface XcgenIR {
  // 既存フィールド...
  commonResponses?: Record<string, IRResponse>;
  commonRequestBodies?: Record<string, IRRequestBody>;
}
```

### Phase 2: Components Visitorの実装

#### 2-1. responses-components-visitor.ts

**新規ファイル**: `packages/core/src/transformer/visitors/components/responses-components-visitor.ts`

```typescript
export function visitComponentsResponses(
  responses: Record<string, ResponseObject | ReferenceObject>
): Record<string, IRResponse> {
  // 各レスポンス定義を処理
  // visitResponseを活用
}
```

#### 2-2. requestBodies-components-visitor.ts

**新規ファイル**: `packages/core/src/transformer/visitors/components/requestBodies-components-visitor.ts`

```typescript
export function visitComponentsRequestBodies(
  requestBodies: Record<string, RequestBodyObject | ReferenceObject>
): Record<string, IRRequestBody> {
  // 各リクエストボディ定義を処理
  // visitRequestBodyを活用
}
```

#### 2-3. components-visitor.tsの更新

```typescript
export interface ComponentsResult {
  models: IRModel[];
  securitySchemes?: Record<string, IRSecurityScheme>;
  responses?: Record<string, IRResponse>;  // 追加
  requestBodies?: Record<string, IRRequestBody>;  // 追加
}
```

### Phase 3: $ref処理の修正

#### 3-1. request-body-visitor.tsの修正

```typescript
export function visitRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  // ...
): RequestBodyResult | null {
  // ReferenceObjectの場合の処理を追加
  if (isReferenceObject(requestBody)) {
    const ref: IRRef = {
      kind: "ref",
      name: requestBody.$ref,
    };

    const irRequestBody: IRRequestBody = {
      content: [],
      ref,
      referencePath: requestBody.$ref,
    };

    return { requestBody: irRequestBody, models: [] };
  }
  // 既存のRequestBodyObject処理...
}
```

### Phase 4: 統合

#### 4-1. transformer.tsの更新

```typescript
// 警告を削除
// components処理結果をXcgenIRに追加
if (componentsResult.responses) {
  result.commonResponses = componentsResult.responses;
}
if (componentsResult.requestBodies) {
  result.commonRequestBodies = componentsResult.requestBodies;
}
```

## テスト計画

### 単体テスト（in-source）

- 各visitor関数のテストケースを追加
- $ref処理のテスト
- 空オブジェクト処理のテスト

### e2eテスト

- `train-travel-api.yaml`: components.responsesのテスト
- `museum-api.yaml`: components.responsesのテスト
- `openapi-generator/petstore.yaml`: components.requestBodiesのテスト

## 期待される成果

1. **警告の解消**: "not supported yet"警告が消える
2. **$ref参照の保持**: `#/components/responses/BadRequest`等が適切に保持
3. **再利用性向上**: 共通定義の一元管理
4. **将来の拡張性**: ジェネレーター側での参照解決基盤

## 実装順序

1. 型定義の拡張（IRRequestBody, XcgenIR）
2. responses-components-visitor.tsの実装
3. requestBodies-components-visitor.tsの実装
4. components-visitor.tsの更新
5. request-body-visitor.tsの$ref処理修正
6. transformer.tsの統合
7. テストの追加・確認

## 見積もり工数

- 実装: 2-3時間
- テスト: 1時間
- 合計: 3-4時間
