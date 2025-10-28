# Task 024: バレルファイル（index.ts）の軽量化

## 概要

packages/core に存在する21個のバレルファイル（index.ts）のうち、冗長な14個を削除してTree-shakingの効率を向上させる。

**更新**: Task 022.5でhelpers配下に2個のバレルファイルが追加されたため、削除対象を12個→14個に更新。

## 背景

現状、packages/core には多数のバレルファイルが存在し、以下の問題がある：

- 薄いバレルファイル（1-2個の型/関数のみをexport）が12個存在
- メンテナンスコストの増加（新規ファイル追加時に複数箇所の更新が必要）
- Tree-shakingの効率低下
- CLAUDE.mdの「Tree-shaking対応」原則に反する

**⚠️ Task 022.5の影響**:
Task 022.5でhelpers配下に2個のバレルファイルが追加されました：

- `src/transformer/helpers/naming/index.ts`
- `src/transformer/helpers/path/index.ts`

これらもTree-shaking効率化のため削除対象とし、`helpers/index.ts`から直接エクスポートします。

## 目標

**21個 → 7個に削減**（14個削除）

- 当初: 19個
- Task 022.5で追加: +2個
- 削除対象: 14個（当初12個 + 追加2個）

### 削除対象（14個）

#### transformer/helpers/ 配下（2個） ← **Task 022.5で追加**

1. `src/transformer/helpers/naming/index.ts` - 10ファイルの再エクスポートのみ
2. `src/transformer/helpers/path/index.ts` - 4ファイルの再エクスポートのみ

#### types/ir/ 配下（7個）

1. `src/types/ir/common/index.ts` - 3ファイルの再エクスポートのみ
2. `src/types/ir/endpoints/index.ts` - 4ファイルの再エクスポートのみ
3. `src/types/ir/models/index.ts` - 3ファイルの再エクスポートのみ
4. `src/types/ir/security/index.ts` - 2ファイルの再エクスポートのみ
5. `src/types/ir/tags/index.ts` - たった1つのinterface定義のみ
6. `src/types/ir/metadata/index.ts` - たった1つのinterface定義のみ
7. `src/types/ir/servers/index.ts` - 2つのinterface定義のみ

#### transformer/visitors/ 配下（5個）

8. `src/transformer/visitors/schema/index.ts`
9. `src/transformer/visitors/components/index.ts` - たった1つの関数のみ
10. `src/transformer/visitors/operations/index.ts`
11. `src/transformer/visitors/paths/index.ts` - 2つの関数のみ
12. `src/transformer/visitors/metadata/index.ts` - 2つの関数のみ

### 残すファイル（7個）

必須のエントリーポイントのみ：

1. `src/index.ts` - パッケージのメインエントリー
2. `src/types/index.ts` - OpenAPI型とIR型の公開API
3. `src/types/ir/index.ts` - IR型の集約（ここで直接ファイルからexport）
4. `src/parser/index.ts` - パーサーモジュール
5. `src/transformer/index.ts` - transformerモジュール
6. `src/transformer/visitors/index.ts` - visitorsの集約（ここで直接ファイルからexport）
7. `src/transformer/helpers/index.ts` - helpersの集約

## 実装手順

### 0. transformer/helpers/ 配下の削除と修正 ← **Task 022.5対応**

#### 0-1. バレルファイルの削除（2個）

```bash
rm src/transformer/helpers/naming/index.ts
rm src/transformer/helpers/path/index.ts
```

#### 0-2. transformer/helpers/index.ts の修正

削除前のimport:

```typescript
// Re-export from naming subdirectory
export * from "./naming";

// Re-export from path subdirectory
export * from "./path";
```

修正後（直接ファイルからimport）:

