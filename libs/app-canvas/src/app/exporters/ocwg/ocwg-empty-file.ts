import { OCWGFile } from './ocwg-schema';

export const ocwgEmptyFile: OCWGFile = {
  ocif: 'https://canvasprotocol.org/ocif/0.1',
  nodes: [],
  relations: [],
  resources: [],
  schemas: {},
};
