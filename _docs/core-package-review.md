# Core Package Review

## 未実装項目

- `servers` / `security` は IR から取り除いたため、必要になった際に再導入する。現時点ではコード生成に不要な付帯情報として扱う。
- Operation/Path レベルの `security` を解析する visitor がなく `visitOperation` でも未対応が明示されています（`packages/core/src/transformer/visitors/operations/operation-visitor.ts:159`）。
- PathItem 共通 `parameters` が `visitPathItem` でスキップされ、各 Operation に継承されません（`packages/core/src/transformer/visitors/paths/path-item-visitor.ts:93`）。
- `$ref` を含む RequestBody/Response/Parameter をすべて警告してスキップしており、コンポーネント参照の再利用ができません（`packages/core/src/transformer/visitors/operations/request-body-visitor.ts:76`、`packages/core/src/transformer/visitors/operations/response-visitor.ts:79`、`packages/core/src/transformer/visitors/operations/parameters-visitor.ts:76`）。
- `visitComponents` が `components.schemas` のみ処理し、`components.securitySchemes` や `components.responses` など他セクションが未対応です（`packages/core/src/transformer/visitors/components/components-visitor.ts:57`）。

## 挙動上のリスク

- transformer がバージョン/Info 欠如時に例外を投げ、ガイドラインの「例外を投げない」に反しています（`packages/core/src/transformer/transformer.ts:51`）。
- コンポーネント名生成ヘルパーが必須引数欠如時に例外を送出し、visitor 連鎖を途切れさせます（`packages/core/src/transformer/helpers/generate-component-name.ts:104`）。

## 改善余地

- レスポンスヘッダーが IR へ取り込まれておらず、`visitResponse` で完全に無視されています（`packages/core/src/transformer/visitors/operations/response-visitor.ts:177`）。
- パラメータ統合モデルへバリデーション情報が渡らず `parameterToParameterProperty` で `validation` を無視しています（`packages/core/src/transformer/helpers/create-parameter-model.ts:147`）。
- `extractValidation` が OpenAPI 3.1 の数値指定形式（`exclusiveMinimum` / `exclusiveMaximum` に数値を取るケース）をカバーしていません（`packages/core/src/transformer/helpers/extract-validation.ts:62`）。

## 次のアクション候補

1. PathItem 共通パラメータと `$ref` 参照を処理できるよう各 visitor を拡張する。
2. エラー処理を `consola.warn` + null 返却へ統一し、レスポンスヘッダーやバリデーションなど欠落情報を IR に反映する。
