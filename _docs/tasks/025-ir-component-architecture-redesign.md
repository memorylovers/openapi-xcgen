# Task 025: IRComponent設計の見直し

## 概要

IRModel（現在の中間表現のモデル定義）における概念の混在問題を解決し、言語非依存なIR設計を実現するための設計見直しタスクです。

**問題提起**:

- IRModelには「型系」（object/enum/array/map/allOf/anyOf/union）と「コンテキスト系」（parameter/requestBody/response）が混在している
- この混在により、概念が不明瞭で学習コストが高い
- TypeScript中心的な思考（inline型許容）がDart対応を困難にする可能性

**結論**:

- 全て名前付きComponent化（現状のモデルB設計）が正解
- IRModel → IRComponent にリネーム
- IRComponent = IRSchema | IROperationComponent に構造分離
- inline化判断は生成器（xcgen-ts/xcgen-dart）の責任

---

## 現状分析

### IRModelの構成（10種類）

#### Type系（スキーマ型）7種類

OpenAPIのスキーマ型を表現:

- `IRObjectModel` - object型スキーマ
- `IREnumModel` - enum型スキーマ
- `IRArrayModel` - array型スキーマ
- `IRMapModel` - map型スキーマ（additionalProperties）
- `IRAllOfModel` - allOf合成（継承・インターセクション）
- `IRAnyOfModel` - anyOf合成（包含的Union）
- `IRUnionModel` - oneOf合成（排他的Union）

#### Context系（操作コンテキスト）3種類

paths配下の操作固有要素を表現:

- `IRParameterModel` - パラメータ統合モデル
- `IRRequestBodyModel` - リクエストボディモデル
- `IRResponseModel` - レスポンスモデル

### コード生成時の処理

現在のxcgen-tsでは、`object`/`requestBody`/`response`を同じ処理にフォールスルー:

```typescript
// packages/xcgen-ts/src/generators/types/types-model.ts:40-44
switch (model.kind) {
  case "object":
  case "requestBody":
  case "response":
    return generateObjectType(model, hooks);
```

**理由**: requestBody/responseは構造的にobjectと同じ（`properties: IRProperty[]`を持つ）

### IRType統一の経緯

commit `6d75172` にて、IRTypeからIRArray/IRMapを削除し、全てモデル化する方針に統一:

```typescript
// Before
type IRType = IRScalarType | IRComponentRef | IRArray | IRMap;

// After (現状)
type IRType = IRScalarType | IRComponentRef;
```

**設計意図**:

- 複雑な型構造を全て「名前付きモデル」として抽出
- IRTypeは参照のみ（primitive or ref）
- コード生成の単純化

---

## 設計の比較評価

### モデルA: Type優先設計（inline型許容）

```typescript
/**
 * IRType: 型表現の主役
 * インライン型定義を許可
 */
type IRType =
  | IRScalarType
  | IRComponentRef
  | IRInlineArray          // inline許可
  | IRInlineMap
  | IRInlineObject;

/**
 * IRComponent: 名前付き型定義
 */
interface IRComponent {
  name: string;
  type: IRType;  // ← Typeを含む
}
```

**メリット**:

- TypeScriptの型システムと対応しやすい（`type User = { ... }`）
- 柔軟性が高い（必要に応じてinline vs named を選択可能）

**デメリット**:

- IRTypeが複雑になる（再帰的構造）
- Dart生成時に名前が必要だが情報がない
- 「いつinlineにするか」の判断が必要

### モデルB: Component優先設計（Phase 1後の姿）

```typescript
/**
 * IRType: シンプルな型参照
 */
type IRType = IRScalarType | IRComponentRef;

/**
 * IRComponent: 全ての型定義を統合
 */
type IRComponent =
  | IRObjectSchema        // Schema系
  | IRArraySchema         // 全て名前付き
  | IRMapSchema           // 全て名前付き
  | IREnumSchema
  | IRUnionSchema
  | IRAllOfSchema
  | IRAnyOfSchema
  | IRParameterComponent  // OperationComponent系
  | IRRequestBodyComponent
  | IRResponseComponent;
```

**メリット**:

- コード生成が単純（全て「名前付き定義」として出力）
- 循環参照の解決が容易
- 型の再利用性が最大化
- **Dart対応が可能**

**デメリット**:

