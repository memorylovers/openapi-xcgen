# タスク014: IRArray/IRMap削除 - IRArrayModel/IRMapModelへの統一

## 概要

IR（中間表現）の設計を簡素化し、`IRObjectModel`との一貫性を保つため、`IRArray`と`IRMap`を削除し、すべての配列・マップ型を`IRArrayModel`/`IRMapModel`に統一します。

## ステータス

- 状態: 未着手
- 優先度: 中
- 破壊的変更: あり（IR出力形式の変更）

## 前提条件

- 現在の実装が安定していること
- E2Eテストが通っていること

## 問題の背景

### 現状の不一致

現在、配列型の表現に2つの異なる方法が存在します：

1. **プロパティの配列**: `IRArrayModel`として抽出 → `IRRef`で参照

   ```yaml
   # OpenAPI
   properties:
     tags:
       type: array
       items:
         type: string
   ```

   ```json
   // IR
   {
     "name": "tags",
     "type": { "kind": "ref", "name": "#/components/schemas/DataTypesTags" }
   }
   // models配列
   { "kind": "array", "name": "DataTypesTags", "itemType": "string" }
   ```

2. **パラメータの配列**: `IRArray`として直接埋め込み

   ```json
   {
     "name": "tags",
     "type": { "kind": "array", "itemType": "string" }
   }
   ```

### 問題点

1. **IRObjectModelとの不一貫性**: オブジェクト型はすべて`IRObjectModel`なのに、配列型は2種類存在
2. **複雑性**: コード生成で2つの配列型を別々に処理する必要がある
3. **冗長性**: `IRArray`と`IRArrayModel`が重複して存在

## 設計方針

### 統一後の構造

```
Layer 2（Model）: 名前を持つ独立した型定義
├── IRObjectModel   ✅ すべてのobject
├── IREnumModel     ✅ すべてのenum
├── IRArrayModel    ✅ すべてのarray（統一後）
├── IRMapModel      ✅ すべてのmap（統一後）
├── IRAllOfModel    ✅ allOf合成
├── IRAnyOfModel    ✅ anyOf合成
└── IRUnionModel    ✅ oneOf合成

Layer 3（Type）: プロパティ・パラメータの型表現
├── IRScalarType    ✅ プリミティブ型（string, number等）
└── IRRef           ✅ モデル参照
    ❌ IRArray を削除
    ❌ IRMap を削除
```

### 設計原則

1. **複雑な型（object, array, map）→ 必ずModelとして抽出**
2. **プリミティブ型（string, number等）→ 直接埋め込み**
3. **すべての参照はIRRefで統一**

## 実装手順

### 1. 型定義の変更

**ファイル**: `packages/core/src/types/ir/common/type.ts`

- [ ] `IRArray`インターフェースを削除
- [ ] `IRMap`インターフェースを削除
- [ ] `IRType`を簡素化：

  ```typescript
  export type IRType = IRScalarType | IRRef;
  ```

### 2. Transformerの変更

#### 2.1 type-visitor.ts

**ファイル**: `packages/core/src/transformer/visitors/schema/type-visitor.ts`

- [ ] `IRArray`のインポートを削除
- [ ] 配列型の処理ロジックを削除（下記コードを削除）：

  ```typescript
  // 配列型
  if (schema.type === "array" && schema.items) {
    const itemType = visitType(schema.items, {...});
    if (itemType === null) return null;
    return { kind: "array", itemType } as IRArray;
  }
  ```

- [ ] テストを更新（配列型のテストケースを削除または変更）

#### 2.2 parameter-visitor.ts

**ファイル**: `packages/core/src/transformer/visitors/operations/parameter-visitor.ts`

- [ ] パラメータの配列型を`IRArrayModel`として抽出するように変更
- [ ] `visitType`の代わりに`visitSchema`を使用（配列もモデルとして抽出）
- [ ] テストを更新

#### 2.3 header-visitor.ts

**ファイル**: `packages/core/src/transformer/visitors/operations/header-visitor.ts`

- [ ] ヘッダーの配列型を`IRArrayModel`として抽出するように変更
- [ ] `visitType`の代わりに`visitSchema`を使用
- [ ] テストを更新

#### 2.4 additional-properties-visitor.ts

**ファイル**: `packages/core/src/transformer/visitors/schema/additional-properties-visitor.ts`

- [ ] Map型を`IRMapModel`として抽出するように変更
- [ ] テストを更新

### 3. エクスポートの変更

#### 3.1 packages/core/src/types/ir/common/index.ts

- [ ] `IRArray`と`IRMap`のエクスポートを削除

#### 3.2 packages/core/src/types/ir/index.ts

- [ ] `IRArray`と`IRMap`のエクスポートを削除

#### 3.3 packages/core/src/types/index.ts

- [ ] `IRArray`と`IRMap`のエクスポートを削除

