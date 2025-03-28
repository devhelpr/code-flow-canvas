import { ocifSchema, ocifVersion } from '../../consts/ocif';
import { OCIFFile } from './ocif-schema';

export const ocifEmptyFile: OCIFFile = {
  ocif: `${ocifSchema}${ocifVersion}`,
  nodes: [],
  relations: [],
  resources: [],
  schemas: [
    {
      uri: 'https://codeflowcanvas.io/schemas/node/0.1.json',
      name: '@code-flow-canvas/node-properties',
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        nodeType: {
          type: 'string',
        },
      },
      required: ['type', 'nodeType'],
      additionalProperties: true,
    },
    {
      uri: 'https://codeflowcanvas.io/schemas/connection/0.1.json',
      name: '@code-flow-canvas/connection-properties',
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        start: {
          type: 'object',
          properties: {
            connected_to: {
              type: 'string',
            },
            portName: {
              type: 'string',
            },
          },
          required: ['connected_to', 'portName'],
          additionalProperties: false,
        },
        end: {
          type: 'object',
          properties: {
            connected_to: {
              type: 'string',
            },
            portName: {
              type: 'string',
            },
          },
          required: ['connected_to', 'portName'],
          additionalProperties: false,
        },
      },
      required: ['type', 'start', 'end'],
      additionalProperties: true,
    },
  ],
};
