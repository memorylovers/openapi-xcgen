# referencePath実装計画

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

- [ ] エンドポイントパスを`::`記法に変換するヘルパー関数作成
- [ ] ComponentName生成ロジックの実装
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

#### 関連コミット

- `47e3fcc` refactor(core): VisitorContextをシンプル化し、documentPath継承を統一
- `621325d` feat(core): IRModel/IREnumにreferencePathフィールドを追加
