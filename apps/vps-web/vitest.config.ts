/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../../dist/apps/vps-web',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 4200,
    host: 'localhost',
    //host: '192.168.68.109',
    //https: true,
  },
  esbuild: {
    sourcemap: false,
    jsxFragment: 'Fragment',
  },
  plugins: [tsconfigPaths()],
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
});
