import { OCWGFile } from './ocwg-schema';

export const ocwgEmptyFile: OCWGFile = {
  schema_version: '0.1',
  nodes: [],
  relations: [],
  schemas: {
    '@code-flow-canvas/node': {
      $schema:
        'https://www.canvasprotocol.org/schema/draft/2024-06/@ocwg/rectangle',
      $id: 'https://demo.codeflowcanvas.io/schema/draft-0.0.1/code-flow-canvas-node.json',
      properties: {
        '@code-flow-canvas/node-properties': {
          type: 'object',
        },
      },
    },
    '@code-flow-canvas/connection': {
      $schema:
        'https://www.canvasprotocol.org/schema/draft/2024-06/@ocwg/arrow',
      $id: 'https://demo.codeflowcanvas.io/schema/draft-0.0.1/code-flow-canvas-connection.json',
      properties: {
        '@code-flow-canvas/node-properties': {
          type: 'object',
        },
        start: {
          type: 'object',
          properties: {
            connected_to: { type: 'string' },
            port_name: { type: 'string' },
          },
        },
        end: {
          type: 'object',
          properties: {
            connected_to: { type: 'string' },
            port_name: { type: 'string' },
          },
        },
      },
    },
  },
};
