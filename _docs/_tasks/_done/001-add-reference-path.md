# IRModelとIREnumへのreferencePath追加

## 背景

現在のIRModelとIREnumには、OpenAPIの`$ref`で参照される際のパス情報がない。これにより：

- IRRefのnameとIRModelの関連付けが不明確
- インラインスキーマと明示的に定義されたスキーマの区別が困難
- デバッグやエラーメッセージでの追跡が困難

## TypeSpec制約事項

### TypeSpecから生成されるOpenAPIの特徴

1. **Components構造**
   - TypeSpecは主に`components/schemas`のみを生成
   - `components/requestBodies`、`components/responses`、`components/parameters`は基本的に生成されない
   - 全てのモデル定義は`components/schemas`に集約

2. **参照パターン**
   - リクエストボディ、レスポンスは全て`$ref`参照を使用
   - インラインスキーマは基本的に生成されない
   - 配列のitemsも`$ref`で参照

3. **メディアタイプ制約**
   - 現時点では`application/json`のみをサポート
   - XML、form-data等の他のメディアタイプは将来の拡張課題

4. **生成例**

   ```yaml
   components:
     schemas:
       User:         # modelは全てここに
         type: object
   
   paths:
     /users:
       post:
         requestBody:
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/User'  # 常に$ref
   ```

## 目的

すべてのIRModelとIREnumインスタンスに`referencePath`フィールドを追加し、一意の識別と適切な$ref解決を可能にする。

## 設計

### 1. 型定義の変更

```typescript
// IRModel
export interface IRModel {
  name: string;
  referencePath: string; // 追加: 必須フィールド
  description?: string;
  properties: IRProperty[];
}

// IREnum
export interface IREnum {
  name: string;
  referencePath: string; // 追加: 必須フィールド
  description?: string;
  type: IRScalarType;
  values: IREnumValue[];
}
```

### 2. 参照パスの形式

#### 基本形式

Components定義とインラインスキーマで異なる参照パス形式を使用：

- **Components定義**: `#/components/schemas/{Name}`
- **インラインスキーマ**: `#/paths/::endpoint/method/type/.../ComponentName`

エンドポイント部分は`::`（ダブルコロン）で区切り、その他は`/`で区切る。

##### 参照パスとComponentName一覧

```
** Components系
参照パス: #/components/schemas/{Name}
命名規則: そのまま使用
例: 
  User → #/components/schemas/User
  UserAddress → #/components/schemas/UserAddress


** リクエストボディ
参照パス: #/paths/::{endpoint}/{method}/requestBody/{ComponentName}
命名規則: {Method}{PathInPascalCase}RequestBody
例:
POST /users
  → #/paths/::users/post/requestBody/PostUsersRequestBody
PUT /users/{userId}
  → #/paths/::users::{userId}/put/requestBody/PutUsersUserIdRequestBody
POST /users/{userId}/posts
  → #/paths/::users::{userId}::posts/post/requestBody/PostUsersUserIdPostsRequestBody

ネストしたプロパティ:
  PostUsersRequestBodyProfile
  PutUsersUserIdRequestBodySettings


** レスポンス
参照パス: #/paths/::{endpoint}/{method}/responses/{statusCode}/{ComponentName}
命名規則: {Method}{PathInPascalCase}{StatusCode}Response
例:
GET /users 200
  → #/paths/::users/get/responses/200/GetUsers200Response
GET /users 404
  → #/paths/::users/get/responses/404/GetUsers404Response
GET /users/{userId} 200
  → #/paths/::users::{userId}/get/responses/200/GetUsersUserId200Response
GET /users/{userId} 404
  → #/paths/::users::{userId}/get/responses/404/GetUsersUserId404Response
GET /users/{userId}/posts/{postId} 200
  → #/paths/::users::{userId}::posts::{postId}/get/responses/200/GetUsersUserIdPostsPostId200Response
GET /users/{userId}/posts/{postId} 404
  → #/paths/::users::{userId}::posts::{postId}/get/responses/404/GetUsersUserIdPostsPostId404Response

ネストしたプロパティ:
  GetUsers200ResponseData
  GetUsersUserId404ResponseError


** パラメータ
参照パス: #/paths/::{endpoint}/{method}/parameters/{ComponentName}
命名規則: {Method}{PathInPascalCase}Params
例:
GET /users
  → #/paths/::users/get/parameters/GetUsersParams
GET /users/{userId}
  → #/paths/::users::{userId}/get/parameters/GetUsersUserIdParams
GET /users/{userId}/posts
  → #/paths/::users::{userId}::posts/get/parameters/GetUsersUserIdPostsParams
```

**パス変換ルール**

