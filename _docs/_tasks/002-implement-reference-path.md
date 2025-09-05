# referencePath実装計画

## TODOリスト

### Phase 1: 型定義の更新

- [ ] IRModelインターフェースに`referencePath: string`を追加
- [ ] IREnumインターフェースに`referencePath: string`を追加

### Phase 2: パーサー層の準備

- [ ] OpenAPIのコンテキスト情報（現在のパス）を保持する仕組みを検討
- [ ] Visitorコンテキストの拡張

### Phase 3: Components配下の処理

- [ ] components/schemas配下のモデルに`#/components/schemas/{Name}`を設定
- [ ] components/schemas配下のEnumに`#/components/schemas/{Name}`を設定

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
