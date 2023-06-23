import {
  createElement,
  createNamedSignal,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  CanvasAppInstance,
  NodeComponentRelationType,
  INodeComponentRelation,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';

const getThumbNode = (
  thumbType: ThumbType,
  node: INodeComponent<NodeInfo>,
  path?: string
) => {
  if (node.thumbConnectors) {
    const thumbNode = node.thumbConnectors.find((thumbNode) => {
      return (
        thumbNode.thumbType === thumbType &&
        ((!path && !thumbNode.pathName) ||
          (path && thumbNode.pathName === path))
      );
    });
    return thumbNode;
  }
};

export const getTestNode = <T>(
  animatePath: (
    node: INodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: INodeComponent<T>,
      input: string
    ) =>
      | { result: boolean; output: string; followPathByName?: string }
      | Promise<{ result: boolean; output: string; followPathByName?: string }>,
    onStopped?: (input: string) => void,
    input?: string,
    followPathByName?: string,
    dummy1?: undefined,
    dummy2?: undefined,
    dummy3?: undefined,
    offsetX?: number,
    offsetY?: number,
    followPathToEndThumb?: boolean
  ) => void
) => {
  let node: INodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let mapCanvasApp: CanvasAppInstance | undefined = undefined;
  let inputNode: INodeComponent<NodeInfo> | undefined = undefined;
  let outputNode: INodeComponent<NodeInfo> | undefined = undefined;
  let testNode: INodeComponent<NodeInfo> | undefined = undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      // htmlNode.domElement.textContent = 'Sum';
      // if (rect) {
      //   rect.resize(240);
      // }
    }
    return;
  };
  const compute = (input: string) => {
    return new Promise((resolve, reject) => {
      let values: any[] = [];
      values = input as unknown as any[];
      if (!Array.isArray(input)) {
        values = [input];
      }
      if (inputNode) {
        animatePath(
          inputNode,
          'white',
          () => {
            return {
              result: true,
              output: '',
            };
          },
          () => {
            // stopped internal flow
            // - follow "test" path (call animatePath with current node and "test" as followPathByName)
            // - wait for it to finish ("onStopped")

            // - follow default path ...call animatePath with end node and undefined as followPathByName
            // - wait for it to finish ("onStopped") and resolve

            animatePath(
              rect?.nodeComponent as INodeComponent<NodeInfo>,
              'green',
              () => {
                return {
                  result: true,
                  output: '',
                };
              },
              () => {
                animatePath(
                  testNode as INodeComponent<NodeInfo>,
                  'purple',
                  () => {
                    return {
                      result: true,
                      output: '',
                    };
                  },
                  () => {
                    const sum = values
                      .map((value) => parseInt(value) ?? 0)
                      .reduce((a, b) => a + b, 0);
                    if (htmlNode) {
                      // const inputElement = createElement(
                      //   'div',
                      //   {
                      //     class:
                      //       'inline-block p-1 m-1 bg-slate-500 border border-slate-600 rounded text-white',
                      //   },
                      //   undefined,
                      //   input.toString()
                      // ) as unknown as INodeComponent<NodeInfo>;

                      if (hasInitialValue) {
                        hasInitialValue = false;
                      }
                      // htmlNode.domElement.textContent = sum.toString();

                      // if (rect) {
                      //   rect.resize(240);
                      // }
                    }
                    resolve({
                      result: sum.toString(),
                      followPath: undefined,
                    });
                  },
                  '',
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  node.x + 50 + 5,
                  node.y + 50 + 5,
                  true
                );
              },
              '',
              'test',
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              false
            );
          },
          '',
          undefined,
          undefined,
          undefined,
          undefined,
          node.x + 50 + 5,
          node.y + 50 + 5
        );
      }
    });
  };
  return {
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number
    ) => {
      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        ''
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        300,
        200,
        undefined,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            offsetY: 20,
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,
            offsetY: 40,
            color: 'red',
            pathName: 'test',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            offsetY: 20,
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true
      );
      rect.nodeComponent.nodeInfo = {};
      rect.nodeComponent.nodeInfo.formElements = [];
      rect.nodeComponent.nodeInfo.taskType = 'map';

      if (htmlNode.domElement) {
        mapCanvasApp = createCanvasApp<NodeInfo>(
          htmlNode.domElement as HTMLElement,
          true
        );

        (mapCanvasApp.canvas.domElement as HTMLElement).classList.add(
          'pointer-events-none'
        );

        const input = mapCanvasApp.createRect(
          0 - 25 - 2,
          20 - 25 + 18,
          1,
          1,
          undefined,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              hidden: true,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              hidden: true,
            },
          ],
          '',
          {
            classNames: `invisible pointer-events-none`,
          },
          true,
          true
        );
        inputNode = input.nodeComponent;

        const output = mapCanvasApp.createRect(
          300 + 25 - 5,
          20 - 25 + 18,
          1,
          1,
          undefined,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              hidden: true,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              hidden: true,
            },
          ],
          '',
          {
            classNames: `invisible pointer-events-none`,
          },
          true,
          true
        );
        outputNode = output.nodeComponent;

        const subOutput = mapCanvasApp.createRect(
          300 + 25 - 5,
          70 - 25 + 18,
          1,
          1,
          undefined,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              hidden: true,
              pathName: 'test',
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              hidden: true,
              pathName: 'test',
            },
          ],
          '',
          {
            classNames: `invisible pointer-events-none`,
          },
          true,
          true
        );

        const start = mapCanvasApp.createRect(
          75,
          25,
          50,
          50,
          undefined,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
              controlPointDistance: 0,
            },
          ],
          `<p>Test</p>`,
          {
            classNames: `bg-slate-800 text-white p-4 rounded flex flex-row items-center justify-center`,
          },
          true,
          true
        );

        const end = mapCanvasApp.createRect(
          175,
          125,
          50,
          50,
          undefined,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              controlPointDistance: 0,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
            },
          ],
          `<p>Test</p>`,
          {
            classNames: `bg-slate-800 text-white p-4 rounded flex flex-row items-center justify-center`,
          },
          true,
          true
        );
        testNode = end.nodeComponent;

        // connect start to end
        const connnection = mapCanvasApp.createCubicBezier(
          75,
          75,
          125,
          125,
          100,
          100,
          100,
          100
        );

        connnection.nodeComponent.isControlled = true;
        connnection.nodeComponent.nodeInfo = {};

        if (start && connnection.nodeComponent) {
          connnection.nodeComponent.components.push({
            type: NodeComponentRelationType.start,
            component: start,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection.nodeComponent.startNode = start.nodeComponent;
          connnection.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            start.nodeComponent
          );
        }

        if (end && connnection.nodeComponent) {
          connnection.nodeComponent.components.push({
            type: NodeComponentRelationType.end,
            component: end,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection.nodeComponent.endNode = end.nodeComponent;
          connnection.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.EndConnectorCenter,
            end.nodeComponent
          );
        }
        if (connnection.nodeComponent.update) {
          connnection.nodeComponent.update();
        }
        start.nodeComponent.connections?.push(connnection.nodeComponent);
        end.nodeComponent.connections?.push(connnection.nodeComponent);

        // connnect node connector to start
        const connnection2 = mapCanvasApp.createCubicBezier(
          -10 - 50 + 10,
          20 - 50 - 5,
          125,
          125,
          0 - 50 + 10 + 20,
          20 - 50 - 5,
          0,
          20
        );

        if (input && connnection2.nodeComponent) {
          connnection2.nodeComponent.isControlled = true;

          connnection2.nodeComponent.components.push({
            type: NodeComponentRelationType.start,
            component: input,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection2.nodeComponent.startNode = input.nodeComponent;
          connnection2.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            input.nodeComponent
          );
          input.nodeComponent.connections?.push(connnection2.nodeComponent);
        }

        if (start && connnection2.nodeComponent) {
          connnection2.nodeComponent.isControlled = true;

          connnection2.nodeComponent.components.push({
            type: NodeComponentRelationType.end,
            component: start,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection2.nodeComponent.endNode = start.nodeComponent;
          connnection2.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.EndConnectorCenter,
            start.nodeComponent
          );
          start.nodeComponent.connections?.push(connnection2.nodeComponent);
        }
        if (connnection2.nodeComponent.update) {
          connnection2.nodeComponent.update();
        }

        // connnect node connector to end
        const connnection3 = mapCanvasApp.createCubicBezier(
          0,
          0,
          300 - 50 - 10,
          20 - 50 - 5,
          0,
          0,
          300 - 50 - 50,
          20 - 50 - 5
        );
        if (end && connnection3.nodeComponent) {
          connnection3.nodeComponent.isControlled = true;

          connnection3.nodeComponent.components.push({
            type: NodeComponentRelationType.start,
            component: end,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection3.nodeComponent.startNode = end.nodeComponent;
          connnection3.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            end.nodeComponent
          );
          end.nodeComponent.connections?.push(connnection3.nodeComponent);
        }

        if (output && connnection3.nodeComponent) {
          connnection3.nodeComponent.isControlled = true;

          connnection3.nodeComponent.components.push({
            type: NodeComponentRelationType.end,
            component: output,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection3.nodeComponent.endNode = output.nodeComponent;
          connnection3.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            output.nodeComponent
          );
          output.nodeComponent.connections?.push(connnection3.nodeComponent);
        }

        if (connnection3.nodeComponent.update) {
          connnection3.nodeComponent.update();
        }

        // connnect node connector to end
        const connnection4 = mapCanvasApp.createCubicBezier(
          0,
          0,
          300 - 50 - 10,
          20 - 50 - 5,
          0,
          0,
          300 - 50 - 50,
          20 - 50 - 5,
          true,
          true
        );
        if (end && connnection4.nodeComponent) {
          connnection4.nodeComponent.isControlled = true;

          connnection4.nodeComponent.components.push({
            type: NodeComponentRelationType.start,
            component: end,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection4.nodeComponent.startNode = end.nodeComponent;
          connnection4.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            end.nodeComponent,
            'test'
          );
          end.nodeComponent.connections?.push(connnection4.nodeComponent);
        }

        if (subOutput && connnection4.nodeComponent) {
          connnection4.nodeComponent.isControlled = true;

          connnection4.nodeComponent.components.push({
            type: NodeComponentRelationType.end,
            component: subOutput,
          } as unknown as INodeComponentRelation<NodeInfo>);

          connnection4.nodeComponent.endNode = subOutput.nodeComponent;
          connnection4.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            subOutput.nodeComponent,
            'test'
          );
          subOutput.nodeComponent.connections?.push(connnection4.nodeComponent);
        }

        if (connnection4.nodeComponent.update) {
          connnection4.nodeComponent.update();
        }
      }

      createNamedSignal(`testnode-${rect.nodeComponent.id}`, '');

      node = rect.nodeComponent;
      node.nodeInfo.computeAsync = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
    },
  };
};