#### 3.4 packages/core/src/index.ts

- [ ] `IRArray`と`IRMap`のエクスポートを削除

### 4. xcgen-tsの変更

#### 4.1 type-mapper.ts

**ファイル**: `packages/xcgen-ts/src/helpers/type-mapper.ts`

- [ ] `IRArray`と`IRMap`の`case`文を削除
- [ ] テストを更新（削除したケースのテストを除去）

#### 4.2 schemas-type-mapper.ts

**ファイル**: `packages/xcgen-ts/src/generators/schemas/schemas-type-mapper.ts`

- [ ] `IRArray`と`IRMap`の`case`文を削除
- [ ] テストを更新

### 5. E2Eテストの更新

**ディレクトリ**: `packages/core/tests/e2e/fixtures/`

- [ ] 全E2E期待値ファイルを再生成：

  ```bash
  cd packages/core
  pnpm regenerate:expected
  ```

- [ ] パラメータの配列型が`IRRef`になっていることを確認
- [ ] すべてのテストが通ることを確認：

  ```bash
  pnpm test
  ```

### 6. xcgen-tsのE2Eテスト更新

**ディレクトリ**: `packages/xcgen-ts/tests/e2e/`

- [ ] 全E2E期待値ファイルを再生成：

  ```bash
  cd packages/xcgen-ts
  pnpm regenerate:expected
  ```

- [ ] すべてのテストが通ることを確認：

  ```bash
  pnpm test
  ```

### 7. ドキュメント更新

#### 7.1 IR設計ドキュメント

**ファイル**: `_docs/003_core_ir_design.md`

- [ ] Layer 3からIRArray/IRMapの説明を削除
- [ ] Layer 3の型リストを更新：

  ```markdown
  ### IRType (判別共用体)

  - IRScalarType
  - IRRef
  ```

- [ ] 配列型の説明を更新（すべてIRArrayModelとして抽出されることを明記）

#### 7.2 Visitor設計ドキュメント

**ファイル**: `_docs/005-visitor-context-mapping.md`

- [ ] type-visitorの説明を更新（配列処理の削除を反映）

## テスト計画

### 1. 単体テスト

- [ ] すべてのin-sourceテストが通ることを確認
- [ ] 新しい配列抽出ロジックのテストを追加

### 2. E2Eテスト

- [ ] Core: 約40個の期待値ファイルが正しく更新されることを確認
- [ ] xcgen-ts: 生成されるTypeScriptコードが変わらないことを確認

### 3. 型チェック

- [ ] `pnpm typecheck`が通ることを確認
- [ ] すべてのパッケージでコンパイルエラーがないことを確認

### 4. リグレッションテスト

- [ ] 既存のサンプルプロジェクト（petstore-example、train-travel-example）が動作することを確認

## 破壊的変更の影響

### IR出力形式の変更

**変更前**（パラメータの配列）:

```json
{
  "name": "tags",
  "type": { "kind": "array", "itemType": "string" }
}
```

**変更後**:

```json
{
  "name": "tags",
  "type": { "kind": "ref", "name": "#/paths/.../GetUsersParamsTags" }
}
// models配列に追加
{
  "kind": "array",
  "name": "GetUsersParamsTags",
  "referencePath": "#/paths/.../GetUsersParamsTags",
  "itemType": "string"
}
```

### 影響を受けるユーザー

- **Core パッケージの直接利用者**: IR形式が変わるため、独自Generatorを実装している場合は対応が必要
- **xcgen-ts/xcgen-dart利用者**: 生成コードは変わらないため、影響なし

## メリット

1. ✅ **IRObjectModelとの完全な一貫性**: すべての複雑な型がModelとして統一
2. ✅ **Layer構造の簡素化**: Layer 3が`IRScalarType | IRRef`のみになる
3. ✅ **コード生成ロジックの統一**: Generator側で特殊処理が不要
4. ✅ **再利用性の向上**: 同じ配列構造を複数箇所で参照可能
5. ✅ **命名の一貫性**: すべての配列に意味のある名前が付く

## デメリット

1. ❌ **破壊的変更**: 既存のIR出力形式が変わる
2. ❌ **モデル数の増加**: パラメータの配列もモデルとして抽出されるため、models配列が増える
3. ❌ **移行コスト**: E2Eテストの期待値ファイルを全更新する必要がある

## 参考資料

- [003_core_ir_design.md](../003_core_ir_design.md) - Core IR型設計
- [005-visitor-context-mapping.md](../005-visitor-context-mapping.md) - Visitor設計マッピング
- [002_core_architecture.md](../002_core_architecture.md) - Core全体アーキテクチャ

## 関連Issue

<!-- GitHub Issueを作成したらここにリンクを追加 -->

## 実装担当者

<!-- 実装者名を記載 -->

## レビュー担当者

<!-- レビュー担当者名を記載 -->
