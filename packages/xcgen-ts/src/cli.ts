/**
 * CLI entry point for TypeScript generator
 *
 * @module @openapi-xcgen/generator-typescript/cli
 */

import { loadConfig } from "c12";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { defu } from "defu";
import process from "node:process";
import pkg from "../package.json";
import { generate } from "./generator";
import type { GeneratorOptions } from "./types";

/**
 * メインCLIコマンド
 */
const main = defineCommand({
  meta: {
    name: "xcgen-ts",
    version: pkg.version,
    description: pkg.description,
  },
  args: {
    input: {
      type: "string",
      alias: "i",
      description: "Input OpenAPI file path (YAML or JSON)",
      required: false,
    },
    output: {
      type: "string",
      alias: "o",
      description: "Output directory path",
      required: false,
    },
    validator: {
      type: "string",
      description: "Validation library to use (valibot)",
      required: false,
    },
    config: {
      type: "string",
      alias: "c",
      description:
        "Path to config file (default: xcgen.config.{ts,mts,js,mjs,json})",
      required: false,
    },
  },
  async run({ args }) {
    try {
      // 1. Load config file using c12
      const { config: fileConfig } = await loadConfig<
        Partial<GeneratorOptions>
      >({
        name: "xcgen",
        configFile: args.config,
        defaults: {},
      });

      // 2. Merge CLI args > config file > defaults
      const options = defu<GeneratorOptions, Partial<GeneratorOptions>[]>(
        {
          // CLI args (highest priority)
          ...(args.input && { input: args.input }),
          ...(args.output && { output: args.output }),
          ...(args.validator && {
            validator: args.validator as "valibot" | undefined,
          }),
        },
        // Config file (medium priority)
        fileConfig || {},
        // Defaults (lowest priority) - will be validated later
      ) as GeneratorOptions;

      // 3. Validate required options
      if (!options.input) {
        consola.error(
          "Input file path is required. Use -i or --input option, or specify in config file.",
        );
        process.exit(1);
        return;
      }

      if (!options.output) {
        consola.error(
          "Output directory path is required. Use -o or --output option, or specify in config file.",
        );
        process.exit(1);
        return;
      }

      // 4. Validate validator option
      if (options.validator && options.validator !== "valibot") {
        consola.warn(
          `Unknown validator: ${options.validator}. Currently only 'valibot' is supported.`,
        );
      }

      // 5. Generate code
      const result = await generate(options);

      // 6. Display summary
      consola.box({
        title: "✅ Generation Complete",
        message: [
          `Files: ${result.files.length}`,
          `Types: ${result.typesCount}`,
          `Services: ${result.servicesCount}`,
          result.schemasCount !== undefined
            ? `Schemas: ${result.schemasCount}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        style: {
          borderColor: "green",
          borderStyle: "rounded",
        },
      });

      process.exit(0);
      return;
    } catch (error) {
      // エラーハンドリング
      if (error instanceof Error) {
        consola.error("Failed to generate TypeScript code:");
        consola.error(error.message);

        if (error.stack) {
          consola.debug(error.stack);
        }
      } else {
        consola.error("An unknown error occurred:", error);
      }

      process.exit(1);
      return;
    }
  },
});

/**
 * Run CLI
 */
export async function runCli(options?: { rawArgs?: string[] }) {
  await runMain(main, options);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi, beforeEach, afterEach } = import.meta
    .vitest;

  // Mock generator module
  vi.mock("./generator", () => ({
    generate: vi.fn(),
  }));

  // Mock c12 to prevent loading actual config files
  vi.mock("c12", () => ({
    loadConfig: () => Promise.resolve({ config: {} }),
  }));

  describe("CLI", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockGenerate: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let exitSpy: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorSpy: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let boxSpy: any;

    beforeEach(async () => {
      // Import and get mocked generate function
      const { generate } = await import("./generator");
      mockGenerate = vi.mocked(generate);
      mockGenerate.mockReset();

      // Setup spies
      exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
      errorSpy = vi.spyOn(consola, "error").mockImplementation(() => {});
      boxSpy = vi.spyOn(consola, "box").mockImplementation(() => {});

      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should generate code successfully with input and output", async () => {
      mockGenerate.mockResolvedValue({
        files: ["model.ts", "service.ts"],
        typesCount: 5,
        servicesCount: 3,
        schemasCount: 2,
      });

      await runCli({ rawArgs: ["-i", "openapi.yaml", "-o", "generated"] });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "openapi.yaml",
          output: "generated",
        }),
      );
      expect(boxSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it("should exit with error when input is missing", async () => {
      await runCli({ rawArgs: ["-o", "generated"] });

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Input file path is required"),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    it("should exit with error when output is missing", async () => {
      await runCli({ rawArgs: ["-i", "openapi.yaml"] });

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Output directory path is required"),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    it("should pass validator option to generate", async () => {
      mockGenerate.mockResolvedValue({
        files: ["model.ts"],
        typesCount: 1,
        servicesCount: 1,
      });

      await runCli({
        rawArgs: [
          "-i",
          "openapi.yaml",
          "-o",
          "generated",
          "--validator",
          "valibot",
        ],
      });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          validator: "valibot",
        }),
      );
    });

    it("should handle generation errors", async () => {
      mockGenerate.mockRejectedValue(new Error("Parse failed"));

      await runCli({ rawArgs: ["-i", "openapi.yaml", "-o", "generated"] });

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to generate TypeScript code:",
      );
      expect(errorSpy).toHaveBeenCalledWith("Parse failed");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
}
