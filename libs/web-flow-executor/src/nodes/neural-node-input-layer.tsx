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
import { navBarButton } from '../consts/classes';
import { showNeuralNetworkView } from './neural-network-utils/neural-network-view';

/*
  TODO : 
    - add small info button to show the inputs and weights in a dialog
     ... other layers should the bias as well
    
*/

export const neuralNodeInputLayerName = 'neural-node-input-layer';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'weighted-layer-data',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: -1,
    thumbConstraint: 'input-data',
  },
];

export const getNeuralNodeInputLayerNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let neuralNodeCountElement: HTMLDivElement | undefined = undefined;
  //let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };

  function getHiddenLayer() {
    let hiddenLayer: IRectNodeComponent<NodeInfo> | undefined = undefined;
    nodeComponent.connections?.forEach((connection) => {
      if (
        connection.startNode?.id === nodeComponent.id &&
        connection.endNode?.nodeInfo?.type === 'neural-node-hidden-layer' &&
        connection.endNode?.nodeInfo?.formValues
      ) {
        hiddenLayer = connection.endNode;
      }
    });

    return hiddenLayer as IRectNodeComponent<NodeInfo> | undefined;
  }

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
      layerInput.inputs &&
      Array.isArray(layerInput.inputs)
    ) {
      const currentLayerNodeCount =
        parseInt(
          nodeComponent.nodeInfo?.formValues?.['neural-layer-node-count']
        ) ?? 0;
      if (currentLayerNodeCount !== layerInput.inputs.length) {
        return {
          stop: true,
          result: undefined,
          output: undefined,
          followPath: undefined,
        };
      }
      let hiddenLayerNodeCount = 0;
      const hiddenLayer = getHiddenLayer();
      if (hiddenLayer) {
        hiddenLayerNodeCount =
          parseInt(
            hiddenLayer.nodeInfo?.formValues['neural-layer-node-count']
          ) ?? 0;
      }

      let outputs: number[][] = [];
      let loopHidden = 0;
      while (loopHidden < hiddenLayerNodeCount) {
        // loop door alle inputs

        outputs.push([]);
        let loop = 0;
        while (loop < currentLayerNodeCount) {
          const input = layerInput.inputs[loop];
          // loop door alle hidden layers
          const inputWeight =
            nodeComponent.nodeInfo?.formValues?.['weights']?.[loopHidden][
              loop
            ] ?? 0;
          outputs[loopHidden].push(inputWeight * input);
          loop++;
        }
        loopHidden++;
      }

      const outputData = {
        weightedOutput: outputs,
        inputs: layerInput.inputs,
        expectedOutput: layerInput.expectedOutput,
        training: layerInput.training,
        testing: layerInput.testing,
        trainingEpoch: layerInput.trainingEpoch,
        trainingIndex: layerInput.trainingIndex,
        trainingEpochs: layerInput.trainingEpochs,
        trainingBatchSize: layerInput.trainingBatchSize,
        connectionHistory: layerInput.connectionHistory,
      };
      //console.log('neural-node-input-layer', outputData);
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
    name: neuralNodeInputLayerName,
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
      //canvasAppInstance = canvasApp;

      const Component = () => (
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]">
          <svg
            width="72"
            height="83"
            viewBox="0 0 72 83"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M71 47.5C71 66.5538 55.5538 82 36.5 82C17.4462 82 2 66.5538 2 47.5C2 28.4462 17.4462 13 36.5 13C55.5538 13 71 28.4462 71 47.5Z"
              fill="#484848"
              stroke="white"
            />
            <path
              d="M71 43.5C71 62.5538 55.5538 78 36.5 78C17.4462 78 2 62.5538 2 43.5C2 24.4462 17.4462 9 36.5 9C55.5538 9 71 24.4462 71 43.5Z"
              fill="#484848"
              stroke="white"
            />
            <path
              d="M70 38.5C70 57.5538 54.5538 73 35.5 73C16.4462 73 1 57.5538 1 38.5C1 19.4462 16.4462 4 35.5 4C54.5538 4 70 19.4462 70 38.5Z"
              fill="#484848"
              stroke="white"
            />
            <path
              d="M71 35.5C71 54.5538 55.5538 70 36.5 70C17.4462 70 2 54.5538 2 35.5C2 16.4462 17.4462 1 36.5 1C55.5538 1 71 16.4462 71 35.5Z"
              fill="#D2E8C8"
              stroke="black"
            />
          </svg>

          <div
            getElement={(element: HTMLDivElement) =>
              (neuralNodeCountElement = element)
            }
          ></div>
          <button
            class={`${navBarButton}`}
            click={() => {
              showNeuralNetworkView(canvasApp.rootElement, nodeComponent);
            }}
          >
            View Neural Network
          </button>
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
          type: neuralNodeInputLayerName,
          formValues: {
            ['weights']: initalValues?.['weights'] ?? [],
            ['neural-layer-name']: initalValues?.['neural-layer-name'] ?? '',
            ['neural-layer-node-count']:
              initalValues?.['neural-layer-node-count'] ?? 1,
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
        ];
        nodeComponent.nodeInfo.isSettingsPopup = true;
        nodeComponent.nodeInfo.compute = compute;
        nodeComponent.nodeInfo.initializeCompute = initializeCompute;

        neuralNodeCountElement!.textContent =
          nodeComponent.nodeInfo.formValues?.['neural-layer-node-count'] ?? '';

        nodeComponent.nodeInfo.meta = [
          {
            getDescription: () => {
              const hiddenLayer = getHiddenLayer();
              return `Input layer for neural network\nHolds weights per hidden layer node (${
                parseInt(
                  hiddenLayer?.nodeInfo?.formValues?.['neural-layer-node-count']
                ) ?? 0
              }) for each input node (${
                parseInt(
                  nodeComponent?.nodeInfo?.formValues?.[
                    'neural-layer-node-count'
                  ]
                ) ?? 0
              })`;
            },

            type: 'info',
          },
          {
            propertyName: 'weights',
            displayName: 'Weights',
            type: 'matrix',
            getColumnCount: () => {
              return (
                parseInt(
                  nodeComponent?.nodeInfo?.formValues?.[
                    'neural-layer-node-count'
                  ]
                ) ?? 0
              );
            },

            getRowCount: () => {
              const hiddenLayer = getHiddenLayer();
              return (
                parseInt(
                  hiddenLayer?.nodeInfo?.formValues?.['neural-layer-node-count']
                ) ?? 0
              );
            },
          },
        ];
      }
      return nodeComponent;
    },
  };
};
