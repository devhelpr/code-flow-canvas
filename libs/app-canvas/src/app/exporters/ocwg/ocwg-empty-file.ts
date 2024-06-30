import { OCWGFile } from './ocwg-schema';

export const ocwgEmptyFile: OCWGFile = {
  schema_version: '0.1',
  nodes: {},
  relations: {},
  schemas: {
    '@ocwg/code-flow-canvas-node': '@ocwg/rectangle',
  },
};
