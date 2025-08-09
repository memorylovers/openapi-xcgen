# OpenAPI拡張構文（x-フィールド）サポート設計

## 概要

OpenAPIの拡張構文（x-プレフィックス）をIR表現でサポートするための設計検討。
実装は実際のニーズが明確になってから行う（YAGNI原則）。

## 1. 背景と目的

### 1.1 OpenAPI拡張構文とは

- `x-`プレフィックスで独自フィールドを定義可能
- 各言語生成器が独自の型やバリデーションを指定するために使用
- 標準仕様では表現できない言語固有の情報を保持

### 1.2 ユースケース

- TypeScript固有の型指定（`x-typescript-type`）
- Kotlin/Java用のパッケージ指定（`x-package`）
- カスタムバリデーション（`x-validation`）
- カスタムフォーマット（`x-format`）

## 2. 検討した実装方針

### 方針1: 汎用extensionsプロパティ（不採用）

```typescript
export interface IRProperty {
  // ... 既存プロパティ
  extensions?: Record<string, unknown>; // すべてのx-*を保存
}
```

- ✅ 柔軟性が高い
- ❌ 型安全性が低い
- ❌ 使用時に型キャストが必要

### 方針2: 限定的な拡張サポート（採用予定）

```typescript
export interface IRProperty {
  // ... 既存プロパティ
  customType?: string;        // x-type
  customFormat?: string;      // x-format
  customValidation?: unknown; // x-validation
}
```

- ✅ 型安全
- ✅ シンプル
- ✅ 実用的
- ❌ 新しい拡張への対応に変更が必要

## 3. 実装設計

### 3.1 サポート対象の拡張フィールド

| 拡張フィールド | 用途 | 型 | 対象 |
|------------|------|-----|------|
| `x-type` | カスタム型指定 | string | Model, Property, Parameter |
| `x-format` | カスタムフォーマット | string | Property, Parameter |
| `x-validation` | 追加バリデーション | object | Property, Parameter |

### 3.2 型定義の変更

#### IRModel

```typescript
export interface IRModel {
  name: string;
  description?: string;
  properties: IRProperty[];
  customType?: string;  // x-type から変換
}
```

#### IRProperty

```typescript
export interface IRProperty {
  // ... 既存プロパティ
  customType?: string;        // x-type
  customFormat?: string;      // x-format
  customValidation?: unknown; // x-validation
}
```

#### IRParameter

```typescript
export interface IRParameter {
  // ... 既存プロパティ
  customType?: string;        // x-type
  customFormat?: string;      // x-format
  customValidation?: unknown; // x-validation
}
```

## 4. 使用例

### 4.1 OpenAPI定義での使用

```yaml
components:
  schemas:
    Email:
      type: string
      format: email
      x-type: "EmailAddress"      # TypeScript独自型
      x-format: "rfc5322"         # より厳密なフォーマット
      x-validation:               # 追加バリデーション
        domain: "example.com"
        allowSubdomains: true
    
    User:
      type: object
      x-type: "UserModel"         # モデル全体のカスタム型
      properties:
        id:
          type: string
          x-type: "UserId"        # プロパティ個別の型
```

### 4.2 Transformerでの処理

```typescript
// シンプルな変換処理
function extractExtensions(schema: SchemaObject, target: IRProperty) {
  if (schema['x-type']) {
    target.customType = schema['x-type'];
  }
  if (schema['x-format']) {
    target.customFormat = schema['x-format'];
  }
  if (schema['x-validation']) {
    target.customValidation = schema['x-validation'];
  }
}
```

### 4.3 生成器での活用

```typescript
// TypeScript生成器
function generatePropertyType(property: IRProperty): string {
  // x-typeが指定されていれば優先
  if (property.customType) {
    return property.customType;
  }
  // 通常の型生成ロジック
  return resolveTypeFromIR(property.type);
}

// バリデーション生成
function generateValidation(property: IRProperty): string {
  const validations = [];
  
  // 標準バリデーション
  if (property.validation) {
    validations.push(generateStandardValidation(property.validation));
  }
  
  // カスタムバリデーション
  if (property.customValidation) {
    validations.push(generateCustomValidation(property.customValidation));
  }
  
  return validations.join(' & ');
}
```

## 5. 実装計画

### Phase 1: 基本実装（未定）

1. IRProperty, IRModelへの追加
2. Transformerでの抽出処理
3. テストケースの作成

### Phase 2: 拡張（必要に応じて）

1. IRParameterへの追加
2. その他の型への展開

## 6. 今後の検討事項

### 6.1 追加サポート候補

- `x-deprecated-message`: 非推奨の詳細メッセージ
- `x-example`: 言語固有の例
- `x-internal`: 内部APIフラグ

### 6.2 生成器固有の拡張

各生成器が独自に定義する拡張：

- `x-typescript-*`
- `x-kotlin-*`
- `x-dart-*`

## 7. 参考資料

- [OpenAPI Specification - Specification Extensions](https://spec.openapis.org/oas/v3.0.3#specification-extensions)
- [OpenAPI Generator - Vendor Extensions](https://openapi-generator.tech/docs/templating/#vendor-extensions)
