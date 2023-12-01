import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
  createElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { parse } from 'path';

const fieldName = 'rotate';
const labelName = 'Rotate';
const nodeName = 'rotate-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'vec2';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    prefixLabel: 'vector',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'vector',
    thumbConstraint: thumbConstraint,
    prefixLabel: 'vector',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',

    name: 'degree',
    thumbConstraint: 'value',
    prefixLabel: 'angle',
  },
];

export const getRotateNode: NodeTaskFactory<any> = (
  updated: () => void
): NodeTask<any> => {
  let node: IRectNodeComponent<any>;
  let contextInstance: CanvasAppInstance<any> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };

  const element = createElement('div', {
    class: 'block',
  });
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number,
    payload?: any
  ) => {
    const vector = payload?.['vector'];

    const degree = payload?.['degree'];
    if (element) {
      element.domElement.textContent = `${(
        (parseFloat(degree) || 0) % 360
      ).toFixed(0)}`;
    }
    return {
      result: `rotate(${vector}, ${degree})`,
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
    200,
    100,
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
      additionalClassNames: 'flex-wrap flex-col',
      childNodeWrapperClass: 'w-full block text-center',
    },
    element.domElement as HTMLElement
  );
};
