# タスク003: Coreパッケージ作成

## 概要

OpenAPIのパース、バリデーション、CLI基盤機能、および共通ユーティリティを提供する`@openapi-xcgen/core`パッケージを作成します。

## 前提条件

- タスク001、002が完了していること
- packagesディレクトリが作成可能な状態であること

## 実行手順

### 1. ディレクトリ構造の作成

```bash
# coreパッケージのディレクトリ作成
mkdir -p packages/core/src/cli
mkdir -p packages/core/src/utils
mkdir -p packages/core/tests
```

### 2. package.jsonの作成

`packages/core/package.json`を作成：

```json
{
  "name": "@openapi-xcgen/core",
  "version": "0.0.0",
  "description": "Core utilities for OpenAPI code generation",
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
  "files": [
    "dist"
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
    "@apidevtools/swagger-parser": "^10.1.0",
    "@types/json-schema": "^7.0.15",
    "citty": "^0.1.6",
    "consola": "^3.4.2",
    "defu": "^6.1.4",
    "pathe": "^1.1.2"
  },
  "devDependencies": {
    "@types/node": "^24.1.0",
    "typescript": "^5.8.3",
    "unbuild": "^3.6.0",
    "vitest": "^3.2.4",
    "prettier": "^3.6.2"
  },
  "peerDependencies": {
    "openapi-types": "^12.1.3"
  }
}
```

### 3. build.config.tsの作成

`packages/core/build.config.ts`を作成：

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
  entries: ["src/index"],
  externals: ["@apidevtools/swagger-parser", "openapi-types", "citty"],
});
```

### 4. tsconfig.jsonの作成

`packages/core/tsconfig.json`を作成：

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

### 5. 基本的なソースコード構造

`packages/core/src/index.ts`を作成：

```typescript
// Main exports
export * from "./parser.js";
export * from "./validator.js";
export * from "./resolver.js";
export * from "./types.js";
export * from "./utils/index.js";
export * from "./cli/index.js";
```

`packages/core/src/types.ts`を作成：

```typescript
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

export interface ParserOptions {
  validate?: boolean;
  dereference?: boolean;
  bundle?: boolean;
}

export interface GeneratorContext {
  document: OpenAPIDocument;
  options: GeneratorOptions;
}

export interface GeneratorOptions {
  outputPath?: string;
  baseURL?: string;
  headers?: Record<string, string>;
}
```

`packages/core/src/parser.ts`を作成：

```typescript
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIDocument, ParserOptions } from "./types.js";
import { consola } from "consola";

export async function parseOpenAPIDocument(
  input: string | OpenAPIDocument,
  options: ParserOptions = {}
): Promise<OpenAPIDocument> {
  try {
    const parser = new SwaggerParser();
    
    if (options.validate !== false) {
      await parser.validate(input as any);
    }
    
    let document: OpenAPIDocument;
    
    if (options.dereference) {
      document = await parser.dereference(input as any) as OpenAPIDocument;
    } else if (options.bundle) {
      document = await parser.bundle(input as any) as OpenAPIDocument;
    } else {
      document = await parser.parse(input as any) as OpenAPIDocument;
    }
    
    consola.success("OpenAPI document parsed successfully");
    return document;
  } catch (error) {
    consola.error("Failed to parse OpenAPI document:", error);
    throw error;
  }
}
```

`packages/core/src/validator.ts`を作成：

```typescript
import type { OpenAPIDocument } from "./types.js";
import { consola } from "consola";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  path: string;
  message: string;
  severity: "warning";
}

export function validateOpenAPIDocument(
  document: OpenAPIDocument
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Basic validation checks
  if (!document.openapi) {
    errors.push({
      path: "/openapi",
      message: "Missing required field 'openapi'",
      severity: "error"
    });
  }
  
  if (!document.info) {
    errors.push({
      path: "/info",
      message: "Missing required field 'info'",
      severity: "error"
    });
  }
  
  if (!document.paths || Object.keys(document.paths).length === 0) {
    warnings.push({
      path: "/paths",
      message: "No paths defined in the document",
      severity: "warning"
    });
  }
  
  const valid = errors.length === 0;
  
  if (valid) {
    consola.success("OpenAPI document is valid");
  } else {
    consola.error(`Found ${errors.length} validation errors`);
  }
  
  return { valid, errors, warnings };
}
```

`packages/core/src/resolver.ts`を作成：

```typescript
import type { OpenAPIDocument } from "./types.js";

export interface ResolvedSchema {
  name: string;
  schema: any;
  path: string;
}

export function resolveSchemas(document: OpenAPIDocument): ResolvedSchema[] {
  const schemas: ResolvedSchema[] = [];
  
  // Extract schemas from components
  if (document.components?.schemas) {
    for (const [name, schema] of Object.entries(document.components.schemas)) {
      schemas.push({
        name,
        schema,
        path: `#/components/schemas/${name}`
      });
    }
  }
  
  return schemas;
}

