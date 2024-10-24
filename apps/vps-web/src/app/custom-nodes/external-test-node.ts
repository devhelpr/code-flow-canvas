import {
  FormField,
  IComputeResult,
  InitialValues,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '@devhelpr/web-flow-executor';

const fieldName = 'test-external-input';
const nodeTitle = 'Test external input';
const nodeName = 'test-external-node';
const familyName = 'flow-canvas';
const thumbConstraint = 'value';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    thumbConstraint: thumbConstraint,
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    thumbConstraint: thumbConstraint,
    maxConnections: 1,
  },
];

export const getExternalTestNode =
  () =>
  // (): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    //let node: IRectNodeComponent<NodeInfo>;
    ///let rect: Rect<NodeInfo> | undefined;
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any
    ) => {
      //const result = input;
      return new Promise<IComputeResult>((resolve) => {
        resolve({
          result: input,
          output: input,
          followPath: undefined,
        });
      });
    };

    return visualNodeFactory(
      nodeName,
      nodeTitle,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues): FormField[] => {
        return [];
      },
      (_nodeInstance) => {
        //rect = nodeInstance.rect;
        //node = nodeInstance.node as IRectNodeComponent<NodeInfo>;
        //rect?.resize();
      },
      {
        category: 'Test',
      },
      undefined,
      true
    );
  };
