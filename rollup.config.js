/**
 * Copyright 2021 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import typescript from 'rollup-plugin-typescript2';
import resolveModule from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import scss from 'rollup-plugin-scss'
import copy from 'rollup-plugin-copy';
import gzipPlugin from 'rollup-plugin-gzip';
import visualizer from 'rollup-plugin-visualizer';

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
  scss({
    output: 'dist/bundle.css'
  }),
  copy({
    targets: [
      { src: 'src/index.html', dest: 'dist' },
      { src: 'images/favicon.png', dest: 'dist'}
    ]
  }),
  gzipPlugin(),
  visualizer({
      template: 'treemap',
      sourcemap: true,
      gzipSize: true
  })
];

export default [
  {
    input: 'src/main.ts',
    output: [
      { dir: 'dist', format: 'esm', sourcemap: true }
    ],
    plugins,
    preserveEntrySignatures: false
  },
];
