# タスク004: TypeScript生成器パッケージ作成

## 概要

OpenAPI仕様書からTypeScriptクライアントコードを生成する`@openapi-xcgen/generator-typescript`パッケージを作成します。

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

### 5. 基本的なソースコード構造

`packages/generator-typescript/src/index.ts`を作成：

```typescript
export * from "./generator.js";
export * from "./types.js";
export * from "./generators/index.js";
```

`packages/generator-typescript/src/types.ts`を作成：

```typescript
import type { GeneratorOptions as BaseOptions } from "@openapi-xcgen/core";

export interface TypeScriptGeneratorOptions extends BaseOptions {
  // バリデーションライブラリ選択（将来的にzod対応）
  validator?: "valibot" | "zod";
  
  // Fetch関数のカスタマイズ
  fetchImplementation?: string;
  
  // 生成するファイルの設定
  generateModels?: boolean;
  generateSchemas?: boolean;
  generateServices?: boolean;
  generateClient?: boolean;
  
  // 型生成のオプション
  enumStyle?: "enum" | "union" | "const";
  dateType?: "string" | "Date";
  
  // Tree-shaking最適化
  treeShakable?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}
```

`packages/generator-typescript/src/generator.ts`を作成：

```typescript
import { consola } from "consola";
import type { OpenAPIDocument } from "@openapi-xcgen/core";
import { resolveSchemas, resolvePaths } from "@openapi-xcgen/core";
import type { TypeScriptGeneratorOptions, GeneratedFile } from "./types.js";
import { generateModels } from "./generators/models.js";
import { generateSchemas } from "./generators/schemas.js";
import { generateServices } from "./generators/services.js";
import { generateClient } from "./generators/client.js";
import { generateIndex } from "./generators/index-file.js";

export class TypeScriptGenerator {
  private options: Required<TypeScriptGeneratorOptions>;
  
  constructor(options: TypeScriptGeneratorOptions = {}) {
    this.options = {
      validator: "valibot",
      fetchImplementation: "fetch",
      generateModels: true,
      generateSchemas: true,
      generateServices: true,
      generateClient: true,
      enumStyle: "union",
      dateType: "string",
      treeShakable: true,
      ...options
    };
  }
  
  async generate(document: OpenAPIDocument): Promise<GeneratedFile[]> {
    consola.start("Generating TypeScript code...");
    
    const files: GeneratedFile[] = [];
    const schemas = resolveSchemas(document);
    const paths = resolvePaths(document);
    
    // モデル（型定義）の生成
    if (this.options.generateModels) {
      const modelFiles = await generateModels(schemas, this.options);
      files.push(...modelFiles);
    }
    
    // Valibotスキーマの生成
    if (this.options.generateSchemas) {
      const schemaFiles = await generateSchemas(schemas, this.options);
      files.push(...schemaFiles);
    }
    
    // APIサービス（関数）の生成
    if (this.options.generateServices) {
      const serviceFiles = await generateServices(paths, document, this.options);
      files.push(...serviceFiles);
    }
    
    // クライアント基盤の生成
    if (this.options.generateClient) {
      const clientFile = await generateClient(this.options);
      files.push(clientFile);
    }
    
    // インデックスファイルの生成
    const indexFile = await generateIndex(files, this.options);
    files.push(indexFile);
    
    consola.success(`Generated ${files.length} files`);
    return files;
  }
}
```

`packages/generator-typescript/src/generators/models.ts`を作成：

```typescript
import type { ResolvedSchema } from "@openapi-xcgen/core";
import { toPascalCase } from "@openapi-xcgen/core";
import type { TypeScriptGeneratorOptions, GeneratedFile } from "../types.js";

export async function generateModels(
  schemas: ResolvedSchema[],
  options: TypeScriptGeneratorOptions
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  
  for (const { name, schema } of schemas) {
    const modelName = toPascalCase(name);
    const content = generateModelContent(modelName, schema, options);
    
    files.push({
      path: `models/${modelName}.ts`,
      content
    });
  }
  
  // models/index.ts
  const indexContent = schemas
    .map(({ name }) => `export * from "./${toPascalCase(name)}.js";`)
    .join("\n");
  
  files.push({
    path: "models/index.ts",
    content: indexContent
  });
  
  return files;
}

function generateModelContent(
  name: string,
  schema: any,
  options: TypeScriptGeneratorOptions
): string {
  const properties = schema.properties || {};
  const required = schema.required || [];
  
  let content = `/**\n * ${schema.description || name}\n */\n`;
  content += `export interface ${name} {\n`;
  
  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const optionalMark = isRequired ? "" : "?";
    const propType = getTypeScriptType(propSchema as any, options);
    
    if ((propSchema as any).description) {
      content += `  /** ${(propSchema as any).description} */\n`;
    }
    content += `  ${propName}${optionalMark}: ${propType};\n`;
  }
  
  content += "}\n";
  
  return content;
}

function getTypeScriptType(schema: any, options: TypeScriptGeneratorOptions): string {
  switch (schema.type) {
    case "string":
      if (schema.enum && options.enumStyle === "union") {
        return schema.enum.map((v: string) => `"${v}"`).join(" | ");
      }
      if (schema.format === "date-time" && options.dateType === "Date") {
        return "Date";
      }
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `${getTypeScriptType(schema.items, options)}[]`;
    case "object":
      return "Record<string, unknown>";
    default:
      return "unknown";
  }
}
```

`packages/generator-typescript/src/generators/client.ts`を作成：

```typescript
import type { TypeScriptGeneratorOptions, GeneratedFile } from "../types.js";

export async function generateClient(
  options: TypeScriptGeneratorOptions
): Promise<GeneratedFile> {
  const content = `
export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  onError?: (error: ApiError) => void;
}

