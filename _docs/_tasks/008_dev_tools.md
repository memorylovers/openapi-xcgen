# タスク008: 開発ツール設定

## 概要

モノレポ全体で使用する開発ツール（ESLint、Prettier、Vitest等）を設定します。

## ステータス

- 状態: 未実施

## 前提条件

- 基本的なパッケージ構造が完成していること
- Node.js v20以上がインストールされていること

## 実行手順

### 1. ESLintの設定

ルートに`.eslintrc.cjs`を作成：

```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "import"],
  rules: {
    // TypeScript
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ],
    
    // Import
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      },
    ],
    
    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
  },
  ignorePatterns: [
    "dist",
    "build",
    "coverage",
    "node_modules",
    "*.config.js",
    "*.config.ts",
    "*.config.mjs",
    "*.config.cjs",
  ],
};
```

### 2. Prettierの設定

既存の`.prettierrc`を確認し、必要に応じて更新：

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`を作成：

```
# Dependencies
node_modules
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build outputs
dist
build
coverage
.turbo
*.tsbuildinfo

# Generated files
*.generated.ts
*.g.dart

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db
```

### 3. Husky & lint-stagedの設定（オプション）

コミット時の自動チェックを設定：

```bash
# Huskyとlint-stagedのインストール
pnpm add -D husky lint-staged
```

`package.json`に追加：

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mjs,cjs}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

Huskyの初期化：

```bash
pnpm prepare
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

### 4. Vitestの設定

ルートに`vitest.config.mts`を作成：

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/types.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: {
      "@openapi-xcgen/core": resolve(__dirname, "./packages/core/src"),
      "@openapi-xcgen/generator-typescript": resolve(
        __dirname,
        "./packages/generator-typescript/src"
      ),
      "@openapi-xcgen/generator-dart": resolve(
        __dirname,
        "./packages/generator-dart/src"
      ),
    },
  },
});
```

### 5. CI/CD設定（GitHub Actions）

`.github/workflows/ci.yml`を作成：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 10.13.1
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "pnpm"
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Typecheck
        run: pnpm typecheck:all
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build

  release:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 10.13.1
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: "pnpm"
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Create Release Pull Request
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 6. Changesets設定（バージョン管理）

```bash
# Changesetsのインストール
pnpm add -D @changesets/cli
```

初期化：

```bash
pnpm changeset init
```

`.changeset/config.json`を更新：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### 7. devDependenciesの追加

ルートの`package.json`に必要な開発依存関係を追加：

```bash
pnpm add -D \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  eslint-config-prettier \
  eslint-plugin-import \
  @changesets/cli \
  vitest \
  @vitest/coverage-v8
```

### 8. スクリプトの統合

ルートの`package.json`のscriptsセクションを更新：

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:coverage": "vitest run --coverage",
    "typecheck": "turbo typecheck",
    "typecheck:all": "tsc --build",
    "lint": "turbo lint && eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "turbo format && prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo build && changeset publish"
  }
}
```

### 9. エディタ設定

`.editorconfig`を作成：

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
```

## 検証

以下のコマンドで設定が正しく機能することを確認：

```bash
# Lint実行
pnpm lint

# フォーマット実行
pnpm format

# テスト実行
pnpm test

# カバレッジ付きテスト
pnpm test:coverage

# 全体ビルド
pnpm build
```

## 次のステップ

すべてのタスクが完了しました！以下を実行してプロジェクトを開始できます：

1. タスク001から順番に実行
2. 各パッケージの実装を進める
3. テストを追加
4. ドキュメントを整備

## 注意事項

- ESLintとPrettierの設定は競合しないように調整済み
- Huskyは`prepare`スクリプトで自動的にインストールされる
- Changesetsを使用してバージョン管理とリリースを自動化
- CI/CDパイプラインでコード品質を保証
