import { generate } from "@openapi-xcgen/generator-typescript";

await generate({
  input: "openapi.yaml",
  output: "generated",
  validator: "valibot",
});
