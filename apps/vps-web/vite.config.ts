/// <reference types="vitest" />
import { defineConfig } from 'vite';
import jsxCompiler from './vite/vite-plugin-jsx-compiler';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  server: {
    port: 4200,
    host: 'localhost',
  },

  plugins: [nxViteTsPaths(), jsxCompiler()],
  esbuild: {
    sourcemap: false,
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
  // },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },

  // esbuild: {
  //   jsxFactory: 'h',
  //   jsxFragment: 'Fragment',
  // },
});