```
エンドポイント記法:
  ::users                            → /users
  ::users::{userId}                  → /users/{userId}
  ::users::{userId}::posts::{postId} → /users/{userId}/posts/{postId}

ComponentName生成:
  /users                              → Users
  /users/{userId}                     → UsersUserId
  /users/{userId}/posts               → UsersUserIdPosts
  /users/{userId}/posts/{postId}      → UsersUserIdPostsPostId
  /admin/settings                     → AdminSettings
  /api/v2/products                    → ApiV2Products
```

#### Components配下

```yaml
components:
  schemas:
    # モデル定義
    User:
      type: object
      # → #/components/schemas/User
      properties:
        status:
          type: string
          enum: [active, inactive, pending]
          # → #/components/schemas/UserStatusEnum (インラインEnum自動抽出)
        address:
          type: object
          # → #/components/schemas/UserAddress
    
    # 明示的なEnum定義
    UserRole:
      type: string
      enum: [admin, user, guest]
      # → #/components/schemas/UserRole
```

#### リクエストボディ

```yaml
paths:
  # TypeSpecパターン（$ref参照）
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
              # TypeSpecでは常に$ref参照、IRRefとして処理
  
  # インラインスキーマパターン（手書きOpenAPI等）
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              # → #/paths/::users/post/requestBody/PostUsersRequestBody
              type: object
              properties:
                role:
                  type: string
                  enum: [admin, user, guest]
                  # → #/paths/::users/post/requestBody/PostUsersRequestBodyRoleEnum
                profile:
                  type: object
                  # → #/paths/::users/post/requestBody/PostUsersRequestBodyProfile
  
  /users/{userId}:
    put:
      requestBody:
        content:
          application/json:
            schema:
              # → #/paths/::users::{userId}/put/requestBody/PutUsersUserIdRequestBody
              type: object
```

#### レスポンス

```yaml
paths:
  # TypeSpecパターン（$ref参照）
  /users:
    get:
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
                # TypeSpecでは常に$ref参照、IRRefとして処理
  
  # インラインスキーマパターン（複数ステータスコード）
  /users/{userId}:
    get:
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                type: object
                # → #/paths/::users::{userId}/get/responses/200/GetUsersUserId200Response
                properties:
                  status:
                    type: string
                    enum: [active, inactive, pending]
                    # → #/paths/::users::{userId}/get/responses/200/GetUsersUserId200ResponseStatusEnum
                  data:
                    type: object
                    # → #/paths/::users::{userId}/get/responses/200/GetUsersUserId200ResponseData
                    properties:
                      id: {type: string}
                      name: {type: string}
        
        '404':
          description: User not found
          content:
            application/json:
              schema:
                type: object
                # → #/paths/::users::{userId}/get/responses/404/GetUsersUserId404Response
                properties:
                  message: {type: string}
```

#### リクエストパラメタ

```yaml
paths:
  /users:
    get:
      # → #/paths/::users/get/parameters/GetUsersParams
      parameters:
        - name: filter
          in: query
          schema:
            type: object
            properties:
              status:
                type: string
                enum: [active, inactive, pending]
                # → GetUsersParamsFilterStatusEnum
        
        - name: page
          in: query
          schema:
            type: integer
        
        - name: sort
          in: query
          schema:
            type: string
            enum: [name, created, updated]
            # → GetUsersParamsSortEnum
  
  /users/{userId}:
    get:
      # → #/paths/::users::{userId}/get/parameters/GetUsersUserIdParams
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
        
        - name: include
          in: query
          schema:
            type: array
            items:
              type: string
              enum: [profile, posts, comments]
              # → GetUsersUserIdParamsIncludeItemEnum
```

##### 処理方針

**IR層での表現**:

- 個別の`IRParameter[]`として保持
- `in`属性（path/query/header/cookie）を保持
- OpenAPI仕様に忠実

#### 区切り文字の選定理由

`::`（ダブルコロン）を採用した理由：

- 視覚的に明確な区切り
- URLパスで`::`を使うケースは極めて稀で実用上安全
- `split('::')`で簡単にパース可能
- C++やRustなどのプログラミング言語で使われる記法で馴染みがある

#### 変換ロジック

参照パスからOpenAPIパスへの復元：

```typescript
// 例: ::users::{userId}::posts::{postId} → /users/{userId}/posts/{postId}
const openApiPath = endpointPart.replace(/::/g, '/');
```

## 考慮事項

### TypeSpec中心の設計

- TypeSpecはcomponents/schemasのみを生成し、$ref参照を多用
- インラインスキーマは少ないが、他ツール互換性のために対応

### 一意性の保証

- 同じ名前が異なるコンテキストで使用される場合の処理
- カウンタを使った重複回避（例: `CreateUserRequest2`）

## 参考資料

- [JSON Pointer (RFC 6901)](https://datatracker.ietf.org/doc/html/rfc6901)
- [OpenAPI Reference Object](https://spec.openapis.org/oas/v3.1.0#reference-object)
