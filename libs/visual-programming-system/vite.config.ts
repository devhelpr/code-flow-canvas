/// <reference types="vitest" />
import { defineConfig } from 'vite';

//import viteTsConfigPaths from 'vite-tsconfig-paths';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  plugins: [
    // viteTsConfigPaths({
    //   root: '../../',
    // }),
    nxViteTsPaths(),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
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
});
