
import typescript from 'rollup-plugin-typescript2';
import resolveModule from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy';
import gzipPlugin from 'rollup-plugin-gzip';
import visualizer from 'rollup-plugin-visualizer';
import sizes from 'rollup-plugin-sizes';

const plugins = [
  typescript({
    typescript: require('typescript')
  }),
  resolveModule({
    mainFields: ['esm2017', 'module']
  }),
  commonjs(),
  terser({
    format: {
      comments: false
    },
    mangle: { toplevel: true },
    compress: false
  }),
  scss(),
  copy({
    targets: [{ src: 'src/index.html', dest: 'dist' }]
  }),
  gzipPlugin(),
  visualizer({
      template: 'treemap',
      sourcemap: true,
      gzipSize: true
  }),
  sizes()
];

export default [
  {
    input: 'src/main.ts',
    output: [
      { file: 'dist/bundle.js', format: 'iife', sourcemap: true }
    ],
    plugins
  },
];
