import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';

const fieldName = 'multiply';
const labelName = 'Multiply';
const nodeName = 'multiply-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value1',
    thumbConstraint: thumbConstraint,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'value2',
    thumbConstraint: thumbConstraint,
  },
];

export const getMultiplyNode: NodeTaskFactory<any> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<any>;
  let contextInstance: CanvasAppInstance<any> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    const parsedValue1 = parseFloat(payload?.['value1']);
    let value1 = '';
    // if (!isNaN(parsedValue1)) {
    //   value1 = parseFloat(payload?.['value1'] ?? '0').toString();
    //   if (value1.indexOf('.') < 0) {
    //     value1 = `${value1}.0`;
    //   }
    // } else {
    //   value1 = payload?.['value1'];
    // }
    value1 = payload?.['value1'];
    const parsedValue2 = parseFloat(payload?.['value2']);
    let value2 = '';
    // if (!isNaN(parsedValue2)) {
    //   value2 = parseFloat(payload?.['value2'] ?? '0').toString();
    //   if (value2.indexOf('.') < 0) {
    //     value2 = `${value2}.0`;
    //   }
    // } else {
    //   value2 = payload?.['value2'];
    // }
    value2 = payload?.['value2'];
    return {
      result: `${value1} * ${value2}`,
      output: input,
      followPath: undefined,
    };
  };

  return visualNodeFactory(
    nodeName,
    labelName,
    familyName,
    fieldName,
    compute,
    initializeCompute,
    false,
    100,
    320,
    thumbs,
    (values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance;
      node = nodeInstance.node;
    },
    {
      hasTitlebar: false,
    }
  );
};