- 単純な配列（`string[]`）も独立定義になる
- モデル数が増加し、出力ファイルが肥大化する可能性
- 「名前の生成」ロジックが複雑化

### モデルC: 2層分離設計（採用案）

```typescript
/**
 * IRType: 型参照
 */
type IRType = IRScalarType | IRComponentRef;

/**
 * IRSchema: スキーマ定義（型の実体）
 */
type IRSchema =
  | IRObjectSchema
  | IRArraySchema
  | IRMapSchema
  | IREnumSchema
  | IRUnionSchema
  | IRAllOfSchema
  | IRAnyOfSchema;

/**
 * IROperationComponent: 操作コンテキスト
 */
type IROperationComponent =
  | IRParameterComponent
  | IRRequestBodyComponent
  | IRResponseComponent;

/**
 * IRComponent: 統合
 */
type IRComponent = IRSchema | IROperationComponent;
```

**メリット**:

- 概念が明確（Schema = 型定義、OperationComponent = 操作コンテキスト）
- 現状のIRType設計を維持（変更最小）
- 将来の拡張性が高い（新しいOperation要素を追加しやすい）

**デメリット**:

- 3つの概念（Type, Schema, OperationComponent）の理解が必要
- 型階層が1段増える

---

## Dartの制約と言語非依存性

### Dartでの型定義の制約

```dart
// ❌ Dartでは複雑なインライン型が制限される
class User {
  List<String> tags;  // ← これはOK（プリミティブ配列）

  // ❌ 複雑なインライン型は定義できない
  // Map<String, ???> metadata;
}

// ✅ Dartでは名前付きクラスが基本
class UserArray {
  final List<User> items;
}

class UserMap {
  final Map<String, User> values;
}

// json_serializableは名前付きクラスを期待
@JsonSerializable()
class User {
  final String id;
  final UserArray friends;  // ← 名前付き型
}
```

### IRの責任 vs 生成器の責任

```
┌─────────────────────────────────────────┐
│ Core IR (言語非依存)                      │
│ - 全ての型を名前付きComponentとして保持   │
│ - 最大の情報量を維持                      │
│ - 最も制約の厳しい言語に合わせる           │
└─────────────────────────────────────────┘
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
┌─────────┐      ┌─────────┐
│ xcgen-ts│      │xcgen-dart│
│         │      │         │
│ inline化 │      │ 全て    │
│ 判断可能 │      │ クラス化 │
└─────────┘      └─────────┘
```

**設計原則**:

1. **IR側**: 全て名前付きComponent（情報の最大化）
2. **生成器側**: 言語特性に応じた最適化
3. **変換不可逆性**: Component → inline（可能） / inline → Component（困難）

### 生成器でのinline化戦略（TypeScript） - ⚠️ ARCHIVED

> **⚠️ このセクションは古い設計提案であり、実装されませんでした。**
>
> **決定日:** 2025-11-09
> **理由:** inline化の複雑さが利益を上回ると判断。全ての型を名前付きコンポーネントとして一貫して生成する方針に統一。
> **詳細:** 本ドキュメント末尾の「設計決定の記録 (ADR-001)」を参照

**⚠️ 重要な設計判断**:

**❌ 誤った理解（削除された旧提案）**:

```typescript
// generateArrayType() を変更して型定義自体を消す提案は誤り
function generateArrayType(component: IRArraySchema): string {
  if (shouldInlineArray(component)) {
    // ❌ 型定義を返さない（これでは export type が生成されない）
    return `Array<${resolveType(component.itemType)}>`;
  }
}
```

**問題点**:

- `export type UserList = Array<User>;` という型定義が失われる
- `components/schemas/UserIds` のように単体公開されている配列型が外部から参照できなくなる
- OpenAPI の公開 API として定義された型が TypeScript で表現されない

**✅ 正しい設計**:

inline化は「使用箇所」で判定し、**型定義自体は常にエクスポート**する。

#### 型定義の生成（常にエクスポート）

```typescript
// packages/xcgen-ts/src/generators/types/types-array.ts
// ← 変更なし、常に型定義をエクスポート

export function generateArrayType(model: IRArraySchema): string {
  const typeName = toTypeName(model.name);
  const itemType = irTypeToTsType(model.itemType);

  // 常に型定義を生成
  return `export type ${typeName} = Array<${itemType}>;`;
}
```

#### 使用箇所での inline 化判定

