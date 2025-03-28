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

const fieldName = 'webcam-viewer-input';
const nodeTitle = 'Webcam viewer';
export const webcamViewerNodeName = 'webcam-viewer-node';
const familyName = 'flow-canvas';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    name: 'output',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    name: 'input',
    maxConnections: 1,
  },
];

export const getWebcamViewerNode =
  () =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    const initializeCompute = () => {
      return;
    };
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any
    ) => {
      return new Promise<IComputeResult>((resolve) => {
        try {
          const cells = {
            frame: JSON.parse(input),
            connectionHistory: false,
          };
          resolve({
            output: cells,
            result: cells,
            followPath: undefined,
          });
        } catch (error) {
          console.error('Error parsing input:', error);
          resolve({
            output: [],
            result: [],
            followPath: undefined,
            stop: true,
          });
        }
      });
    };

    return visualNodeFactory(
      webcamViewerNodeName,
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
      (nodeInstance) => {
        if (!nodeInstance.node.nodeInfo) {
          nodeInstance.node.nodeInfo = {};
        }
        nodeInstance.node.nodeInfo.shouldNotSendOutputFromWorkerToMainThread =
          true;
      },
      {
        category: 'default',
      },
      undefined,
      true
    );
  };
