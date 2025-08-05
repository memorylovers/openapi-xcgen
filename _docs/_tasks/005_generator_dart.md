# タスク005: Dart生成器パッケージ作成

## 概要

OpenAPI仕様書からDartクライアントコードを生成する`@openapi-xcgen/generator-dart`パッケージを作成します。

## 前提条件

- タスク003（coreパッケージ）が完了していること
- Dart 3.0以上（Null Safety対応）の知識
- json_serializableによるシリアライゼーション方針の理解

## 実行手順

### 1. ディレクトリ構造の作成

```bash
# generator-dartパッケージのディレクトリ作成
mkdir -p packages/generator-dart/src/generators
mkdir -p packages/generator-dart/src/templates
mkdir -p packages/generator-dart/tests
mkdir -p packages/generator-dart/bin
```

### 2. package.jsonの作成

`packages/generator-dart/package.json`を作成：

```json
{
  "name": "@openapi-xcgen/generator-dart",
  "version": "0.0.0",
  "description": "Dart code generator for OpenAPI specifications",
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
    "openapi-xcgen-dart": "./bin/cli.mjs"
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
    "prettier": "^3.6.2"
  },
  "peerDependencies": {
    "openapi-types": "^12.1.3"
  }
}
```

### 3. build.config.tsの作成

`packages/generator-dart/build.config.ts`を作成：

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

`packages/generator-dart/tsconfig.json`を作成：

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

`packages/generator-dart/src/index.ts`を作成：

```typescript
export * from "./generator.js";
export * from "./types.js";
export * from "./generators/index.js";
```

`packages/generator-dart/src/types.ts`を作成：

```typescript
import type { GeneratorOptions as BaseOptions } from "@openapi-xcgen/core";

export interface DartGeneratorOptions extends BaseOptions {
  // シリアライゼーションライブラリ選択
  serialization?: "json_serializable" | "freezed";
  
  // HTTPクライアント選択
  httpClient?: "http" | "dio";
  
  // 生成するファイルの設定
  generateModels?: boolean;
  generateServices?: boolean;
  generateClient?: boolean;
  
  // Null Safety設定
  nullSafety?: boolean;
  
  // Union型の実装方法
  unionImplementation?: "sealed" | "freezed";
  
  // パッケージ名
  packageName?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface DartPackageStructure {
  name: string;
  description: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}
```

`packages/generator-dart/src/generator.ts`を作成：

```typescript
import { consola } from "consola";
import type { OpenAPIDocument } from "@openapi-xcgen/core";
import { resolveSchemas, resolvePaths } from "@openapi-xcgen/core";
import type { DartGeneratorOptions, GeneratedFile } from "./types.js";
import { generateModels } from "./generators/models.js";
import { generateServices } from "./generators/services.js";
import { generateClient } from "./generators/client.js";
import { generatePubspec } from "./generators/pubspec.js";
import { generateExports } from "./generators/exports.js";

export class DartGenerator {
  private options: Required<DartGeneratorOptions>;
  
  constructor(options: DartGeneratorOptions = {}) {
    this.options = {
      serialization: "json_serializable",
      httpClient: "http",
      generateModels: true,
      generateServices: true,
      generateClient: true,
      nullSafety: true,
      unionImplementation: "sealed",
      packageName: "openapi_client",
      ...options
    };
  }
  
  async generate(document: OpenAPIDocument): Promise<GeneratedFile[]> {
    consola.start("Generating Dart code...");
    
    const files: GeneratedFile[] = [];
    const schemas = resolveSchemas(document);
    const paths = resolvePaths(document);
    
    // pubspec.yamlの生成
    const pubspecFile = await generatePubspec(this.options, document);
    files.push(pubspecFile);
    
    // モデルクラスの生成
    if (this.options.generateModels) {
      const modelFiles = await generateModels(schemas, this.options);
      files.push(...modelFiles);
    }
    
    // APIサービスの生成
    if (this.options.generateServices) {
      const serviceFiles = await generateServices(paths, document, this.options);
      files.push(...serviceFiles);
    }
    
    // HTTPクライアントの生成
    if (this.options.generateClient) {
      const clientFile = await generateClient(this.options);
      files.push(clientFile);
    }
    
    // エクスポートファイルの生成
    const exportFiles = await generateExports(files, this.options);
    files.push(...exportFiles);
    
    consola.success(`Generated ${files.length} files`);
    return files;
  }
}
```

`packages/generator-dart/src/generators/models.ts`を作成：

