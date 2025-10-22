# E2Eテスト拡充計画（2025年1月更新）

## 目的

- **現状分析**: models中心のテストからAPI構造全体への拡充
- **不足領域の補完**: IRService分類、IREndpoint生成の非model部分
- **実装価値の重視**: 現実的で保守可能なテスト設計

## 現在の実装状況

### ✅ **充実している領域（実装完了済み）**

- **IRModel/IREnum生成**: models.test.ts で完全カバー（18テスト）
- **referencePath機能**: Components/インライン/パラメータ参照の検証完了
- **型安全性**: kind識別による判別共用体テスト完了
- **インラインスキーマ処理**: models/inline-schemas.yaml で詳細実装済み

### ❌ **不足している領域（実装が必要）**

- **IRService 生成・分類**: タグベースのサービス分類が全く未テスト
- **IREndpoint 生成（非model部分）**: operationId、パス構造、メタデータ処理が未テスト

## 実装が必要なテストカテゴリ

### 🏷️ **1. services/ - IRService分類テスト（最重要）**

#### 未実装項目

- **single-tag**: 単一タグによるサービス分類

  ```yaml
  # users タグ → UsersService
  tags: [users]
  ```

- **multi-tags**: 複数タグの分類・優先処理

  ```yaml
  # users, admin タグ → どちらのサービスに？
  tags: [users, admin]
  ```

- **no-tags**: タグなしエンドポイントのdefaultサービス化

  ```yaml
  # タグなし → DefaultService
  ```

### 🎯 **2. endpoints/ - IREndpoint生成テスト（非model部分のみ）**

#### 既に実装済み（inline-schemas.yamlでカバー）

- ✅ path-params, query-params（GetTest1ParametersParams で検証済み）
- ✅ request-body（PostTest2RequestRequestBody で検証済み）  
- ✅ response-types（複数ステータスコード検証済み）
- ✅ multiple-methods（GET/POST で検証済み）

#### 未実装項目（model無関係部分）

- **operation-id**: 自動生成・重複回避ロジック
- **path-structure**: パス解析・正規化処理  
- **endpoint-metadata**: summary/description の保持
- **method-consolidation**: 同一パスの複数メソッド統合

## 更新後のディレクトリ構造

### 現在（実装済み）

```
tests/e2e/transformer/
├── models.test.ts        # ✅ 18テスト（完全実装済み）
├── general.test.ts       # ✅ 基本変換テスト
└── fixtures/
    ├── models/           # ✅ 7YAMLファイル（data-types, ref-model等）
    └── general/          # ✅ 3YAMLファイル
```

### 追加が必要

```
tests/e2e/transformer/
├── services.test.ts      # 🆕 IRService分類テスト
├── endpoints.test.ts     # 🆕 IREndpoint構造テスト（非model部分）
└── fixtures/
    ├── services/         # 🆕 タグ分類テストYAML群
    │   ├── single-tag.yaml
    │   ├── multi-tags.yaml
    │   └── no-tags.yaml
    └── endpoints/        # 🆕 API構造テストYAML群
        ├── operation-id.yaml
        ├── path-structure.yaml
        └── endpoint-metadata.yaml
```

## 実装優先順位（更新）

### **高優先度**

1. **services.test.ts** - 現在完全に欠落している重要機能
2. **fixtures/services/** - サービス分類の基本テストケース

### **中優先度**

3. **endpoints.test.ts** - API構造の品質保証
4. **fixtures/endpoints/** - operationId等の動作検証

## 実装方針（現実的アプローチ）

### YAMLファイル設計

- **集約型**: models/inline-schemas.yaml の成功を踏襲
- **実用重視**: 細分化より包括的なテストシナリオ
- **保守容易**: 50-100行程度の適度なサイズ

### テスト設計

- **既存パターン活用**: models.test.ts の構造を参考
- **compareWithExpected()**: 既存ヘルパー関数を活用
- **統合検証**: 複数機能を組み合わせた現実的シナリオ
