# Task 023-2: Property/Parameterメタデータ欠落の修正

**Status**: ✅ 完了
**Priority**: Critical（必須仕様の後退）
**Created**: 2025-10-31
**Completed**: 2025-10-31
**Commit**: 18316b8
**Parent Task**: Task 023 (Visitor Architecture Refactoring)

## 概要

Task 023の3層アーキテクチャリファクタリング時に、Object propertiesとParametersから重要なメタデータが欠落しました。これは必須仕様の後退であり、TypeScript/Dartの生成コードでバリデーション、x-拡張、readOnly/writeOnly処理が機能しなくなります。

## 欠落しているメタデータ

### Object Properties (IRProperty)

- `defaultValue` - デフォルト値
- `deprecated` - 非推奨フラグ
- `readOnly` - レスポンス専用フラグ
- `writeOnly` - リクエスト専用フラグ
- `validation` - min/max/pattern等のバリデーション制約
- `extensions` - x-拡張フィールド
- `description` - プロパティの説明

### Parameters (IRParameter)

- `defaultValue` - デフォルト値
- `deprecated` - 非推奨フラグ
- `description` - パラメータの説明
- `validation` - min/max/pattern等のバリデーション制約
- `extensions` - x-拡張フィールド

## 原因箇所

### 1. object-traverser.ts:100-104

プロパティ情報を再構築する際にメタデータを捨てている：

```typescript
visitedProperties.push({
  name: propName,
  type: result.type,
  ...(requiredSet.has(propName) && { required: true }),
  ...(nullable && { nullable: true }),
  // ❌ defaultValue, deprecated, readOnly, writeOnly, validation, extensions, description が欠落
});
```

### 2. object-transformer.ts:33-44

IRPropertyへの変換時に同様の欠落

### 3. parameters-traverser.ts:79-90

ParametersTraversalResultでメタデータを保持していない

### 4. parameter-aggregator.ts / operation-transformer.ts:53

統合パラメータモデル・エンドポイント直下のparametersでメタデータが失われる

## 旧実装との比較

### Object Properties

旧実装 (dcffa7a:object-visitor.ts:157-173) では完全に設定：

```typescript
const property: IRProperty = {
  name: propName,
  type: propResult.type,
  ...(required.includes(propName) && { required: true }),
  ...(schemaObj.description && { description: schemaObj.description }),
  ...(isNullable(schemaObj) && { nullable: true }),
  ...(schemaObj.default !== undefined && { defaultValue: schemaObj.default }),
  ...(schemaObj.deprecated === true && { deprecated: true }),
  ...(schemaObj.readOnly === true && { readOnly: true }),
  ...(schemaObj.writeOnly === true && { writeOnly: true }),
  ...(validation && { validation }),
  ...(extensions && { extensions }),
};
```

### Parameters

旧実装 (dcffa7a:parameter-visitor.ts:138-148) では完全に設定：

```typescript
const irParameter: IRParameter = {
  name: parameter.name,
  in: parameterIn,
  type,
  ...(parameter.required && { required: true }),
  ...(parameter.description && { description: parameter.description }),
  ...(isNullable(schema) && { nullable: true }),
  ...(schema.default !== undefined && { defaultValue: schema.default }),
  ...(parameter.deprecated && { deprecated: parameter.deprecated }),
  ...(validation && { validation }),
  ...(extensions && { extensions }),
};
```

## 影響範囲

- ❌ **TypeScript生成**: バリデーションが生成されない
- ❌ **Dart生成**: バリデーションが生成されない
- ❌ **x-拡張**: カスタマイズ情報が失われる
- ❌ **readOnly/writeOnly**: 適切なシリアライゼーションができない
- ❌ **deprecated**: 警告表示できない
- ❌ **defaultValue**: デフォルト値が失われる

## 実装方針

### Phase 1: 回帰テスト追加（テストファースト）

1. validation/extensionsを含むE2Eフィクスチャを作成
2. 期待値JSONにメタデータフィールドを追加
3. テスト実行（現状では失敗）

### Phase 2: Object Properties修正

1. `object-traverser.ts` - SchemaObjectから全メタデータを抽出
2. `object-transformer.ts` - PropertyTraversalResultからIRPropertyへ設定
3. PropertyTraversalResult型定義更新
4. In-sourceテスト追加

### Phase 3: Parameters修正

1. `parameters-traverser.ts` - ParameterObjectから全メタデータを抽出
2. `parameter-aggregator.ts` - 統合モデル生成時に保持
3. `operation-transformer.ts` - IRParameterへの変換時に保持
4. ParametersTraversalResult型定義更新
5. In-sourceテスト追加

