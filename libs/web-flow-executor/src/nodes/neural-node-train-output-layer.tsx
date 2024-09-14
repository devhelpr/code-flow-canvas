import {
  FlowCanvasInstance,
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

import {
  getNodeByNeuralLayerName,
  learningRate,
} from './neural-network-utils/get-neural-node';
import {
  ActivationFunctionType,
  deriviateActivationFunction,
} from './neural-network-utils/activation-functions';

export const neuralNodeTrainOutputLayerName = 'neural-node-train-output-layer';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenterLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'gradients',
  },
  {
    thumbType: ThumbType.EndConnectorCenterRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'output-data',
  },
];

export const getNeuralNodeTrainOutputLayerNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: FlowCanvasInstance<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    return;
  };

  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounter?: RunCounter
  ) => {
    const layerInput = input as unknown as any;
    if (!layerInput?.training) {
      return {
        stop: true,
        result: undefined,
        output: undefined,
        followPath: undefined,
      };
    }
    if (
      layerInput &&
      typeof layerInput === 'object' &&
      layerInput.outputs &&
      layerInput.expectedOutput &&
      Array.isArray(layerInput.outputs) &&
      Array.isArray(layerInput.expectedOutput)
    ) {
      if (canvasAppInstance) {
        const neuralLayer = getNodeByNeuralLayerName(
          nodeComponent.nodeInfo?.formValues['neural-layer-name'] ?? '',
          canvasAppInstance
        ) as unknown as IRectNodeComponent<NodeInfo>;

        if (neuralLayer) {
          let hiddenLayer: IRectNodeComponent<NodeInfo> | undefined = undefined;
          let inputLayerNodeCount = 0;
          let hiddenLayerName = '';
          neuralLayer.connections?.forEach((connection) => {
            if (
              connection.startNode?.id !== neuralLayer.id &&
              (connection.startNode?.nodeInfo?.type ===
                'neural-node-hidden-layer' ||
                connection.startNode?.nodeInfo?.type ===
                  'neural-node-input-layer') &&
              connection.startNode?.nodeInfo?.formValues
            ) {
              hiddenLayer =
                connection.startNode as unknown as IRectNodeComponent<NodeInfo>;
              inputLayerNodeCount =
                parseInt(
                  connection.startNode.nodeInfo.formValues[
                    'neural-layer-node-count'
                  ]
                ) ?? 0;

              hiddenLayerName =
                connection.startNode.nodeInfo.formValues['neural-layer-name'];
            }
          });
          if (!hiddenLayer || !hiddenLayerName) {
            return {
              stop: true,
              result: undefined,
              output: undefined,
              followPath: undefined,
            };
          }

          const currentLayerNodeCount =
            parseInt(
              neuralLayer.nodeInfo?.formValues?.['neural-layer-node-count']
            ) ?? 0;

          const activationFunction =
            neuralLayer.nodeInfo?.formValues?.['activation-function'] ?? 'relu';
          // Output fout berekenen
          const outputErrors = [];
          for (let i = 0; i < currentLayerNodeCount; i++) {
            outputErrors.push(
              layerInput.outputs?.[i] - layerInput.expectedOutput?.[i]
            );
          }

          // Output laag delta's berekenen
          const outputDeltas = [];
          for (let i = 0; i < currentLayerNodeCount; i++) {
            outputDeltas.push(
              outputErrors[i] *
                deriviateActivationFunction(
                  activationFunction as ActivationFunctionType,
                  layerInput.outputs?.[i]
                )
            );
          }

          const nodeHiddenLayer = hiddenLayer! as IRectNodeComponent<NodeInfo>;
          const weights =
            nodeHiddenLayer.nodeInfo?.formValues?.['weights'] ?? [];
          const orgWeights = weights.map((row: number[]) => [...row]);

          const hiddenOutputs = layerInput.hiddenLayers[hiddenLayerName];
          for (let i = 0; i < currentLayerNodeCount; i++) {
            for (let j = 0; j < inputLayerNodeCount; j++) {
              let deltaWeight = outputDeltas[i] * hiddenOutputs[j];

              deltaWeight *= learningRate;
              const nodeHiddenLayer =
                hiddenLayer as IRectNodeComponent<NodeInfo>;
              if (
                nodeHiddenLayer?.nodeInfo?.formValues?.['weights']?.[i][j] !==
                undefined
              ) {
                nodeHiddenLayer.nodeInfo.formValues['weights'][i][j] -=
                  deltaWeight;
              }
            }
            const deltaBias = learningRate * outputDeltas[i];
            if (neuralLayer.nodeInfo?.formValues?.['bias']?.[i] !== undefined) {
              neuralLayer.nodeInfo.formValues['bias'][i] -= deltaBias;
            }
          }
          let output = {
            ...(input as unknown as any),
            training: layerInput.training,
            trainingEpoch: layerInput.trainingEpoch,
            trainingIndex: layerInput.trainingIndex,
            trainingEpochs: layerInput.trainingEpochs,
            trainingBatchSize: layerInput.trainingBatchSize,
            outputDeltas: outputDeltas,
            orgWeightsHiddenToOutput: orgWeights,
            connectionHistory: layerInput.connectionHistory,
          };
          return {
            result: output,
            output: output,
            followPath: undefined,
          };
        }
      }
    }
    return {
      stop: true,
      result: undefined,
      output: undefined,
      followPath: undefined,
    };
  };

  const getDependencies = (): { startNodeId: string; endNodeId: string }[] => {
    const dependencies: { startNodeId: string; endNodeId: string }[] = [];
    if (canvasAppInstance) {
      const neuralLayer = getNodeByNeuralLayerName(
        nodeComponent.nodeInfo?.formValues['neural-layer-name'] ?? '',
        canvasAppInstance
      );

      if (neuralLayer) {
        dependencies.push({
          startNodeId: nodeComponent.id,
          endNodeId: neuralLayer.id,
        });
      }
    }
    return dependencies;
  };

  return {
    name: neuralNodeTrainOutputLayerName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: FlowCanvasInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;

      const Component = () => (
        <div class="inner-node bg-[#E9D1C9] text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]">
          <div>train output layer</div>
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
          type: neuralNodeTrainOutputLayerName,
          formValues: {
            ['neural-layer-name']: initalValues?.['neural-layer-name'] ?? '',
            ['cost-function']: initalValues?.['cost-function'] ?? '',
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
            label: 'name',
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
            fieldType: FormFieldType.Select,
            fieldName: 'cost-function',
            label: 'Cost function',
            value: initalValues?.['cost-function'] ?? 'mean-squared-error',
            options: [
              { label: 'mean squared error', value: 'mean-squared-error' },
              { label: 'mean absolute error', value: 'mean-absolute-error' },
            ],
            onChange: (value: string) => {
              if (!nodeComponent || !nodeComponent.nodeInfo) {
                return;
              }
              nodeComponent.nodeInfo.formValues = {
                ...nodeComponent.nodeInfo.formValues,
                ['cost-function']: value,
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
        nodeComponent.nodeInfo.getDependencies = getDependencies;
      }
      return nodeComponent;
    },
  };
};
