import {
  IFlowCanvasBase,
  FormFieldType,
  IRectNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { activationFunction } from './neural-network-utils/activation-functions';

export const neuralNodeOutputLayerName = 'neural-node-output-layer';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: -1,
    thumbConstraint: 'output-data',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'weighted-layer-data',
  },
];

export const getNeuralNodeOutputLayerNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let neuralNodeCountElement: HTMLDivElement | undefined = undefined;
  const initializeCompute = () => {
    lastOutput = [];
    return;
  };

  let lastOutput: any[] = [];

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounter?: RunCounter
  ) => {
    const layerInput = input as unknown as any;
    if (
      layerInput &&
      typeof layerInput === 'object' &&
      layerInput.weightedOutput &&
      Array.isArray(layerInput.weightedOutput)
    ) {
      let inputLayerNodeCount = 0;
      nodeComponent.connections?.forEach((connection) => {
        if (
          connection.startNode?.id !== nodeComponent.id &&
          (connection.startNode?.nodeInfo?.type ===
            'neural-node-hidden-layer' ||
            connection.startNode?.nodeInfo?.type ===
              'neural-node-input-layer') &&
          connection.startNode?.nodeInfo?.formValues
        ) {
          inputLayerNodeCount =
            parseInt(
              connection.startNode.nodeInfo.formValues[
                'neural-layer-node-count'
              ]
            ) ?? 0;
        }
      });

      const currentLayerNodeCount =
        parseInt(
          nodeComponent.nodeInfo?.formValues?.['neural-layer-node-count']
        ) ?? 0;
      const activationFunctionType =
        nodeComponent.nodeInfo?.formValues?.['activation-function'] ?? 'relu';
      if (currentLayerNodeCount !== layerInput.weightedOutput.length) {
        return {
          stop: true,
          result: undefined,
          output: undefined,
          followPath: undefined,
        };
      }

      // per node in current layer :
      // - sum all inputs from previous layer
      // - send sun value as ouput from neural network

      let outputs: number[] = [];
      let loop = 0;
      while (loop < currentLayerNodeCount) {
        let sum = 0;

        let columnLoop = 0;
        while (columnLoop < inputLayerNodeCount) {
          sum += layerInput.weightedOutput[loop][columnLoop];
          columnLoop++;
        }
        sum += nodeComponent.nodeInfo?.formValues?.['bias']?.[loop] ?? 0;
        const activationValue = activationFunction(activationFunctionType, sum);
        outputs.push(activationValue);

        loop++;
      }

      let maxDigit = -1;
      let maxAmount: undefined | number = undefined;
      outputs.forEach((output, index) => {
        if (maxAmount === undefined || output > maxAmount) {
          maxDigit = index;
          maxAmount = output;
        }
      });

      let maxExpectedDigit = -1;
      let maxExpectedAmount: undefined | number = undefined;
      layerInput.expectedOutput.forEach((output: number, index: number) => {
        if (maxExpectedAmount === undefined || output > maxExpectedAmount) {
          maxExpectedDigit = index;
          maxExpectedAmount = output;
        }
      });

      const outputErrors = [];
      let totalError = 0;
      for (let i = 0; i < currentLayerNodeCount; i++) {
        const error = Math.pow(layerInput.expectedOutput?.[i] - outputs[i], 2);
        outputErrors.push(error);
        totalError += error;
      }
      totalError *= 0.5;

      const outputData = {
        hiddenLayers: {
          ...layerInput.hiddenLayers,
        },
        hiddenLayerWeightedOutput: {
          ...layerInput.hiddenLayerWeightedOutput,
        },
        hiddenLayerInputs: {
          ...layerInput.hiddenLayerInputs,
        },
        outputs: outputs,
        expectedOutput: layerInput.expectedOutput,
        training: layerInput.training,
        testing: layerInput.testing,
        trainingEpoch: layerInput.trainingEpoch,
        trainingIndex: layerInput.trainingIndex,
        trainingEpochs: layerInput.trainingEpochs,
        trainingBatchSize: layerInput.trainingBatchSize,
        digit: maxDigit,
        expectedDigit: maxExpectedDigit,
        totalError,
        connectionHistory: layerInput.connectionHistory,
      };
      lastOutput = [...outputs];
      //console.log('neural-node-output-layer', outputData);
      return {
        result: outputData,
        output: outputData,
        followPath: undefined,
      };
    }

    return {
      stop: true,
      result: undefined,
      output: undefined,
      followPath: undefined,
    };
  };

  return {
    name: neuralNodeOutputLayerName,
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
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]">
          <svg
            width="94"
            height="83"
            viewBox="0 0 94 83"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M93 47.5C93 66.5538 77.5538 82 58.5 82C39.4462 82 24 66.5538 24 47.5C24 28.4462 39.4462 13 58.5 13C77.5538 13 93 28.4462 93 47.5Z"
              fill="#484848"
            />
            <path
              d="M1 35C1 32.2386 3.23858 30 6 30H19C21.7614 30 24 32.2386 24 35V60C24 62.7614 21.7614 65 19 65H6C3.23858 65 1 62.7614 1 60V35Z"
              fill="#484848"
            />
            <path
              d="M58.5 82C77.5538 82 93 66.5538 93 47.5C93 28.4462 77.5538 13 58.5 13M58.5 82C39.4462 82 24 66.5538 24 47.5C24 28.4462 39.4462 13 58.5 13M58.5 82V13M6 65H19C21.7614 65 24 62.7614 24 60V35C24 32.2386 21.7614 30 19 30H6C3.23858 30 1 32.2386 1 35V60C1 62.7614 3.23858 65 6 65Z"
              stroke="white"
            />
            <path
              d="M93 43.5C93 62.5538 77.5538 78 58.5 78C39.4462 78 24 62.5538 24 43.5C24 24.4462 39.4462 9 58.5 9C77.5538 9 93 24.4462 93 43.5Z"
              fill="#484848"
            />
            <path
              d="M1 31C1 28.2386 3.23858 26 6 26H19C21.7614 26 24 28.2386 24 31V56C24 58.7614 21.7614 61 19 61H6C3.23858 61 1 58.7614 1 56V31Z"
              fill="#484848"
            />
            <path
              d="M58.5 78C77.5538 78 93 62.5538 93 43.5C93 24.4462 77.5538 9 58.5 9M58.5 78C39.4462 78 24 62.5538 24 43.5C24 24.4462 39.4462 9 58.5 9M58.5 78V9M6 61H19C21.7614 61 24 58.7614 24 56V31C24 28.2386 21.7614 26 19 26H6C3.23858 26 1 28.2386 1 31V56C1 58.7614 3.23858 61 6 61Z"
              stroke="white"
            />
            <path
              d="M93 38.5C93 57.5538 77.5538 73 58.5 73C39.4462 73 24 57.5538 24 38.5C24 19.4462 39.4462 4 58.5 4C77.5538 4 93 19.4462 93 38.5Z"
              fill="#484848"
            />
            <path
              d="M1 26C1 23.2386 3.23858 21 6 21H19C21.7614 21 24 23.2386 24 26V51C24 53.7614 21.7614 56 19 56H6C3.23858 56 1 53.7614 1 51V26Z"
              fill="#484848"
            />
            <path
              d="M58.5 73C77.5538 73 93 57.5538 93 38.5C93 19.4462 77.5538 4 58.5 4M58.5 73C39.4462 73 24 57.5538 24 38.5C24 19.4462 39.4462 4 58.5 4M58.5 73V4M6 56H19C21.7614 56 24 53.7614 24 51V26C24 23.2386 21.7614 21 19 21H6C3.23858 21 1 23.2386 1 26V51C1 53.7614 3.23858 56 6 56Z"
              stroke="white"
            />
            <path
              d="M93 35.5C93 54.5538 77.5538 70 58.5 70C39.4462 70 24 54.5538 24 35.5C24 16.4462 39.4462 1 58.5 1C77.5538 1 93 16.4462 93 35.5Z"
              fill="#C9CAE9"
            />
            <path
              d="M1 23C1 20.2386 3.23858 18 6 18H19C21.7614 18 24 20.2386 24 23V48C24 50.7614 21.7614 53 19 53H6C3.23858 53 1 50.7614 1 48V23Z"
              fill="#E1E9C9"
            />
            <path
              d="M93 35.5C93 54.5538 77.5538 70 58.5 70C39.4462 70 24 54.5538 24 35.5C24 16.4462 39.4462 1 58.5 1C77.5538 1 93 16.4462 93 35.5Z"
              fill="#E9D1C9"
            />
            <path
              d="M1 23C1 20.2386 3.23858 18 6 18H19C21.7614 18 24 20.2386 24 23V48C24 50.7614 21.7614 53 19 53H6C3.23858 53 1 50.7614 1 48V23Z"
              fill="#F8F0AE"
            />
            <path
              d="M58.5 70C77.5538 70 93 54.5538 93 35.5C93 16.4462 77.5538 1 58.5 1M58.5 70C39.4462 70 24 54.5538 24 35.5C24 16.4462 39.4462 1 58.5 1M58.5 70V1M6 53H19C21.7614 53 24 50.7614 24 48V23C24 20.2386 21.7614 18 19 18H6C3.23858 18 1 20.2386 1 23V48C1 50.7614 3.23858 53 6 53Z"
              stroke="#855600"
            />
          </svg>
          <div
            getElement={(element: HTMLDivElement) =>
              (neuralNodeCountElement = element)
            }
          ></div>
        </div>
      );

      const rect = canvasApp.createRect(
        x,
        y,
        150,
        110,
        undefined,
        thumbs,
        Component() as unknown as HTMLElement,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        false,
        undefined,
        undefined,
        id,
        {
          type: neuralNodeOutputLayerName,
          formValues: {
            ['bias']: initalValues?.['bias'] ?? [],
            ['neural-layer-name']: initalValues?.['neural-layer-name'] ?? '',
            ['neural-layer-node-count']:
              initalValues?.['neural-layer-node-count'] ?? 1,
            ['activation-function']:
              initalValues?.['activation-function'] ?? 'relu',
          },
        },

        containerNode,
        undefined,
        'object-node rect-node'
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      rect.resize();

      nodeComponent = rect.nodeComponent;
      if (nodeComponent.nodeInfo) {
        nodeComponent.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'neural-layer-name',
            label: 'Name',
            value: initalValues?.['neural-layer-name'] ?? '',
            onChange: (value: string) => {
              if (!nodeComponent || !nodeComponent.nodeInfo) {
                return;
              }
              nodeComponent.nodeInfo.formValues = {
                ...nodeComponent.nodeInfo.formValues,
                ['neural-layer-name']: value,
              };
              console.log('onChange', nodeComponent.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
          {
            fieldType: FormFieldType.Slider,
            fieldName: 'neural-layer-node-count',
            label: 'Node count',
            min: 1,
            max: 10000,
            step: 1,
            value: initalValues?.['neural-layer-node-count'] ?? 1,
            onChange: (value: string) => {
              if (!nodeComponent || !nodeComponent.nodeInfo) {
                return;
              }
              nodeComponent.nodeInfo.formValues = {
                ...nodeComponent.nodeInfo.formValues,
                ['neural-layer-node-count']: value,
              };
              console.log('onChange', nodeComponent.nodeInfo);
              if (updated) {
                updated();
              }
              neuralNodeCountElement!.textContent = value;
            },
          },
          {
            fieldType: FormFieldType.Select,
            fieldName: 'activation-function',
            label: 'Activation function',
            value: initalValues?.['activation-function'] ?? 'relu',
            options: [
              { label: 'sigmoid', value: 'sigmoid' },
              { label: 'relu', value: 'relu' },
              { label: 'tanh', value: 'tanh' },
              { label: 'softmax', value: 'softmax' },
            ],
            onChange: (value: string) => {
              if (!nodeComponent || !nodeComponent.nodeInfo) {
                return;
              }
              nodeComponent.nodeInfo.formValues = {
                ...nodeComponent.nodeInfo.formValues,
                ['activation-function']: value,
              };
              console.log('onChange', nodeComponent.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
        ];
        nodeComponent.nodeInfo.isSettingsPopup = true;
        nodeComponent.nodeInfo.compute = compute;
        nodeComponent.nodeInfo.initializeCompute = initializeCompute;

        neuralNodeCountElement!.textContent =
          nodeComponent.nodeInfo.formValues?.['neural-layer-node-count'] ?? '';

        nodeComponent.nodeInfo.meta = [
          {
            getDescription: () => {
              return `Output layer for neural network (${
                parseInt(
                  nodeComponent?.nodeInfo?.formValues?.[
                    'neural-layer-node-count'
                  ]
                ) ?? 0
              } nodes)`;
            },

            type: 'info',
          },
          {
            propertyName: 'bias',
            displayName: 'Bias',
            type: 'array',
            getCount: () => {
              return (
                parseInt(
                  nodeComponent?.nodeInfo?.formValues?.[
                    'neural-layer-node-count'
                  ]
                ) ?? 0
              );
            },
          },
          {
            propertyName: 'outputs',
            displayName: 'Last outputs',
            type: 'array',
            getCount: () => {
              return lastOutput.length;
            },
            getData: () => {
              return lastOutput;
            },
          },
        ];
      }
      return nodeComponent;
    },
  };
};
