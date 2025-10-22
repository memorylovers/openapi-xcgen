/**
 * 生成コード型チェックテスト
 *
 * 生成されたTypeScriptコードがTypeScript型チェックを通過することを検証します。
 * これにより、生成コードが実際にコンパイル可能であり、ランタイムエラーを防ぐことができることを保証します。
 *
 * 各fixtureごとに3つのテストパターン:
 * 1. expected/ファイルの型チェック（高速）
 * 2. 生成コード（validator無し）の型チェック
 * 3. 生成コード（valibot）の型チェック
 */

import { describe, it, beforeAll, afterAll } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { generate } from "../../src/generator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Helper: expected/ディレクトリの型チェック
 */
async function typeCheckExpectedFiles(fixture: string): Promise<void> {
  const expectedDir = join(__dirname, "fixtures", fixture, "expected");

  try {
    execSync("pnpm exec tsc --noEmit", {
      cwd: expectedDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // eslint-disable-next-line no-undef
    console.error(
      `\n❌ TypeScript errors in ${fixture}:`,
      error.stderr || error.stdout,
    );
    throw new Error(
      `Type checking failed for ${fixture}\n${error.stderr || error.stdout}`,
    );
  }
}

/**
 * Helper: 生成コードの型チェック
 */
async function typeCheckGeneratedCode(
  fixture: string,
  tempDir: string,
  validator?: "valibot",
): Promise<void> {
  const fixtureDir = join(__dirname, "fixtures", fixture);
  const inputPath = join(fixtureDir, "openapi.yaml");
  const fixtureName = fixture.replace(/\//g, "-");
  const suffix = validator ? `-${validator}` : "-no-validator";
  const outputDir = join(tempDir, `${fixtureName}${suffix}`);

  // Generate TypeScript code
  await generate({
    input: inputPath,
    output: outputDir,
    validator,
  });

  // Create tsconfig.json
  const tsconfigPath = join(outputDir, "tsconfig.json");
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      lib: ["ES2020", "DOM"],
    },
    include: ["*.ts"],
  };
  await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  // Create package.json
  const packageJsonPath = join(outputDir, "package.json");
  const packageJson = {
    name: "generated-test",
    version: "0.0.0",
    private: true,
    type: "module",
    dependencies: validator
      ? {
          valibot: "^1.0.0",
          typescript: "^5.8.0",
        }
      : {
          typescript: "^5.8.0",
        },
  };
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Install dependencies
  execSync("pnpm install --no-lockfile", {
    cwd: outputDir,
    stdio: "pipe",
  });

  // Run TypeScript compiler
  try {
    execSync("pnpm exec tsc --noEmit", {
      cwd: outputDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const label = validator ? `${fixture} (${validator})` : fixture;
    // eslint-disable-next-line no-undef
    console.error(
      `\n❌ TypeScript errors in ${label}:`,
      error.stderr || error.stdout,
    );
    throw new Error(
      `Type checking failed for ${label}\n${error.stderr || error.stdout}`,
    );
  }
}

/**
 * Type Check Tests
 */
describe("Type Check Tests", () => {
  const tempDir = join(tmpdir(), `xcgen-typecheck-${Date.now()}`);

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // general/petstore
  describe("general/petstore", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("general/petstore");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("general/petstore", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("general/petstore", tempDir, "valibot");
    });
  });

  // general/readonly-writeonly
  describe("general/readonly-writeonly", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("general/readonly-writeonly");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("general/readonly-writeonly", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode(
        "general/readonly-writeonly",
        tempDir,
        "valibot",
      );
    });
  });

  // general/allof
  describe("general/allof", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("general/allof");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("general/allof", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("general/allof", tempDir, "valibot");
    });
  });

  // general/complex-schema
  describe("general/complex-schema", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("general/complex-schema");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("general/complex-schema", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode(
        "general/complex-schema",
        tempDir,
        "valibot",
      );
    });
  });

  // models/data-types
  describe("models/data-types", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/data-types");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/data-types", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("models/data-types", tempDir, "valibot");
    });
  });

  // models/complex-structures
  describe("models/complex-structures", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/complex-structures");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/complex-structures", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode(
        "models/complex-structures",
        tempDir,
        "valibot",
      );
    });
  });

  // models/ref-model
  describe("models/ref-model", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/ref-model");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/ref-model", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("models/ref-model", tempDir, "valibot");
    });
  });

  // models/nullable-model
  describe("models/nullable-model", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/nullable-model");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/nullable-model", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("models/nullable-model", tempDir, "valibot");
    });
  });

  // models/validation-model
  describe("models/validation-model", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/validation-model");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/validation-model", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode(
        "models/validation-model",
        tempDir,
        "valibot",
      );
    });
  });

  // models/metadata-model
  describe("models/metadata-model", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/metadata-model");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/metadata-model", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("models/metadata-model", tempDir, "valibot");
    });
  });

  // models/inline-schemas
  describe("models/inline-schemas", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("models/inline-schemas");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("models/inline-schemas", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("models/inline-schemas", tempDir, "valibot");
    });
  });

  // validation
  describe("validation", () => {
    it("should type-check expected files", async () => {
      await typeCheckExpectedFiles("validation");
    });

    it("should pass type checking for generated code (without validator)", async () => {
      await typeCheckGeneratedCode("validation", tempDir);
    });

    it("should pass type checking for generated code (with valibot)", async () => {
      await typeCheckGeneratedCode("validation", tempDir, "valibot");
    });
  });
});
