# Core実装 TDDタスク一覧

## TDD実装方針

### 基本原則（Red-Green-Refactor）

1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: コードを改善（テストは常にGreen）

### 実装順序の方針

- 外側から内側へ（インターフェースから実装詳細へ）
- 依存関係の少ないものから
- 単純なものから複雑なものへ
- 小さなステップで確実に進める

---

## 完了済みタスク

### Phase 1: 基本型定義とユーティリティ ✅ 完了

| タスク | 実装ファイル | テストファイル |
|--------|------------|--------------|
| Task 1.1: 型ガード関数 | `src/types/guards.ts` | `tests/types/guards.test.ts` |
| Task 1.2: HTTPメソッドユーティリティ | `src/utils/http.ts` | `tests/utils/http.test.ts` |
| Task 1.3: パスユーティリティ | `src/utils/path.ts` | `tests/utils/path.test.ts` |

### Phase 2: Parser実装 ✅ 完了

| タスク | 実装ファイル | テストファイル |
|--------|------------|--------------|
| Task 2.1: ParserError クラス | `src/parser/error.ts` | `tests/parser/error.test.ts` |
| Task 2.2: OpenAPIParser | `src/parser/openapi-parser.ts` | `tests/parser/parse-file.test.ts` |

---

## スキップしたタスク（YAGNI原則）

### Phase 2: Parser関連

- **Task 2.3**: 文字列パース - ファイルパースで十分
- **Task 2.4**: エラーハンドリング - Task 2.2で実装済み

### Phase 3: Validator実装 ⏭️ スキップ

- @apidevtools/swagger-parserが全バリデーション機能を提供

### Phase 4: Resolver実装 ⏭️ スキップ  

- bundle()メソッドで$refを内部参照として保持
- Transformer内で必要に応じて解決

### Phase 5: IR型定義 ✅ 完了

| タスク | 実装ファイル | 備考 |
|--------|------------|------|
| Task 5.0: IR型定義 | `src/types/ir/index.ts`, `src/types/ir/data.ts`, `src/types/ir/api.ts`, `src/types/ir/config.ts` | 判別共用体として実装、IRRefで参照を統一、type alias追加 |

---

## 完了済みタスク - Phase 6

### Phase 6: Transformer実装（中間表現への変換）✅ 完了

#### Task 6.1: OpenAPITransformer - 基本構造 ✅ 完了

- **テストファイル**: `packages/core/tests/transformer/basic.test.ts`
- **実装ファイル**: `packages/core/src/transformer/transformer.ts`（関数ベースで実装）
- **テスト内容**: transform関数とmetadata抽出
- **完了日**: 2025-08-10
- **詳細**: [009-04_task6.1_transformer_impl.md](./_done/009-04_task6.1_transformer_impl.md)

#### Task 6.2: IRModel抽出 ✅ 完了

- **テストファイル**: `packages/core/tests/transformer/extract-models.test.ts`
- **実装ファイル**: `packages/core/src/transformer/extractors/model-extractor.ts`
- **テスト内容**: componentsからIRModel定義を抽出
- **詳細**: [009-05_task6.2_model_extractor_impl.md](./_done/009-05_task6.2_model_extractor_impl.md)

  ```typescript
  // 期待される動作
  const ir = transformer.transform(doc);
  expect(ir.models[0].name).toBe('User');
  expect(ir.models[0].properties).toHaveLength(2);
  ```

#### Task 6.3: IREnum抽出 ✅ 完了

- **実装ファイル**: `packages/core/src/transformer/visitors/enum-visitor.ts`
- **テスト内容**: IREnum型の抽出と変換
- **実装方法**: Visitorパターンで実装、in-sourceテスト

#### Task 6.4: IRUnion型抽出 🔜 将来実装

- **状態**: oneOf/anyOf/allOfは基本機能安定化後に実装予定
- **理由**: 使用頻度が低い（全体の5-10%）、基本的な型処理を優先

#### Task 6.5: IRService/IREndpoint抽出 ✅ 完了

- **実装ファイル**: `packages/core/src/transformer/visitors/paths-visitor.ts`
- **実装ファイル**: `packages/core/src/transformer/visitors/operation-visitor.ts`
- **テスト内容**: パスをタグごとにサービスとしてグループ化

  ```typescript
  // 期待される動作
  const ir = transformer.transform(doc);
  expect(ir.services[0].name).toBe('users');
  expect(ir.services[0].endpoints).toHaveLength(2);
  ```

#### Task 6.6: 型解決 ✅ 完了

- **実装ファイル**: `packages/core/src/transformer/visitors/type-visitor.ts`
- **実装ファイル**: `packages/core/src/transformer/visitors/primitive-visitor.ts`
- **テスト内容**:
  - プリミティブ型の解決
  - 配列型の解決
  - $ref参照の解決（コンポーネント名を保持）

#### Task 6.7: 依存関係解析 ✅ 完了

- **実装ファイル**: `packages/core/src/transformer/visitors/schema-visitor.ts`
- **テスト内容**: モデル間の依存関係を解析（ネストされたオブジェクトの抽出）

#### Task 6.8: インラインスキーマ抽出 ✅ 完了

- **実装ファイル**: `packages/core/src/transformer/visitors/schema-visitor.ts`
- **テスト内容**:
  - requestBodyのインラインスキーマ抽出
  - responsesのインラインスキーマ抽出
  - ネストされたインラインオブジェクトの再帰的抽出
  - 一意の名前生成（階層的命名規則）
  - 名前の衝突回避

### Phase 6の実装成果

- **Visitorパターン**: 関数ベースのVisitorパターンで全変換処理を実装
- **全216テスト合格**: in-sourceテストとE2Eテストで完全カバレッジ
- **ファイルベースE2Eテスト**: `tests/transformer/transformer.test.ts`で実際のYAML変換を検証
- **品質保証**: lint/typecheck/test全てパス

---

## 未実施タスク

### Phase 7: 統合とCLI

#### Task 7.1: generateCode関数

- **テストファイル**: `packages/core/tests/generate.test.ts`
- **実装ファイル**: `packages/core/src/index.ts`
- **テスト内容**: エンドツーエンドの統合テスト

#### Task 7.2: CLIコマンド実装

- **テストファイル**: `packages/core/tests/cli/commands.test.ts`
- **実装ファイル**: `packages/core/src/cli/commands.ts`
- **テスト内容**: コマンドライン引数のパース

#### Task 6.3: 設定ファイル読み込み

- **テストファイル**: `packages/core/tests/cli/config.test.ts`
- **実装ファイル**: `packages/core/src/cli/config.ts`
- **テスト内容**: xcgen.config.tsの読み込み

---

## テスト環境のセットアップ

### 必要なパッケージ

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Vitestの設定（`vitest.config.ts`）

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**']
    }
  }
});
```

---

## 完了基準

### 各タスクの完了基準

- [ ] テストが全てGreen
- [ ] カバレッジ80%以上
- [ ] リファクタリング完了
- [ ] ドキュメント更新

### Phase完了基準

- [ ] 全タスクが完了
- [ ] 統合テストがパス
- [ ] パフォーマンステスト実施
- [ ] コードレビュー完了

### 全体の完了基準

- [ ] 全Phaseが完了
- [ ] E2Eテストがパス
- [ ] APIドキュメント作成
- [ ] リリースノート準備
