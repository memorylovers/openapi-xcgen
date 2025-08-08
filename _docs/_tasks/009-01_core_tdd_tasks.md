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

---

## 未実施タスク

### Phase 5: Transformer実装（中間表現への変換）

#### Task 5.0: IR型定義

- **テストファイル**: なし（型定義のため）
- **実装ファイル**: `packages/core/src/types/ir.ts`
- **設計ドキュメント**: `_docs/_tasks/009-02_ir_design.md`
- **実装内容**: IntermediateRepresentation及び関連型の定義

#### Task 5.1: AdvancedTransformer - 基本構造

- **テストファイル**: `packages/core/tests/transformer/basic.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: トランスフォーマーのインスタンス作成

#### Task 5.2: Model抽出

- **テストファイル**: `packages/core/tests/transformer/extract-models.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: componentsからモデル定義を抽出

  ```typescript
  // 期待される動作
  const ir = transformer.transform(doc);
  expect(ir.models[0].name).toBe('User');
  expect(ir.models[0].properties).toHaveLength(2);
  ```

#### Task 5.3: Enum抽出

- **テストファイル**: `packages/core/tests/transformer/extract-enums.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: Enum型の抽出と変換

#### Task 5.4: Union型抽出

- **テストファイル**: `packages/core/tests/transformer/extract-unions.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: oneOf/anyOfからUnion型を生成

#### Task 5.5: Service/Endpoint抽出

- **テストファイル**: `packages/core/tests/transformer/extract-services.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: パスをタグごとにサービスとしてグループ化

  ```typescript
  // 期待される動作
  const ir = transformer.transform(doc);
  expect(ir.services[0].name).toBe('users');
  expect(ir.services[0].endpoints).toHaveLength(2);
  ```

#### Task 5.6: 型解決

- **テストファイル**: `packages/core/tests/transformer/resolve-types.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:
  - プリミティブ型の解決
  - 配列型の解決
  - $ref参照の解決（コンポーネント名を保持）

#### Task 5.7: 依存関係解析

- **テストファイル**: `packages/core/tests/transformer/dependencies.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**: モデル間の依存関係を解析してimports配列を生成

#### Task 5.8: インラインスキーマ抽出

- **テストファイル**: `packages/core/tests/transformer/inline-schemas.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:
  - requestBodyのインラインスキーマ抽出
  - responsesのインラインスキーマ抽出
  - ネストされたインラインオブジェクトの再帰的抽出
  - 一意の名前生成（パス+メソッド or operationIdベース）
  - 名前の衝突回避

### Phase 6: 統合とCLI

#### Task 6.1: generateCode関数

- **テストファイル**: `packages/core/tests/generate.test.ts`
- **実装ファイル**: `packages/core/src/index.ts`
- **テスト内容**: エンドツーエンドの統合テスト

#### Task 6.2: CLIコマンド実装

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
