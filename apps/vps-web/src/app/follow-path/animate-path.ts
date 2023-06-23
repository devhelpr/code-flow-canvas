import {
  CanvasAppInstance,
  ControlAndEndPointNodeType,
  createElement,
  CurveType,
  getPointOnCubicBezierCurve,
  getPointOnQuadraticBezierCurve,
  IElementNode,
  INodeComponent,
  LineType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import {
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from './get-node-connection-pairs';

export type FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
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
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IElementNode<unknown>;
    node2?: IElementNode<unknown>;
    node3?: IElementNode<unknown>;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => void;

export const timers: Map<NodeJS.Timer, () => void> = new Map();
let speedMeter = 0;
export const setSpeedMeter = (speed: number) => {
  speedMeter = speed;
};

// TODO : alt : animatePathFromThumb
// TODO : rename node1,node2,node3 and put in object
// TODO : what parameters put together in "options" parameter?
// TODO : build different variations of this function for the different use-cases

export const animatePathForNodeConnectionPairs = <T>(
  canvasApp: CanvasAppInstance,
  nodeConnectionPairs:
    | false
    | {
        start: INodeComponent<T>;
        end: INodeComponent<T>;
        connection: INodeComponent<T>;
      }[],
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
  animatedNodes?: {
    node1?: IElementNode<unknown>;
    node2?: IElementNode<unknown>;
    node3?: IElementNode<unknown>;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => {
  if (!nodeConnectionPairs || nodeConnectionPairs.length === 0) {
    if (animatedNodes?.node1 && animatedNodes?.node2 && animatedNodes?.node3) {
      canvasApp?.elements.delete(animatedNodes?.node1.id);
      animatedNodes?.node1?.domElement?.remove();

      canvasApp?.elements.delete(animatedNodes?.node2.id);
      animatedNodes?.node2?.domElement?.remove();
    }
    if (onStopped) {
      console.log('animatePath onStopped4', input);
      onStopped(input ?? '');
    }
    return;
  }
  const maxSpeed = 50;
  const currentSpeed = speedMeter;
  nodeConnectionPairs.forEach((nodeConnectionPair) => {
    const start = nodeConnectionPair.start;
    const connection = nodeConnectionPair.connection;
    const end = nodeConnectionPair.end;

    // eslint-disable-next-line prefer-const
    let testCircle =
      animatedNodes?.node1 ??
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
      animatedNodes?.node2 ??
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
      animatedNodes?.node3 ??
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
    if (!animatedNodes?.node1) {
      domCircle.style.display = 'none';
      domMessage.style.display = 'none';
      domMessage.style.pointerEvents = 'none';
    }
    let loop = 0;
    const onInterval = () => {
      if (
        start &&
        end &&
        connection.onCalculateControlPoints &&
        connection &&
        connection.controlPoints &&
        connection.controlPoints.length >= 1
      ) {
        const startHelper = connection.onCalculateControlPoints(
          start,
          ControlAndEndPointNodeType.start,
          connection.startNodeThumb?.thumbType ??
            ThumbType.StartConnectorCenter,
          connection.startNodeThumb?.thumbIndex,
          end,
          connection.startNodeThumb?.thumbOffsetY ?? 0,
          connection.startNodeThumb?.thumbControlPointDistance,
          connection.endNodeThumb
        );

        const endHelper = connection.onCalculateControlPoints(
          end,
          ControlAndEndPointNodeType.end,
          connection.endNodeThumb?.thumbType ?? ThumbType.EndConnectorCenter,
          connection.endNodeThumb?.thumbIndex,
          start,
          connection.endNodeThumb?.thumbOffsetY ?? 0,
          connection.endNodeThumb?.thumbControlPointDistance,
          connection.startNodeThumb
        );

        const tx = 40;
        const ty = 40;

        const bezierCurvePoints =
          connection.lineType === LineType.BezierCubic
            ? getPointOnCubicBezierCurve(
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
              )
            : getPointOnQuadraticBezierCurve(
                Math.min(loop, 1),
                { x: startHelper.x + tx, y: startHelper.y + ty },
                {
                  x: startHelper.cx + tx,
                  y: startHelper.cy + ty,
                },
                { x: endHelper.x + tx, y: endHelper.y + ty }
              );

        if (!animatedNodes?.node1) {
          domCircle.style.display = 'flex';
        }
        domCircle.style.transform = `translate(${
          bezierCurvePoints.x + (offsetX ?? 0)
        }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;
        if (!animatedNodes?.node1) {
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
            const onNextOrPromise = singleStep ??
              onNextNode?.(end.id, end, input ?? '') ?? {
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
                    { node1: testCircle, node2: message, node3: messageText },
                    offsetX,
                    offsetY
                  );
                } else {
                  canvasApp?.elements.delete(testCircle.id);
                  testCircle?.domElement?.remove();

                  canvasApp?.elements.delete(message.id);
                  message?.domElement?.remove();
                  if (onStopped) {
                    console.log(
                      'animatePath onStopped1',
                      nodeConnectionPairs,
                      input
                    );
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
              console.log('animatePath onStopped2', nodeConnectionPairs, input);
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
          console.log('animatePath onStopped3', nodeConnectionPairs, input);
          onStopped(input ?? '');
        }
      }
    };

    let cancel = setInterval(onInterval, (maxSpeed * (100 - speedMeter)) / 100);

    const setCanceler = () => {
      timers.set(cancel, () => {
        clearInterval(cancel);
        timers.delete(cancel);
        cancel = setInterval(onInterval, (maxSpeed * (100 - speedMeter)) / 100);
        setCanceler();
      });
    };
    setCanceler();
  });
};

export const animatePath: FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
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
  animatedNodes?: {
    node1?: IElementNode<unknown>;
    node2?: IElementNode<unknown>;
    node3?: IElementNode<unknown>;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => {
  const nodeConnectionPairs = getNodeConnectionPairById<T>(
    canvasApp,
    node,
    followPathByName,
    followPathToEndThumb
  );

  animatePathForNodeConnectionPairs(
    canvasApp,
    nodeConnectionPairs,
    color,
    onNextNode,
    onStopped,
    input,
    followPathByName,
    animatedNodes,
    offsetX,
    offsetY,
    followPathToEndThumb,
    singleStep
  );
};

export const animatePathFromThumb: FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
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
  animatedNodes?: {
    node1?: IElementNode<unknown>;
    node2?: IElementNode<unknown>;
    node3?: IElementNode<unknown>;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean
) => {
  const connectionsPairs = getNodeConnectionPairsFromThumb<T>(canvasApp, node);

  animatePathForNodeConnectionPairs(
    canvasApp,
    connectionsPairs,
    color,
    onNextNode,
    onStopped,
    input,
    followPathByName,
    animatedNodes,
    offsetX,
    offsetY,
    followPathToEndThumb,
    singleStep
  );
};
