import {
  CanvasAppInstance,
  createNodeElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { runNodeFromThumb } from '../flow-engine/flow-engine';

export const getSequential = (_updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: CanvasAppInstance<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    return;
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    return new Promise((resolve, reject) => {
      if (
        !node.thumbConnectors ||
        node.thumbConnectors.length < 2 ||
        !canvasAppInstance
      ) {
        reject();
        return;
      }
      runNodeFromThumb(
        node.thumbConnectors[0],
        canvasAppInstance,
        (inputFromFirstRun: string | any[]) => {
          console.log('Sequential inputFromFirstRun', inputFromFirstRun);
          if (
            !node.thumbConnectors ||
            node.thumbConnectors.length < 2 ||
            !canvasAppInstance
          ) {
            reject();
            return;
          }
          runNodeFromThumb(
            node.thumbConnectors[1],
            canvasAppInstance,
            (inputFromSecondRun: string | any[]) => {
              console.log('Sequential inputFromSecondRun', inputFromSecondRun);
              resolve({
                result: input,
                output: input,
                stop: true,
              });
            },
            input,
            node,
            loopIndex,
            scopeId
          );
        },
        input,
        node,
        loopIndex,
        scopeId
      );
    });
  };

  return {
    name: 'sequential',
    family: 'flow-canvas',
    isContainer: false,
    category: 'flow-control',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      _initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const jsxComponentWrapper = createNodeElement(
        'div',
        {
          class: `inner-node bg-slate-500 p-4 rounded pl-6 flex flex-row justify-center items-center`,
          style: {
            'clip-path': 'polygon(0 50%, 100% 0, 100% 100%)',
          },
        },
        undefined,
        'sequential'
      ) as unknown as INodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        110,
        110,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            name: 'output1',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            name: 'output2',
          },
          {
            thumbType: ThumbType.EndConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: ' ',
          },
        ],
        jsxComponentWrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          type: 'sequential',
          formValues: {},
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = [];
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
      }
      return node;
    },
  };
};
