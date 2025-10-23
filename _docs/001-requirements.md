# openapi-xcgen 要件定義書

## 概要

TypeSpecから生成されたOpenAPI仕様書（YAML/JSON）を入力として、TypeScript/Dartのクライアントコードを自動生成するクロスランゲージコード生成ライブラリ。

## アーキテクチャ

```
┌─────────────────┐
│  CLI Interface  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Core Engine    │
├─────────────────┤
│ - Parser        │
│ - Validator     │
│ - Resolver      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Code Generators │
├─────────────────┤
│ - TypeScript    │
│ - Dart          │
│ - (Extensible)  │
└─────────────────┘
```

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
│   ├── core/                 # パーサー、バリデーター
│   ├── generator-typescript/ # TS生成器
│   ├── generator-dart/       # Dart生成器
│   └── cli/                  # CLIインターフェース
```

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
export function createApiConfig(config: ClientConfig) { }
export async function request<T>(method, path, options?): Promise<T> { }

// services/users.ts - 個別エクスポート可能
export async function getUser(id: string): Promise<User> {
  const response = await request('GET', `/users/${id}`);
  return v.parse(UserSchema, response);
}

// 使用例
import { createApiConfig, users } from './generated';
createApiConfig({ baseUrl: 'https://api.example.com' });
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
OpenAPI Schema
     ↓
[Schema Parser] → AST
     ↓
[Language Router]
     ├── [TypeScript Generator] → TS/Valibot Code
     └── [Dart Generator] → Dart/JsonSerializable Code
```

### エラーハンドリング

- HTTPステータスごとの型定義を生成
- エラーは単純なオブジェクトとして扱う
- カスタムエラー処理は`errorHandler`で拡張可能

```typescript
type ApiErrorResponse<T = unknown> = {
  status: number;
  statusText: string;
  body: T;
  headers: Record<string, string>;
};
```

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
- OpenAPI拡張フック機能
- カスタムフォーマット対応（`x-format: ulid`等）
- ストリーミングレスポンス対応
- TypeSpecからの直接生成

## CLI仕様

```bash
# TypeScript生成
openapi-xcgen generate --input api.yaml --output ./src/api --lang ts

# Dart生成
openapi-xcgen generate --input api.yaml --output ./lib/api --lang dart

# 設定ファイル使用
openapi-xcgen generate --config xcgen.config.ts
```

## 設定ファイル

```typescript
// xcgen.config.ts
export default {
  input: './openapi.yaml',
  output: {
    typescript: './generated/ts',
    dart: './generated/dart',
  },
  typescript: {
    validator: 'valibot', // 将来: 'zod'
    fetch: globalThis.fetch,
  },
  dart: {
    serialization: 'json_serializable', // 将来: 'freezed'
    httpClient: 'http', // or 'dio'
  },
}
```
