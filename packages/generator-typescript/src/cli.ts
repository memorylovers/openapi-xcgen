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
import { generate } from "./generator.js";
import type { GeneratorOptions } from "./types.js";

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
      }

      if (!options.output) {
        consola.error(
          "Output directory path is required. Use -o or --output option, or specify in config file.",
        );
        process.exit(1);
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
    }
  },
});

/**
 * Run CLI
 */
export async function runCli() {
  await runMain(main);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
