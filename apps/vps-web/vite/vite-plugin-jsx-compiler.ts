import { transformAsync } from '@babel/core';
import jsxSyntaxParserPlugin from './babel/jsx-syntax-parser';
import customJsxCompilerPlugin from './babel/custom-jsx-compiler';

const fileRegex = /\.tsx$/;

export default function jsxCompilerPlugin() {
  return {
    name: 'jsx-compiler',

    async transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        console.log('transform', id, fileRegex.test(id));
        console.log('TRANSFORM TSX');
        const code = await transformAsync(src, {
          babelrc: false,
          configFile: false,
          plugins: [customJsxCompilerPlugin, jsxSyntaxParserPlugin],
          /*presets: [
            [
              '@babel/preset-react',
              {
                //pragma: 'createJSXElement', // default pragma is React.createElement (only in classic runtime)
                //pragmaFrag: 'Fragment', // default is React.Fragment (only in classic runtime)
                //throwIfNamespace: false, // defaults to true
                runtime: 'automatic', // defaults to classic
                importSource: '@devhelpr', // defaults to react (only in automatic runtime)
              },
            ],
          ],
          */
        });
        return {
          code: code?.code ?? '', //compileFileToJS(src),
          map: null, // provide source map if available
        };
      }
    },
  };
}
