# タスク015: additionalPropertiesのインラインスキーマ参照を修正

## 概要

`visitAdditionalProperties` が親オブジェクトと同じ `documentPath` を使用したまま `visitSchema` を呼び出すため、配列などの複合型を追加プロパティに持つ場合に自己参照の `referencePath` が生成されます。その結果、`IRObjectModel.additionalProperties` が親モデル自身を指し、抽出された配列モデルも同じ参照パスを共有してしまい、下流のコード生成で不正な参照が発生します。

## ステータス

- 状態: 未着手
- 優先度: 高
- 破壊的変更: なし（バグ修正）

## 背景と問題点

- 影響ファイル: `packages/core/src/transformer/visitors/schema/additional-properties-visitor.ts`、`packages/core/src/transformer/visitors/schema/object-visitor.ts`
- 親コンテキストの `documentPath` を使い回すことで、`buildReferencePath` / `getModelName` が親モデル名を再利用してしまう。
- `additionalProperties` が配列（例: `MetricsData` のケース）だと、
  - `IRObjectModel.additionalProperties` が `#/components/schemas/MetricsData` を参照
  - 抽出された `IRArrayModel` も同じ `referencePath` を持ち、自己参照が発生
- これにより生成クライアントが正しくマップ値モデルを参照できない。

## 対応方針

1. `visitAdditionalProperties` 内で、追加プロパティ専用の `documentPath` を構築したうえで `visitSchema` を呼び出す。
   - `buildInlineSchemaPath` などを利用し、`{ExistingModelName}AdditionalProperty` もしくは `Value` サフィックスを付与して一意の参照パスを確保する。
   - 返却する `models` もこの新しいパスに紐づける。
2. `visitObject`（およびレスポンス/リクエストボディ版）で追加プロパティの結果を統合する際、`additionalProperties` が正しく `IRRef` として値モデルを指すことを確認する。
3. ユニットテストを更新して自己参照が発生しないことを保証する。
   - `packages/core/src/transformer/visitors/schema/additional-properties-visitor.ts` の in-source テスト
   - `packages/core/src/transformer/visitors/schema/object-visitor.ts` の in-source テスト
4. 必要に応じて E2E 期待値（`packages/core/tests/e2e/fixtures/**`) を更新し、`IRArrayModel` / `IRMapModel` が正しい `referencePath` を持つことを確認する。
5. `pnpm test` と `pnpm typecheck` を実行してリグレッションを防止する。

## 完了条件

- 追加プロパティの配列/マップ値が自己参照にならず、専用のモデルを参照する。
- ユニットテスト・E2E テスト・型チェックがすべて成功する。
- 修正内容がリリースノート/CHANGELOG に反映される（必要に応じて）。
