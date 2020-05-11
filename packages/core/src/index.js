import pluginUtils from '@rollup/pluginutils';
import { compile } from './compiler';

export default function rollupLWC2ReactCompiler(pluginOptions = {}) {
  let { include, exclude, debug } = pluginOptions;

  const lwcDeps = ['@lwc/engine/dist/engine.js', 'wire-service', 'lwc/dist'];

  const filter = pluginUtils.createFilter(include, exclude);

  return {
    name: 'rollup-lwc2react-compiler',
    async transform(src, id) {
      if (lwcDeps.find((dep) => id.includes(dep))) {
        return {
          code: 'export const registerComponent = undefined;',
          map: null,
        };
      }

      if (debug && filter(id)) {
        console.log('lwc2react -> ', id);
      }

      if (!filter(id)) {
        return;
      }

      let code;
      try {
        code = compile(id, src);
        if (code) {
          if (debug && id.includes(debug)) {
            console.log(src);
            console.log('===========');
            console.log(code);
          }
          return {
            code,
            map: null,
          };
        }
      } catch (error) {
        console.log('error processing lwc source: ', id);
        console.log(src);
        throw error;
      }
    },
  };
}
