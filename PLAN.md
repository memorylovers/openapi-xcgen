# 開発計画

## 対応タスク一覧

1. `packages/core/src/types/index.ts` の `OpenAPIV3Document` 型エイリアスを見直し、`OpenAPIV3.Document` を参照するよう修正する。
2. `packages/core/src/transformer/visitors/schema/object-visitor.ts` 内のプロパティ生成処理で `extractValidation` を 1 回だけ呼ぶように整理する。
3. `packages/core/src/transformer/visitors/schema/additional-properties-visitor.ts` における `additionalProperties: true` の扱いを再検討し、`IRMapModel` 側での解釈が誤解されない形にする。
4. `packages/core/src/transformer/visitors/schema/array-visitor.ts` と `map-visitor.ts` の結果型（`{ type, models }`）を共通化し、重複コードを削減する。
5. `visitSchema` 系の呼び出しで行っている `as SchemaObjectWithNullable` キャストを排除し、`ReferenceObject` を含む受け口にリファクタリングする。

## 実施順序

上記 1〜5 の順に、小さなコミットへ分けて対応する。

## メモ

- 既存テスト（`pnpm test`）を各ステップ後に実行し、回帰が無いことを確認する。
- ドキュメントとの整合も適宜確認する。