```typescript
// packages/xcgen-ts/src/generators/types/helpers/inline-strategy.ts（新規作成）

/**
 * Array型を使用箇所で inline 化すべきか判定
 */
export function shouldInlineArrayAtUsage(
  component: IRArraySchema
): boolean {
  return (
    !component.validation &&          // バリデーションなし
    !component.description &&         // ドキュメントなし
    isSimpleType(component.itemType)  // 単純な型（primitive or simple ref）
  );
}

function isSimpleType(type: IRType): boolean {
  // primitive型はシンプル
  if (typeof type === "string") return true;
  // ref型は一旦非シンプルとする（将来拡張可能）
  return false;
}
```

#### プロパティ生成での適用

```typescript
// packages/xcgen-ts/src/generators/types/generation-context.ts（新規作成）

import type { XcgenIR, IRComponent } from "@openapi-xcgen/core";
import type { HookableInstance } from "../../hooks";

/**
 * 型生成時のコンテキスト
 * IR全体、Hook、設定などを保持し、生成関数間で共有する
 */
export interface TypeGenerationContext {
  ir: XcgenIR;
  hooks?: HookableInstance;
}

/**
 * IRから参照パスでコンポーネントを検索
 */
export function resolveComponent(
  ctx: TypeGenerationContext,
  referencePath: string,
): IRComponent | undefined {
  return ctx.ir.components.find(c => c.referencePath === referencePath);
}
```

```typescript
// packages/xcgen-ts/src/generators/types/types-property.ts を更新

import type { TypeGenerationContext } from "./generation-context";
import { resolveComponent } from "./generation-context";
import { shouldInlineArrayAtUsage, shouldInlineMapAtUsage } from "./helpers/inline-strategy";

export function generateProperty(
  prop: IRProperty,
  model: IRModel,
  ctx: TypeGenerationContext,  // ← IR、Hooksを含むコンテキスト
): string {
  let typeStr: string;

  if (typeof prop.type !== "string" && prop.type.kind === "ref") {
    // コンテキストから component を検索
    const component = resolveComponent(ctx, prop.type.referencePath);

    if (component?.kind === "array" && shouldInlineArrayAtUsage(component)) {
      // inline 化: Array<...> 形式
      const itemType = irTypeToTsType(component.itemType);
      typeStr = `Array<${itemType}>`;
    } else if (component?.kind === "map" && shouldInlineMapAtUsage(component)) {
      // inline 化: Record<string, ...> 形式
      const valueType = irTypeToTsType(component.valueType);
      typeStr = `Record<string, ${valueType}>`;
    } else {
      // 通常の参照型
      typeStr = irTypeToTsType(prop.type);
    }
  } else {
    typeStr = irTypeToTsType(prop.type);
  }

  // Hook 呼び出し
  if (ctx.hooks) {
    ctx.hooks.callHook("property:generate", { /* ... */ });
  }

  // ...
}
```

**生成例**:

```typescript
// === IR定義（全て名前付き） ===
IRArraySchema {
  name: "UserIds",
  itemType: "string",
  validation: undefined,
  description: undefined
}

IRArraySchema {
  name: "UserList",
  itemType: { kind: "ref", referencePath: "#/components/schemas/User" },
  validation: { minItems: 1 }
}

// === TypeScript生成結果 ===

// 1. 型定義は常に生成される
export type UserIds = Array<string>;
export type UserList = Array<User>;

// 2. 使用箇所で inline 化判定
interface SomeResponse {
  userIds: Array<string>;  // ← inline化（validation/descriptionなし）
  users: UserList;         // ← 参照型（validationあり）
}
```

**Dart生成結果**:

```dart
// 全てクラス化（inline化しない）
class UserIds {
  final List<String> items;
}

class UserList {
  final List<User> items;
}

class SomeResponse {
  final UserIds userIds;  // ← Dart は常に参照型
  final UserList users;
}
```

**設計原則**:

1. **型定義は常にエクスポート**: 外部参照、ドキュメント生成、型の再利用のため
2. **inline化は使用箇所で判定**: プロパティ、パラメータ、レスポンス型で個別に判断
3. **設定で制御可能**: 将来的に `xcgen.config.ts` で inline 化の挙動を変更可能
4. **情報の保持**: validation や description がある場合は参照型を維持

---

## 結論と改善提案

### 採用する設計

**モデルC（2層分離設計）** を採用し、以下の改善を実施:

