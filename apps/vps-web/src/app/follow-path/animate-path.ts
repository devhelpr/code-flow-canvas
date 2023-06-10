import {
  CanvasAppInstance,
  ControlAndEndPointNodeType,
  createElement,
  CurveType,
  getPointOnCubicBezierCurve,
  IElementNode,
  INodeComponent,
  ThumbType,
} from '@devhelpr/visual-programming-system';

export type FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
  color: string,
  onNextNode?: (
    nodeId: string,
    node: INodeComponent<T>,
    input: string
  ) =>
    | { result: boolean; output: string; followPathByName?: string }
    | Promise<{
        result: boolean;
        output: string;
        followPathByName?: string;
      }>,
  onStopped?: (input: string) => void,
  input?: string,
  followPathByName?: string, // normal, success, failure, "subflow",
  node1?: IElementNode<unknown>,
  node2?: IElementNode<unknown>,
  node3?: IElementNode<unknown>,
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean
) => void;

const getNodeConnectionPairById = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
  followPathByName?: string,
  followPathToEndThumb?: boolean
) => {
  const connectionPairs: {
    start: INodeComponent<T>;
    end: INodeComponent<T>;
    connection: INodeComponent<T>;
  }[] = [];

  // EXPENSIVE copy
  //const elementList = Array.from(canvasApp?.elements ?? []);
  //const node = this.canvasApp?.elements?.get(nodeId);
  if (node) {
    const start = node as unknown as INodeComponent<T>;
    if (start) {
      // EXPENSIVE filter
      // const connectionsFromStartNode = elementList.filter((e) => {
      //   const element = e[1] as INodeComponent<NodeInfo>;
      //   return element.startNode?.id === node.id;
      // });
      const connectionsFromStartNode = start.connections;
      // TODO : store connections in the nodes they connect to as well
      // (remove the need for this expensive find)
      // remove the connection reference when the node is removed from the connection

      let connection: INodeComponent<T> | undefined = undefined;

      if (connectionsFromStartNode && connectionsFromStartNode.length > 0) {
        connectionsFromStartNode.forEach((connectionNode) => {
          if (connectionNode.startNode?.id !== start.id) {
            return;
          }
          let end: INodeComponent<T> | undefined = undefined;
          connection = connectionNode as unknown as INodeComponent<T>;
          //connectionNode[1] as unknown as INodeComponent<NodeInfo>;

          if (connection && connection.endNode) {
            // EXPENSIVE find
            // const endElement = elementList.find((e) => {
            //   const element = e[1] as INodeComponent<NodeInfo>;
            //   return (
            //     connection &&
            //     connection.endNode &&
            //     element.id === connection.endNode.id
            //   );
            // });
            // if (endElement) {
            //   end = endElement[1] as unknown as INodeComponent<NodeInfo>;
            // }
            end = connection.endNode;
          }

          if (
            connection &&
            end &&
            canvasApp?.canvas &&
            connection.controlPoints &&
            connection.controlPoints.length === 2
          ) {
            if (followPathToEndThumb) {
              if (
                followPathByName &&
                connection.endNodeThumb?.pathName !== followPathByName
              ) {
                return;
              }

              if (!followPathByName && connection.endNodeThumb?.pathName) {
                return;
              }
            } else {
              if (
                followPathByName &&
                connection.startNodeThumb?.pathName !== followPathByName
              ) {
                return;
              }

              if (!followPathByName && connection.startNodeThumb?.pathName) {
                return;
              }
            }

            connectionPairs.push({
              start,
              connection,
              end,
            });
          }
        });
      }

      return connectionPairs;
    }
  }
  return false;
};

export const timers: Map<NodeJS.Timer, () => void> = new Map();
let speedMeter = 0;
export const setSpeedMeter = (speed: number) => {
  speedMeter = speed;
};

