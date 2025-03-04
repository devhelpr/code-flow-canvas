/// <reference types="vitest" />
import { defineConfig } from 'vite';
//import jsxCompiler from './vite/vite-plugin-jsx-compiler';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
//import mkcert from 'vite-plugin-mkcert';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  optimizeDeps: { exclude: [] },
  build: {
    outDir: '../../dist/apps/vps-web',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 4200,
    host: 'localhost',
    //host: '192.168.68.109',
    //https: true,
  },

  plugins: [nxViteTsPaths()], //mkcert()
  esbuild: {
    sourcemap: false,
    jsxFragment: 'Fragment',
  },

  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: [
  //     viteTsConfigPaths({
  //       root: '../../',
  //     }),
  //   ],
  // },

  test: {
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/vps-web',
      provider: 'v8',
    },
    globals: true,

    environment: 'jsdom',
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
  },

  // esbuild: {
  //   jsxFactory: 'h',
  //   jsxFragment: 'Fragment',
  // },
});
