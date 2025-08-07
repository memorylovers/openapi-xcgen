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

## Phase 1: 基本型定義とユーティリティ（依存なし）

### Task 1.1: 型ガード関数の実装 ✅️ 完了

- **テストファイル**: `packages/core/tests/types/guards.test.ts`
- **実装ファイル**: `packages/core/src/types/guards.ts`
- **テスト内容**:

  ```typescript
  // Red: isReferenceObject()のテスト
  test('should identify reference object', () => {
    expect(isReferenceObject({ $ref: '#/components/schemas/User' })).toBe(true);
    expect(isReferenceObject({ type: 'string' })).toBe(false);
    expect(isReferenceObject(null)).toBe(false);
  });
  ```

- **依存**: なし
- **完了条件**: 全ての型ガード関数のテストがパス

### Task 1.2: HTTPメソッドのユーティリティ ✅ 完了

- **テストファイル**: `packages/core/tests/utils/http.test.ts`
- **実装ファイル**: `packages/core/src/utils/http.ts`
- **テスト内容**:

  ```typescript
  // Red: isValidHTTPMethod()のテスト
  test('should validate HTTP methods', () => {
    expect(isValidHTTPMethod('GET')).toBe(true);
    expect(isValidHTTPMethod('get')).toBe(true);
    expect(isValidHTTPMethod('INVALID')).toBe(false);
  });
  ```

- **依存**: なし
- **完了条件**: HTTPメソッド関連のユーティリティテストがパス

### Task 1.3: パスユーティリティ ✅ 完了

- **テストファイル**: `packages/core/tests/utils/path.test.ts`
- **実装ファイル**: `packages/core/src/utils/path.ts`
- **テスト内容**:

  ```typescript
  // Red: extractPathParams()のテスト
  test('should extract path parameters', () => {
    expect(extractPathParams('/users/{id}/posts/{postId}')).toEqual(['id', 'postId']);
    expect(extractPathParams('/users')).toEqual([]);
  });
  ```

- **依存**: なし
- **完了条件**: パス操作関連のテストがパス

---

## Phase 2: Parser実装（外部ライブラリのラッパー）

### Task 2.1: ParserError クラス ✅ 完了

- **テストファイル**: `packages/core/tests/parser/error.test.ts`
- **実装ファイル**: `packages/core/src/parser/error.ts`
- **テスト内容**:

  ```typescript
  // Red: ParserErrorのテスト
  test('should create parser error with message', () => {
    const error = new ParserError('Failed to parse');
    expect(error.message).toBe('Failed to parse');
    expect(error.name).toBe('ParserError');
    expect(error instanceof Error).toBe(true);
  });
  ```

- **依存**: なし
- **完了条件**: エラークラスのテストがパス

### Task 2.2: OpenAPIParser - ファイルパース

- **テストファイル**: `packages/core/tests/parser/parse-file.test.ts`
- **実装ファイル**: `packages/core/src/parser/index.ts`
- **テスト内容**:

  ```typescript
  // Red: ファイルパースのテスト（モックを使用）
  test('should parse valid OpenAPI file', async () => {
    const parser = new OpenAPIParser();
    const result = await parser.parse('./fixtures/petstore.yaml');
    expect(result.openapi).toMatch(/^3\./);
    expect(result.info.title).toBeDefined();
  });
  ```

- **依存**: @apidevtools/swagger-parser, Task 2.1
- **完了条件**: ファイルパーステストがパス

### Task 2.3: OpenAPIParser - 文字列パース

- **テストファイル**: `packages/core/tests/parser/parse-string.test.ts`
- **実装ファイル**: `packages/core/src/parser/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 文字列パースのテスト
  test('should parse OpenAPI string', async () => {
    const yamlString = `
      openapi: 3.1.0
      info:
        title: Test API
        version: 1.0.0
      paths: {}
    `;
    const parser = new OpenAPIParser();
    const result = await parser.parseFromString(yamlString);
    expect(result.info.title).toBe('Test API');
  });
  ```

- **依存**: Task 2.2
- **完了条件**: 文字列パーステストがパス

