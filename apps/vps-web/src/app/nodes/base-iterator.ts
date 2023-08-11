import {
  createElement,
  INodeComponent,
  ThumbConnectionType,
  ThumbType,
  createCanvasApp,
  CanvasAppInstance,
  IThumbNodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import {
  runNodeFromThumb,
  RunNodeResult,
} from '../simple-flow-engine/simple-flow-engine';
import { InitialValues, NodeTask } from '../node-task-registry';

export const SubOutputActionType = {
  pushToResult: 'pushToResult',
  filterFromResult: 'filterFromResult',
  keepInput: 'keepInput',
} as const;

export type SubOutputActionType =
  (typeof SubOutputActionType)[keyof typeof SubOutputActionType];

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
  return undefined;
};

export const getBaseIterator = <T>(
  nodeTypeName: string,
  nodeTitle: string,
  onSubOutputActionType: (input: string) => SubOutputActionType,
  animatePath: (
    node: IRectNodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: IRectNodeComponent<T>,
      input: string | any[]
    ) =>
      | { result: boolean; output: string | any[]; followPathByName?: string }
      | Promise<{
          result: boolean;
          output: string | any[];
          followPathByName?: string;
        }>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string,
    animatedNodes?: undefined,
    offsetX?: number,
    offsetY?: number,
    followPathToEndThumb?: boolean,
    singleStep?: boolean
  ) => void,
  animatePathFromThumb: (
    node: IThumbNodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: INodeComponent<T>,
      input: string | any[]
    ) =>
      | { result: boolean; output: string | any[]; followPathByName?: string }
      | Promise<{
          result: boolean;
          output: string | any[];
          followPathByName?: string;
        }>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string,
    animatedNodes?: undefined,
    offsetX?: number,
    offsetY?: number,
    followPathToEndThumb?: boolean,
    singleStep?: boolean
  ) => void,
  isConditionalSubflow?: boolean
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;
  let mapCanvasApp: CanvasAppInstance | undefined = undefined;
  let inputNode: INodeComponent<NodeInfo> | undefined = undefined;
  let outputNode: INodeComponent<NodeInfo> | undefined = undefined;
  let testNode: INodeComponent<NodeInfo> | undefined = undefined;

  let succesThumb: IThumbNodeComponent<NodeInfo> | undefined = undefined;
  let testThumb: IThumbNodeComponent<NodeInfo> | undefined = undefined;
  let textNode: HTMLElement | undefined = undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    if (htmlNode) {
      // htmlNode.domElement.textContent = 'Sum';
      // if (rect) {
      //   rect.resize(240);
      // }
    }
    if (textNode) {
      textNode.textContent = nodeTitle;
    }
    return;
  };
  const compute = (
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
  ) => {
    const mapResults: any[] = [];
    return new Promise((resolve, reject) => {
      let mapLoop = 0;
      let values: any[] = [];
      values = input as unknown as any[];
      if (!Array.isArray(input)) {
        values = [input];
      }

      if (inputNode) {
        animatePath(
          inputNode as IRectNodeComponent<NodeInfo>,
          'white',
          undefined,
          (input: string | any[]) => {
            const takeValue = input.at(mapLoop);
            if (textNode) {
              textNode.textContent = `${mapLoop + 1}/${values.length}`;
            }
            if (!rect?.nodeComponent) {
              reject();
              return;
            }
            const connection = rect.nodeComponent.connections?.find(
              (connection) => {
                return (
                  rect &&
                  rect.nodeComponent &&
                  connection.startNode?.id === rect.nodeComponent.id &&
                  connection.startNodeThumb?.pathName === 'test'
                );
              }
            );

            if (connection && connection.startNodeThumb) {
              if (!connection.endNode) {
                reject();
              } else {
                const testConnection = rect?.nodeComponent.connections?.find(
                  (connection) => {
                    return (
                      rect &&
                      rect.nodeComponent &&
                      connection.startNode?.id === rect.nodeComponent.id &&
                      connection.startNodeThumb?.pathName === 'test'
                    );
                  }
                );

                if (testThumb) {
                  const thumb = testThumb;
                  const mapStep = (value: string) => {
                    animatePathFromThumb(
                      thumb,
                      'white',
                      undefined,
                      (input: string | any[]) => {
                        if (connection.startNodeThumb) {
                          // TODO : push result to pathExecution
                          if (
                            node &&
                            pathExecution &&
                            connection &&
                            connection.startNode &&
                            connection.endNode
                          ) {
                            pathExecution.push({
                              nodeId: node.id,
                              connection: connection,
                              scopeNode: connection.startNode,
                              node: connection.startNode,
                              endNode: connection.endNode,
                              path: 'test',
                              result: true,
                              input: value,
                              output: input,
                              previousOutput: input,
                              nodeType: nodeTypeName,
                            });
                          }

                          runNodeFromThumb(
                            connection.startNodeThumb,
                            animatePathFromThumb,
                            (input: string | any[]) => {
                              // TODO : fix this type assertion
                              const action = onSubOutputActionType(
                                input as unknown as string
                              );
                              if (action === SubOutputActionType.pushToResult) {
                                mapResults.push(input);
                              } else if (
                                action === SubOutputActionType.keepInput
                              ) {
                                mapResults.push(value);
                              } else if (
                                action === SubOutputActionType.filterFromResult
                              ) {
                                // TODO: implement
                              }

                              mapLoop++;

                              if (mapLoop < values.length) {
                                if (textNode) {
                                  textNode.textContent = `${mapLoop + 1}/${
                                    values.length
                                  }`;
                                }

                                mapStep(values.at(mapLoop));
                              } else {
                                if (textNode) {
                                  textNode.textContent = nodeTitle;
                                }
                                if (!succesThumb) {
                                  reject();
                                  return;
                                }

                                animatePathFromThumb(
                                  succesThumb,
                                  'white',
                                  (
                                    _nodeId: string,
                                    node: INodeComponent<T>,
                                    input: string | any[]
                                  ) => {
                                    return {
                                      result: true,
                                      output: input ?? [],
                                      followPathByName: 'test', // if this is set .. the test subpath is followed
                                    };
                                  },
                                  (input: string | any[]) => {
                                    resolve({
                                      result: true,
                                      output: input ?? [],
                                    });
                                  },
                                  mapResults ?? [],
                                  undefined,
                                  undefined,
                                  node.x + 50 + 5,
                                  node.y + 50 + 5,
                                  undefined,
                                  true
                                );
                              }
                            },
                            input,
                            pathExecution,
                            connection.startNode,
                            mapLoop
                          );
                        }
                      },
                      value ?? '',
                      undefined,
                      undefined,
                      node.x + 50 + 5,
                      node.y + 50 + 5,
                      undefined,
                      true
                    );
                  };
                  mapStep(takeValue ?? '');
                }
              }
            } else {
              return reject();
            }
          },
          values ?? [],
          undefined,
          undefined,
          node.x + 50 + 5,
          node.y + 50 + 5,
          undefined,
          true
        );
      }
    });
  };
  return {
    name: nodeTypeName,
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: canvasAppReturnType,
      x: number,
      y: number,
      id?: string,
      initalValue?: InitialValues,
      containerNode?: INodeComponent<NodeInfo>
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
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,

            name: 'output',
            label: '[]',
            thumbConstraint: 'array',
          },
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.start,

            color: 'white',
            pathName: 'test',
            name: 'iteration',
            label: '#',
            thumbConstraint: 'value',
            thumbShape: isConditionalSubflow ? 'diamond' : 'circle',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,

            name: 'input',
            label: '[]',
            thumbConstraint: 'array',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          FormElements: [],
          type: nodeTypeName,
          taskTyp: nodeTypeName,
        }
      );
      // rect.nodeComponent.nodeInfo = {};
      // rect.nodeComponent.nodeInfo.formElements = [];
      // rect.nodeComponent.nodeInfo.taskType = nodeTypeName;

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

        const jsxComponentWrapper = createElement(
          'div',
          {
            //class: `bg-slate-500 p-4 rounded`,
            class:
              'flex text-center items-center justify-center w-[50px] h-[50px] overflow-hidden bg-slate-400 rounded',
            style: {
              'clip-path': 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
            },
          },
          undefined,
          nodeTitle
        ) as unknown as INodeComponent<NodeInfo>;

        // const start = mapCanvasApp.createRect(
        //   75,
        //   25,
        //   50,
        //   50,
        //   undefined,
        //   undefined,
        //   [
        //     {
        //       thumbType: ThumbType.StartConnectorTop,
        //       thumbIndex: 0,
        //       connectionType: ThumbConnectionType.start,
        //     },
        //     {
        //       thumbType: ThumbType.EndConnectorCenter,
        //       thumbIndex: 0,
        //       connectionType: ThumbConnectionType.end,
        //       controlPointDistance: 0,
        //     },
        //   ],
        //   jsxComponentWrapper,
        //   {
        //     classNames: `bg-slate-800 text-white p-4 rounded flex flex-row items-center justify-center`,
        //   },
        //   true,
        //   true
        // );

        const jsxCircleComponentWrapper = createElement(
          'div',
          {
            class:
              'flex text-center items-center justify-center w-[50px] h-[50px] overflow-hidden bg-slate-400 rounded',
            style: {
              'clip-path': 'circle(50%)',
            },
          },
          undefined,
          nodeTitle
        ) as unknown as INodeComponent<NodeInfo>;
        textNode = jsxCircleComponentWrapper.domElement as HTMLElement;

        const end = mapCanvasApp.createRect(
          130,
          80,
          40,
          40,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorTop,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              //controlPointDistance: 0,
            },
            {
              thumbType: ThumbType.StartConnectorBottom,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              pathName: 'test',
              //controlPointDistance: 0,
            },
            {
              thumbType: ThumbType.EndConnectorCenter,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.end,
            },
          ],
          jsxCircleComponentWrapper,
          {
            classNames: `bg-slate-800 text-white p-4 rounded flex flex-row items-center justify-center`,
          },
          true,
          true
        );
        testNode = end.nodeComponent;

        // connect start to end
        // const connnection = mapCanvasApp.createCubicBezier(
        //   0,
        //   0,
        //   0,
        //   0,
        //   0,
        //   0,
        //   0,
        //   0
        // );

        // connnection.nodeComponent.isControlled = true;
        // connnection.nodeComponent.nodeInfo = {};

        // if (start && connnection.nodeComponent) {

        //   connnection.nodeComponent.startNode = start.nodeComponent;
        //   connnection.nodeComponent.startNodeThumb = getThumbNode(
        //     ThumbType.StartConnectorTop,
        //     start.nodeComponent
        //   );
        // }

        // if (end && connnection.nodeComponent) {
        //   connnection.nodeComponent.endNode = end.nodeComponent;
        //   connnection.nodeComponent.endNodeThumb = getThumbNode(
        //     ThumbType.EndConnectorCenter,
        //     end.nodeComponent
        //   );
        // }
        // if (connnection.nodeComponent.update) {
        //   connnection.nodeComponent.update();
        // }
        // start.nodeComponent.connections?.push(connnection.nodeComponent);
        // end.nodeComponent.connections?.push(connnection.nodeComponent);

        // connnect node connector to start

        const connnection2 = mapCanvasApp.createCubicBezier();

        if (input && input.nodeComponent && connnection2.nodeComponent) {
          connnection2.nodeComponent.isControlled = true;
          connnection2.nodeComponent.startNode = input.nodeComponent;
          connnection2.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            input.nodeComponent
          );
          input.nodeComponent.connections?.push(connnection2.nodeComponent);
        }

        if (end && end.nodeComponent && connnection2.nodeComponent) {
          connnection2.nodeComponent.isControlled = true;
          connnection2.nodeComponent.endNode = end.nodeComponent;
          connnection2.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.EndConnectorCenter,
            end.nodeComponent
          );
          end.nodeComponent.connections?.push(connnection2.nodeComponent);
        }
        if (connnection2.nodeComponent && connnection2.nodeComponent.update) {
          connnection2.nodeComponent.update();
        }

        // connnect node connector to end
        const connnection3 = mapCanvasApp.createCubicBezier();

        if (end && end.nodeComponent && connnection3.nodeComponent) {
          connnection3.nodeComponent.isControlled = true;
          connnection3.nodeComponent.startNode = end.nodeComponent;
          connnection3.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorTop,
            end.nodeComponent
          );
          succesThumb = connnection3.nodeComponent.startNodeThumb;
          //end.nodeComponent.connections?.push(connnection3.nodeComponent);
        }

        if (
          output &&
          output.nodeComponent &&
          end.nodeComponent &&
          connnection3.nodeComponent
        ) {
          connnection3.nodeComponent.isControlled = true;
          connnection3.nodeComponent.endNode = output.nodeComponent;
          connnection3.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            output.nodeComponent
          );
          end.nodeComponent.connections?.push(connnection3.nodeComponent);
          output.nodeComponent.connections?.push(connnection3.nodeComponent);
        }

        if (connnection3.nodeComponent && connnection3.nodeComponent.update) {
          connnection3.nodeComponent.update();
        }

        // connnect node connector to end
        const connnection4 = mapCanvasApp.createQuadraticBezier(
          0,
          0,
          0,
          0,
          0,
          0,
          true,
          true
        );
        if (end && end.nodeComponent && connnection4.nodeComponent) {
          connnection4.nodeComponent.isControlled = true;
          connnection4.nodeComponent.startNode = end.nodeComponent;
          connnection4.nodeComponent.startNodeThumb = getThumbNode(
            ThumbType.StartConnectorBottom,
            end.nodeComponent,
            'test'
          );
          testThumb = connnection4.nodeComponent.startNodeThumb;
          end.nodeComponent.connections?.push(connnection4.nodeComponent);
        }

        if (
          subOutput &&
          subOutput.nodeComponent &&
          connnection4.nodeComponent
        ) {
          connnection4.nodeComponent.isControlled = true;
          connnection4.nodeComponent.endNode = subOutput.nodeComponent;
          connnection4.nodeComponent.endNodeThumb = getThumbNode(
            ThumbType.StartConnectorCenter,
            subOutput.nodeComponent,
            'test'
          );
          subOutput.nodeComponent.connections?.push(connnection4.nodeComponent);
        }

        if (connnection4.nodeComponent && connnection4.nodeComponent.update) {
          connnection4.nodeComponent.update();
        }
      }
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      node.nodeInfo.computeAsync = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      return node;
    },
  };
};
