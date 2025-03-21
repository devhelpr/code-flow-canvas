import {
  IFlowCanvasBase,
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
import { Mnist } from './neural-network-utils/mnist';
import { getNodesByNeuralLayerType } from './neural-network-utils/get-neural-node';
import { NeuralNetworkLayerTrainingSample } from './neural-network-utils/types';

/*

  neural layer structure:


  inputs:

    has [input node count] weights  for each node in the connected hidden layer
    

  hidden layer:
  
    has [hidden node count] weights for each node in the connected hidden or output layer
    has bias for eac node in this layer
    

  output layer:

    has bias for each node in this layer
    
*/

export const neuralMnistTrainingDataName = 'neural-mnist-training-data';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    color: 'white',
    label: ' ',
    maxConnections: 1,
    thumbConstraint: 'input-data',
  },
  {
    thumbType: ThumbType.EndConnectorCenter,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    color: 'white',
    label: ' ',
    maxConnections: -1,
    thumbConstraint: 'iteration',
  },
];

export const getNeuralMnistTrainingDataNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let nodeHTMLElement: HTMLElement | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  let mnist: Mnist | undefined = undefined;

  let trainedWeightsPerBatch: NeuralNetworkLayerTrainingSample[] = [];

  const computeAsync = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounter?: RunCounter
  ) => {
    if (!canvasAppInstance) {
      return Promise.resolve({
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      });
    }

    const maxEpochs = 10; //5;
    // const maxDigits = 10; //10;
    const inputAsObject = input as unknown as any;

    if (mnist && !inputAsObject.inittesting && !inputAsObject.inittraining) {
      const maxIndex = mnist.structuredData.shuffledData.length - 1000; //800;

      if (typeof inputAsObject !== 'object' || !inputAsObject) {
        return Promise.resolve({
          result: undefined,
          output: undefined,
          followPath: undefined,
          stop: true,
        });
      }
      if (inputAsObject.testing) {
        const maxLength = mnist.structuredData.shuffledData.length - 1;
        const testData = {
          inputs: mnist.structuredData.shuffledData[maxLength].input,
          expectedOutput:
            mnist.structuredData.shuffledData[maxLength].expectedOutput,
          training: 0,
          testing: 1,
          trainingEpoch: 0,
          trainingIndex: {
            digit: 0,
            index: maxLength,
          },
          trainingEpochs: 10,
          trainingBatchSize: 100,
        };
        return Promise.resolve({
          result: testData,
          output: testData,
          followPath: undefined,
          //stop: true,
        });
      }

      if (
        !inputAsObject.trainingIndex ||
        inputAsObject.trainingIndex.digit === undefined ||
        inputAsObject.trainingIndex.index === undefined
      ) {
        return Promise.resolve({
          result: undefined,
          output: undefined,
          followPath: undefined,
          stop: true,
        });
      }
      let currentEpoch = inputAsObject.trainingEpoch ?? 0;
      let currentDigit = inputAsObject.trainingIndex?.digit ?? 0;
      let currentIndex = inputAsObject.trainingIndex?.index ?? 0;

      currentIndex = currentIndex + 1;
      if (
        currentIndex >= mnist.structuredData.shuffledData.length ||
        currentIndex > maxIndex
      ) {
        currentDigit++;
        currentIndex = 0;

        currentEpoch++;
        if (currentEpoch >= maxEpochs) {
          updated();
          return Promise.resolve({
            result: undefined,
            output: undefined,
            followPath: undefined,
            stop: true,
          });
        } else {
          currentDigit = 0;
          currentIndex = 0;
        }
      }

      /*
        TODO :
        - train in batches
        - so just calculate the proposed new weights and biases with backward propagation
        - collect all proposed weights and biases here
        - when batch is done.. calculate average weights and biases and update the weights and biases
        - reset the proposed weights and biases
        - continue with the next batch

        - eerste stap om hier te komen: gewichten niet meer updaten tijdens backward propagation maar hier opvangen en dan updaten

          - nu wordt direct de formValues bijgewerkt
          - ipv daarvan : in de output in layers sectie met node layer-name de weights/biases doorsturen
        
      */

      const maxProgress = maxIndex * maxEpochs;
      const currentProgress = currentEpoch * maxIndex + currentIndex;
      const progress = (currentProgress / maxProgress) * 100;
      if (nodeHTMLElement) {
        nodeHTMLElement.innerHTML = `training ${progress.toFixed(2)}%`;
      }
      trainedWeightsPerBatch.push(inputAsObject.layers);
      if (currentIndex % 32 === 0) {
        // 32 is batch size

        // TODO : calculate new weights and biases here .. determine average
        //    store per layer-node the weights and biases

        /*
          the adjust weights and node are in the layers object
            .. stored for the linked layer connected to the training-node



        */

        const inputNodes = getNodesByNeuralLayerType(
          'neural-node-input-layer',
          canvasAppInstance!
        );

        const hiddenNodes = getNodesByNeuralLayerType(
          'neural-node-hidden-layer',
          canvasAppInstance!
        );

        const outputNodes = getNodesByNeuralLayerType(
          'neural-node-output-layer',
          canvasAppInstance!
        );

        if (inputNodes && hiddenNodes && outputNodes) {
          const inputNames: string[] = [];
          const hiddenNames: string[] = [];
          const outputNames: string[] = [];

          inputNodes.forEach((inputNode) => {
            inputNames.push(
              inputNode.nodeInfo!.formValues['neural-layer-name']
            );
          });
          hiddenNodes.forEach((hiddenNode) => {
            hiddenNames.push(
              hiddenNode.nodeInfo!.formValues['neural-layer-name']
            );
          });
          outputNodes.forEach((outputNode) => {
            outputNames.push(
              outputNode.nodeInfo!.formValues['neural-layer-name']
            );
          });

          const layerWeights: NeuralNetworkLayerTrainingSample = {};

          trainedWeightsPerBatch.forEach((layer) => {
            // inputNames.forEach((layerName) => {
            //   if (layer[layerName]) {
            //     const nodesWeightsBias = layer[layerName];
            //     if (!layerWeights[layerName]) {
            //       layerWeights[layerName] = new Array(
            //         nodesWeightsBias.length
            //       ).fill({
            //         weights: new Array(nodesWeightsBias[0].weights.length).fill(
            //           0
            //         ),
            //         bias: 0,
            //         count: 0,
            //       });
            //     }
            //     for (let i = 0; i < nodesWeightsBias.length; i++) {
            //       const neuralNetworkLayerTrainingSample = nodesWeightsBias[i];
            //       for (
            //         let j = 0;
            //         j < neuralNetworkLayerTrainingSample.weights.length;
            //         j++
            //       ) {
            //         const weight = neuralNetworkLayerTrainingSample.weights[j];
            //         layerWeights[layerName][i].weights[j] += weight;
            //       }
            //       layerWeights[layerName][i].count += 1;
            //     }
            //   }
            // });

            hiddenNames.forEach((layerName) => {
              if (layer[layerName]) {
                const nodesWeightsBias = layer[layerName];
                if (!layerWeights[layerName]) {
                  layerWeights[layerName] = new Array(
                    nodesWeightsBias.length
                  ).fill({});
                  layerWeights[layerName] = layerWeights[layerName].map(() => {
                    return {
                      weights: new Array(
                        nodesWeightsBias[0].weights.length
                      ).fill(0),
                      bias: 0,
                      count: 0,
                    };
                  });
                }
                for (let i = 0; i < nodesWeightsBias.length; i++) {
                  const neuralNetworkLayerTrainingSample = nodesWeightsBias[i];
                  for (
                    let j = 0;
                    j < neuralNetworkLayerTrainingSample.weights.length;
                    j++
                  ) {
                    const weight = neuralNetworkLayerTrainingSample.weights[j];
                    layerWeights[layerName][i].weights[j] += weight;
                  }
                  layerWeights[layerName][i].bias +=
                    neuralNetworkLayerTrainingSample.bias;
                  layerWeights[layerName][i].count += 1;
                }
              }
            });

            outputNames.forEach((layerName) => {
              if (layer[layerName]) {
                const nodesWeightsBias = layer[layerName];
                if (!layerWeights[layerName]) {
                  layerWeights[layerName] = new Array(
                    nodesWeightsBias.length
                  ).fill({});
                  layerWeights[layerName] = layerWeights[layerName].map(() => {
                    return {
                      weights: new Array(
                        nodesWeightsBias[0].weights.length
                      ).fill(0),
                      bias: 0,
                      count: 0,
                    };
                  });
                }
                for (let i = 0; i < nodesWeightsBias.length; i++) {
                  const neuralNetworkLayerTrainingSample = nodesWeightsBias[i];
                  for (
                    let j = 0;
                    j < neuralNetworkLayerTrainingSample.weights.length;
                    j++
                  ) {
                    const weight = neuralNetworkLayerTrainingSample.weights[j];
                    layerWeights[layerName][i].weights[j] += weight;
                  }
                  layerWeights[layerName][i].bias +=
                    neuralNetworkLayerTrainingSample.bias;
                  layerWeights[layerName][i].count += 1;
                }
              }
            });

            // inputNodes.forEach((inputNode) => {
            //   // input layer
            //   const layer =
            //     layerWeights[
            //       inputNode.nodeInfo!.formValues['neural-layer-name']
            //     ];
            //   if (layer) {
            //     for (let i = 0; i < layer.length; i++) {
            //       for (let j = 0; j < layer[i].weights.length; j++) {
            //         inputNode.nodeInfo!.formValues['weights'][i] =
            //           layer[i].weights[j] / layer[i].count;
            //       }
            //       inputNode.nodeInfo!.formValues['bias'] =
            //         layer[i].bias / layer[i].count;
            //     }
            //   }
            // });

            // hiddenNodes.forEach((hiddenNode) => {
            //   const layer =
            //     layerWeights[
            //       hiddenNode.nodeInfo!.formValues['neural-layer-name']
            //     ];
            //   if (layer) {
            //     for (let i = 0; i < layer.length; i++) {
            //       for (let j = 0; j < layer[i].weights.length; j++) {
            //         hiddenNode.nodeInfo!.formValues['weights'][i] =
            //           layer[i].weights[j] / layer[i].count;
            //       }
            //       hiddenNode.nodeInfo!.formValues['bias'] =
            //         layer[i].bias / layer[i].count;
            //     }
            //   }
            // });
            // outputNodes.forEach((outputNode) => {
            //   const layer =
            //     layerWeights[
            //       outputNode.nodeInfo!.formValues['neural-layer-name']
            //     ];
            //   if (layer) {
            //     for (let i = 0; i < layer.length; i++) {
            //       for (let j = 0; j < layer[i].weights.length; j++) {
            //         outputNode.nodeInfo!.formValues['weights'][i] =
            //           layer[i].weights[j] / layer[i].count;
            //       }
            //       outputNode.nodeInfo!.formValues['bias'] =
            //         layer[i].bias / layer[i].count;
            //     }
            //   }
            // });

            inputNodes.forEach((inputNode) => {
              // input layer
              const inputLayerNodeCount =
                parseInt(
                  inputNode.nodeInfo?.formValues['neural-layer-node-count']
                ) ?? 0;
              inputNode.nodeInfo!.formValues['weights'] = [];

              let hiddenOrOutputLayerNodeCount = 0;
              let hiddenLayerName = '';
              inputNode.connections?.forEach((connection) => {
                if (
                  connection.startNode?.id === inputNode.id &&
                  (connection.endNode?.nodeInfo?.type ===
                    'neural-node-hidden-layer' ||
                    connection.endNode?.nodeInfo?.type ===
                      'neural-node-output-layer') &&
                  connection.endNode?.nodeInfo?.formValues
                ) {
                  hiddenOrOutputLayerNodeCount =
                    parseInt(
                      connection.endNode.nodeInfo.formValues[
                        'neural-layer-node-count'
                      ]
                    ) ?? 0;
                  hiddenLayerName =
                    connection.endNode.nodeInfo.formValues['neural-layer-name'];
                }
              });

              const layer = layerWeights[hiddenLayerName];
              if (layer) {
                let loopHidden = 0;
                while (loopHidden < hiddenOrOutputLayerNodeCount) {
                  const layerNode = layer[loopHidden];

                  inputNode.nodeInfo?.formValues['weights']?.push([]);
                  let loop = 0;
                  while (loop < inputLayerNodeCount) {
                    inputNode.nodeInfo?.formValues['weights'][loopHidden].push(
                      layerNode.weights[loop] / layerNode.count
                    );
                    loop++;
                  }
                  loopHidden++;
                }
              }
            });

            hiddenNodes.forEach((hiddenNode) => {
              const hiddenLayerNodeCount =
                parseInt(
                  hiddenNode.nodeInfo?.formValues['neural-layer-node-count']
                ) ?? 0;

              hiddenNode.nodeInfo!.formValues['weights'] = [];
              const currentHiddenLayerName =
                hiddenNode.nodeInfo?.formValues['neural-layer-name'];

              let hiddenOrOutputLayerNodeCount = 0;
              let hiddenLayerName = '';
              hiddenNode.connections?.forEach((connection) => {
                if (
                  connection.startNode?.id === hiddenNode.id &&
                  (connection.endNode?.nodeInfo?.type ===
                    'neural-node-hidden-layer' ||
                    connection.endNode?.nodeInfo?.type ===
                      'neural-node-output-layer') &&
                  connection.endNode?.nodeInfo?.formValues
                ) {
                  hiddenOrOutputLayerNodeCount =
                    parseInt(
                      connection.endNode.nodeInfo.formValues[
                        'neural-layer-node-count'
                      ]
                    ) ?? 0;
                  hiddenLayerName =
                    connection.endNode.nodeInfo.formValues['neural-layer-name'];
                }
              });
              const layer = layerWeights[hiddenLayerName];
              if (layer) {
                let loopHidden = 0;
                while (loopHidden < hiddenOrOutputLayerNodeCount) {
                  const layerNode = layer[loopHidden];
                  hiddenNode.nodeInfo?.formValues['weights']?.push([]);
                  let loop = 0;
                  while (loop < hiddenLayerNodeCount) {
                    hiddenNode.nodeInfo?.formValues['weights'][loopHidden].push(
                      layerNode.weights[loop] / layerNode.count
                    );
                    loop++;
                  }
                  loopHidden++;
                }
              }
              const biasLayer = layerWeights[currentHiddenLayerName];
              if (biasLayer) {
                hiddenNode.nodeInfo!.formValues['bias'] = [];
                let loop = 0;
                while (loop < hiddenLayerNodeCount) {
                  const layerNode = biasLayer[loop];
                  hiddenNode.nodeInfo?.formValues['bias']?.push(
                    layerNode.bias / layerNode.count
                  );
                  loop++;
                }
              }
            });

            outputNodes.forEach((outputNode) => {
              const outputLayerNodeCount =
                parseInt(
                  outputNode.nodeInfo!.formValues['neural-layer-node-count']
                ) ?? 0;
              const outputLayerName =
                outputNode.nodeInfo!.formValues['neural-layer-name'];
              const layer = layerWeights[outputLayerName];
              if (layer) {
                outputNode.nodeInfo!.formValues['bias'] = [];
                let loop = 0;
                while (loop < outputLayerNodeCount) {
                  const layerNode = layer[loop];
                  outputNode.nodeInfo?.formValues['bias']?.push(
                    layerNode.bias / layerNode.count
                  );
                  loop++;
                }
              }
            });
          });
        }

        trainedWeightsPerBatch = [];
      }

      const inputData: any = {
        inputs: mnist.structuredData.shuffledData[currentIndex].input,
        expectedOutput:
          mnist.structuredData.shuffledData[currentIndex].expectedOutput,
        training: 1,
        testing: 0,
        trainingEpoch: currentEpoch,
        trainingIndex: {
          digit: currentDigit,
          index: currentIndex,
        },
        trainingEpochs: 10,
        trainingBatchSize: 100,
      };

      if (inputData.training) {
        inputData.connectionHistory = false;
      }

      if (window.gc) {
        window.gc();
      }
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({
            result: inputData,
            output: inputData,
            followPath: undefined,
          });
        }, 2);
      });
    }

    if (
      !(input as unknown as any).inittesting &&
      !(input as unknown as any).inittraining
    ) {
      if (nodeHTMLElement) {
        nodeHTMLElement.innerHTML = 'init training/testing first!';
      }
      return Promise.resolve({
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      });
    }

    if (nodeHTMLElement) {
      nodeHTMLElement.innerHTML =
        '<span class="inline-block simple-loader border-black border-b-[transparent]"></span>';
    }
    const promise = new Promise((resolve, _reject) => {
      Promise.all([
        fetch('/mnist/0.json').then((response: any) => response.json()),
        fetch('/mnist/1.json').then((response: any) => response.json()),
        fetch('/mnist/2.json').then((response: any) => response.json()),
        fetch('/mnist/3.json').then((response: any) => response.json()),
        fetch('/mnist/4.json').then((response: any) => response.json()),
        fetch('/mnist/5.json').then((response: any) => response.json()),
        fetch('/mnist/6.json').then((response: any) => response.json()),
        fetch('/mnist/7.json').then((response: any) => response.json()),
        fetch('/mnist/8.json').then((response: any) => response.json()),
        fetch('/mnist/9.json').then((response: any) => response.json()),
      ]).then((mnistDigits) => {
        mnist = new Mnist();
        mnist.init(
          mnistDigits[0],
          mnistDigits[1],
          mnistDigits[2],
          mnistDigits[3],
          mnistDigits[4],
          mnistDigits[5],
          mnistDigits[6],
          mnistDigits[7],
          mnistDigits[8],
          mnistDigits[8]
        );

        /*
          init neural layers bias and weights here:
          - input layer : init weights : 784 * 16
          - hidden layer : 
            - init weights : 16 * 10
            - init bias : 16
          - output layer :
            - init bias : 10
        */
        const inputNodes = getNodesByNeuralLayerType(
          'neural-node-input-layer',
          canvasAppInstance!
        );

        const hiddenNodes = getNodesByNeuralLayerType(
          'neural-node-hidden-layer',
          canvasAppInstance!
        );

        const outputNodes = getNodesByNeuralLayerType(
          'neural-node-output-layer',
          canvasAppInstance!
        );

        if (
          inputNodes &&
          hiddenNodes &&
          outputNodes &&
          (input as unknown as any).inittraining
        ) {
          inputNodes.forEach((inputNode) => {
            // input layer
            const inputLayerNodeCount =
              parseInt(
                inputNode.nodeInfo?.formValues['neural-layer-node-count']
              ) ?? 0;
            inputNode.nodeInfo!.formValues['weights'] = [];

            let hiddenOrOutputLayerNodeCount = 0;
            inputNode.connections?.forEach((connection) => {
              if (
                connection.startNode?.id === inputNode.id &&
                (connection.endNode?.nodeInfo?.type ===
                  'neural-node-hidden-layer' ||
                  connection.endNode?.nodeInfo?.type ===
                    'neural-node-output-layer') &&
                connection.endNode?.nodeInfo?.formValues
              ) {
                hiddenOrOutputLayerNodeCount =
                  parseInt(
                    connection.endNode.nodeInfo.formValues[
                      'neural-layer-node-count'
                    ]
                  ) ?? 0;
              }
            });

            let loopHidden = 0;
            while (loopHidden < hiddenOrOutputLayerNodeCount) {
              inputNode.nodeInfo?.formValues['weights']?.push([]);
              let loop = 0;
              while (loop < inputLayerNodeCount) {
                inputNode.nodeInfo?.formValues['weights'][loopHidden].push(
                  Math.random() * 2 - 1 //* Math.sqrt(2 / inputLayerNodeCount) //* 2 - 1
                );
                loop++;
              }
              loopHidden++;
            }
          });

          hiddenNodes.forEach((hiddenNode) => {
            const hiddenLayerNodeCount =
              parseInt(
                hiddenNode.nodeInfo?.formValues['neural-layer-node-count']
              ) ?? 0;

            hiddenNode.nodeInfo!.formValues['weights'] = [];

            let hiddenOrOutputLayerNodeCount = 0;
            hiddenNode.connections?.forEach((connection) => {
              if (
                connection.startNode?.id === hiddenNode.id &&
                (connection.endNode?.nodeInfo?.type ===
                  'neural-node-hidden-layer' ||
                  connection.endNode?.nodeInfo?.type ===
                    'neural-node-output-layer') &&
                connection.endNode?.nodeInfo?.formValues
              ) {
                hiddenOrOutputLayerNodeCount =
                  parseInt(
                    connection.endNode.nodeInfo.formValues[
                      'neural-layer-node-count'
                    ]
                  ) ?? 0;
              }
            });

            let loopHidden = 0;
            while (loopHidden < hiddenOrOutputLayerNodeCount) {
              hiddenNode.nodeInfo?.formValues['weights']?.push([]);
              let loop = 0;
              while (loop < hiddenLayerNodeCount) {
                hiddenNode.nodeInfo?.formValues['weights'][loopHidden].push(
                  Math.random() * 2 - 1 // * Math.sqrt(2 / hiddenLayerNodeCount) //* 2 - 1
                );
                loop++;
              }
              loopHidden++;
            }

            hiddenNode.nodeInfo!.formValues['bias'] = [];
            let loop = 0;
            while (loop < hiddenLayerNodeCount) {
              hiddenNode.nodeInfo?.formValues['bias']?.push(
                Math.random() * 2 - 1
              );
              loop++;
            }
          });

          outputNodes.forEach((outputNode) => {
            const outputLayerNodeCount =
              parseInt(
                outputNode.nodeInfo!.formValues['neural-layer-node-count']
              ) ?? 0;

            outputNode.nodeInfo!.formValues['bias'] = [];
            let loop = 0;
            while (loop < outputLayerNodeCount) {
              outputNode.nodeInfo?.formValues['bias']?.push(
                Math.random() * 2 - 1
              );
              loop++;
            }
          });
        }

        if (nodeHTMLElement) {
          nodeHTMLElement.innerHTML = 'MNist loaded';
        }

        trainedWeightsPerBatch = [];

        const inputData: any = {
          inputs: mnist.structuredData.shuffledData[0].input,
          expectedOutput: mnist.structuredData.shuffledData[0].expectedOutput,
          training: (input as unknown as any).inittraining ? 1 : 0,
          testing: (input as unknown as any).inittesting ? 1 : 0,
          trainingEpoch: 0,
          trainingIndex: {
            digit: 0,
            index: 0,
          },
          trainingEpochs: 10,
          trainingBatchSize: 100,
        };
        if (inputData.training) {
          inputData.connectionHistory = false;
        }
        resolve({
          result: inputData,
          output: inputData,
          followPath: undefined,
        });
      });
    });
    return promise;
  };

  return {
    name: neuralMnistTrainingDataName,
    family: 'flow-canvas',
    category: 'neural networks',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;

      const Component = () => (
        <div class="inner-node bg-white text-black p-4 rounded flex flex-col justify-center items-center min-w-[150px]">
          <div
            getElement={(element: HTMLElement) => {
              nodeHTMLElement = element;
            }}
          >
            Mnist training data
          </div>
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
          type: neuralMnistTrainingDataName,
          formValues: {},
        },

        containerNode,
        undefined,
        'object-node rect-node'
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }
      if (rect && rect?.resize) {
        rect.resize();
      }

      nodeComponent = rect.nodeComponent;
      if (nodeComponent.nodeInfo) {
        nodeComponent.nodeInfo.formElements = [];
        nodeComponent.nodeInfo.isSettingsPopup = true;
        nodeComponent.nodeInfo.computeAsync = computeAsync;
        nodeComponent.nodeInfo.initializeCompute = initializeCompute;
      }
      return nodeComponent;
    },
  };
};
