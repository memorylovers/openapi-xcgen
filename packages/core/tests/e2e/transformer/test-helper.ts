import { expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "../../../src/parser/index";
import { transform } from "../../../src/transformer/index";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the packages/core directory
const coreDir = join(__dirname, "..", "..", "..");

/**
 * Compare YAML transformation result with expected JSON
 * @param testCase - Test case name (relative path from fixtures/)
 */
export async function compareWithExpected(testCase: string): Promise<void> {
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
  const actual = transform(document);

  // Load expected result
  const expectedJson = await readFile(expectedPath, "utf-8");
  const expected = JSON.parse(expectedJson);

  // Compare
  expect(actual).toEqual(expected);
}

/**
 * Generate expected JSON file from current transformation
 * Used for initial setup or updating expected results
 */
export async function generateExpected(testCase: string): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
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
