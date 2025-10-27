# タスク013-3: xcgen-ts - デフォルト Hooks 実装

## 概要

xcgen-ts（TypeScript生成器）に、OpenAPI x-extensionsを自動処理するデフォルトHooksを実装します。ユーザーが設定ファイルを書かなくても、OpenAPIに`x-type`, `x-format`, `x-validation`を記述するだけで拡張機能が動作します。

親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)

## ステータス

- **状態**: 未着手
- **優先度**: 中
- **前提タスク**: 013-2（Hook機構の導入）完了

## 前提条件

- タスク013-1（Core - IRへのextensionsフィールド追加）が完了していること
- タスク013-2（xcgen-ts - Hook機構の導入）が完了していること

## デフォルトHooksの一覧

### x-type

カスタム型名での生成：

- `x-type: UserId` ... カスタム型`UserId`を使用（`string`の代わり）
- `x-type: EmailAddress` ... カスタム型`EmailAddress`を使用
- `x-type: Dayjs` ... `Date`の代わりに`Dayjs`を使用

### x-format

カスタムフォーマットバリデーション（初期実装）：

- `x-format: rfc5322` ... RFC 5322準拠のメール検証
- `x-format: e164` ... E.164国際電話番号
- `x-format: iso8601` ... ISO 8601日時（厳密版）
- `x-format: uuid-v4` ... UUID v4検証

### x-validation

追加バリデーションロジック：

- `x-validation.customCheck: positivePrice` ... カスタムバリデーション関数`validatePositivePrice()`を追加
- `x-validation.customCheck: skuFormat` ... カスタムバリデーション関数`validateSkuFormat()`を追加

---

## 参考資料

- 親タスク: [013-x-extensions-support.md](./013-x-extensions-support.md)
- 前提タスク: [013-2-x-extensions-xcgen-ts-hooks.md](./013-2-x-extensions-xcgen-ts-hooks.md)
- [OpenAPI Specification - Specification Extensions](https://spec.openapis.org/oas/v3.0.3#specification-extensions)
- [Valibot - Custom Validations](https://valibot.dev/guides/methods/#custom)
