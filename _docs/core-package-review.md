# Core Package Review

## 未実装項目

- `components.responses` など一部のcomponentsセクションが未対応です。
- discriminatorを使用したoneOf/allOf/anyOfパターンが未サポートで、3つのE2Eテスト（discriminator-one-of.yaml、discriminator-all-of.yaml、discriminator-any-of.yaml）が失敗します。CLAUDE.mdの制限事項にも明記済み。

## 挙動上のリスク

- transformer がバージョン/Info 欠如時に例外を投げ、ガイドラインの「例外を投げない」に反しています（`packages/core/src/transformer/transformer.ts:51`）。
- コンポーネント名生成ヘルパーが必須引数欠如時に例外を送出し、visitor 連鎖を途切れさせます（`packages/core/src/transformer/helpers/generate-component-name.ts:104`）。

## 改善余地

- レスポンスヘッダーが IR へ取り込まれておらず、`visitResponse` で完全に無視されています（`packages/core/src/transformer/visitors/operations/response-visitor.ts:174`）。`IRResponse`と`IRResponseHeader`インターフェースは定義済み（`packages/core/src/types/ir/endpoints/response.ts:99,34`）なので、実装のみが必要です。
- パラメータのバリデーション情報が`IRParameter`に含まれていません。`IRParameter`インターフェースに`validation?: IRValidation`フィールドが未定義（`packages/core/src/types/ir/endpoints/parameter.ts:33-49`）。`extractValidation`ヘルパー関数は実装済み（`packages/core/src/transformer/helpers/extract-validation.ts:37`）だが、`parameter-visitor.ts`で未使用。
- パラメータ統合モデルへバリデーション情報が渡らず `parameterToParameterProperty` で `validation` を無視しています（`packages/core/src/transformer/helpers/create-parameter-model.ts:147`）。
- `extractValidation` が OpenAPI 3.1 の数値指定形式（`exclusiveMinimum` / `exclusiveMaximum` に数値を取るケース）をカバーしていません（`packages/core/src/transformer/helpers/extract-validation.ts:62`）。

## 詳細な実装計画

### エラー処理の方針

以下の箇所は**現状維持**とする（例外を投げるのが適切）:

- `transformer.ts:51,56` - OpenAPIバージョン/info欠如時の例外
- `generate-component-name.ts:104,116` - 必須引数欠如時の例外

理由：エントリーポイントでの必須要件チェックは処理の前提条件であり、満たされない場合は異常終了すべき。
「例外を投げない」原則は**Visitor関数内**での部分的な処理失敗に対する指針。

### 1. Parameterの$ref参照の処理（優先度: 高）

#### 1-1. 問題詳細

Parameterレベルでの$ref参照が解決されず、再利用可能な定義が活用できない。

#### 1-2. 修正箇所

- `parameters-visitor.ts:117-119` - Parameterの$ref警告とスキップ

#### 1-3. 実装方法

schema-level（`visitRef`）での処理に依存する現在の方式を継続、またはParameterレベルでの解決を実装。

### 2. パラメータバリデーション情報のIR反映（優先度: 中）

#### 2-1. 問題詳細

バリデーション情報が失われ、クライアントコードで検証ロジックを生成できない。

#### 2-2. 修正箇所

- `packages/core/src/types/ir/endpoints/parameter.ts` - `IRParameter`インターフェースに`validation?: IRValidation`を追加
- `parameter-visitor.ts` - `extractValidation`をインポートして使用
- `create-parameter-model.ts:147` - validation情報の渡し忘れ修正
- `extract-validation.ts:62-66` - OpenAPI 3.1形式の未対応

#### 2-3. 実装方法

```typescript
// IRParameterインターフェースに追加
export interface IRParameter {
  // 既存のフィールド
  validation?: IRValidation;
}

// parameter-visitor.tsで
import { extractValidation } from "../../helpers";

const validation = extractValidation(schema);
const irParameter: IRParameter = {
  // 既存のフィールド
  ...(validation && { validation }),
};

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

- `response-visitor.ts:174` - ヘッダー処理のスキップ箇所

#### 3-3. 実装方法

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

1. Parameterの$ref参照の処理（再利用性の向上）
2. パラメータバリデーション情報（クライアント側検証）
3. レスポンスヘッダー対応（追加情報の取り込み）

## 完了済みタスク

### 2024年実装

- **PathItem共通parameters継承**: PathItemレベルのparametersをOperationに継承し、同一name+inの場合はOperationレベルが優先される仕組みを実装（`parameters-visitor.ts:44-69`）
- **RequestBody/Responseの$ref簡略化**: $ref参照を解決せず、ResponseObject/RequestBodyObjectとして扱うように変更。schema-level（`visitRef`）での処理に委譲（`response-visitor.ts:79`、`request-body-visitor.ts:77`）

### 2025年実装

- **Security対応**: Operation/PathレベルのsecurityとcomponentsのsecuritySchemesを完全対応。APIKey、HTTP(Basic/Bearer)、OAuth2、OpenID Connectの全認証タイプをサポート（`operation-visitor.ts:150-176`、`security-schemes-visitor.ts`、`components-visitor.ts:62-67`）
- **グローバルセキュリティ対応**: OpenAPI仕様書のルートレベル`security`をIRの`globalSecurity`フィールドに変換する機能を実装。全エンドポイントのデフォルト認証要件をサポート（`transformer.ts:126-138`、`types/ir/index.ts:30`）