1. **用語変更**: `IRModel` → `IRComponent`
2. **構造分離**: `IRComponent = IRSchema | IROperationComponent`
3. **inline化**: 生成器の責任（xcgen-tsで実装、xcgen-dartは全クラス化）

### 最終的な型階層

```typescript
XcgenIR
├── components: IRComponent[]
│   ├── IRSchema[]
│   │   ├── IRObjectSchema
│   │   ├── IRArraySchema    // 全て名前付き
│   │   ├── IRMapSchema      // 全て名前付き
│   │   ├── IREnumSchema
│   │   ├── IRUnionSchema
│   │   ├── IRAllOfSchema
│   │   └── IRAnyOfSchema
│   └── IROperationComponent[]
│       ├── IRParameterComponent
│       ├── IRRequestBodyComponent
│       └── IRResponseComponent
└── endpoints: IREndpoint[]
```

### IRTypeの定義

```typescript
/**
 * IRType: 型参照
 * プロパティやパラメータの型として使用
 */
type IRType = IRScalarType | IRComponentRef;

/**
 * IRComponentRef: Componentへの参照
 * OpenAPIの$refを表現し、コンポーネントへの参照パスを保持する。
 * xcgen-ts/xcgen-dartは参照パスから型名を抽出して使用する。
 */
export interface IRComponentRef {
  kind: "ref";
  referencePath: string;  // "#/components/schemas/User" など
}
```

---

## 実装計画

### Phase 1: 型定義の整理とリネーム + validation 追加（拡張版）

**目的**: IRModelをIRComponentに変更し、構造を分離、validation フィールドを追加

**推定時間**: 6-8 hours

**タスク**:

1. 型定義のリネーム（4時間）

   **Schema系（Model → Schema）**:
   - `IRModel` → `IRComponent`
   - `IRObjectModel` → `IRObjectSchema`
   - `IREnumModel` → `IREnumSchema`
   - `IRArrayModel` → `IRArraySchema`
   - `IRMapModel` → `IRMapSchema`
   - `IRAllOfModel` → `IRAllOfSchema`
   - `IRAnyOfModel` → `IRAnyOfSchema`
   - `IRUnionModel` → `IRUnionSchema`

   **OperationComponent系（Model → Component）**:
   - `IRParameterModel` → `IRParameterComponent`
   - `IRRequestBodyModel` → `IRRequestBodyComponent`
   - `IRResponseModel` → `IRResponseComponent`

   **型参照（Ref → ComponentRef）**:
   - `IRRef` → `IRComponentRef`
   - `IRComponentRef.name` → `IRComponentRef.referencePath` フィールド名変更

   **影響範囲**:
   - **Core**: 型定義（1箇所）、全transformer（約20箇所で `name:` → `referencePath:` に変更）
   - **xcgen-ts**: `type-mapper.ts`, `extract-dependencies.ts`（`irType.name` → `irType.referencePath`）
   - 機械的な置換で対応可能

2. validation フィールドの追加（2時間）

   **IRArraySchema に追加**:

   ```typescript
   export interface IRArraySchema {
     kind: "array";
     name: string;
     referencePath: string;
     description?: string;
     itemType: IRType;
     validation?: IRValidation;  // ← 追加（minItems, maxItems, uniqueItems）
   }
   ```

   **IRMapSchema に追加**:

   ```typescript
   export interface IRMapSchema {
     kind: "map";
     name: string;
     referencePath: string;
     description?: string;
     valueType: IRType;
     validation?: IRValidation;  // ← 追加（minProperties, maxProperties）
   }
   ```

   **既存の `extractValidation` ヘルパー関数**:
   - `packages/core/src/transformer/helpers/extract-validation.ts` は既に実装済み
   - 配列バリデーション（minItems, maxItems, uniqueItems）に対応済み
   - オブジェクトバリデーション（minProperties, maxProperties）に対応済み

