import { parse } from 'recast';
import { compileClass } from './class-compiler';
import { compileTemplate } from './template-compiler';

export function compile(id, source) {
  if (id.includes('@lwc/engine/dist/engine.js') || id.includes('wire-service'))
    return 'export default undefined';

  const ast = parse(source);

  if (id.endsWith('.html')) {
    return compileTemplate(ast);
  } else if (id.endsWith('.css')) {
    return source;
  } else {
    return compileClass(ast);
  }
}