### Phase 4: 検証

1. 全テスト実行
2. E2E期待値の更新
3. xcgen-tsでのバリデーション動作確認

## 実装チェックリスト

### Phase 1: 回帰テスト追加

- [ ] E2Eフィクスチャ作成: metadata/validation-metadata.yaml
- [ ] 期待値JSON生成
- [ ] xcgen-ts期待値生成
- [ ] テスト追加と実行（失敗確認）

### Phase 2: Object Properties修正

- [ ] object-traverser.ts修正
  - [ ] description抽出
  - [ ] defaultValue抽出
  - [ ] deprecated抽出
  - [ ] readOnly抽出
  - [ ] writeOnly抽出
  - [ ] validation抽出 (extractValidation使用)
  - [ ] extensions抽出 (extractExtensions使用)
- [ ] object-transformer.ts修正
- [ ] PropertyTraversalResult型定義更新
- [ ] In-sourceテスト追加（7項目）
- [ ] 全テスト実行

### Phase 3: Parameters修正

- [ ] parameters-traverser.ts修正
  - [ ] description抽出
  - [ ] defaultValue抽出
  - [ ] deprecated抽出
  - [ ] validation抽出
  - [ ] extensions抽出（parameter + schema両方）
- [ ] parameter-aggregator.ts修正（統合モデル生成）
- [ ] operation-transformer.ts修正（convertToIRParameter）
- [ ] ParametersTraversalResult型定義更新
- [ ] In-sourceテスト追加（5項目）
- [ ] 全テスト実行

### Phase 4: 検証

- [ ] E2E期待値更新
- [ ] xcgen-tsバリデーション確認
- [ ] コミット

## 関連ファイル

### 修正対象

- `packages/core/src/transformer/transformers/traversers/object-traverser.ts`
- `packages/core/src/transformer/transformers/transformers/object-transformer.ts`
- `packages/core/src/transformer/transformers/traversers/parameters-traverser.ts`
- `packages/core/src/transformer/transformers/aggregators/parameter-aggregator.ts`
- `packages/core/src/transformer/transformers/transformers/operation-transformer.ts`
- `packages/core/src/transformer/transformers/types.ts` (型定義)

### テスト対象

- `packages/core/tests/e2e/fixtures/metadata/validation-metadata.yaml` (新規)
- その他E2E期待値ファイル

### 参考実装

- `dcffa7a:packages/core/src/transformer/visitors/schema/object-visitor.ts` (旧実装)
- `dcffa7a:packages/core/src/transformer/visitors/operations/parameter-visitor.ts` (旧実装)

## 進捗状況

| Phase | ステータス | 完了日 | コミット |
|-------|-----------|--------|----------|
| Phase 1: 回帰テスト追加 | ✅ 完了 | 2025-10-31 | 18316b8 |
| Phase 2: Object Properties修正 | ✅ 完了 | 2025-10-31 | 18316b8 |
| Phase 3: Parameters修正 | ✅ 完了 | 2025-10-31 | 18316b8 |
| Phase 4: 検証 | ✅ 完了 | 2025-10-31 | 18316b8 |

## 実装結果

### 修正内容

1. **型定義更新** (`types.ts`)
   - PropertyTraversalResult: validation, extensions, defaultValue, deprecated, readOnly, writeOnly追加
   - ParametersTraversalResult: validation, extensions追加

2. **Traverser修正** (メタデータ抽出)
   - object-traverser.ts: extractValidation/extractExtensionsでプロパティメタデータ抽出
   - parameters-traverser.ts: transformParameter結果からvalidation/extensions保持

3. **Transformer修正** (IRへの設定)
   - object-transformer.ts: PropertyTraversalResult → IRPropertyへメタデータマッピング
   - operation-transformer.ts: convertToIRParameterでvalidation/extensions保持

4. **テスト追加**
   - object-traverser.ts: メタデータ抽出の7テストケース
   - parameters-traverser.ts: メタデータ保持の5テストケース
   - E2Eフィクスチャ: validation-metadata.yaml

5. **E2E期待値更新**
   - 全E2Eテストの期待値を再生成（validation.format, defaultValue等が正しく含まれる）

### テスト結果

- ✅ 全526テストが成功
- ✅ Lint/TypeCheck成功
- ✅ E2E期待値が正しく更新された

### 影響

- ✅ TypeScript/Dart生成時のvalidation制約が機能
- ✅ x-extensionsがコード生成に反映
- ✅ readOnly/writeOnlyプロパティが正しく処理
- ✅ deprecated/defaultValueが保持