3. Transformer での validation 収集（2時間）

   **array-transformer.ts を更新**:

   ```typescript
   import { extractValidation } from "../../helpers";

   export function transformArray(
     schema: SchemaObject & {
       items?: SchemaObject | ReferenceObject;
     },
     context: VisitorContext,
     traversalResult: ArrayItemTraversalResult,
   ): TransformResult {
     const name = getComponentName(context);
     const referencePath = buildReferencePath(context.documentPath);
     const validation = extractValidation(schema);  // ← 追加

     const arrayModel: IRArraySchema = {
       kind: "array",
       name,
       referencePath,
       itemType: traversalResult.itemType,
       ...(schema.description && { description: schema.description }),
       ...(validation && { validation }),  // ← 追加
     };

     return {
       type: { kind: "ref", referencePath },
       components: [arrayModel, ...traversalResult.components],
     };
   }
   ```

   **map-transformer.ts を更新**:

   ```typescript
   import { extractValidation } from "../../helpers";

   export function transformMap(
     schema: SchemaObject,
     context: VisitorContext,
     traversalResult: AdditionalPropertiesTraversalResult,
   ): TransformResult {
     const name = getComponentName(context);
     const referencePath = buildReferencePath(context.documentPath);
     const validation = extractValidation(schema);  // ← 追加

     const mapModel: IRMapSchema = {
       kind: "map",
       name,
       referencePath,
       valueType: traversalResult.valueType,
       ...(schema.description && { description: schema.description }),
       ...(validation && { validation }),  // ← 追加
     };

     return {
       type: { kind: "ref", referencePath },
       components: [mapModel, ...traversalResult.components],
     };
   }
   ```

4. 型階層の分離

   ```typescript
   // packages/core/src/types/ir/components/index.ts

   export type IRSchema =
     | IRObjectSchema
     | IREnumSchema
     | IRArraySchema
     | IRMapSchema
     | IRAllOfSchema
     | IRAnyOfSchema
     | IRUnionSchema;

   export type IROperationComponent =
     | IRParameterComponent
     | IRRequestBodyComponent
     | IRResponseComponent;

   export type IRComponent = IRSchema | IROperationComponent;
   ```

5. XcgenIRフィールドの変更

   ```typescript
   // packages/core/src/types/ir/index.ts

   export interface XcgenIR {
     metadata: IRMetadata;
     components: IRComponent[];  // models → components
     tags: IRTag[];
     endpoints: IREndpoint[];
     // ...
   }
   ```

6. 型ガード関数の追加

   ```typescript
   // packages/core/src/types/guards.ts

   export function isIRSchema(component: IRComponent): component is IRSchema {
     return ["object", "enum", "array", "map", "allOf", "anyOf", "union"].includes(component.kind);
   }

   export function isIROperationComponent(component: IRComponent): component is IROperationComponent {
     return ["parameter", "requestBody", "response"].includes(component.kind);
   }
   ```

7. Helper関数のリネーム ← **Task 022/022.5との整合性**

   Task 022/022.5で整理された`helpers/`配下の命名関数も"Model"から"Component"へ変更:

   **`helpers/naming/`配下**:
   - `getModelName` → `getComponentName`
   - `buildInlineModelName` → `buildInlineComponentName`
   - `buildParameterModelName` → `buildParameterComponentName`
   - `buildParameterSchemaModelName` → `buildParameterSchemaComponentName`
   - `buildRequestBodyModelName` → `buildRequestBodyComponentName`
   - `buildResponseModelName` → `buildResponseComponentName`
   - `buildAdditionalPropertiesModelName` → `buildAdditionalPropertiesComponentName`

   **`helpers/`直下**:
   - `createParameterModel` → `createParameterComponent`

   **影響ファイル**:
   - `helpers/naming/get-model-name.ts` - メイン関数名変更
   - `helpers/naming/build-*-model-name.ts` (7ファイル) - 関数名とコメント変更
   - `helpers/create-parameter-model.ts` - 関数名変更
   - 全transformerファイル - import文と関数呼び出しを更新

**影響範囲**:

- `packages/core/src/types/ir/models/` - **型定義 (4ファイル)**
  - base.ts, operation.ts, property.ts, validation.ts

