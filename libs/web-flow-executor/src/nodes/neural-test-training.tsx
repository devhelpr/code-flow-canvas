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
import { getNodesByNeuralLayerType } from './neural-network-utils/get-neural-node';

/*
  https://nnplayground.com/

  3/2/2/1
  0.03
  1

[
  [[-0.59,1.81],[1]]
]

[
    [[-0.5,0.3,0.2],[0.25,-0.4,-0.1]],
    [[0.83,-0.27,-0.27]]
]

*/
export const neuralTestTrainingDataName = 'neural-test-training';
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

export const getNeuralTestTrainingNode: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<any> => {
  let nodeComponent: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
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
    if (!canvasAppInstance) {
      return {
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      };
    }
    const inputPayload: any = input;
    if (inputPayload.test) {
      return {
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      };
    }
    // const testData = {
    //   inputs: [-0.59, 1.81],
    //   expectedOutput: [1],
    // };
    const testData = {
      inputs: [0.15, 0.35],
      expectedOutput: [0, 1],
    };
    if (inputPayload.training) {
      updated();
      const payload = {
        training: 0,
        test: 1,
        ...testData,
      };

      return {
        result: payload,
        output: payload,
        followPath: undefined,
      };
    }

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

    // const initWeights = {
    //   inputToHiddenWeights: [
    //     [-0.5, 0.3],
    //     [0.25, -0.4],
    //   ],
    //   hiddenBias: [0.2, -0.1],
    //   hiddenToOutputWeights: [[0.83, -0.27]],
    //   outputBias: [-0.27],
    // };

    const initWeights = {
      inputToHiddenWeights: [
        [0.1, 0.12],
        [0.2, 0.17],
      ],
      hiddenBias: [0.8, 0.25],
      hiddenToOutputWeights: [
        [0.05, 0.33],
        [0.4, 0.07],
      ],
      outputBias: [0.15, 0.7],
    };
    if (inputNodes && hiddenNodes && outputNodes) {
      inputNodes.forEach((inputNode) => {
        // input layer
        const inputLayerNodeCount =
          parseInt(inputNode.nodeInfo?.formValues['neural-layer-node-count']) ??
          0;
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
              initWeights.inputToHiddenWeights?.[loopHidden]?.[loop] ??
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

        let loop = 0;
        while (loop < hiddenOrOutputLayerNodeCount) {
          hiddenNode.nodeInfo?.formValues['weights']?.push([]);
          let loopHidden = 0;
          while (loopHidden < hiddenLayerNodeCount) {
            hiddenNode.nodeInfo?.formValues['weights'][loop].push(
              initWeights.hiddenToOutputWeights?.[loop]?.[loopHidden] ??
                Math.random() * 2 - 1 // * Math.sqrt(2 / hiddenLayerNodeCount) //* 2 - 1
            );
            loopHidden++;
          }
          loop++;
        }

        hiddenNode.nodeInfo!.formValues['bias'] = [];
        loop = 0;
        while (loop < hiddenLayerNodeCount) {
          hiddenNode.nodeInfo?.formValues['bias']?.push(
            initWeights.hiddenBias?.[loop] ?? Math.random() * 2 - 1
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
            initWeights.outputBias?.[loop] ?? Math.random() * 2 - 1
          );
          loop++;
        }
      });
    }
    const payload = {
      training: 1,
      test: 0,
      ...testData,
    };

    return {
      result: payload,
      output: payload,
      followPath: undefined,
    };
  };

  return {
    name: neuralTestTrainingDataName,
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
          train & test NN
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
          type: neuralTestTrainingDataName,
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
        nodeComponent.nodeInfo.compute = compute;
        nodeComponent.nodeInfo.initializeCompute = initializeCompute;
      }
      return nodeComponent;
    },
  };
};
