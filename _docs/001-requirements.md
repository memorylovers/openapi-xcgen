# openapi-xcgen 要件定義書

## 概要

TypeSpecから生成されたOpenAPI仕様書（YAML/JSON）を入力として、TypeScript/Dartのクライアントコードを自動生成するクロスランゲージコード生成ライブラリ。

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│           Core Package                  │
│  (@openapi-xcgen/core)                  │
├─────────────────────────────────────────┤
│  - Parser (OpenAPI 3.x)                 │
│  - Transformer (OpenAPI → IR)           │
│  - Validator                            │
└───────────────┬─────────────────────────┘
                │ IR (Intermediate Representation)
        ┌───────┴───────┐
        │               │
┌───────▼──────┐ ┌──────▼──────┐
│  xcgen-ts    │ │ xcgen-dart  │
│  (CLI統合)   │ │ (CLI統合)   │
├──────────────┤ ├─────────────┤
│ - Generator  │ │ - Generator │
│ - CLI        │ │ - CLI       │
└──────────────┘ └─────────────┘
```

**処理フロー:**

1. Parser: OpenAPI仕様をパース・バンドル
2. Transformer: OpenAPIをIR（中間表現）に変換
3. Generator: IRから各言語のコードを生成

## 処理フロー

```
TypeSpec(.tsp) → OpenAPI(.yaml) → Generated Code(.ts/.dart)
                        ↑
                 [本ライブラリの対象範囲]
```

## 技術スタック

- 実装言語: TypeScript (Node.js v20/v22)
- ビルドツール: unbuild (ESM/CJS両対応)
- 対象TypeScript: 5.0以上
- 対象Dart: 3.0以上（null safety対応）
- パーサー: @apidevtools/swagger-parser

## ディレクトリ構成

### ライブラリ構成

```
openapi-xcgen/
├── packages/
│   ├── core/      # パーサー、トランスフォーマー、バリデーター
│   │              # (@openapi-xcgen/core)
│   ├── xcgen-ts/  # TypeScript生成器（CLI統合）
│   │              # (@openapi-xcgen/xcgen-ts)
│   └── xcgen-dart/# Dart生成器（Phase 2、未実装）
│                  # (@openapi-xcgen/xcgen-dart)
```

**パッケージ設計:**

- 各言語の生成器は独立したパッケージとして公開
- CLI は各生成器パッケージに統合（`xcgen-ts`, `xcgen-dart`コマンド）
- ユーザーは必要な言語のパッケージのみインストール可能

### 生成コード構成（TypeScript）

```
generated/
├── models/       # 型定義（個別ファイル）
│   ├── User.ts
│   ├── Post.ts
│   └── index.ts
├── schemas/      # Valibotスキーマ
│   ├── UserSchema.ts
│   ├── PostSchema.ts
│   └── index.ts
├── services/     # API関数
│   ├── users.ts
│   ├── posts.ts
│   └── index.ts
├── client.ts     # 基本リクエスト関数
├── types.ts      # 共通型定義
└── index.ts      # エクスポート
```

### 生成コード構成（Dart）

```
generated/
├── lib/
│   ├── models/       # モデルクラス
│   │   ├── user.dart
│   │   ├── post.dart
│   │   └── models.dart
│   ├── services/     # APIサービス
│   │   ├── user_service.dart
│   │   ├── post_service.dart
│   │   └── services.dart
│   ├── client.dart   # HTTPクライアント
│   └── api.dart      # メインエクスポート
└── pubspec.yaml      # パッケージ定義
```

## 機能要件

### 入力

- OpenAPI 3.0.x / 3.1.x
- YAML/JSON形式
- ローカルファイル、URL、文字列からの読み込み
- $ref参照の解決

### 出力

#### TypeScript生成

- Tree-shaking対応（関数ベース、クラス不使用）
- Fetch API使用（差し替え可能）
- Valibot によるランタイムバリデーション
- 完全な型安全性

#### Dart生成

- Null Safety対応
- json_serializableによるシリアライゼーション
- Sealed classでのUnion型表現
- http/dioパッケージ選択可能

### 基本設計（TypeScript）

```typescript
// client.ts - 最小限の共通処理
export function setConfig(config: ApiConfig): void { }
export async function request<T>(method, path, options?): Promise<T> { }

// services/users.ts - 個別エクスポート可能
export async function getUser(id: string): Promise<User> {
  const response = await request('GET', `/users/${id}`);
  return v.parse(UserSchema, response);
}

// 使用例
import { setConfig, users } from './generated';
setConfig({ baseUrl: 'https://api.example.com' });
const user = await users.getUser('123');
```

### 基本設計（Dart）

```dart
// lib/models/user.dart
@JsonSerializable()
class User {
  final String id;
  final String email;
  final String name;
  
  const User({required this.id, required this.email, required this.name});
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

// lib/services/user_service.dart
class UserService {
  final ApiClient _client;
  
  UserService(this._client);
  