```typescript
// Re-export from naming subdirectory (直接ファイルから)
export { buildAdditionalPropertiesModelName } from "./naming/build-additional-properties-model-name";
export { buildInlineModelName } from "./naming/build-inline-model-name";
export { buildParameterModelName } from "./naming/build-parameter-model-name";
export { buildParameterSchemaModelName } from "./naming/build-parameter-schema-model-name";
export { buildRequestBodyModelName } from "./naming/build-request-body-model-name";
export { buildResponseModelName } from "./naming/build-response-model-name";
export { generateEnumName } from "./naming/generate-enum-name";
export { getModelName } from "./naming/get-model-name";
export { getMediaTypeSuffix } from "./naming/media-type-suffix";
export { pathToComponentBase } from "./naming/path-to-component-base";

// Re-export from path subdirectory (直接ファイルから)
export { buildComponentSchemaPath } from "./path/build-component-schema-path";
export { buildInlineSchemaPath } from "./path/build-inline-schema-path";
export { buildReferencePath } from "./path/build-reference-path";
export { parseCompositionPath } from "./path/parse-document-path";
export { parseParameterPath } from "./path/parse-document-path";
export { parseResponsePath } from "./path/parse-document-path";
export { parseRequestBodyPath } from "./path/parse-document-path";
export { parseAdditionalPropertiesPath } from "./path/parse-document-path";
export { parseSchemaPath } from "./path/parse-document-path";
```

### 1. types/ir/ 配下の削除と修正

#### 1-1. バレルファイルの削除（7個）

```bash
rm src/types/ir/common/index.ts
rm src/types/ir/endpoints/index.ts
rm src/types/ir/models/index.ts
rm src/types/ir/security/index.ts
rm src/types/ir/tags/index.ts
rm src/types/ir/metadata/index.ts
rm src/types/ir/servers/index.ts
```

#### 1-2. types/ir/index.ts の修正

削除前のimport:

```typescript
export type { IRExtensions, IRExtensionValue, IRRef, IRScalarType, IRType, MimeType } from "./common";
export type { IRMetadata } from "./metadata";
```

修正後（直接ファイルからimport）:

```typescript
// common
export type { IRExtensions, IRExtensionValue } from "./common/extensions";
export type { MimeType } from "./common/mime-type";
export type { IRRef, IRScalarType, IRType } from "./common/type";

// metadata (inline定義なのでそのまま残す)
export type { IRMetadata } from "./metadata";

// models
export type {
  IRAllOfModel,
  IRAnyOfModel,
  IRArrayModel,
  IRDiscriminator,
  IREnumModel,
  IREnumValue,
  IRMapModel,
  IRObjectModel,
  IRUnionModel,
} from "./models/base";
export type {
  IRModel,
  IRParameterModel,
  IRRequestBodyModel,
  IRResponseModel,
} from "./models/operation";
export type { IRParameterProperty, IRProperty } from "./models/property";
export type { IRValidation } from "./models/validation";

// tags (inline定義なのでそのまま残す)
export type { IRTag, IRTagExternalDocs } from "./tags";

// endpoints
export { isIRRequestBodyWithContent } from "./endpoints/request";
export type { IREndpoint, IRHttpMethod } from "./endpoints/endpoint";
export type { IRParameter, IRParameterInType } from "./endpoints/parameter";
export type {
  IRRequestBody,
  IRRequestBodyWithContent,
  IRRequestBodyWithRef,
  IRRequestContent,
} from "./endpoints/request";
export type {
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
} from "./endpoints/response";

// security
export type {
  IRApiKeySecurityScheme,
  IRHttpSecurityScheme,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
  IROpenIdConnectSecurityScheme,
  IRSecurityRequirement,
  IRSecurityScheme,
} from "./security/security-scheme";
export type { IRSecurityRequirement } from "./security/security-requirement";

// servers (inline定義なのでそのまま残す)
export type { IRServer, IRServerVariable } from "./servers";
```

### 2. transformer/visitors/ 配下の削除と修正

#### 2-1. バレルファイルの削除（5個）

```bash
rm src/transformer/visitors/schema/index.ts
rm src/transformer/visitors/components/index.ts
rm src/transformer/visitors/operations/index.ts
rm src/transformer/visitors/paths/index.ts
rm src/transformer/visitors/metadata/index.ts
```

#### 2-2. transformer/visitors/index.ts の修正

削除前のimport:

```typescript
export { visitSchema, visitType, visitEnum, visitObject, /* ... */ } from "./schema";
export { visitComponents, type ComponentsResult } from "./components";
```

修正後（直接ファイルからimport）:

