import commonjs from '@rollup/plugin-commonjs';
import node from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const { minify } = process.env;

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ES2015',
          target: 'es2020',
          declaration: false,
          declarationMap: false,
          sourceMap: true,
        },
      },
    }),
    node(),
    commonjs({
      include: 'node_modules/**',
    }),
  ].concat(minify ? terser() : []),
  output: {
    extend: true,
    file: `dist/modern-face-api${minify ? '.min' : ''}.js`,
    format: 'umd',
    name: 'faceapi',
    globals: {
      crypto: 'crypto',
    },
    sourcemap: !minify,
  },
  external: ['crypto', 'node:fs'],
  onwarn: (warning, warn) => {
    if (warning.missing === 'alea') return;
    warn(warning);
  },
};