export interface ApiError {
  status: number;
  statusText: string;
  body: unknown;
  headers: Record<string, string>;
}

let config: ClientConfig = {
  baseUrl: "",
  fetch: ${options.fetchImplementation || "globalThis.fetch"}
};

export function createApiConfig(newConfig: Partial<ClientConfig>) {
  config = { ...config, ...newConfig };
}

export async function request<T>(
  method: string,
  path: string,
  options?: {
    params?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const url = new URL(path, config.baseUrl);
  
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  const response = await (config.fetch || fetch)(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
      ...options?.headers
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      statusText: response.statusText,
      body: await response.json().catch(() => null),
      headers: Object.fromEntries(response.headers.entries())
    };
    
    if (config.onError) {
      config.onError(error);
    }
    
    throw error;
  }
  
  return response.json();
}
`.trim();

  return {
    path: "client.ts",
    content
  };
}
```

### 6. CLI実装

`packages/generator-typescript/src/cli.ts`を作成：

```typescript
#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { 
  createGenerateCommand, 
  createValidateCommand,
  getPackageInfo,
  writeGeneratedFiles 
} from "@openapi-xcgen/core";
import { TypeScriptGenerator } from "./generator.js";
import { consola } from "consola";

const pkg = await getPackageInfo("../package.json");

const generateCommand = createGenerateCommand({
  name: "generate",
  description: "Generate TypeScript client code from OpenAPI specification",
  additionalArgs: {
    validator: {
      type: "string",
      description: "Validator library (valibot, zod)",
      default: "valibot",
    },
    enumStyle: {
      type: "string",
      description: "Enum style (enum, union, const)",
      default: "union",
    },
    dateType: {
      type: "string",
      description: "Date type (string, Date)",
      default: "string",
    },
  },
  async generator(document, args) {
    const generator = new TypeScriptGenerator({
      outputPath: args.output,
      validator: args.validator,
      enumStyle: args.enumStyle,
      dateType: args.dateType,
    });
    
    const files = await generator.generate(document);
    await writeGeneratedFiles(files, args.output);
    
    consola.info(`Generated ${files.length} TypeScript files`);
  },
});

const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List all endpoints in OpenAPI specification",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to OpenAPI specification file",
      required: true,
    },
  },
  async run({ args }) {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("pathe");
    const { parseOpenAPIDocument, resolvePaths } = await import("@openapi-xcgen/core");
    
    try {
      const inputPath = resolve(args.input);
      const spec = await readFile(inputPath, "utf-8");
      
      const document = await parseOpenAPIDocument(spec);
      const paths = resolvePaths(document);
      
      consola.info(`Found ${paths.length} endpoints:\n`);
      
      for (const { method, path, operation } of paths) {
        const operationId = operation.operationId || "(no operationId)";
        const summary = operation.summary || "";
        consola.log(`  ${method.toUpperCase().padEnd(7)} ${path.padEnd(40)} ${operationId} ${summary ? `- ${summary}` : ""}`);
      }
    } catch (error) {
      consola.error("Failed to list endpoints:", error);
      process.exit(1);
    }
  },
});

const main = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    generate: generateCommand,
    validate: createValidateCommand(),
    list: listCommand,
  },
});

runMain(main).catch((error) => {
  consola.error(error);
  process.exit(1);
});
```

`packages/generator-typescript/bin/cli.mjs`を作成：

```javascript
#!/usr/bin/env node
import "../dist/cli.mjs";
```

### 7. テンプレートシステム（オプション）

Handlebarsを使用したテンプレート例：

`packages/generator-typescript/src/templates/model.hbs`：

```handlebars
/**
 * {{description}}
 */
export interface {{name}} {
{{#each properties}}
  {{#if description}}
  /** {{description}} */
  {{/if}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}
```

### 8. 実装完了後の検証

```bash
# generator-typescriptパッケージに移動
cd packages/generator-typescript

# 依存関係のインストール
pnpm install

# ビルド
pnpm build

# 型チェック
pnpm typecheck

# テスト実行
pnpm test

# CLIの動作確認
pnpm link --global
openapi-xcgen-ts --help
openapi-xcgen-ts generate --help
```

## 次のステップ

このタスクが完了したら、次は`005_generator_dart.md`に進んでDart生成器を作成します。

## 注意事項

- Tree-shaking対応のため、関数ベースのエクスポートを使用
- Valibotスキーマは別ファイルに生成（schemasディレクトリ）
- 各APIエンドポイントは個別の関数として生成
- エラーハンドリングはシンプルなオブジェクトベース
