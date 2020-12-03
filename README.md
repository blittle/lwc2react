# lwc2react [![Node.js CI](https://github.com/blittle/lwc2react/workflows/Node.js%20CI/badge.svg)](https://github.com/blittle/lwc2react/actions) [![npm version](https://badge.fury.io/js/lwc2react.svg)](https://badge.fury.io/js/lwc2react)
A rollup plugin for compile-time conversion of lwc components to react for easy interop. This is a proof of concept and _NOT_ ready for use in production!

What is working:

1. Template data binding and reactive data
1. Template lists
1. Template conditionals
1. Scoped CSS
1. @api properties
1. slots (named and anonymous)
1. lifecycle methods
1. Form and input events
1. Custom events (from within templates)

What is not working:

1. Wire adapters


## Example

Add the `lwc2react` plugin. Make sure to configure it to process your lwc modules with the `include` option:

```js
import lwc from '@lwc/rollup-plugin';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import path from 'path';
import lwc2react from 'lwc2react';

const outputDir = path.resolve(__dirname, `./src/dist`);
const input = path.resolve(__dirname, './src/index.js');
const output = path.join(outputDir, 'app.js');
const env = process.env.NODE_ENV || 'development';

export default {
  input,
  output: {
    format: 'iife',
    file: path.join(outputDir, 'app.js'),
  },
  plugins: [
    resolve(),
    lwc({
      rootDir: "./src",
      modules: [
        {
          dir: 'modules',
        },
      ],
    }),
    commonjs(),
    replace({'process.env.NODE_ENV': JSON.stringify(env)}),
    lwc2react({
      include: "**/modules/my/**"
    }),
  ],
};
```

Now any react component can render an LWC component:

```js
import React from 'react';
import MyComp from 'my/comp'; // lwc component

export default function App() {
    return <div>
        <MyComp />
    </div>
}
```
