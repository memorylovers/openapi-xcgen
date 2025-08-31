import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { consola } from "consola";
import { parse } from "../../../src/parser/index";
import { transform } from "../../../src/transformer/index";

/**
 * Generate expected JSON file from current transformation
 */
async function generateExpected(testCase: string): Promise<void> {
  const yamlPath = join("tests", "e2e", "fixtures", `${testCase}.yaml`);
  const expectedPath = join(
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

// Generate expected JSON files for all test cases
const testCases = [
  "models/primitive-model",
  "models/object-model",
  "models/array-model",
  "models/nested-object",
  "models/array-of-objects",
  "models/ref-model",
  "models/nullable-model",
  "models/validation-model",
  "models/format-model",
  "models/metadata-model",
];

async function generateAll() {
  for (const testCase of testCases) {
    consola.info(`Generating expected JSON for ${testCase}...`);
    await generateExpected(testCase);
  }
  consola.success("All expected JSON files generated");
}

generateAll().catch(consola.error);
