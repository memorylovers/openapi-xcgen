# Core Package Review

## 未実装項目

- Operation/Path レベルの `security` を解析する visitor がなく `visitOperation` でも未対応が明示されています（`packages/core/src/transformer/visitors/operations/operation-visitor.ts:159`）。
- `$ref` を含む RequestBody/Response/Parameter をすべて警告してスキップしており、コンポーネント参照の再利用ができません（`packages/core/src/transformer/visitors/operations/request-body-visitor.ts:76`、`packages/core/src/transformer/visitors/operations/response-visitor.ts:79`、`packages/core/src/transformer/visitors/operations/parameters-visitor.ts:76`）。
- `visitComponents` が `components.schemas` のみ処理し、`components.securitySchemes` や `components.responses` など他セクションが未対応です（`packages/core/src/transformer/visitors/components/components-visitor.ts:57`）。

## 挙動上のリスク

- transformer がバージョン/Info 欠如時に例外を投げ、ガイドラインの「例外を投げない」に反しています（`packages/core/src/transformer/transformer.ts:51`）。
- コンポーネント名生成ヘルパーが必須引数欠如時に例外を送出し、visitor 連鎖を途切れさせます（`packages/core/src/transformer/helpers/generate-component-name.ts:104`）。

## 改善余地

- レスポンスヘッダーが IR へ取り込まれておらず、`visitResponse` で完全に無視されています（`packages/core/src/transformer/visitors/operations/response-visitor.ts:177`）。
- パラメータ統合モデルへバリデーション情報が渡らず `parameterToParameterProperty` で `validation` を無視しています（`packages/core/src/transformer/helpers/create-parameter-model.ts:147`）。
- `extractValidation` が OpenAPI 3.1 の数値指定形式（`exclusiveMinimum` / `exclusiveMaximum` に数値を取るケース）をカバーしていません（`packages/core/src/transformer/helpers/extract-validation.ts:62`）。

## 詳細な実装計画

### エラー処理の方針

以下の箇所は**現状維持**とする（例外を投げるのが適切）:

- `transformer.ts:51,56` - OpenAPIバージョン/info欠如時の例外
- `generate-component-name.ts:104,116` - 必須引数欠如時の例外

理由：エントリーポイントでの必須要件チェックは処理の前提条件であり、満たされない場合は異常終了すべき。
「例外を投げない」原則は**Visitor関数内**での部分的な処理失敗に対する指針。

### 1. $ref参照の処理（優先度: 高）

#### 1-1. 問題詳細

コンポーネントへの参照が解決されず、再利用可能な定義が活用できない。

#### 1-2. 修正箇所

- `request-body-visitor.ts:76-81` - RequestBodyの$ref
- `response-visitor.ts:79` - Responseの$ref
- `parameters-visitor.ts:76` - Parameterの$ref

#### 1-3. 実装方法

```typescript
if (isReferenceObject(requestBody)) {
  const refName = extractRefName(requestBody.$ref);
  const resolved = context.document.components?.requestBodies?.[refName];
  if (!resolved) {
    consola.warn(`Cannot resolve reference: ${requestBody.$ref}`);
    return null;
  }
  // 解決したオブジェクトで通常処理を継続
  requestBody = resolved as RequestBodyObject;
}
```

### 2. パラメータバリデーション情報のIR反映（優先度: 中）

#### 2-1. 問題詳細

バリデーション情報が失われ、クライアントコードで検証ロジックを生成できない。

#### 2-2. 修正箇所

- `create-parameter-model.ts:158` - validation情報の無視
- `extract-validation.ts:62-66` - OpenAPI 3.1形式の未対応

#### 2-3. 実装方法

```typescript
// OpenAPI 3.1形式対応
if (typeof schema.exclusiveMinimum === 'number') {
  validation.minimum = schema.exclusiveMinimum;
  validation.exclusiveMinimum = true;
}
```

### 3. レスポンスヘッダーのIR取り込み（優先度: 低）

#### 3-1. 問題詳細

Rate-Limit情報などの重要なヘッダー情報がIRに含まれない。

#### 3-2. 実装箇所

- `response-visitor.ts:177` - ヘッダー処理のスキップ箇所

#### 3-3. 実装方法

1. `IRResponse`型に`headers`フィールドを追加
2. `HeadersObject`の各エントリーを処理
3. ヘッダーごとにスキーマ情報を保持

## テスト方針

各修正に対してTDDサイクルを適用：

1. **Red**: 失敗するテストを先に書く
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コード品質を改善

In-sourceテストを使用し、各visitorファイル内で単体テストを実装。

## 実装順序

1. $ref参照の処理（再利用性の向上）
2. パラメータバリデーション情報（クライアント側検証）
3. レスポンスヘッダー対応（追加情報の取り込み）
