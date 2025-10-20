# 仕様書

[English](./spec.md) | [日本語](./spec.ja.md)

openapi-xcgenの型システムと制限事項に関する技術仕様です。

## 型システム

### スカラー型マッピング

以下の表は、OpenAPI型、IR型、TypeScript型のマッピングを示しています：

| 型名 | OpenAPI `type` | OpenAPI `format` | IR型 | TypeScript型 |
|------|----------------|------------------|------|-------------|
| 32ビット整数 | `integer` | - または `int32` | `int` | `number` |
| 64ビット整数 | `integer` | `int64` | `long` | `number` |
| 倍精度浮動小数点数 | `number` | - または `double` | `double` | `number` |
| 単精度浮動小数点数 | `number` | `float` | `float` | `number` |
| 文字列 | `string` | - | `string` | `string` |
| 日付 | `string` | `date` | `date` | `string` |
| 日付時刻 | `string` | `date-time` | `datetime` | `string` |
| バイナリデータ | `string` | `binary` | `binary` | `Blob` |
| Base64エンコード | `string` | `byte` | `byte` | `string` |
| 真偽値 | `boolean` | - | `boolean` | `boolean` |

### 複合型

| 要素 | OpenAPI定義 | IR上での表現 | TypeScript上での表現 |
|------|------------|------------|-------------------|
| Object | `type: object` + properties | `IRObjectModel` | `interface` |
| Array | `type: array` + items | `IRArray` | `T[]` |
| Enum | `enum: [...]` | `IREnumModel` | union型 |
| Map | `additionalProperties` | `IRMap` | `Record<string, T>` |
| Union | `oneOf` | `IRUnionModel` | discriminated union |
| Intersection | `allOf` | `IRAllOfModel` | `A & B` |
| Inclusive Union | `anyOf` | `IRAnyOfModel` | `A \| B` |

### 型修飾子

| 修飾子 | OpenAPI定義 | IR上での表現 | TypeScript上での表現 |
|--------|------------|------------|-------------------|
| Required | `required: [...]` | `IRProperty.required: true` | non-optional |
| Nullable | `nullable: true` / `type: [..., "null"]` | `IRProperty.nullable: true` | `T \| null` |
| ReadOnly | `readOnly: true` | `IRProperty.readOnly: true` | `readonly` |
| WriteOnly | `writeOnly: true` | `IRProperty.writeOnly: true` | (省略) |

### スカラー型バリデーション

| IR型 | Valibotスキーマ | 備考 |
|------|---------------|------|
| `int` | `v.number()` | 32ビット整数 |
| `long` | `v.number()` | 64ビット整数 |
| `float` | `v.number()` | 単精度浮動小数点数 |
| `double` | `v.number()` | 倍精度浮動小数点数 |
| `string` | `v.string()` | 文字列 |
| `boolean` | `v.boolean()` | 真偽値 |
| `null` | `v.null()` | null値 |
| `date` | `v.string()` | 日付 |
| `datetime` | `v.string()` | 日付時刻 |
| `byte` | `v.string()` | Base64エンコード |
| `binary` | `v.instance(Blob)` | バイナリデータ |

### 複合型バリデーション

| IR型 | Valibotスキーマ | 例 |
|------|---------------|-----|
| `IRObjectModel` | `v.object({...})` | `v.object({ id: v.string() })` |
| `IRArray` | `v.array(itemSchema)` | `v.array(v.string())` |
| `IREnumModel` | `v.picklist([...])` | `v.picklist(["a", "b"])` |
| `IRMap` | `v.record(v.string(), valueSchema)` | `v.record(v.string(), v.number())` |
| `IRUnionModel` (oneOf) | `v.variant(discriminator, [...])` | `v.variant("type", [CatSchema, DogSchema])` |
| `IRAllOfModel` (allOf) | `v.intersect([...])` | `v.intersect([BaseSchema, MixinSchema])` |
| `IRAnyOfModel` (anyOf) | `v.union([...])` | `v.union([StringSchema, NumberSchema])` |

### 型修飾子バリデーション

| 修飾子 | IR上での表現 | Valibotスキーマ | 例 |
|--------|------------|----------------|-----|
| Required | `IRProperty.required: true` | (デフォルト) | `v.string()` |
| Optional | `IRProperty.required: false` | `v.optional(schema)` | `v.optional(v.string())` |
| Nullable | `IRProperty.nullable: true` | `v.nullable(schema)` | `v.nullable(v.string())` |
| ReadOnly | `IRProperty.readOnly: true` | (コメントのみ) | `v.string() // readOnly` |
| WriteOnly | `IRProperty.writeOnly: true` | (生成対象外) | - |

### バリデーション制約

| カテゴリ | バリデーション | OpenAPI定義 | IR上での表現 | Valibotでの表現 |
|---------|--------------|------------|------------|----------------|
| 文字列 | 最小長 | `minLength: 3` | `IRValidation.minLength: 3` | `v.minLength(3)` |
| 文字列 | 最大長 | `maxLength: 50` | `IRValidation.maxLength: 50` | `v.maxLength(50)` |
| 文字列 | パターン | `pattern: "^[a-z]+$"` | `IRValidation.pattern: "^[a-z]+$"` | `v.regex(/^[a-z]+$/)` |
| 数値 | 最小値 | `minimum: 0` | `IRValidation.minimum: 0` | `v.minValue(0)` |
| 数値 | 最大値 | `maximum: 100` | `IRValidation.maximum: 100` | `v.maxValue(100)` |
| フォーマット | Email | `format: email` | `IRValidation.format: "email"` | `v.email()` |
| フォーマット | UUID | `format: uuid` | `IRValidation.format: "uuid"` | `v.uuid()` |
| フォーマット | URL | `format: url` / `uri` | `IRValidation.format: "url"` | `v.url()` |

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
