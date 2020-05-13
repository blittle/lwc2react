import lwc from '@lwc/rollup-plugin';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import path from 'path';
import lwc2react from 'lwc2react';
import visualizer from 'rollup-plugin-visualizer';

const outputDir = path.resolve(__dirname, `./src/dist`);
const input = path.resolve(__dirname, './src/index.js');
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
      rootDir: './src',
      modules: [
        {
          dir: 'modules',
        },
      ],
    }),
    commonjs(),
    replace({ 'process.env.NODE_ENV': JSON.stringify(env) }),
    lwc2react({
      debug: 'searchBar.js', // change to a string to output a specific file for debugging
      include: '**/modules/my/**',
    }),
    visualizer({
      filename: 'src/dist/stats.html',
    }),
  ],
};
