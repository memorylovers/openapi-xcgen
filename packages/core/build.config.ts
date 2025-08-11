import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
      define: {
        "import.meta.vitest": "undefined",
      },
    },
  },
  entries: ["src/index"],
  externals: ["@apidevtools/swagger-parser", "openapi-types", "citty"],
});
