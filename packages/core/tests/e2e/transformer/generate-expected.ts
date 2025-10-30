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
  // models/
  "models/data-types",
  "models/complex-structures",
  "models/ref-model",
  "models/nullable-model",
  "models/validation-model",
  "models/metadata-model",
  "models/inline-schemas",
  // general/
  "general/petstore",
  "general/complex-schema",
  "general/multi-service",
  "general/servers",
  "general/readonly-writeonly",
  "general/train-travel-api",
  "general/museum-api",
  "general/allof",
  // general/hey-api/
  "general/hey-api/transformers-all-of",
  "general/hey-api/discriminator-one-of",
  "general/hey-api/discriminator-all-of",
  "general/hey-api/discriminator-any-of",
  // general/openapi-generator/
  "general/openapi-generator/anyof",
  "general/openapi-generator/webhooks",
  "general/openapi-generator/null-types",
  "general/openapi-generator/oneof",
  "general/openapi-generator/allof-composition",
  "general/openapi-generator/petstore",
  // general/swagger-parser/
  "general/swagger-parser/anyof",
  "general/swagger-parser/webhooks",
  "general/swagger-parser/anyof-discriminator",
  // general/orval/
  "general/orval/petstore-basic",
  "general/orval/petstore-react",
  // general/x-extensions/
  "general/x-extensions-basic",
  "general/x-extensions-merge",
  "general/x-extensions-types",
  // services/
  "services/single-tag",
  "services/multi-tags",
  "services/no-tags",
  // endpoints/
  "endpoints/operation-id",
  "endpoints/path-structure",
  "endpoints/endpoint-metadata",
];

async function generateAll() {
  let successCount = 0;
  let failureCount = 0;
  const failures: string[] = [];

  for (const testCase of testCases) {
    consola.info(`Generating expected JSON for ${testCase}...`);
    try {
      await generateExpected(testCase);
      successCount++;
    } catch (error) {
      failureCount++;
      failures.push(testCase);
      consola.error(`Failed to generate expected JSON for ${testCase}:`, error);
    }
  }

  consola.success(`Generated ${successCount} expected JSON files`);
  if (failureCount > 0) {
    consola.warn(`Failed to generate ${failureCount} files:`);
    failures.forEach((f) => consola.warn(`  - ${f}`));
  }
}

generateAll().catch(consola.error);
