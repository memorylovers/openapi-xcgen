# referencePath実装計画

## 概要

IRModelとIREnumに`referencePath`フィールドを追加し、OpenAPIの`$ref`参照を適切に処理できるようにする実装計画。

## 現在のステータス

- **完了**: Phase 1-3（基本実装）、Phase 4の一部（ヘルパー関数）
- **進行中**: Phase 4（インラインスキーマ処理）
- **未着手**: Phase 5-7

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
- [ ] リクエストボディのインラインスキーマ処理
- [ ] レスポンスのインラインスキーマ処理
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

#### 関連コミット

- `47e3fcc` refactor(core): VisitorContextをシンプル化し、documentPath継承を統一
- `621325d` feat(core): IRModel/IREnumにreferencePathフィールドを追加
- `c3b28d7` docs: referencePath実装の進捗を更新（Phase 1-3完了）
- `d178f56` feat(core): インラインスキーマ処理用のヘルパー関数を追加

## 次のステップ

### 優先度高

1. **リクエストボディのインラインスキーマ処理**
   - request-body-visitorの拡張
   - インラインスキーマを検出してIRModelとして抽出
   - generateComponentNameを使用して一意な名前を生成
   - referencePathの設定

2. **レスポンスのインラインスキーマ処理**
   - response-visitorの拡張
   - ステータスコード別の処理
   - 同上の抽出とreferencePath設定

3. **パラメータの統合モデル生成**
   - 複数のパラメータを1つのモデルにまとめる
   - parameter-visitorの拡張

### 優先度中

4. **重複回避機構**
   - 同名コンポーネントの検出
   - カウンタによる自動リネーム

5. **E2Eテスト**
   - インラインスキーマが正しく抽出されることを確認
   - referencePathが適切に設定されることを確認
