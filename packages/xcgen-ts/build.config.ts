import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
    },
  },
  entries: ["src/index"],
  externals: ["@openapi-xcgen/core", "openapi-types"],
});
