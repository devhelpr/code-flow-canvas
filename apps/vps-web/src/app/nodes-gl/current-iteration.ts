import {
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';

const fieldName = 'iteration';
const labelName = 'Iteration';
const nodeName = 'current-iteration-node';
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
];

export const getCurrentIterationNode: NodeTaskFactory<GLNodeInfo> = (
  _updated: () => void
): NodeTask<GLNodeInfo> => {
  let currentContainer: IRectNodeComponent<GLNodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (input: string, _loopIndex?: number, _payload?: any) => {
    if (
      currentContainer &&
      (currentContainer.nodeInfo as any)?.repeatVariableInstance
    ) {
      const index = (currentContainer.nodeInfo as any).repeatVariableInstance;
      return {
        result: `i${index}`,
        output: input,
        followPath: undefined,
      };
    }
    return {
      result: `0.`,
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
    (_values?: InitialValues) => {
      return [];
    },
    (_nodeInstance, containerNode) => {
      currentContainer = containerNode;
    },
    {
      hasTitlebar: false,
      category: 'Math',
    }
  );
};
