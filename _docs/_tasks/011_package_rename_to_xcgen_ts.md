# タスク11: パッケージ名変更 (generator-typescript → xcgen-ts)

## 目的

- CLIコマンド名とパッケージ名を一致させる
- 将来的な多言語サポート（Dart等）の準備
- ユーザーにとってわかりやすい命名

## 現状

```
パッケージ名: @openapi-xcgen/generator-typescript
CLIコマンド: xcgen-ts
インストール: npm install --save-dev @openapi-xcgen/generator-typescript
```

## 変更後

```
パッケージ名: @openapi-xcgen/xcgen-ts
CLIコマンド: xcgen-ts（変更なし）
インストール: npm install --save-dev @openapi-xcgen/xcgen-ts
```

## 実装ステップ

### Phase 1: ディレクトリとパッケージ名変更

- [ ] ディレクトリ名変更
  - `packages/generator-typescript/` → `packages/xcgen-ts/`

- [ ] package.json 更新
  - `name`: `@openapi-xcgen/generator-typescript` → `@openapi-xcgen/xcgen-ts`
  - `bin` は変更なし（`xcgen-ts` のまま）

- [ ] 依存パッケージの更新
  - `packages/core/package.json` は変更なし
  - 他のパッケージで `@openapi-xcgen/generator-typescript` を参照している箇所を修正

- [ ] ワークスペース設定更新
  - `pnpm-workspace.yaml` の確認（glob パターンなら自動対応）
  - `package.json` の `scripts` で直接パス指定している箇所を修正

### Phase 2: ドキュメント更新

- [ ] README.md 更新

  ```bash
  # Before
  npm install --save-dev @openapi-xcgen/generator-typescript

  # After
  npm install --save-dev @openapi-xcgen/xcgen-ts
  ```

- [ ] README.ja.md 更新（同上）

- [ ] _guides/spec.md/ja.md 更新
  - パッケージ名の言及箇所を修正

- [ ] _guides/README.md 更新
  - パッケージパスの確認

- [ ] examples/ 更新
  - `examples/petstore/package.json`
  - `examples/train-travel/package.json`
  - インストール手順のコメント等

### Phase 3: 設定ファイル・CI/CD 更新

- [ ] GitHub Actions ワークフロー確認
  - パッケージパスを直接参照している箇所

- [ ] CLAUDE.md 更新
  - パッケージ一覧の記載

- [ ] LICENSE / package.json メタデータ確認

### Phase 4: テスト・検証

- [ ] pnpm install で依存関係が正しく解決されるか
- [ ] pnpm build で全パッケージがビルドできるか
- [ ] pnpm test で全テストが通るか
- [ ] CLI が正しく動作するか

  ```bash
  cd packages/xcgen-ts
  node bin/cli.mjs -i ../../examples/petstore/openapi.yaml -o /tmp/test
  ```

### Phase 5: npm公開準備

- [ ] npm publish 前の確認事項
  - package.json の `publishConfig` 設定
  - `.npmignore` または `files` フィールドの確認
  - README.md がパッケージに含まれるか

- [ ] npm organization 確認
  - `@openapi-xcgen` scope の権限確認

## 影響範囲

### 破壊的変更

- ✅ **既存ユーザーへの影響なし**: まだnpmに公開していないため

### 互換性

- ✅ CLIコマンド名は変更なし（`xcgen-ts` のまま）
- ✅ 生成されるコードは変更なし

## チェックリスト

- [ ] ディレクトリ名変更
- [ ] package.json 更新
- [ ] 依存関係の更新
- [ ] ドキュメント更新（README, guides）
- [ ] サンプルコード更新（examples/）
- [ ] 設定ファイル更新
- [ ] ビルド・テスト確認
- [ ] CLI動作確認

## 将来の拡張

この変更により、以下の拡張が容易になります：

```
packages/
  ├── core/              # @openapi-xcgen/core（内部ライブラリ）
  ├── xcgen-ts/          # @openapi-xcgen/xcgen-ts（TypeScript CLI）
  ├── xcgen-dart/        # @openapi-xcgen/xcgen-dart（Dart CLI、将来）
  └── xcgen-go/          # @openapi-xcgen/xcgen-go（Go CLI、将来）
```

各言語のCLIは独立したパッケージとして公開可能。

## 参考

類似プロジェクトの命名例：

- `@prisma/cli` → `prisma` コマンド
- `@nestjs/cli` → `nest` コマンド
- `@angular/cli` → `ng` コマンド

本プロジェクトは：

- `@openapi-xcgen/xcgen-ts` → `xcgen-ts` コマンド
- `@openapi-xcgen/xcgen-dart` → `xcgen-dart` コマンド（将来）
