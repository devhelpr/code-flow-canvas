import {
  CanvasAppInstance,
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

export const neuralNodeTrainHiddenLayerName = 'neural-node-train-hidden-layer';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenterLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    // thumbConstraint: 'gradients',
  },
  {
    thumbType: ThumbType.EndConnectorCenterRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'gradients',
  },
];

export const getNeuralNodeTrainHiddenLayerNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;
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
    if (
      layerInput &&
      typeof layerInput === 'object' &&
      layerInput.outputs &&
      layerInput.expectedOutput &&
      Array.isArray(layerInput.outputs) &&
      Array.isArray(layerInput.expectedOutput)
    ) {
      if (canvasAppInstance) {
        const currentLayerName =
          nodeComponent.nodeInfo?.formValues['neural-layer-name'] ?? '';
        const neuralLayer = getNodeByNeuralLayerName(
          nodeComponent.nodeInfo?.formValues['neural-layer-name'] ?? '',
          canvasAppInstance
        ) as unknown as IRectNodeComponent<NodeInfo>;

        if (neuralLayer) {
          let hiddenOrInputLayer: IRectNodeComponent<NodeInfo> | undefined =
            undefined;
          //let inputLayerNodeCount = 0;
          let hiddenOrInputLayerName = '';
          neuralLayer.connections?.forEach((connection) => {
            if (
              connection.startNode?.id !== neuralLayer.id &&
              (connection.startNode?.nodeInfo?.type ===
                'neural-node-hidden-layer' ||
                connection.startNode?.nodeInfo?.type ===
                  'neural-node-input-layer') &&
              connection.startNode?.nodeInfo?.formValues
            ) {
              hiddenOrInputLayer =
                connection.startNode as unknown as IRectNodeComponent<NodeInfo>;
              // inputLayerNodeCount =
              //   parseInt(
              //     connection.startNode.nodeInfo.formValues[
              //       'neural-layer-node-count'
              //     ]
              //   ) ?? 0;

              hiddenOrInputLayerName =
                connection.startNode.nodeInfo.formValues['neural-layer-name'];
            }
          });
          if (!hiddenOrInputLayer || !hiddenOrInputLayerName) {
            return {
              stop: true,
              result: undefined,
              output: undefined,
              followPath: undefined,
            };
          }
          const activationFunction =
            neuralLayer.nodeInfo?.formValues?.['activation-function'] ?? 'relu';

          const currentLayerNodeCount =
            parseInt(
              neuralLayer.nodeInfo?.formValues?.['neural-layer-node-count']
            ) ?? 0;

          const nodeLayer = hiddenOrInputLayer! as IRectNodeComponent<NodeInfo>;
          const weights = nodeLayer?.nodeInfo?.formValues?.['weights'] ?? [];
          const orgWeights = weights.map((row: number[]) => [...row]);

          // let hiddenOrOutputLayerNodeCount = 0;
          // neuralLayer.connections?.forEach((connection) => {
          //   if (
          //     connection.startNode?.id === neuralLayer.id &&
          //     (connection.endNode?.nodeInfo?.type ===
          //       'neural-node-hidden-layer' ||
          //       connection.endNode?.nodeInfo?.type ===
          //         'neural-node-output-layer') &&
          //     connection.endNode?.nodeInfo?.formValues
          //   ) {
          //     hiddenOrOutputLayerNodeCount =
          //       parseInt(
          //         connection.endNode.nodeInfo.formValues[
          //           'neural-layer-node-count'
          //         ]
          //       ) ?? 0;
          //   }
          // });

          const hiddenToOutputWeights =
            layerInput.orgWeightsHiddenToOutput ?? [];
          const outputDeltas = layerInput.outputDeltas ?? [];
          const hiddenErrors = [];
          for (let i = 0; i < currentLayerNodeCount; i++) {
            let error = 0;
            for (let j = 0; j < outputDeltas.length; j++) {
              error += hiddenToOutputWeights[j][i] * outputDeltas[j];
            }
            hiddenErrors.push(error);
          }

          const hiddenOutputs = layerInput.hiddenLayers[currentLayerName];
          const hiddenDeltas = [];
          for (let i = 0; i < currentLayerNodeCount; i++) {
            hiddenDeltas.push(
              hiddenErrors[i] *
                deriviateActivationFunction(
                  activationFunction as ActivationFunctionType,
                  hiddenOutputs[i]
                )
            );
          }

          const inputs = layerInput.hiddenLayerInputs[currentLayerName];
          // TODO: inputs kan hier een 2d-array zijn... afhankelijk of de input node een hidden layer was
          //   of een input layer
          for (let i = 0; i < currentLayerNodeCount; i++) {
            let hiddenInputs = Array.isArray(inputs[0]) ? inputs[i] : inputs;
            for (let j = 0; j < hiddenInputs.length; j++) {
              const deltaWeight =
                learningRate * hiddenDeltas[i] * hiddenInputs[j];

              if (
                (hiddenOrInputLayer as IRectNodeComponent<NodeInfo>)?.nodeInfo
                  ?.formValues?.['weights']?.[i][j] !== undefined
              ) {
                const nodeLayer =
                  hiddenOrInputLayer! as IRectNodeComponent<NodeInfo>;
                nodeLayer!.nodeInfo!.formValues['weights'][i][j] -= deltaWeight;
              }
            }
            const deltaBias = learningRate * hiddenDeltas[i]; //hiddenErrors[i] * hiddenOutputs[i];

            if (
              neuralLayer?.nodeInfo?.formValues?.['bias']?.[i] !== undefined
            ) {
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
            outputDeltas: hiddenDeltas,
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
    name: neuralNodeTrainHiddenLayerName,
    family: 'flow-canvas',
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;

      const Component = () => (
        <div class="inner-node bg-[#C9CAE9] text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]">
          <div>train hidden layer</div>
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
          type: neuralNodeTrainHiddenLayerName,
          formValues: {
            ['neural-layer-name']: initalValues?.['neural-layer-name'] ?? '',
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