```typescript
// Schema visitors
export { visitSchema, type SchemaVisitorResult } from "./schema/schema-visitor";
export { visitType } from "./schema/type-visitor";
export { visitEnum, type EnumVisitorResult } from "./schema/enum-visitor";
export {
  visitObject,
  visitRequestBodyObject,
  visitResponseObject,
  type ObjectVisitorResult,
} from "./schema/object-visitor";
export { visitAdditionalProperties } from "./schema/additional-properties-visitor";
export { visitArray } from "./schema/array-visitor";
export { visitMap } from "./schema/map-visitor";
export type { SchemaTransformationResult } from "../types";

// Components visitors
export { visitComponents, type ComponentsResult } from "./components/components-visitor";

// Paths visitors
export { visitPaths, type PathsResult } from "./paths/paths-visitor";
export { visitPathItem, type PathItemResult } from "./paths/path-item-visitor";

// Operations visitors
export { visitOperation, type OperationResult } from "./operations/operation-visitor";
export { visitParameter } from "./operations/parameter-visitor";
export { visitParameters, type ParametersResult } from "./operations/parameters-visitor";
export { visitRequestBody, type RequestBodyResult } from "./operations/request-body-visitor";
export { visitResponse, type ResponseResult } from "./operations/response-visitor";
export { visitResponses, type ResponsesResult } from "./operations/responses-visitor";

// Metadata visitors
export { visitMetadata } from "./metadata/metadata-visitor";
export { visitTags } from "./metadata/tags-visitor";

// Servers visitors
export { visitServers } from "./servers-visitor";
```

### 3. 検証

```bash
cd packages/core

# 型チェック
pnpm typecheck

# テスト実行
pnpm test

# Lint実行
pnpm lint

# 全チェック
pnpm check
```

## 期待される効果

### Tree-shaking効率の向上

- バレルファイルの階層が減り、バンドラーが未使用エクスポートを検出しやすくなる
- 直接ファイルからimportすることで依存関係が明確になる

### メンテナンス性の向上

- 新規ファイル追加時の更新箇所が減る（親のindex.tsのみ）
- ファイル構造がシンプルになる

### コード品質

- CLAUDE.mdの「Tree-shaking対応」原則に準拠
- 関数ベースアーキテクチャの効果を最大化

## 注意事項

### 破壊的変更なし

- パッケージの公開API（src/index.ts）は変更なし
- 外部からのインポートパスは変更なし
- 内部構造の最適化のみ

### Git履歴

- `git mv` ではなく削除のみ（index.ts自体が小さいため）
- コミットメッセージ: `refactor(core): remove redundant barrel files for better tree-shaking`

## 完了条件

- [ ] transformer/helpers/ 配下の2個のバレルファイルを削除（Task 022.5対応）
- [ ] transformer/helpers/index.ts を修正（直接ファイルからexport）
- [ ] types/ir/ 配下の7個のバレルファイルを削除
- [ ] types/ir/index.ts を修正（直接ファイルからexport）
- [ ] transformer/visitors/ 配下の5個のバレルファイルを削除
- [ ] transformer/visitors/index.ts を修正（直接ファイルからexport）
- [ ] `pnpm typecheck` が成功
- [ ] `pnpm test` が成功
- [ ] `pnpm lint` が成功
- [ ] コミット作成

## 参考

### バレルファイル削減の判断基準

削除すべきバレルファイルの条件：

1. **単一ファイルのみを再エクスポート**（メリットがない）
2. **1-3個程度の薄いエクスポート**（オーバーヘッドの方が大きい）
3. **inline定義のみ**（バレルファイルの意味がない）

残すべきバレルファイルの条件：

1. **パッケージのエントリーポイント**（src/index.ts）
2. **複数のサブモジュールを統合**（src/types/ir/index.ts など）
3. **公開APIの明確化**（transformer/index.ts など）

### Tree-shakingの仕組み

```typescript
// ❌ Bad: 深い階層のバレルファイル
// src/types/ir/index.ts
export type { IRTag } from "./tags"; // → tags/index.ts → tags.ts

// ✅ Good: 直接ファイルからexport
export type { IRTag } from "./tags/tags"; // または ./tags（inline定義の場合）
```

バンドラー（Rollup/esbuild/Webpack）は直接的な依存関係を追跡しやすくなり、未使用のコードをより効率的に削除できる。
