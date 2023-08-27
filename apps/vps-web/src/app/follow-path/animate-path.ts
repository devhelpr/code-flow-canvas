import {
  CanvasAppInstance,
  createElement,
  IConnectionNodeComponent,
  IElementNode,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import {
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from './get-node-connection-pairs';
import { getPointOnConnection } from './point-on-connection';

export type AnimatePathFunction<T> = (
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

export type AnimatePathFromThumbFunction<T> = (
  node: IThumbNodeComponent<T>,
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

export type FollowPathFunction = <T>(
  canvasApp: CanvasAppInstance,
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
let speedMeter = 100;
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
        start: IRectNodeComponent<T>;
        end: IRectNodeComponent<T>;
        connection: IConnectionNodeComponent<T>;
      }[],
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
          class: `absolute top-0 left-0 z-[1000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded`,
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
          class: `flex text-center truncate min-w-0 overflow-hidden z-[1010] pointer-events-none origin-center px-2 bg-white text-black absolute top-[-100px] z-[1000] left-[-60px] items-center justify-center w-[80px] h-[100px] overflow-hidden`,
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

    // dirty hack to prevent reusing cached node on next iteration if nodeConnectionPairs.length > 1
    if (animatedNodes?.node1) {
      animatedNodes.node1 = undefined;
    }
    if (animatedNodes?.node2) {
      animatedNodes.node2 = undefined;
    }
    if (animatedNodes?.node3) {
      animatedNodes.node3 = undefined;
    }
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
        //connection.onCalculateControlPoints &&
        connection &&
        connection.controlPoints &&
        connection.controlPoints.length >= 1
      ) {
        const bezierCurvePoints = getPointOnConnection<T>(
          loop,
          connection,
          start,
          end
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
                if (!result.stop && result.result !== undefined) {
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

export const animatePathFromThumb = <T>(
  canvasApp: CanvasAppInstance,
  node: IThumbNodeComponent<T>,
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
