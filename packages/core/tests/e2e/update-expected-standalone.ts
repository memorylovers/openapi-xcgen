#!/usr/bin/env node
/**
 * Standalone script to regenerate expected JSON files for E2E tests
 * This is needed when the IR output format changes
 */

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "../../src/parser/index";
import { transform } from "../../src/transformer/index";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/core directory
const coreDir = join(__dirname, "..", "..");

const testCases = [
  "models/data-types",
  "models/complex-structures",
  "models/ref-model",
  "models/nullable-model",
  "models/validation-model",
  "models/metadata-model",
];

async function generateExpected(testCase: string): Promise<void> {
  const yamlPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.yaml`,
  );
  const expectedPath = join(
    coreDir,
    "tests",
    "e2e",
    "fixtures",
    `${testCase}.expected.json`,
  );

  // Parse and transform YAML
  const document = await parse(yamlPath);
  const result = transform(document);

  // Write expected result
  await writeFile(expectedPath, JSON.stringify(result, null, 2) + "\n");
}

async function updateAll() {
  console.log("Regenerating E2E test expected files...");

  for (const testCase of testCases) {
    try {
      await generateExpected(testCase);
      console.log(`✅ Updated: ${testCase}.expected.json`);
    } catch (error) {
      console.error(`❌ Failed to update ${testCase}:`, error);
    }
  }

  console.log("\n✨ Done! All expected files have been regenerated.");
}

updateAll().catch(console.error);
