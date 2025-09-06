# referencePath実装計画

## 概要

IRModelとIREnumに`referencePath`フィールドを追加し、OpenAPIの`$ref`参照を適切に処理できるようにする実装計画。

## 現在のステータス

- **完了**: Phase 1-4（基本実装、インラインスキーマ処理）
- **進行中**: Phase 5（重複回避機構）
- **未着手**: Phase 6-7

## TODOリスト

### Phase 1: 型定義の更新

- [x] IRModelインターフェースに`referencePath: string`を追加
- [x] IREnumインターフェースに`referencePath: string`を追加

### Phase 2: パーサー層の準備

- [x] OpenAPIのコンテキスト情報（現在のパス）を保持する仕組みを検討
  - VisitorContextに`documentPath: string[]`を実装
- [x] Visitorコンテキストの拡張
  - 全visitorでdocumentPathを適切に継承・拡張するように統一

### Phase 3: Components配下の処理

- [x] components/schemas配下のモデルに`#/components/schemas/{Name}`を設定
  - build-reference-pathヘルパーを実装し、components-visitorで使用
- [x] components/schemas配下のEnumに`#/components/schemas/{Name}`を設定
  - 同上

### Phase 4: インラインスキーマの処理

- [x] エンドポイントパスを`::`記法に変換するヘルパー関数作成
  - convert-path-to-endpoint.tsを実装
- [x] ComponentName生成ロジックの実装
  - generate-component-name.tsを実装（es-toolkit活用）
- [x] リクエストボディのインラインスキーマ処理
  - request-body-visitorを拡張し、インラインobjectスキーマを独立したIRModelとして抽出
- [x] レスポンスのインラインスキーマ処理
  - response-visitorを拡張し、インラインobjectスキーマを独立したIRModelとして抽出
- [x] Visitor関数の返り値一貫性修正
  - 全visitor関数でnullableな返り値に統一し、visitorパターンの原則に準拠
- [ ] パラメータの統合モデル生成

### Phase 5: 重複回避

- [ ] 同名モデルの重複検出
- [ ] カウンタによる自動リネーム（例: `User2`）

### Phase 6: テスト

- [ ] referencePath生成の単体テスト
- [ ] Components定義のE2Eテスト
- [ ] インラインスキーマのE2Eテスト
- [ ] 重複回避のテスト

### Phase 7: ドキュメント更新

- [ ] README.mdへの機能追記
- [ ] APIドキュメントの更新

## 実装履歴

### 2025-01-06

#### Phase 1-3完了

以下の実装を完了：

1. **型定義の更新**
   - IRModelとIREnumに`referencePath: string`フィールドを追加

2. **VisitorContext実装**
   - `documentPath: string[]`のみを保持するシンプルな設計に変更
   - 全visitorで親のdocumentPathを適切に継承・拡張
   - createContext関数を削除し、YAGNI原則に従う

3. **build-reference-pathヘルパー実装**
   - documentPathから参照パス（#/components/schemas/{Name}等）を生成
   - components-visitorで使用し、IRModelとIREnumにreferencePathを設定

4. **コード改善**
   - パラメータのdocumentPathをインデックスから名前ベースに変更（可読性向上）
   - 全テストを更新し、createContext()の使用を排除

#### Phase 4部分完了

5. **インラインスキーマ処理用ヘルパー実装**
   - `convert-path-to-endpoint.ts`: パステンプレートを`::`記法に変換
     - シンプルな文字列置換で実装（KISS原則）
     - 双方向変換をサポート
   - `generate-component-name.ts`: コンポーネント名生成
     - es-toolkitの`pascalCase`を活用して簡潔化
     - パステンプレートとHTTPメソッドから一意な名前を生成
     - コンテキスト別の接尾辞（RequestBody、Response、Params等）

6. **コード最適化**
   - es-toolkitを活用して約30行のコード削減
   - パラメータ名を`path`から`pathTemplate`に変更（意図の明確化）

#### Phase 4完了（同日続き）

7. **インラインスキーマ処理の実装**
   - `request-body-visitor.ts`と`response-visitor.ts`を拡張
   - インラインobjectスキーマを検出し、独立したIRModelとして抽出
   - 生成されるモデルに適切なreferencePath設定（例: `#/paths/::users/post/requestBody/schema`）
   - generateComponentNameで一意な名前生成（例: `PostUsersRequestBody`, `GetUsers200Response`）

8. **Visitor関数の一貫性向上**
   - 全visitor関数でnullableな返り値に統一（visitorパターンの原則に準拠）
   - エラー時は`null`を返し、成功時はオブジェクトを返すように統一
   - TypeScriptエラーの修正とテストの更新

9. **実装品質の向上**
   - ObjectVisitorResultから適切にプロパティを取得
   - IRRefのフィールド修正（`ref` → `name`）
   - ネストしたモデルとEnumの適切な収集

#### 関連コミット

- `47e3fcc` refactor(core): VisitorContextをシンプル化し、documentPath継承を統一
- `621325d` feat(core): IRModel/IREnumにreferencePathフィールドを追加
- `c3b28d7` docs: referencePath実装の進捗を更新（Phase 1-3完了）
- `d178f56` feat(core): インラインスキーマ処理用のヘルパー関数を追加
- `ea7d3d8` fix(core): response-visitor.tsのTypeScriptエラーを修正

## 次のステップ

### 優先度高

1. **パラメータの統合モデル生成**
   - 複数のパラメータを1つのモデルにまとめる
   - parameter-visitorの拡張
   - generateComponentNameでパラメータモデル名生成（例: `GetUsersParams`）

### 優先度中

2. **重複回避機構**
   - 同名コンポーネントの検出
   - カウンタによる自動リネーム（例: `User2`, `User3`）

3. **E2Eテスト**
   - インラインスキーマが正しく抽出されることを確認（リクエストボディ・レスポンス）
   - referencePathが適切に設定されることを確認
   - パラメータ統合モデルのテスト
   - 重複回避機構のテスト