  Future<User> getUser(String id) async {
    final response = await _client.request('GET', '/users/$id');
    return User.fromJson(response);
  }
}
```

### データフロー

```
OpenAPI Schema (YAML/JSON)
     ↓
[Parser] parse & bundle
     ↓
OpenAPI Document (with internal $refs)
     ↓
[Transformer] Visitor pattern
     ↓
XcgenIR (Intermediate Representation)
  ├── metadata (API info)
  ├── models (schemas)
  ├── endpoints (paths/operations)
  ├── security
  └── servers
     ↓
[Language Generators]
     ├── [TypeScript Generator] → TS/Valibot Code
     └── [Dart Generator] → Dart/JsonSerializable Code
```

**処理の3段階:**

1. **Parser**: OpenAPI仕様を読み込み、$refを解決（bundle）
2. **Transformer**: OpenAPIをIR（中間表現）に変換（Visitorパターン）
3. **Generator**: IRから各言語のコードを生成

**IRの役割:**

- 言語に依存しない統一的なデータ構造
- コード生成ロジックの明確な分離
- 多言語対応時のTransformer再利用

### エラーハンドリング（生成するTypeScriptクライアントコード）

- HTTPステータスごとの型定義を生成
- Errorクラスを継承したカスタムエラーを使用
- try-catchで自然に扱える設計

```typescript
export class XcgenApiError extends Error {
  readonly response: Response;
  readonly body?: unknown;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;

  constructor(response: Response, body?: unknown) {
    super(`API Error: ${response.status} ${response.statusText}`);
    this.name = "XcgenApiError";
    this.response = response;
    this.body = body;
    this.status = response.status;
    this.statusText = response.statusText;
    this.url = response.url;
  }
}
```

**設計方針:**

- **Errorクラス継承**: 標準的なエラーハンドリングが可能
- **型ガード**: `instanceof XcgenApiError` で型安全に判定
- **スタックトレース**: 自動的に記録され、デバッグが容易
- **豊富な情報**: status, body, url など詳細情報にアクセス可能
- **Response オブジェクト保持**: `response.headers` から追加情報を取得可能

**例外的なクラス使用:**

本ライブラリは「関数ベース、クラス不使用」を設計原則としていますが、エラーハンドリングは例外として Errorクラスの継承を許可します。理由：

- TypeScriptのエラーハンドリングのベストプラクティスに準拠
- スタックトレースによるデバッグ性の向上
- エラー監視ツール（Sentry等）との統合が容易
- Tree-shakingへの影響は軽微（クラス1つのみ）

### ファイルアップロード

- multipart/form-dataの基本対応
- File/Blobオブジェクトを受け取る
- `x-`拡張での詳細指定をサポート予定

## 非機能要件

- 大規模スキーマ（100+エンドポイント）対応
- 生成コードのLintエラーゼロ
- TypeSpec由来のメタデータ保持

## 制限事項（初版）

### レスポンス形式

- JSONレスポンスのみ対応（SSE/ストリーミング非対応）
- 認証機能は手動実装が必要
- OpenAPI拡張（`x-`）は無視

### 未対応のOpenAPI仕様

基本機能の安定化を優先し、以下の機能は現バージョンでは未対応：

#### Union型とスキーママージ（使用頻度: 5-10%）

- **oneOf**: 排他的Union（exactly one）
- **anyOf**: 包含的Union（one or more）  
- **allOf**: スキーママージ
- **discriminator**: ポリモーフィズムのヒント

#### 高度なバリデーション（使用頻度: 1-5%）

- **not**: 否定スキーマ
- **additionalProperties**: 追加プロパティ制約
- **patternProperties**: パターンプロパティ
- **if/then/else**: 条件付きスキーマ
- **multipleOf**: 数値の倍数制約

#### その他（使用頻度: <1%）

- **contentMediaType/contentEncoding**: コンテンツエンコーディング
- **$id/$anchor**: スキーマ識別子

※ 基本的な型処理（object、array、primitive、enum、$ref）で90%以上のAPIに対応可能

## ライブラリ情報

- **パッケージ名**: `openapi-xcgen`
- **説明**: Cross-language code generator for OpenAPI specifications
- **対象言語**: TypeScript, Dart
- **特徴**: Tree-shaking対応、モダンな設計、TypeSpec親和性

## 実装優先順位

1. **Phase 1**: TypeScript生成（Valibot）
2. **Phase 2**: Dart生成（json_serializable）
3. **Phase 3**: 拡張機能（Zod対応、x-拡張対応）

## 将来の拡張予定

```
現在:     TypeSpec → OpenAPI → Generated Code
将来:     TypeSpec ──────────→ Generated Code
              ↓
          OpenAPI → Generated Code
```

- Zodバリデーター選択オプション
- カスタムfetch関数の差し替え対応（インターセプター、認証ヘッダー等）
- OpenAPI拡張フック機能
- カスタムフォーマット対応（`x-format: ulid`等）
- ストリーミングレスポンス対応
- TypeSpecからの直接生成

## CLI仕様

```bash
# TypeScript生成
xcgen-ts --input api.yaml --output ./src/api

# 設定ファイル使用
xcgen-ts --config xcgen.config.ts

# Dart生成（Phase 2）
xcgen-dart --input api.yaml --output ./lib/api
```

## 設定ファイル

**TypeScript生成器の設定:**

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/xcgen-ts';

export default defineConfig({
  input: './openapi.yaml',
  output: './generated',
  validator: 'valibot', // 将来: 'zod'
});
```

**Dart生成器の設定（Phase 2）:**

```typescript
// xcgen.config.ts
import { defineConfig } from '@openapi-xcgen/xcgen-dart';

export default defineConfig({
  input: './openapi.yaml',
  output: './lib/generated',
  serialization: 'json_serializable', // 将来: 'freezed'
  httpClient: 'dio', // or 'http'
});
```
