/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const optimizeDeps = isDev
    ? {
        exclude: [
          '@devhelpr/visual-programming-system',
          '@devhelpr/web-flow-executor',
        ],
        include: [],
      }
    : {
        include: [
          '@devhelpr/visual-programming-system',
          '@devhelpr/web-flow-executor',
        ],
        exclude: [],
      };
  return {
    root: __dirname,
    optimizeDeps: optimizeDeps,
    build: {
      minify: !isDev,
      sourcemap: isDev,
      outDir: '../../dist/apps/vps-web',
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    worker: {
      format: 'es',
      rollupOptions: {
        output: {
          sourcemap: isDev,
        },
      },
    },
    server: {
      port: 4200,
      host: 'localhost',
      //host: '192.168.68.109',
      //https: true,
    },

    plugins: [nxViteTsPaths()],
    esbuild: {
      sourcemap: false,
      jsxFragment: 'Fragment',
    },
    resolve: {
      alias: {
        '@devhelpr/web-flow-executor': isDev
          ? path.resolve(__dirname, '../../libs/web-flow-executor/src')
          : path.resolve(
              __dirname,
              '../../dist/libs/web-flow-executor/index.mjs'
            ),
        '@devhelpr/visual-programming-system': isDev
          ? path.resolve(__dirname, '../../libs/visual-programming-system/src')
          : path.resolve(
              __dirname,
              '../../dist/libs/visual-programming-system/index.mjs'
            ),
      },
    },
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
  };
});