export const animatePath: FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
  color: string,
  onNextNode?: (
    nodeId: string,
    node: INodeComponent<T>,
    input: string
  ) =>
    | { result: boolean; output: string; followPathByName?: string }
    | Promise<{
        result: boolean;
        output: string;
        followPathByName?: string;
      }>,
  onStopped?: (input: string) => void,
  input?: string,
  followPathByName?: string, // normal, success, failure, "subflow",
  node1?: IElementNode<unknown>,
  node2?: IElementNode<unknown>,
  node3?: IElementNode<unknown>,
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean
) => {
  const maxSpeed = 50;
  const currentSpeed = speedMeter;
  const nodeConnectionPairs = getNodeConnectionPairById<T>(
    canvasApp,
    node,
    followPathByName,
    followPathToEndThumb
  );

  if (nodeConnectionPairs && nodeConnectionPairs.length > 0) {
    nodeConnectionPairs.forEach((nodeConnectionPair) => {
      const start = nodeConnectionPair.start;
      const connection = nodeConnectionPair.connection;
      const end = nodeConnectionPair.end;

      // eslint-disable-next-line prefer-const
      let testCircle =
        node1 ??
        createElement(
          'div',
          {
            class: `absolute top-0 left-0 z-[1000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded cursor-pointer`,
            style: {
              'background-color': color,
              'clip-path': 'circle(50%)',
            },
          },
          canvasApp?.canvas.domElement,
          ''
        );

      // eslint-disable-next-line prefer-const
      let message =
        node2 ??
        createElement(
          'div',
          {
            class: `flex text-center truncate min-w-0 overflow-hidden z-[1010] pointer-events-none origin-center px-2 bg-white text-black absolute top-[-100px] z-[1000] left-[-60px] items-center justify-center w-[80px] h-[100px] overflow-hidden cursor-pointer`,
            style: {
              'clip-path':
                'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
            },
          },
          canvasApp?.canvas.domElement,
          ''
        );

      // eslint-disable-next-line prefer-const
      let messageText =
        node3 ??
        createElement(
          'div',
          {
            class: `truncate min-w-0 overflow-hidden w-[80px] mt-[-30px]`,
          },
          message.domElement,
          input?.toString() ??
            (start.nodeInfo as unknown as any)?.formValues?.Expression ??
            ''
        );
      messageText.domElement.textContent =
        input?.toString() ??
        (start.nodeInfo as unknown as any)?.formValues?.Expression ??
        '';
      const domCircle = testCircle.domElement as HTMLElement;
      const domMessage = message.domElement as HTMLElement;
      if (!node1) {
        domCircle.style.display = 'none';
        domMessage.style.display = 'none';
        domMessage.style.pointerEvents = 'none';
      }
      let loop = 0;
      const onInterval = () => {
        if (
          start &&
          end &&
          start.onCalculateControlPoints &&
          end.onCalculateControlPoints &&
          connection &&
          connection.controlPoints &&
          connection.controlPoints.length === 2
        ) {
          const startHelper = start.onCalculateControlPoints(
            ControlAndEndPointNodeType.start,
            CurveType.bezierCubic,
            connection.startNodeThumb?.thumbType ??
              ThumbType.StartConnectorCenter,
            connection.startNodeThumb?.thumbIndex,
            end,
            connection.startNodeThumb?.thumbOffsetY ?? 0,
            connection.startNodeThumb?.thumbControlPointDistance
          );

          const endHelper = end.onCalculateControlPoints(
            ControlAndEndPointNodeType.end,
            CurveType.bezierCubic,
            connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
            connection.endNodeThumb?.thumbIndex,
            start,
            connection.endNodeThumb?.thumbOffsetY ?? 0,
            connection.endNodeThumb?.thumbControlPointDistance
          );

          const tx = 40;
          const ty = 40;
          const bezierCurvePoints = getPointOnCubicBezierCurve(
            Math.min(loop, 1),
            { x: startHelper.x + tx, y: startHelper.y + ty },
            {
              x: startHelper.cx + tx,
              y: startHelper.cy + ty,
            },
            {
              x: endHelper.cx + tx,
              y: endHelper.cy + ty,
            },
            { x: endHelper.x + tx, y: endHelper.y + ty }
          );

          if (!node1) {
            domCircle.style.display = 'flex';
          }
          domCircle.style.transform = `translate(${
            bezierCurvePoints.x + (offsetX ?? 0)
          }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;
          if (!node1) {
            domMessage.style.display = 'flex';
          }
          domMessage.style.transform = `translate(${
            bezierCurvePoints.x + (offsetX ?? 0)
          }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;

          loop += 0.015;
          if (loop > 1.015) {
            loop = 0;

            // canvasApp?.elements.delete(testCircle.id);
            // testCircle?.domElement?.remove();

            // canvasApp?.elements.delete(message.id);
            // message?.domElement?.remove();

            clearInterval(cancel);
            timers.delete(cancel);

            if (!onNextNode || onNextNode) {
              const onNextOrPromise = onNextNode?.(
                end.id,
                end,
                input ?? ''
              ) ?? {
                result: true,
                output: '',
                followPathByName: undefined,
              };

              if ((onNextOrPromise as unknown as Promise<unknown>).then) {
                canvasApp?.elements.delete(testCircle.id);
                testCircle?.domElement?.remove();

                canvasApp?.elements.delete(message.id);
                message?.domElement?.remove();
                (testCircle as unknown as undefined) = undefined;
                (message as unknown as undefined) = undefined;
                (messageText as unknown as undefined) = undefined;
              }

              Promise.resolve(onNextOrPromise)
                .then((result: any) => {
                  //const result =
                  console.log('animatePath onNextNode result', input, result);
                  if (result.result) {
                    animatePath<T>(
                      canvasApp,
                      end,
                      color,
                      onNextNode,
                      onStopped,
                      result.output,
                      result.followPathByName,
                      testCircle,
                      message,
                      messageText,
                      offsetX,
                      offsetY
                    );
                  } else {
                    canvasApp?.elements.delete(testCircle.id);
                    testCircle?.domElement?.remove();

                    canvasApp?.elements.delete(message.id);
                    message?.domElement?.remove();
                    if (onStopped) {
                      console.log('animatePath onStopped1', node, input);
                      onStopped(input ?? '');
                    }
                  }
                })
                .catch((err) => {
                  console.log('animatePath onNextNode error', err);
                });
            } else {
              canvasApp?.elements.delete(testCircle.id);
              testCircle?.domElement?.remove();

              canvasApp?.elements.delete(message.id);
              message?.domElement?.remove();
              if (onStopped) {
                console.log('animatePath onStopped2', node, input);
                onStopped(input ?? '');
              }
            }
          } else {
            if (speedMeter !== currentSpeed) {
              clearInterval(cancel);
              timers.delete(cancel);
              cancel = setInterval(
                onInterval,
                (maxSpeed * (100 - speedMeter)) / 100
              );
              setCanceler();
            }
          }
        } else {
          if (start) {
            onNextNode && onNextNode(start.id, start, input ?? '');
          }
          canvasApp?.elements.delete(testCircle.id);
          testCircle?.domElement?.remove();

          canvasApp?.elements.delete(message.id);
          message?.domElement?.remove();

          clearInterval(cancel);
          timers.delete(cancel);

          if (onStopped) {
            console.log('animatePath onStopped3', node, input);
            onStopped(input ?? '');
          }
        }
      };

      let cancel = setInterval(
        onInterval,
        (maxSpeed * (100 - speedMeter)) / 100
      );

      const setCanceler = () => {
        timers.set(cancel, () => {
          clearInterval(cancel);
          timers.delete(cancel);
          cancel = setInterval(
            onInterval,
            (maxSpeed * (100 - speedMeter)) / 100
          );
          setCanceler();
        });
      };
      setCanceler();
    });
  } else {
    if (node1 && node2 && node3) {
      canvasApp?.elements.delete(node1.id);
      node1?.domElement?.remove();

      canvasApp?.elements.delete(node2.id);
      node2?.domElement?.remove();
    }
    if (onStopped) {
      console.log('animatePath onStopped4', node, input);
      onStopped(input ?? '');
    }
  }
};