```typescript
import type { ResolvedSchema } from "@openapi-xcgen/core";
import { toPascalCase, toSnakeCase } from "change-case";
import type { DartGeneratorOptions, GeneratedFile } from "../types.js";

export async function generateModels(
  schemas: ResolvedSchema[],
  options: DartGeneratorOptions
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  
  for (const { name, schema } of schemas) {
    const className = toPascalCase(name);
    const fileName = toSnakeCase(name);
    const content = generateModelContent(className, schema, options);
    
    files.push({
      path: `lib/models/${fileName}.dart`,
      content
    });
  }
  
  // models.dart（バレルファイル）
  const modelsExport = schemas
    .map(({ name }) => `export '${toSnakeCase(name)}.dart';`)
    .join("\n");
  
  files.push({
    path: "lib/models/models.dart",
    content: modelsExport
  });
  
  return files;
}

function generateModelContent(
  className: string,
  schema: any,
  options: DartGeneratorOptions
): string {
  const properties = schema.properties || {};
  const required = schema.required || [];
  
  let content = "";
  
  // インポート
  if (options.serialization === "json_serializable") {
    content += "import 'package:json_annotation/json_annotation.dart';\n\n";
    content += `part '${toSnakeCase(className)}.g.dart';\n\n`;
  }
  
  // クラスコメント
  if (schema.description) {
    content += `/// ${schema.description}\n`;
  }
  
  // アノテーション
  if (options.serialization === "json_serializable") {
    content += "@JsonSerializable()\n";
  }
  
  // クラス定義
  content += `class ${className} {\n`;
  
  // フィールド定義
  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const fieldName = toCamelCase(propName);
    const dartType = getDartType(propSchema as any, isRequired, options);
    
    if ((propSchema as any).description) {
      content += `  /// ${(propSchema as any).description}\n`;
    }
    
    if (propName !== fieldName) {
      content += `  @JsonKey(name: '${propName}')\n`;
    }
    
    content += `  final ${dartType} ${fieldName};\n\n`;
  }
  
  // コンストラクタ
  content += `  const ${className}({\n`;
  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const fieldName = toCamelCase(propName);
    content += `    ${isRequired ? "required " : ""}this.${fieldName},\n`;
  }
  content += "  });\n\n";
  
  // json_serializable用のファクトリメソッド
  if (options.serialization === "json_serializable") {
    content += `  factory ${className}.fromJson(Map<String, dynamic> json) => _$${className}FromJson(json);\n\n`;
    content += `  Map<String, dynamic> toJson() => _$${className}ToJson(this);\n`;
  }
  
  content += "}\n";
  
  return content;
}