export function resolvePaths(document: OpenAPIDocument) {
  const paths = [];
  
  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    const methods = ["get", "post", "put", "delete", "patch", "options", "head"] as const;
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        paths.push({
          path,
          method,
          operation,
          operationId: operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`
        });
      }
    }
  }
  
  return paths;
}
```

`packages/core/src/utils/index.ts`を作成：

```typescript
export * from "./string.js";
export * from "./case.js";
```

`packages/core/src/utils/string.ts`を作成：

```typescript
export function sanitizeIdentifier(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
```

`packages/core/src/utils/case.ts`を作成：

```typescript
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
```

### 6. CLI基盤機能の実装

`packages/core/src/cli/index.ts`を作成：

```typescript
export * from "./commands.js";
export * from "./utils.js";
```

`packages/core/src/cli/commands.ts`を作成：

```typescript
import { defineCommand } from "citty";
import { consola } from "consola";
import { readFile } from "node:fs/promises";
import { resolve } from "pathe";
import { parseOpenAPIDocument } from "../parser.js";
import type { OpenAPIDocument } from "../types.js";

export interface BaseGenerateArgs {
  input: string;
  output: string;
  config?: string;
}

/**
 * 共通のgenerate コマンド定義を作成するヘルパー
 */
export function createGenerateCommand(options: {
  name: string;
  description: string;
  generator: (document: OpenAPIDocument, args: any) => Promise<void>;
  additionalArgs?: Record<string, any>;
}) {
  return defineCommand({
    meta: {
      name: options.name,
      description: options.description,
    },
    args: {
      input: {
        type: "positional",
        description: "Path to OpenAPI specification file (YAML/JSON)",
        required: true,
      },
      output: {
        type: "string",
        alias: "o",
        description: "Output directory",
        default: "./generated",
      },
      config: {
        type: "string",
        alias: "c",
        description: "Path to configuration file",
      },
      ...options.additionalArgs,
    },
    async run({ args }) {
      try {
        consola.start("Starting code generation...");
        
        // OpenAPI仕様書の読み込み
        const inputPath = resolve(args.input);
        const spec = await readFile(inputPath, "utf-8");
        
        // パースとバリデーション
        const document = await parseOpenAPIDocument(spec, {
          validate: true,
          dereference: true,
        });
        
        // 生成器の実行
        await options.generator(document, args);
        
        consola.success("Code generation completed!");
      } catch (error) {
        consola.error("Code generation failed:", error);
        process.exit(1);
      }
    },
  });
}

/**
 * 共通のvalidateコマンド定義
 */
export const createValidateCommand = () => defineCommand({
  meta: {
    name: "validate",
    description: "Validate OpenAPI specification",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to OpenAPI specification file",
      required: true,
    },
  },
  async run({ args }) {
    try {
      consola.start("Validating OpenAPI specification...");
      
      const inputPath = resolve(args.input);
      const spec = await readFile(inputPath, "utf-8");
      
      const document = await parseOpenAPIDocument(spec, {
        validate: true,
        bundle: true,
      });
      
      consola.success("OpenAPI specification is valid!");
      process.exit(0);
    } catch (error) {
      consola.error("Validation failed:", error);
      process.exit(1);
    }
  },
});
```

`packages/core/src/cli/utils.ts`を作成：

```typescript
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "pathe";
import { consola } from "consola";

export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * 生成されたファイルを書き込むユーティリティ
 */
export async function writeGeneratedFiles(
  files: GeneratedFile[],
  outputDir: string
): Promise<void> {
  for (const file of files) {
    const filePath = resolve(outputDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf-8");
    consola.success(`Generated: ${file.path}`);
  }
}

/**
 * パッケージ情報を取得するユーティリティ
 */
export async function getPackageInfo(packagePath: string) {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve: pathResolve, dirname: pathDirname } = await import("pathe");
  
  const __dirname = pathDirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(pathResolve(__dirname, packagePath), "utf-8")
  );
  
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  };
}
```

### 7. テストの作成

`packages/core/vitest.config.ts`を作成：

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

### 7. 実装完了後の検証

```bash
# coreパッケージに移動
cd packages/core

# 依存関係のインストール
pnpm install

# ビルド
pnpm build

# 型チェック
pnpm typecheck

# テスト実行
pnpm test
```

## 次のステップ

このタスクが完了したら、次は`004_generator_typescript.md`に進んでTypeScript生成器を作成します。

## 注意事項

- ESM/CJS両対応のため、importには`.js`拡張子を付ける
- 外部依存は最小限に抑える
- 型定義は`openapi-types`パッケージを使用
- エラーハンドリングは適切に行い、consolaでログ出力
- CLI基盤機能はcittyを使用し、各generatorパッケージで再利用可能