- `packages/core/src/transformer/transformers/` - **変換ロジック (34ファイル)**
  - transformers/*.ts (21ファイル) - 各型のIR変換
  - traversers/*.ts (10ファイル) - 子要素の訪問処理
  - dispatchers/*.ts (2ファイル) - 型判定とルーティング
  - aggregators/*.ts (1ファイル) - パラメータ集約

- `packages/core/src/transformer/helpers/` - **ヘルパー関数 (8ファイル)**
  - naming/*.ts (7ファイル) - 命名関数
  - create-parameter-model.ts (1ファイル)

- `packages/xcgen-ts/src/` - **TypeScript生成器 (27ファイル)**
  - generators/types/*.ts - 型定義生成
  - generators/schemas/*.ts - Valibotスキーマ生成
  - generators/services/*.ts - サービス生成
  - helpers/model-resolver.ts - モデル名解決

- `packages/xcgen-dart/src/` - **Dart生成器（未実装）**

**合計**: 約73ファイル + テストファイル

**検証**:

```bash
pnpm typecheck  # 型チェック
pnpm test       # 全テスト実行
```

### Phase 2: TypeGenerationContext 導入（実装完了、inline化は削除）

**⚠️ 注意**: 当初計画されていたinline化機能は実装されませんでした（ADR-001参照）

**目的**: 型生成時のコンテキスト管理インフラを構築（inline化なし）

**推定時間**: 2-3 hours

**実装内容**: TypeGenerationContext の導入のみ（inline化戦略は削除）

**タスク（完了済み）**:

1. TypeGenerationContext 導入（✅ 完了）

   **packages/xcgen-ts/src/generators/types/generation-context.ts（作成済み）**:

   ```typescript
   import type { XcgenIR, IRComponent } from "@openapi-xcgen/core";
   import type { HookableInstance } from "../../hooks";

   /**
    * 型生成時のコンテキスト
    * IR全体、Hook、設定などを保持し、生成関数間で共有する
    */
   export interface TypeGenerationContext {
     ir: XcgenIR;
     hooks?: HookableInstance;
   }

   /**
    * IRから参照パスでコンポーネントを検索
    */
   export function resolveComponent(
     ctx: TypeGenerationContext,
     referencePath: string,
   ): IRComponent | undefined {
     return ctx.ir.components.find(c => c.referencePath === referencePath);
   }
   ```

**⚠️ inline化戦略タスク（削除）**:

以下のタスクは実装されませんでした（ADR-001参照）:

- ~~inline化戦略モジュールの作成~~ → **削除**
- ~~プロパティ生成での inline 化判定の実装~~ → **削除**
- ~~パラメータ/レスポンス型での適用~~ → **削除**
- ~~設定ファイルでの制御~~ → **削除**

**実装方針**:

全ての Array/Map 型は名前付きコンポーネントとして一貫して生成されます。

```typescript
// 全ての型が名前付きで生成される
export type UserIds = Array<string>;
export type UserList = Array<User>;

interface SomeResponse {
  userIds: UserIds;    // ← 参照型（inline化なし）
  users: UserList;     // ← 参照型（inline化なし）
}
```

### Phase 3: ドキュメント更新

**目的**: 設計変更をドキュメントに反映

**タスク**:

1. IR設計ドキュメントの更新
   - `_docs/003_core_ir_design.md`
     - IRModel → IRComponent に変更
     - 2層構造（Schema/OperationComponent）を明記
     - inline化は生成器の責任であることを記載

2. アーキテクチャドキュメントの更新
   - `_docs/002_core_architecture.md`
     - Component優先設計の説明
     - 言語非依存性の原則を明記

3. Transformer設計の更新
   - `_docs/004_core_parser_transformer.md`
     - Visitor実装でのComponent生成を記載

4. プロジェクトガイドラインの更新
   - `CLAUDE.md`
     - IRComponent用語の使用を明記
     - 命名規約の更新

**検証**:

```bash
pnpm lint:md  # markdownlint
```

### Phase 4: Breaking Changes対応（バージョン管理）

**目的**: 破壊的変更として適切にリリース

**破壊的変更の詳細**:

1. **Public API型名変更** (packages/core):

   ```typescript
   // Before
   import type { IRModel, IRObjectModel, IREnumModel } from '@openapi-xcgen/core';

   // After
   import type { IRComponent, IRObjectSchema, IREnumSchema } from '@openapi-xcgen/core';
   ```

2. **XcgenIRフィールド名変更**:

   ```typescript
   // Before
   const ir: XcgenIR = { models: [...], endpoints: [...], ... };

   // After
   const ir: XcgenIR = { components: [...], endpoints: [...], ... };
   ```

3. **型ガード関数**（新規追加が必要）:

   ```typescript
   // 新規追加
   export function isIRSchema(component: IRComponent): component is IRSchema {
     return ['object', 'enum', 'array', 'map', 'allOf', 'anyOf', 'union']
       .includes(component.kind);
   }

   export function isIROperationComponent(c: IRComponent): c is IROperationComponent {
     return ['parameter', 'requestBody', 'response'].includes(c.kind);
   }
   ```

**影響を受けるユーザー**:

- ✅ **ほぼゼロ** - 現在外部利用者がいない（開発初期段階）
- ⚠️ 将来的な外部利用に備えたドキュメント整備が重要

**タスク**:

1. CHANGELOG.md の作成
   - Breaking Changes セクションに記載
   - 移行ガイドの提供（上記コード例含む）

2. バージョニング
   - 0.x.x → 0.y.0 (minor bump)
   - 1.0.0前なので破壊的変更は許容

3. リリースノート
   - GitHub Releaseで告知
   - 移行方法の詳細説明

---

## 議論の経緯

### 問題提起（2025-10-27）

IRModelの定義において、以下の混在が指摘された:

```
### IRModel

