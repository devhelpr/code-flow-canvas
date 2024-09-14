import {
  FlowCanvasInstance,
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
  let canvasAppInstance: FlowCanvasInstance<NodeInfo> | undefined = undefined;
  let nodeHTMLElement: HTMLElement | undefined = undefined;
  const initializeCompute = () => {
    return;
  };
  let mnist: Mnist | undefined = undefined;
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

      const maxProgress = maxIndex * maxEpochs;
      const currentProgress = currentEpoch * maxIndex + currentIndex;
      const progress = (currentProgress / maxProgress) * 100;
      if (nodeHTMLElement) {
        nodeHTMLElement.innerHTML = `training ${progress.toFixed(2)}%`;
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

        console.log('mnistDigits', mnist);
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
    category: 'flow-control',
    isContainer: false,
    thumbs,
    createVisualNode: (
      canvasApp: FlowCanvasInstance<NodeInfo>,
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
      rect.resize();

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
