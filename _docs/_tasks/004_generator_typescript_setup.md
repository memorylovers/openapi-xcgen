# タスク004: TypeScript生成器環境構築

## 概要

OpenAPI仕様書からTypeScriptクライアントコードを生成する`@openapi-xcgen/generator-typescript`パッケージの環境構築を行います。

## 前提条件

- タスク003（coreパッケージ）が完了していること
- Valibotによるランタイムバリデーションの実装方針が決定していること

## 実行手順

### 1. ディレクトリ構造の作成

```bash
# generator-typescriptパッケージのディレクトリ作成
mkdir -p packages/generator-typescript/src/generators
mkdir -p packages/generator-typescript/src/templates
mkdir -p packages/generator-typescript/tests
mkdir -p packages/generator-typescript/bin
```

### 2. package.jsonの作成

`packages/generator-typescript/package.json`を作成：

```json
{
  "name": "@openapi-xcgen/generator-typescript",
  "version": "0.0.0",
  "description": "TypeScript code generator for OpenAPI specifications",
  "author": "Memory Lovers, LLC<https://github.com/memorylovers>",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "openapi-xcgen-ts": "./bin/cli.mjs"
  },
  "files": [
    "dist",
    "bin"
  ],
  "scripts": {
    "dev": "unbuild --stub",
    "build": "unbuild",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "prettier --check .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@openapi-xcgen/core": "workspace:*",
    "change-case": "^5.4.4",
    "consola": "^3.4.2",
    "defu": "^6.1.4",
    "handlebars": "^4.7.8"
  },
  "devDependencies": {
    "@types/node": "^24.1.0",
    "typescript": "^5.8.3",
    "unbuild": "^3.6.0",
    "vitest": "^3.2.4",
    "prettier": "^3.6.2",
    "valibot": "^1.0.0-beta.8"
  },
  "peerDependencies": {
    "openapi-types": "^12.1.3"
  }
}
```

### 3. build.config.tsの作成

`packages/generator-typescript/build.config.ts`を作成：

```typescript
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
    },
  },
  entries: ["src/index", "src/cli"],
  externals: ["@openapi-xcgen/core", "openapi-types"],
});
```

### 4. tsconfig.jsonの作成

`packages/generator-typescript/tsconfig.json`を作成：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 5. エントリーポイントの作成

`packages/generator-typescript/src/index.ts`を作成：

```typescript
// Main exports
// TODO: Implementation will be added in a separate task
```

### 6. 依存関係のインストール

```bash
cd packages/generator-typescript
pnpm install
```

## 検証

- ディレクトリ構造が正しく作成されていること
- package.jsonが正しく設定されていること
- 依存関係がインストールされていること
- TypeScript設定が正しいこと

## 次のステップ

このタスクが完了したら、タスク010でTypeScript生成器の実装を行います。
