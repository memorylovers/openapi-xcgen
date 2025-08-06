import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
    },
  },
  entries: ["src/index", "src/cli"],
  externals: ["@openapi-xcgen/core", "openapi-types"],
});