### Task 2.4: OpenAPIParser - エラーハンドリング

- **テストファイル**: `packages/core/tests/parser/error-handling.test.ts`
- **実装ファイル**: `packages/core/src/parser/index.ts`
- **テスト内容**:

  ```typescript
  // Red: エラーハンドリングのテスト
  test('should throw ParserError for invalid file', async () => {
    const parser = new OpenAPIParser();
    await expect(parser.parse('./not-exist.yaml')).rejects.toThrow(ParserError);
  });
  ```

- **依存**: Task 2.2, Task 2.3
- **完了条件**: エラーケースのテストがパス

---

## Phase 3: Validator実装（純粋な検証ロジック）

### Task 3.1: ValidationResult型とヘルパー

- **テストファイル**: `packages/core/tests/validator/result.test.ts`
- **実装ファイル**: `packages/core/src/validator/result.ts`
- **テスト内容**:

  ```typescript
  // Red: ValidationResultのヘルパーテスト
  test('should create validation error', () => {
    const error = createValidationError('info.title', 'Title is required');
    expect(error.path).toBe('info.title');
    expect(error.severity).toBe('error');
  });
  ```

- **依存**: なし
- **完了条件**: ValidationResult関連のテストがパス

### Task 3.2: SchemaValidator - 基本構造検証

- **テストファイル**: `packages/core/tests/validator/basic.test.ts`
- **実装ファイル**: `packages/core/src/validator/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 基本検証のテスト
  test('should validate required fields', () => {
    const validator = new SchemaValidator();
    const doc = { openapi: '3.1.0', paths: {} };
    const result = validator.validateDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: 'info.title' })
    );
  });
  ```

- **依存**: Task 3.1
- **完了条件**: 基本構造の検証テストがパス

### Task 3.3: SchemaValidator - パス検証

- **テストファイル**: `packages/core/tests/validator/paths.test.ts`
- **実装ファイル**: `packages/core/src/validator/index.ts`
- **テスト内容**:

  ```typescript
  // Red: パス検証のテスト
  test('should validate path operations', () => {
    const validator = new SchemaValidator();
    const pathItem = { get: { responses: {} } };
    const result = validator.validatePath(pathItem);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('at least one response');
  });
  ```

- **依存**: Task 3.2
- **完了条件**: パス検証テストがパス

### Task 3.4: SchemaValidator - スキーマ検証

- **テストファイル**: `packages/core/tests/validator/schemas.test.ts`
- **実装ファイル**: `packages/core/src/validator/index.ts`
- **テスト内容**:

  ```typescript
  // Red: スキーマ検証のテスト
  test('should validate schema objects', () => {
    const validator = new SchemaValidator();
    const schema = { type: 'object', properties: {} };
    const result = validator.validateSchema(schema);
    expect(result.valid).toBe(true);
  });
  ```

- **依存**: Task 3.2
- **完了条件**: スキーマ検証テストがパス

---

## Phase 4: Resolver実装（参照解決）

### Task 4.1: ReferenceResolver - 基本構造

- **テストファイル**: `packages/core/tests/resolver/basic.test.ts`
- **実装ファイル**: `packages/core/src/resolver/index.ts`
- **テスト内容**:

  ```typescript
  // Red: リゾルバーの基本テスト
  test('should create resolver with cache', () => {
    const resolver = new ReferenceResolver();
    expect(resolver).toBeDefined();
    // キャッシュが空であることを確認
  });
  ```

- **依存**: なし
- **完了条件**: 基本構造のテストがパス

### Task 4.2: ReferenceResolver - コンポーネント参照解決

- **テストファイル**: `packages/core/tests/resolver/component-ref.test.ts`
- **実装ファイル**: `packages/core/src/resolver/index.ts`
- **テスト内容**:

  ```typescript
  // Red: コンポーネント参照解決のテスト
  test('should resolve component reference', () => {
    const resolver = new ReferenceResolver();
    const components = {
      schemas: {
        User: { type: 'object', properties: { id: { type: 'string' } } }
      }
    };
    const result = resolver.resolveComponentRef('#/components/schemas/User', components);
    expect(result.type).toBe('object');
  });
  ```

