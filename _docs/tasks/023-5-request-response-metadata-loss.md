# Task 023-5: Request/Responseモデル内プロパティのメタデータ欠落

**Status**: ✅ 完了
**Priority**: Medium（データ品質の後退）
**Created**: 2025-10-31
**Completed**: 2025-10-31
**Parent Task**: Task 023 (Visitor Architecture Refactoring)

## 概要

Task 023の3層アーキテクチャリファクタリング時に、Request/Responseボディのモデル内プロパティから重要なメタデータが欠落する問題が発生しました。

PropertyTraversalResult にはメタデータが含まれているのに、IRProperty への変換時に一部フィールドのみを抽出してしまい、defaultValue, deprecated, readOnly, writeOnly, validation, extensions が失われていました。

## 問題箇所

### request-body-transformer.ts:154-161（修正前）

```typescript
const properties: IRProperty[] = propertyTraversalResult.properties.map(
  (prop) => ({
    name: prop.name,
    type: prop.type,
    ...(prop.required && { required: true as const }),
    ...(prop.nullable && { nullable: true as const }),
    ...(prop.description && { description: prop.description }),
    // ❌ defaultValue, deprecated, readOnly, writeOnly, validation, extensions が欠落
  }),
);
```

### response-transformer.ts:180-187（修正前）

同様の問題。

**影響**:

- Request/Responseボディのプロパティからメタデータが失われる
- バリデーション制約が生成コードに反映されない
- x-extensionsが失われる
- readOnly/writeOnly が失われる

## 正しい実装

object-transformer.ts:64-80 では完全に実装されていました：

```typescript
const properties: IRProperty[] = propertyTraversalResult.properties.map(
  (prop) => ({
    name: prop.name,
    type: prop.type,
    ...(prop.required && { required: true as const }),
    ...(prop.nullable && { nullable: true as const }),
    ...(prop.description && { description: prop.description }),
    ...(prop.defaultValue !== undefined && {
      defaultValue: prop.defaultValue,
    }),
    ...(prop.deprecated && { deprecated: true as const }),
    ...(prop.readOnly && { readOnly: true as const }),
    ...(prop.writeOnly && { writeOnly: true as const }),
    ...(prop.validation && { validation: prop.validation }),
    ...(prop.extensions && { extensions: prop.extensions }),
  }),
);
```

## 修正内容

### 1. request-body-transformer.ts修正

object-transformer.ts と同じパターンでメタデータを保持：

- defaultValue
- deprecated
- readOnly
- writeOnly
- validation
- extensions

### 2. response-transformer.ts修正

同様にすべてのメタデータを保持。

### 3. E2E期待値更新

全E2Eテストの期待値を再生成（validation.format等が正しく含まれる）

## テスト結果

- ✅ 全529テストが成功
- ✅ Lint/TypeCheck成功
- ✅ E2E期待値が正しく更新された

## 影響

- ✅ Request/Responseボディのプロパティメタデータが保持される
- ✅ バリデーション制約が正しく機能
- ✅ x-extensionsがコード生成に反映
- ✅ readOnly/writeOnlyが正しく処理

## 関連ファイル

### 修正対象

- `packages/core/src/transformer/transformers/transformers/request-body-transformer.ts`
- `packages/core/src/transformer/transformers/transformers/response-transformer.ts`

### 参考実装

- `packages/core/src/transformer/transformers/transformers/object-transformer.ts` (正しい実装)

## 関連タスク

- Task 023-2: Property/Parameter metadata loss（同様のパターン）
