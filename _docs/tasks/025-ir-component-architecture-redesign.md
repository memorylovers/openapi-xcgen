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

### 生成器でのinline化戦略（TypeScript）

```typescript
// xcgen-ts/src/generators/types/inline-strategy.ts

/**
 * TypeScript生成時のinline化判断
 */
function shouldInlineArray(component: IRArraySchema): boolean {
  return (
    !component.validation &&           // validationなし
    !component.description &&          // ドキュメントなし
    isSimpleType(component.itemType)   // 参照先がシンプル
  );
}

function generateArrayType(component: IRArraySchema): string {
  if (shouldInlineArray(component)) {
    // inline化
    return `Array<${resolveType(component.itemType)}>`;
  } else {
    // 独立した型定義
    return `export type ${component.name} = Array<${resolveType(component.itemType)}>;`;
  }
}
```

**生成例**:

```typescript
// IR定義（全て名前付き）
IRArraySchema {
  name: "UserIds",
  itemType: "string",
  validation: undefined
}

IRArraySchema {
  name: "UserList",
  itemType: { kind: "ref", name: "User" },
  validation: { minItems: 1 }
}

// TypeScript生成結果
interface SomeResponse {
  userIds: string[];        // ← inline化（シンプル）
  users: UserList;          // ← 名前付き（validation有り）
}

export type UserList = Array<User>;
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
  final UserIds userIds;
  final UserList users;
}
```

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
 * IRComponentに定義された名前付き型定義への参照
 */
export interface IRComponentRef {
  kind: "ref";
  name: string;  // 参照先のComponent名
}
```

---

## 実装計画

### Phase 1: 型定義の整理とリネーム

**目的**: IRModelをIRComponentに変更し、構造を分離

**タスク**:

1. 型定義のリネーム

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

2. 型階層の分離

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

3. XcgenIRフィールドの変更

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

4. 型ガード関数の更新

   ```typescript
   // packages/core/src/types/guards.ts

   export function isIRSchema(component: IRComponent): component is IRSchema {
     return ["object", "enum", "array", "map", "allOf", "anyOf", "union"].includes(component.kind);
   }

   export function isIROperationComponent(component: IRComponent): component is IROperationComponent {
     return ["parameter", "requestBody", "response"].includes(component.kind);
   }
   ```

5. Helper関数のリネーム ← **Task 022/022.5との整合性**

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

### Phase 2: 生成器のinline化戦略実装（xcgen-ts）

**目的**: TypeScript生成時のinline化判断ロジックを実装

**タスク**:

1. inline化戦略モジュールの作成

   ```typescript
   // packages/xcgen-ts/src/generators/types/inline-strategy.ts

   export interface InlineConfig {
     arrays: boolean | "simple-only";  // true/false/"simple-only"
     maps: boolean | "simple-only";
   }

   export function shouldInlineArray(
     component: IRArraySchema,
     config: InlineConfig
   ): boolean {
     // 判断ロジック
   }
   ```

2. 既存の型生成ロジックの更新
   - `types-array.ts` - inline化判断を追加
   - `types-map.ts` - inline化判断を追加

3. 設定ファイルでの制御（将来拡張）

   ```typescript
   // xcgen.config.ts (将来実装)
   export default {
     typescript: {
       inline: {
         arrays: "simple-only",
         maps: false
       }
     }
   }
   ```

**検証**:

```bash
cd packages/xcgen-ts
pnpm test
pnpm regenerate:expected  # E2E期待値再生成
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

- [ ] Phase 1: 型定義の整理とリネーム
  - 影響: 73ファイル + テスト
  - 期間: 2-3日
  - 主な作業: IRModel→IRComponent、helper関数リネーム、JSDocコメント更新

- [ ] Phase 2: 生成器のinline化戦略実装
  - 影響: xcgen-tsのみ（types-array.ts、types-map.ts）
  - 期間: 1-2日
  - 主な作業: inline化判断ロジック実装、設定オプション追加

- [ ] Phase 3: ドキュメント更新
  - 影響: _docs/配下の4ファイル
  - 期間: 半日
  - 主な作業: IR設計、アーキテクチャ、Transformer設計、CLAUDE.mdの更新

- [ ] Phase 4: Breaking Changes対応
  - CHANGELOG.md作成
  - バージョンバンプ
  - GitHub Release作成
  - 期間: 半日