- **依存**: Task 4.1
- **完了条件**: コンポーネント参照解決テストがパス

### Task 4.3: ReferenceResolver - 深い参照解決

- **テストファイル**: `packages/core/tests/resolver/deep-resolve.test.ts`
- **実装ファイル**: `packages/core/src/resolver/index.ts`
- **テスト内容**:

  ```typescript
  // Red: ネストした参照の解決テスト
  test('should resolve nested references', () => {
    const resolver = new ReferenceResolver();
    const doc = {
      components: {
        schemas: {
          Pet: { $ref: '#/components/schemas/Animal' },
          Animal: { type: 'object', properties: { name: { type: 'string' } } }
        }
      }
    };
    const resolved = resolver.resolveRefs(doc);
    expect(resolved.resolved).toBe(true);
  });
  ```

- **依存**: Task 4.2
- **完了条件**: 深い参照解決テストがパス

### Task 4.4: ReferenceResolver - 循環参照対応

- **テストファイル**: `packages/core/tests/resolver/circular.test.ts`
- **実装ファイル**: `packages/core/src/resolver/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 循環参照のテスト
  test('should handle circular references', () => {
    const resolver = new ReferenceResolver();
    const doc = {
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: {
              children: { type: 'array', items: { $ref: '#/components/schemas/Node' } }
            }
          }
        }
      }
    };
    expect(() => resolver.resolveRefs(doc)).not.toThrow();
  });
  ```

- **依存**: Task 4.3
- **完了条件**: 循環参照のテストがパス

---

## Phase 5: Transformer実装（中間表現への変換）

### Task 5.1: AdvancedTransformer - 基本構造

- **テストファイル**: `packages/core/tests/transformer/basic.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: トランスフォーマーの基本テスト
  test('should create transformer', () => {
    const transformer = new AdvancedTransformer();
    expect(transformer).toBeDefined();
  });
  ```

- **依存**: Task 4.4（Resolver完了）
- **完了条件**: 基本構造のテストがパス

### Task 5.2: Model抽出

- **テストファイル**: `packages/core/tests/transformer/extract-models.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: モデル抽出のテスト
  test('should extract models from schemas', () => {
    const transformer = new AdvancedTransformer();
    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            },
            required: ['id']
          }
        }
      }
    };
    const ir = transformer.transform(doc);
    expect(ir.models).toHaveLength(1);
    expect(ir.models[0].name).toBe('User');
    expect(ir.models[0].properties).toHaveLength(2);
  });
  ```

- **依存**: Task 5.1
- **完了条件**: モデル抽出テストがパス

### Task 5.3: Enum抽出

- **テストファイル**: `packages/core/tests/transformer/extract-enums.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: Enum抽出のテスト
  test('should extract enums from schemas', () => {
    const transformer = new AdvancedTransformer();
    const doc = {
      components: {
        schemas: {
          Status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      }
    };
    const ir = transformer.transform(doc);
    expect(ir.enums).toHaveLength(1);
    expect(ir.enums[0].name).toBe('Status');
    expect(ir.enums[0].values).toHaveLength(3);
  });
  ```

- **依存**: Task 5.2
- **完了条件**: Enum抽出テストがパス

### Task 5.4: Union型抽出

- **テストファイル**: `packages/core/tests/transformer/extract-unions.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: Union型抽出のテスト
  test('should extract union types', () => {
    const transformer = new AdvancedTransformer();
    const doc = {
      components: {
        schemas: {
          Pet: {
            oneOf: [
              { $ref: '#/components/schemas/Cat' },
              { $ref: '#/components/schemas/Dog' }
            ]
          }
        }
      }
    };
    const ir = transformer.transform(doc);
    expect(ir.unions).toHaveLength(1);
    expect(ir.unions[0].name).toBe('Pet');
  });
  ```

- **依存**: Task 5.3
- **完了条件**: Union型抽出テストがパス

### Task 5.5: Service/Endpoint抽出

