# TODO実装計画

## 概要

本ドキュメントは、openapi-xcgenのコードベースに存在するTODOコメントの実装優先順位と計画をまとめたものです。
TypeSpecから生成されるOpenAPI仕様書を適切に処理し、実用的なクライアントコードを生成するために必要な機能を選別しています。

## 優先度の基準

- **コード生成に必要な部分**: 生成されるクライアントコードの品質・機能に直接影響
- **TypeSpecで利用される部分**: TypeSpecの標準的な機能で頻繁に使用される
- **一般的に利用される部分**: 多くのAPIで共通的に使用される機能

## 🔴 優先度：高（必須実装）

### 1. description処理

**理由**: コード生成でドキュメントコメントに必要、TypeSpecでも`@doc`として広く使用

**該当箇所**:

- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 148: `description: null, // TODO: implement property description handling`
  - Line 287: 同上（requestBody用）
  - Line 427: 同上（response用）

**影響**:

- 生成されるコードのドキュメント品質に直結
- IDE補完時の説明表示
- APIドキュメント自動生成

### 2. nullable処理

**理由**: 型安全性の確保に必須、TypeScriptやDartでnull安全性が重要

**該当箇所**:

- `packages/core/src/transformer/visitors/parameter-visitor.ts`
  - Line 96: `nullable: null, // TODO: implement nullable handling`
- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 151, 290, 430: `nullable: null, // TODO: implement nullable handling`

**影響**:

- TypeScript: `T | null` vs `T` の区別
- Dart: `T?` vs `T` の区別
- 実行時エラーの防止

### 3. defaultValue処理

**理由**: APIクライアントの初期値設定に必要、TypeSpecでも頻繁に使用

**該当箇所**:

- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 152, 291, 431: `defaultValue: null, // TODO: implement default value handling`

**影響**:

- オプショナルパラメータのデフォルト値
- 生成コードの使いやすさ向上
- APIクライアントの初期化簡略化

### 4. deprecated処理

**理由**: 非推奨APIの警告表示に必要、TypeSpecの`@deprecated`で使用

**該当箇所**:

- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 153, 292, 432: `deprecated: null, // TODO: implement deprecated handling`

**影響**:

- 非推奨警告の表示
- API移行の計画的実施
- 下位互換性の管理

## 🟡 優先度：中（推奨実装）

### 5. validation処理

**理由**: 入力検証コードの生成に有用（minimum, maximum, pattern等）

**該当箇所**:

- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 154, 293, 433: `validation: null, // TODO: implement validation handling`
- `packages/core/src/transformer/helpers/create-parameter-model.ts`
  - Line 145: `validation: null, // TODO: implement validation handling`

**影響**:

- Valibot/Zodとの連携
- クライアント側バリデーション
- 型レベルの制約表現

**注**: `extractValidation`ヘルパー関数は既に実装済み。Visitorでの統合が必要。

### 6. headers処理

**理由**: カスタムヘッダーを使うAPIで必要、Rate-Limit等の情報取得

**該当箇所**:

- `packages/core/src/transformer/visitors/response-visitor.ts`
  - Line 168: `// TODO: headersの処理（Step 12で実装予定）`
  - Line 174: `headers: null, // TODO: implement headers processing`
  - Line 425: `// TODO: headersの処理はStep 12で実装`
- `packages/core/src/transformer/visitors/object-visitor.ts`
  - Line 336: `headers: null, // TODO: Implement headers processing`

**影響**:

- レスポンスメタデータの取得
- Rate-Limit情報の処理
- カスタムヘッダーの型定義

## 🔵 優先度：低（任意実装）

### 7. security処理

**理由**: 認証方式の定義、ただしクライアント生成では別途実装が多い

**該当箇所**:

- `packages/core/src/transformer/visitors/operation-visitor.ts`
  - Line 155: `security: null, // TODO: implement security handling`

**影響**:

- APIキー管理
- OAuth認証フロー
- Bearer token処理

### 8. 共通パラメータ処理

**理由**: PathItemレベルの共通パラメータは使用頻度が低い

**該当箇所**:

- `packages/core/src/transformer/visitors/path-item-visitor.ts`
  - Line 96: `// TODO: Step 12で共通パラメータの処理を実装`
  - Line 295: テストコメント

**影響**:

- パス全体の共通パラメータ
- コード重複の削減

## 実装推奨順序

1. **description処理**
   - 最も基本的で影響が大きい
   - 実装も比較的シンプル

2. **nullable処理**
   - 型安全性の基本
   - TypeScript/Dart両方で重要

3. **defaultValue処理**
   - API使いやすさに直結
   - descriptionと同時実装可能

4. **deprecated処理**
   - API進化の管理
   - 実装は単純なフラグ処理

5. **validation処理**
   - 既存のextractValidationを活用
   - より堅牢なコード生成

6. **headers処理**
   - 完全なレスポンス処理
   - 実装はやや複雑

## 実装時の注意点

### 共通事項

- 各フィールドはOpenAPIのSchemaObjectから取得
- TypeSpec固有の拡張（x-typespec-*）も考慮
- null/undefinedの適切な処理

### description

- OpenAPIの`description`フィールドから取得
- マークダウン形式の可能性を考慮
- 改行やエスケープの処理

### nullable

- OpenAPI 3.0: `nullable: true`
- OpenAPI 3.1: `type: ["string", "null"]`
- 両方のパターンに対応必要

### defaultValue

- 型に応じた適切な変換
- JSON値からTypeScript/Dart値への変換

### deprecated

- ブール値フラグ
- TypeScriptでは`@deprecated`JSDoc
- Dartでは`@Deprecated`アノテーション

## 関連ファイル

- 既存実装参考:
  - `packages/core/src/transformer/helpers/extract-validation.ts` - バリデーション抽出（実装済み）
  - `packages/core/src/transformer/helpers/extract-ref-name.ts` - $ref名抽出（実装済み）

## 更新履歴

- 2024-01-13: 初版作成
