import {
  CanvasAppInstance,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';

const fieldName = 'uv';
const labelName = 'UV';
const nodeName = 'uv-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    name: 'x',
    prefixLabel: 'x',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
    name: 'y',
    prefixLabel: 'y',
  },
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 2,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    thumbConstraint: 'vec2',
    maxConnections: -1,
    name: 'vector',
    prefixLabel: 'vector',
  },
];

export const getUVNode: NodeTaskFactory<any> = (
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
    payload?: any,
    thumbName?: string
  ) => {
    if (thumbName === 'x') {
      return {
        result: `uv.x`,
        output: input,
        followPath: undefined,
      };
    } else if (thumbName == 'y') {
      return {
        result: `uv.y`,
        output: input,
        followPath: undefined,
      };
    } else {
      return {
        result: `uv`,
        output: input,
        followPath: undefined,
      };
    }
  };

  return visualNodeFactory(
    `${nodeName}`,
    `${labelName}`,
    familyName,
    fieldName,
    compute as unknown as (
      input: string,
      pathExecution?: RunNodeResult<NodeInfo>[],
      loopIndex?: number,
      payload?: any
    ) => IComputeResult,
    initializeCompute,
    false,
    200,
    100,
    thumbs,
    (values?: InitialValues) => {
      return [];
    },
    (nodeInstance) => {
      contextInstance = nodeInstance.contextInstance!;
      node = nodeInstance.node!;
    }
  );
};

// export const getUVNodeY: NodeTaskFactory<any> = (
//   updated: () => void
// ): NodeTask<any> => {
//   let node: IRectNodeComponent<any>;
//   let contextInstance: CanvasAppInstance<any> | undefined = undefined;
//   const initializeCompute = () => {
//     return;
//   };
//   const compute = (
//     input: string,
//     pathExecution?: RunNodeResult<NodeInfo>[],
//     loopIndex?: number,
//     payload?: any
//   ) => {
//     return {
//       result: `uv.y`,
//       output: input,
//       followPath: undefined,
//     };
//   };

//   return visualNodeFactory(
//     `${nodeName}-y`,
//     `${labelName} Y`,
//     familyName,
//     fieldName,
//     compute,
//     initializeCompute,
//     false,
//     200,
//     100,
//     thumbs,
//     (values?: InitialValues) => {
//       return [];
//     },
//     (nodeInstance) => {
//       contextInstance = nodeInstance.contextInstance!;
//       node = nodeInstance.node!;
//     }
//   );
// };