IRModelは以下の種類がある

- IRObjectModel
- IREnumModel
- IRArrayModel
- IRMapModel
- IRParameterModel
- IRRequestBodyModel
- IRResponseModel
- IRAllOfModel
- IRAnyOfModel
- IRUnionModel
```

> object/enum/arrayなど型に関するものと、parameter/RequestBodyなど種類に関するものが混在している。互換性や修正量などは考慮せず、コード生成向け抽象表現として、これは適切か？

### 初期分析

3つのアプローチを比較:

1. **Type優先設計**: inline型を許容
2. **Component優先設計**: 全て名前付き（現状）
3. **2層分離設計**: Schema/OperationComponentに分離

当初、inline型を許容する設計（モデルA）も検討したが、Dartの制約から却下。

### 重要な転換点

> dartを考えると、inlineArrayは適切ではない。すべて名前付きのComponentとして考えるべき。intefaceにするか、inlineにするかは、コード生成側で選択できるようにすべき。

この指摘により、**言語非依存なIR設計**という原則に立ち返り、以下の結論に到達:

1. IRは情報を最大限保持すべき（全て名前付き）
2. inline化判断は生成器の責任
3. 現状の設計（モデルB）は正しかった

### 最終決定

- 用語整理: IRModel → IRComponent
- 構造分離: IRSchema（型定義） / IROperationComponent（操作コンテキスト）
- inline化: xcgen-tsで戦略実装、xcgen-dartは全クラス化

---

## 参考資料

### 関連ドキュメント

- [002_core_architecture.md](../002_core_architecture.md) - Core全体アーキテクチャ
- [003_core_ir_design.md](../003_core_ir_design.md) - IR型設計
- [004_core_parser_transformer.md](../004_core_parser_transformer.md) - Parser/Transformer設計

### 関連コミット

- `6d75172` - IRArray/IRMapをIRTypeから削除、モデル専用化

### 外部資料

- [TypeScript Type vs Interface](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Dart json_serializable](https://pub.dev/packages/json_serializable)
- [OpenAPI Components Object](https://spec.openapis.org/oas/v3.1.0#components-object)

---

## 実装ステータス

### ✅ Phase 1: 型定義の整理とリネーム + validation 追加（拡張版） - 完了

**完了日**: 2025-11-09
**コミット**: d6d78fe, a9e3ca4, e735fba, 07701e8

**実装内容**:

- ✅ IRModel→IRComponent リネーム（全10種類）
- ✅ IRRef.name → IRComponentRef.referencePath フィールド名変更
- ✅ Core transformer 約20箇所更新（name → referencePath）
- ✅ xcgen-ts 更新（type-mapper.ts, model-resolver.ts等）
- ✅ IRArraySchema/IRMapSchema に validation フィールド追加
- ✅ array-transformer.ts/map-transformer.ts で validation 収集実装
- ✅ Helper関数リネーム（7ファイル）:
  - `getModelName` → `getComponentName`
  - `buildInlineModelName` → `buildInlineComponentName`
  - `buildParameterModelName` → `buildParameterComponentName`
  - `buildParameterSchemaModelName` → `buildParameterSchemaComponentName`
  - `buildRequestBodyModelName` → `buildRequestBodyComponentName`
  - `buildResponseModelName` → `buildResponseComponentName`
  - `buildAdditionalPropertiesModelName` → `buildAdditionalPropertiesComponentName`
- ✅ XcgenIR.models → XcgenIR.components フィールド変更
- ✅ JSDocコメント更新
- ✅ 後方互換性エイリアス追加（@openapi-xcgen/core/src/index.ts）
- ✅ E2E期待値ファイル再生成（43ファイル）
- ✅ 全テスト通過（433/433 passing）

**影響ファイル**: 131ファイル変更、7ファイルリネーム、1ファイル新規作成

**未実装項目**:

- ⚠️ 型ガード関数（`isIRSchema`, `isIROperationComponent`）- 将来実装予定

---

### ⏭️ Phase 2: TypeGenerationContext 導入 - 部分完了（inline化は削除）

**完了日**: 2025-11-09
**ステータス**: TypeGenerationContext のみ実装、inline化機能は**削除**

**実装内容**:

- ✅ TypeGenerationContext 作成（generation-context.ts）
- ✅ resolveComponent() ヘルパー実装
- ❌ inline化戦略 → **削除**（ADR-001参照）
- ❌ inline-strategy.ts → **作成されず**
- ❌ 生成関数シグネチャ変更 → **実施されず**（hooks 引数のまま）

**設計決定**: 全ての Array/Map 型を名前付きコンポーネントとして一貫して生成

---

### ⏳ Phase 3: ドキュメント更新 - TODO

**ステータス**: 未着手

**主な作業**:

- [ ] IR設計ドキュメントの更新（`_docs/003_core_ir_design.md`）
- [ ] アーキテクチャドキュメントの更新（`_docs/002_core_architecture.md`）
- [ ] Transformer設計の更新（`_docs/004_core_parser_transformer.md`）
- [ ] プロジェクトガイドラインの更新（`CLAUDE.md`）

**推定時間**: 半日

---

### ⏳ Phase 4: Breaking Changes対応 - TODO

**ステータス**: 未着手

**主な作業**:

- [ ] CHANGELOG.md 作成
- [ ] バージョンバンプ（0.x.x → 0.y.0）
- [ ] GitHub Release 作成

**推定時間**: 半日

---

## 設計決定の記録 (ADR)

### ADR-001: inline化機能の削除（2025-11-09）

**決定**: Phase 2 の inline化機能を実装せず、全ての型を名前付きコンポーネントとして生成する

**背景**:

当初、TypeScript生成時に単純な Array/Map 型（例: `Array<string>`, `Record<string, number>`）を使用箇所で inline 化する機能を計画していた。

**理由**:

1. **シンプルさ優先**: 一貫した設計で学習コストを低減
   - 全ての型が名前付きコンポーネント
   - 「いつ inline 化するか」の判断ロジックが不要
   - 生成コードの予測可能性が向上

2. **保守性向上**: inline化判断ロジックの複雑さを回避
   - TypeGenerationContext 経由での component 検索
   - shouldInlineArrayAtUsage() などの判定関数
   - 使用箇所ごとの条件分岐
   - これらの実装・テスト・保守コストが高い

3. **言語間の一貫性**: Dart は全てクラス化するため、TypeScript も統一
   - TypeScript: 名前付き型エイリアス
   - Dart: 名前付きクラス
   - 両方とも同じ IR から一貫して生成

4. **機能的な問題なし**: inline 化しなくても実用上の問題はない
   - 型定義は常にエクスポートされる
   - 外部から参照可能
   - Tree-shaking で未使用の型は削除される
   - バンドルサイズへの影響は軽微

**影響**:

- ✅ TypeGenerationContext インフラは作成済み（将来の拡張に活用可能）
- ✅ 全テスト通過（inline 化なしで E2E 期待値再生成済み）
- ❌ inline-strategy.ts は作成されず
- ❌ 生成関数のシグネチャ変更は実施されず（hooks 引数のまま維持）

**生成例**:

```typescript
// IR定義（全て名前付き）
IRArraySchema { name: "UserIds", itemType: "string" }
IRArraySchema { name: "UserList", itemType: { kind: "ref", ... } }

// TypeScript生成結果（一貫して参照型）
export type UserIds = Array<string>;
export type UserList = Array<User>;

interface SomeResponse {
  userIds: UserIds;   // ← 名前付き型参照
  users: UserList;    // ← 名前付き型参照
}
```

**将来の拡張性**:

必要になった場合、TypeGenerationContext インフラを活用して inline 化機能を追加可能。ただし、現時点では YAGNI 原則に従い実装しない。
