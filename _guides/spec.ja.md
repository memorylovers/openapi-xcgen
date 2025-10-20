# 仕様書

[English](./spec.md) | [日本語](./spec.ja.md)

openapi-xcgenの型システムと制限事項に関する技術仕様です。

## 型システム

### スカラー型マッピング

以下の表は、OpenAPI型とTypeScript型のマッピングを示しています：

| OpenAPI `type` | OpenAPI `format` | TypeScript型 | 備考 |
|----------------|------------------|-------------|------|
| `integer` | - または `int32` | `number` | 32ビット整数 |
| `integer` | `int64` | `number` | 64ビット整数 |
| `number` | - または `double` | `number` | 倍精度浮動小数点数 |
| `number` | `float` | `number` | 単精度浮動小数点数 |
| `string` | - | `string` | 文字列 |
| `string` | `date` | `string` | ISO 8601 日付 |
| `string` | `date-time` | `string` | ISO 8601 日付時刻 |
| `string` | `binary` | `Blob` | バイナリデータ |
| `string` | `byte` | `string` | Base64エンコード |
| `boolean` | - | `boolean` | 真偽値 |

### 複合型

- **Object**: `type: object` とプロパティ → TypeScriptインターフェース
- **Array**: `type: array` と要素型 → `T[]`
- **Enum**: `enum` 配列 → TypeScript union型
- **Map**: `additionalProperties` → `Record<string, T>`
- **Union**: `oneOf` → `kind`プロパティを持つDiscriminated union
- **Intersection**: `allOf` → 型の交差 (`A & B`)
- **Inclusive Union**: `anyOf` → 型の合併 (`A | B`)

### 型修飾子

- **Required**: `required` 配列で指定 → 非オプショナルプロパティ
- **Nullable**: `nullable: true` (OpenAPI 3.0) または `type: [T, "null"]` (OpenAPI 3.1) → `T | null`
- **ReadOnly**: `readOnly: true` → `readonly` プロパティ
- **WriteOnly**: `writeOnly: true` → レスポンス型から省略

## サポートされていない機能

以下のOpenAPI機能は現在サポートされていません：

### スキーマ機能

- ❌ **not**: 否定スキーマ
- ❌ **if/then/else**: 条件付きスキーマ
- ❌ **空のスキーマ `{}`**: すべての型を受け入れるスキーマ

### バリデーション機能

- ❌ **multipleOf**: 数値の倍数制約
- ❌ **contentMediaType/contentEncoding**: コンテンツエンコーディング
- ❌ **patternProperties**: パターンベースのプロパティ
- ❌ **$id/$anchor**: スキーマ識別子

### オペレーション機能

- ❌ **レスポンスヘッダー**: Rate-Limit情報等
- ❌ **共通パラメータ**: パスレベルの共通パラメータ
- ❌ **セキュリティ定義**: security/securitySchemes
- ❌ **コールバック**: 非同期コールバック
- ❌ **リンク**: ハイパーメディアリンク

これらの機能は典型的なAPI使用の一部（10%未満）を占めます。基本的な型処理（object、array、primitive、enum、$ref、oneOf/anyOf/allOf）で90%以上のAPIをカバーできます。

## 関連ドキュメント

- **[README](../README.ja.md)** - プロジェクト概要、CLI使い方、はじめ方
- **[Examples](../examples/)** - 動作するコード例
