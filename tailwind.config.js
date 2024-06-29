/** @type {import('tailwindcss').Config} */
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

module.exports = {
  content: [
    join(__dirname, 'apps/vps-web/index.html'),
    join(
      __dirname,
      'apps/**/{src,pages,components}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    join(
      __dirname,
      'libs/**/{src,pages,components}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
