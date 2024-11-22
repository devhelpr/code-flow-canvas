import {
  IFlowCanvasBase,
  FormFieldType,
  IRectNodeComponent,
  IThumb,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
  thumbConstraints,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const vectorDistanceNodeName = 'vector-distance';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: -1,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: '[]',
    name: 'a',
    maxConnections: 1,
    prefixLabel: '',
    thumbConstraints: thumbConstraints.array,
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 1,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: '[]',
    name: 'b',
    maxConnections: 1,
    prefixLabel: '',
    thumbConstraints: thumbConstraints.array,
  },
];

export const getVectorDistanceNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  //let contextInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  const initializeCompute = () => {
    values = { global: { value1: undefined, value2: undefined } };
    return;
  };

  let values = {
    global: {
      value1: undefined,
      value2: undefined,
    },
  } as Record<string, Record<string, number[] | undefined>>;

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    thumbName?: string,
    scopeId?: string
  ) => {
    if (scopeId && !values[scopeId]) {
      values[scopeId] = {
        value1: undefined,
        value2: undefined,
      };
    }
    const localValues = values[scopeId ?? 'global'];
    if (thumbName === 'a') {
      if (!Array.isArray(input)) {
        return {
          result: undefined,
          output: undefined,
          stop: true,
          followPath: undefined,
        };
      }
      localValues['value1'] = input as unknown as number[];
    } else {
      if (thumbName === 'b') {
        if (!Array.isArray(input)) {
          return {
            result: undefined,
            output: undefined,
            stop: true,
            followPath: undefined,
          };
        }
        localValues['value2'] = input as unknown as number[];
      }
    }

    if (
      localValues['value1'] === undefined ||
      localValues['value2'] === undefined
    ) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }
    const value1 = localValues['value1'];
    const value2 = localValues['value2'];
    localValues['value1'] = undefined;
    localValues['value2'] = undefined;
    const method =
      node.nodeInfo?.formValues?.['distance-method'] ?? 'euclidean';

    if (value1.length !== value2.length) {
      return {
        result: undefined,
        output: undefined,
        stop: true,
        followPath: undefined,
      };
    }

    if (method === 'cosine-similarity') {
      const dotProduct = value1.reduce(
        (acc: number, value: number, index: number) => {
          return acc + value * value2[index];
        },
        0
      );
      const magnitude1 = Math.sqrt(
        value1.reduce((acc: number, value: number) => {
          return acc + value * value;
        }, 0)
      );
      const magnitude2 = Math.sqrt(
        value2.reduce((acc: number, value: number) => {
          return acc + value * value;
        }, 0)
      );
      return {
        result: dotProduct / (magnitude1 * magnitude2),
        output: dotProduct / (magnitude1 * magnitude2),
        followPath: undefined,
      };
    } else if (method === 'manhattan') {
      return {
        result: value1.reduce((acc: number, value: number, index: number) => {
          return acc + Math.abs(value - value2[index]);
        }, 0),
        output: value1.reduce((acc: number, value: number, index: number) => {
          return acc + Math.abs(value - value2[index]);
        }, 0),
        followPath: undefined,
      };
    }
    const distance = Math.sqrt(
      value1.reduce((acc: number, value: number, index: number) => {
        return acc + Math.pow(value - value2[index], 2);
      }, 0)
    );
    return {
      result: distance,
      output: distance,
      followPath: undefined,
    };
  };

  return {
    name: vectorDistanceNodeName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      const Component = () => (
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px] clip-merge">
          <div>Distance</div>
        </div>
      );
      const nodeThumbs: IThumb[] = [...thumbs];

      const rect = canvasApp.createRect(
        x,
        y,
        150,
        110,
        undefined,
        nodeThumbs,
        Component() as unknown as HTMLElement,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: vectorDistanceNodeName,
          formValues: {
            'distance-method': initalValues?.['distance-method'] ?? 'euclidean',
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.resize();

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Select,
            fieldName: 'distance-method',
            label: 'Distance method',
            hideDeleteButton: true,
            value: initalValues?.['distance-method'] ?? 'euclidean',
            options: [
              { value: 'euclidean', label: 'Euclidean' },
              { value: 'manhattan', label: 'Manhattan' },
              { value: 'cosine-similarity', label: 'Cosine similarity' },
            ],
            onChange: (value: unknown[]) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['distance-method']: value,
              };

              if (updated) {
                updated();
              }
            },
          },
        ];
        node.nodeInfo.isSettingsPopup = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.formValues = {
          'distance-method': initalValues?.['distance-method'] ?? 'euclidean',
        };
      }
      return node;
    },
  };
};