- **テストファイル**: `packages/core/tests/transformer/extract-services.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: サービス抽出のテスト
  test('should group endpoints by tags', () => {
    const transformer = new AdvancedTransformer();
    const doc = {
      paths: {
        '/users': {
          get: {
            tags: ['users'],
            operationId: 'getUsers',
            responses: { '200': { description: 'OK' } }
          }
        },
        '/users/{id}': {
          get: {
            tags: ['users'],
            operationId: 'getUser',
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };
    const ir = transformer.transform(doc);
    expect(ir.services).toHaveLength(1);
    expect(ir.services[0].name).toBe('users');
    expect(ir.services[0].endpoints).toHaveLength(2);
  });
  ```

- **依存**: Task 5.4
- **完了条件**: サービス抽出テストがパス

### Task 5.6: 型解決

- **テストファイル**: `packages/core/tests/transformer/resolve-types.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 型解決のテスト
  test('should resolve primitive types', () => {
    const transformer = new AdvancedTransformer();
    const result = transformer.resolveType({ type: 'string', format: 'email' });
    expect(result.kind).toBe('primitive');
    expect(result.primitive).toBe('string');
    expect(result.format).toBe('email');
  });

  test('should resolve array types', () => {
    const transformer = new AdvancedTransformer();
    const result = transformer.resolveType({ 
      type: 'array', 
      items: { type: 'string' } 
    });
    expect(result.kind).toBe('array');
    expect(result.arrayType.kind).toBe('primitive');
  });
  ```

- **依存**: Task 5.5
- **完了条件**: 型解決テストがパス

### Task 5.7: 依存関係解析

- **テストファイル**: `packages/core/tests/transformer/dependencies.test.ts`
- **実装ファイル**: `packages/core/src/transformer/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 依存関係解析のテスト
  test('should analyze model dependencies', () => {
    const transformer = new AdvancedTransformer();
    const doc = {
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' }
            }
          }
        }
      }
    };
    const ir = transformer.transform(doc);
    const userModel = ir.models.find(m => m.name === 'User');
    expect(userModel.imports).toContain('Address');
  });
  ```

- **依存**: Task 5.6
- **完了条件**: 依存関係解析テストがパス

---

## Phase 6: 統合とCLI

### Task 6.1: generateCode関数

- **テストファイル**: `packages/core/tests/generate.test.ts`
- **実装ファイル**: `packages/core/src/index.ts`
- **テスト内容**:

  ```typescript
  // Red: 統合テスト
  test('should generate code from OpenAPI', async () => {
    const config = {
      input: './fixtures/petstore.yaml',
      output: './output',
      language: 'typescript'
    };
    await generateCode(config);
    // ファイルが生成されたことを確認
  });
  ```

- **依存**: Phase 1-5 完了
- **完了条件**: エンドツーエンドのテストがパス

### Task 6.2: CLIコマンド実装

- **テストファイル**: `packages/core/tests/cli/commands.test.ts`
- **実装ファイル**: `packages/core/src/cli/commands.ts`
- **テスト内容**:

  ```typescript
  // Red: CLIコマンドのテスト
  test('should parse command arguments', () => {
    const args = ['--input', 'api.yaml', '--output', './gen', '--language', 'ts'];
    const parsed = parseArgs(args);
    expect(parsed.input).toBe('api.yaml');
    expect(parsed.output).toBe('./gen');
    expect(parsed.language).toBe('ts');
  });
  ```

- **依存**: Task 6.1
- **完了条件**: CLIコマンドのテストがパス

### Task 6.3: 設定ファイル読み込み

- **テストファイル**: `packages/core/tests/cli/config.test.ts`
- **実装ファイル**: `packages/core/src/cli/config.ts`
- **テスト内容**:

  ```typescript
  // Red: 設定ロードのテスト
  test('should load config file', async () => {
    const config = await loadConfig('./fixtures/xcgen.config.ts');
    expect(config.input).toBeDefined();
    expect(config.output).toBeDefined();
  });
  ```

- **依存**: Task 6.2
- **完了条件**: 設定ファイル読み込みテストがパス

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

### テストスクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
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
