import pluginUtils from "@rollup/pluginutils";
import { compile } from "./compiler";

export default function rollupLWC2ReactCompiler(pluginOptions = {}) {
  let { include, exclude } = pluginOptions;

  exclude = exclude || [
    "**/@lwc/engine/**",
    "**/@lwc/synthetic-shadow/**",
    "**/@lwc/wire-service/**",
  ];

  const filter = pluginUtils.createFilter(include, exclude);

  return {
    name: "rollup-lwc2react-compiler",
    async transform(src, id) {
    console.log(id, filter(id));
      if (!filter(id)) {
        return;
      }

      let code;
      try {
        code = compile(id, src);
        if (code) {
          return {
            code,
            map: null,
          };
        }
      } catch (error) {
        console.log("error processing lwc source: ", id);
        console.log(src);
        throw error;
      }
    },
  };
}
