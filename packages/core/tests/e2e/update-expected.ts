#!/usr/bin/env node
/**
 * Script to regenerate expected JSON files for E2E tests
 * This is needed when the IR output format changes
 */

import { generateExpected } from "./transformer/test-helper";

const testCases = [
  "models/data-types",
  "models/complex-structures",
  "models/ref-model",
  "models/nullable-model",
  "models/validation-model",
  "models/metadata-model",
];

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