function getDartType(schema: any, isRequired: boolean, options: DartGeneratorOptions): string {
  let baseType: string;
  
  switch (schema.type) {
    case "string":
      if (schema.enum) {
        // Enum型として別途生成する必要がある
        baseType = toPascalCase(schema.title || "StringEnum");
      } else {
        baseType = "String";
      }
      break;
    case "number":
      baseType = "double";
      break;
    case "integer":
      baseType = "int";
      break;
    case "boolean":
      baseType = "bool";
      break;
    case "array":
      const itemType = getDartType(schema.items, true, options);
      baseType = `List<${itemType}>";
      break;
    case "object":
      if (schema.additionalProperties) {
        const valueType = getDartType(schema.additionalProperties, true, options);
        baseType = `Map<String, ${valueType}>`;
      } else {
        baseType = "Map<String, dynamic>";
      }
      break;
    default:
      baseType = "dynamic";
  }
  
  // Null Safetyの処理
  if (!isRequired && options.nullSafety) {
    return `${baseType}?`;
  }
  
  return baseType;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

`packages/generator-dart/src/generators/pubspec.ts`を作成：

```typescript
import type { OpenAPIDocument } from "@openapi-xcgen/core";
import type { DartGeneratorOptions, GeneratedFile } from "../types.js";

export async function generatePubspec(
  options: DartGeneratorOptions,
  document: OpenAPIDocument
): Promise<GeneratedFile> {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  
  // 基本的な依存関係
  if (options.httpClient === "http") {
    dependencies["http"] = "^1.2.0";
  } else if (options.httpClient === "dio") {
    dependencies["dio"] = "^5.5.0";
  }
  
  if (options.serialization === "json_serializable") {
    dependencies["json_annotation"] = "^4.9.0";
    devDependencies["build_runner"] = "^2.4.0";
    devDependencies["json_serializable"] = "^6.8.0";
  }
  
  const content = `name: ${options.packageName}
description: ${document.info.description || "OpenAPI client generated by openapi-xcgen"}
version: ${document.info.version || "0.0.1"}
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
${Object.entries(dependencies).map(([name, version]) => `  ${name}: ${version}`).join("\n")}

dev_dependencies:
  lints: ^4.0.0
  test: ^1.25.0
${Object.entries(devDependencies).map(([name, version]) => `  ${name}: ${version}`).join("\n")}
`;

  return {
    path: "pubspec.yaml",
    content
  };
}
```

`packages/generator-dart/src/generators/client.ts`を作成：

```typescript
import type { DartGeneratorOptions, GeneratedFile } from "../types.js";

export async function generateClient(
  options: DartGeneratorOptions
): Promise<GeneratedFile> {
  let content = "";
  
  if (options.httpClient === "http") {
    content = generateHttpClient();
  } else if (options.httpClient === "dio") {
    content = generateDioClient();
  }
  
  return {
    path: "lib/client.dart",
    content
  };
}

function generateHttpClient(): string {
  return `import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  final Map<String, String> defaultHeaders;
  final http.Client _httpClient;
  
  ApiClient({
    required this.baseUrl,
    this.defaultHeaders = const {},
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();
  
  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse(baseUrl).replace(
      path: path,
      queryParameters: queryParams?.isEmpty ?? true ? null : queryParams,
    );
    
    final request = http.Request(method, uri);
    request.headers.addAll({
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...?headers,
    });
    
    if (body != null) {
      request.body = jsonEncode(body);
    }
    
    final streamedResponse = await _httpClient.send(request);
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: response.body,
      );
    }
  }
  
  void dispose() {
    _httpClient.close();
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  
  const ApiException({
    required this.statusCode,
    required this.message,
  });
  
  @override
  String toString() => 'ApiException: $statusCode - $message';
}
`;
}

function generateDioClient(): string {
  return `import 'package:dio/dio.dart';

class ApiClient {
  final String baseUrl;
  final Dio _dio;
  
  ApiClient({
    required this.baseUrl,
    Map<String, String>? defaultHeaders,
    Dio? dio,
  }) : _dio = dio ?? Dio() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.headers = {
      'Content-Type': 'application/json',
      ...?defaultHeaders,
    };
  }
  
  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final response = await _dio.request<Map<String, dynamic>>(
        path,
        options: Options(
          method: method,
          headers: headers,
        ),
        queryParameters: queryParams,
        data: body,
      );
      
      return response.data!;
    } on DioException catch (e) {
      throw ApiException(
        statusCode: e.response?.statusCode ?? 0,
        message: e.message ?? 'Unknown error',
      );
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  
  const ApiException({
    required this.statusCode,
    required this.message,
  });
  
  @override
  String toString() => 'ApiException: $statusCode - $message';
}
`;
}
```

### 6. CLI実装

`packages/generator-dart/src/cli.ts`を作成：

```typescript
#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { 
  createGenerateCommand, 
  createValidateCommand,
  getPackageInfo,
  writeGeneratedFiles 
} from "@openapi-xcgen/core";
import { DartGenerator } from "./generator.js";
import { consola } from "consola";

const pkg = await getPackageInfo("../package.json");

const generateCommand = createGenerateCommand({
  name: "generate",
  description: "Generate Dart client code from OpenAPI specification",
  additionalArgs: {
    serialization: {
      type: "string",
      description: "Serialization library (json_serializable, freezed)",
      default: "json_serializable",
    },
    httpClient: {
      type: "string",
      description: "HTTP client library (http, dio)",
      default: "http",
    },
    nullSafety: {
      type: "boolean",
      description: "Enable Null Safety (default: true)",
      default: true,
    },
    packageName: {
      type: "string",
      description: "Dart package name",
      default: "openapi_client",
    },
  },
  async generator(document, args) {
    const generator = new DartGenerator({
      outputPath: args.output,
      serialization: args.serialization,
      httpClient: args.httpClient,
      nullSafety: args.nullSafety,
      packageName: args.packageName,
    });
    
    const files = await generator.generate(document);
    await writeGeneratedFiles(files, args.output);
    
    consola.info(`Generated ${files.length} Dart files`);
    consola.info("\nNext steps:");
    consola.info("1. cd " + args.output);
    consola.info("2. dart pub get");
    if (args.serialization === "json_serializable") {
      consola.info("3. dart run build_runner build");
    }
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

`packages/generator-dart/bin/cli.mjs`を作成：

```javascript
#!/usr/bin/env node
import "../dist/cli.mjs";
```

### 7. 実装完了後の検証

```bash
# generator-dartパッケージに移動
cd packages/generator-dart

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
openapi-xcgen-dart --help
openapi-xcgen-dart generate --help
```

## 次のステップ

このタスクが完了したら、各パッケージが独立して動作することを確認します。統合CLIは必要に応じて後で追加できます。

## 注意事項

- Dart 3.0以上のNull Safety対応を前提
- json_serializableを使用する場合はbuild_runnerが必要
- Sealed classはDart 3.0の新機能
- 生成されたDartコードは`dart format`でフォーマット推奨
