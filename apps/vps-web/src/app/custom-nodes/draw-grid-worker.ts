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

const fieldName = 'draw-grid-input';
const nodeTitle = 'Draw grid';
export const drawGridNodeName = 'draw-grid-node';
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

export const getDrawGridNode =
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
          const cells = JSON.parse(input);
          console.log('cells', cells);
          resolve({
            output: cells,
            result: cells,
            followPath: undefined,
          });
        } catch (error) {
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
      drawGridNodeName,
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
        //
      },
      {
        category: 'Diagrams',
      },
      undefined,
      true
    );
  };
