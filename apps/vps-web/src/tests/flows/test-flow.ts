import {
  Flow,
  FlowEndpoint,
  FlowMeta,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';
export const metaData: FlowMeta = {
  title: 'Flow',
};
export const endpoints: Record<string, FlowEndpoint> = {
  default: {
    id: 'default',
    type: 'default',
    name: 'default',
    group: 'endpoints',
    outputs: [],
  },
};

export const flow: Flow<NodeInfo> = {
  schemaType: 'flow',
  schemaVersion: '0.0.1',
  id: '1234',
  flows: {
    flow: {
      flowType: 'flow',
      nodes: [
        {
          id: 'f4ca8d38-fed7-46ba-a221-239f38553f21',
          x: 5518.7635975244575,
          y: 1600.0930358794196,
          width: 200,
          height: 100,
          nodeType: 'Shape',
          nodeInfo: {
            type: 'expression',
            formValues: {
              expression: '1234 + input',
              inputType: 'number',
            },
            showFormOnlyInPopup: true,
            isSettingsPopup: true,
            taskType: 'expression',
          },
        },
      ],
    },
  },
  compositions: {},
};
