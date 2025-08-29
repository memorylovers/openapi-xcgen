# E2Eテスト再構成計画

## 目的

- 生成されるIR仕様を基準としたテスト構成
- IRの各要素（IRModel, IREnum, IREndpoint, IRService）を明確に検証
- componentsとインラインスキーマの両方をカバー

## テストカテゴリと項目（IR仕様ベース）

### 1. models/ - IRModel生成テスト

- **primitive-model**: string, number, integer, boolean型プロパティ
- **object-model**: オブジェクト型、required/optional
- **array-model**: 配列型プロパティ、items定義
- **nested-object**: ネストされたオブジェクト構造
- **array-of-objects**: オブジェクトの配列
- **ref-model**: $ref参照を含むモデル
- **nullable-model**: nullable対応

### 2. enums/ - IREnum生成テスト

- **string-enum**: 文字列型のenum
- **inline-enum**: プロパティ内インラインenum
- **ref-enum**: components配下のenum参照

### 3. endpoints/ - IREndpoint生成テスト

- **path-params**: パスパラメータ
- **query-params**: クエリパラメータ
- **request-body**: リクエストボディ
- **response-types**: レスポンス型定義
- **multiple-methods**: 同一パスの複数メソッド

### 4. services/ - IRService分類テスト

- **single-tag**: 単一タグによるグルーピング
- **multi-tags**: 複数タグによる分類
- **no-tags**: タグなしエンドポイント（default）

## ディレクトリ構造

```
tests/
├── e2e/                    # End-to-End テスト
│   ├── transformer/        # Transformer のE2Eテスト
│   │   ├── models/
│   │   ├── enums/
│   │   ├── endpoints/
│   │   └── services/
│   └── fixtures/          # E2E用のテストYAMLファイル
│       ├── models/
│       ├── enums/
│       ├── endpoints/
│       └── services/
```

## 実装優先順位

1. models - IRModel生成の基本動作
2. enums - IREnum生成の検証
3. endpoints - IREndpoint生成の確認
4. services - IRService分類の検証

## 各YAMLファイルの方針

- 10-50行程度の小さなファイル
- 単一のIR要素にフォーカス
- 生成されるIRの構造を明確に検証
- componentsとインラインスキーマの両方をテスト
