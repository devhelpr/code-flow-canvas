import {
  CanvasAppInstance,
  createElement,
  IConnectionNodeComponent,
  IDOMElement,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import {
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from './get-node-connection-pairs';
import { getPointOnConnection } from './point-on-connection';
import { followNodeExecution } from './followNodeExecution';
import { NodeInfo } from '../types/node-info';
import { OnNextNodeFunction } from './OnNextNodeFunction';

// function getSpeed(maxSpeed: number, speedMeter: number) {
//   //return 1;
//   return (maxSpeed * (1000 - speedMeter)) / 1000;
// }
function getLoopIncrement() {
  return 0.25;
  //return 0.1;
}
function getMaxLoop() {
  //return 0;
  return 1.015;
}

export type AnimatePathFunction = (
  node: IRectNodeComponent<NodeInfo>,
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  followThumb?: string,
  scopeId?: string
) => void;

export type AnimatePathFromThumbFunction = (
  node: IThumbNodeComponent<NodeInfo>,
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string
) => void;

export type FollowPathFunction = (
  canvasApp: CanvasAppInstance<NodeInfo>,
  node: IRectNodeComponent<NodeInfo>,
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string, // normal, success, failure, "subflow",
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  followThumb?: string,
  scopeId?: string
) => void;

export const timers: Map<NodeJS.Timer, () => void> = new Map();

type NodeAnimationNextNode = (
  nodeId: string,
  node: IRectNodeComponent<NodeInfo>,
  input: string | any[],
  connection: IConnectionNodeComponent<NodeInfo>,
  scopeId?: string
) =>
  | {
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
    }
  | Promise<{
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
    }>;

interface NodeAnimatonInfo {
  start: IRectNodeComponent<NodeInfo>;
  connection: IConnectionNodeComponent<NodeInfo>;
  end: IRectNodeComponent<NodeInfo>;
  animationLoop: number;
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  };
  onNextNode?: NodeAnimationNextNode;
  onStopped?: (input: string | any[], scopeId?: string) => void;
  scopeId?: string;
  input?: string | any[];
  singleStep?: boolean;

  domCircle: HTMLElement;
  domMessage: HTMLElement;
  offsetX?: number;
  offsetY?: number;

  testCircle: IDOMElement;
  message: IDOMElement;
  messageText: IDOMElement;

  color: string;
}

const nodeAnimationMap: Map<number, NodeAnimatonInfo> = new Map();
let nodeAnimationId = 1;

let speedMeter = 500;
export const setSpeedMeter = (speed: number) => {
  speedMeter = speed;
};

let targetX: number | undefined = undefined;
let targetY: number | undefined = undefined;
let nodeId = '';
let targetScale = 1.0;
let isTargetinCameraSpace = false;
let useFastTransition = false;
export function setTargetCameraAnimation(
  x: number,
  y: number,
  id: string,
  scale: number,
  fastTransition = false
) {
  console.log('setTargetCameraAnimation', x, y, id, scale);
  targetX = x;
  targetY = y;
  nodeId = id;
  targetScale = scale;
  isTargetinCameraSpace = false;
  useFastTransition = fastTransition;
}

export function setPositionTargetCameraAnimation(
  x: number,
  y: number,
  scale?: number
) {
  isTargetinCameraSpace = true;
  targetX = x;
  targetY = y;
  if (scale !== undefined) {
    targetScale = scale;
  }
}

let onFrame: undefined | ((elapsed: number) => void) = undefined;
export function setOnFrame(handler: (elapsed: number) => void) {
  onFrame = handler;
}
let lastTime: number | undefined = undefined;
export function setCameraAnimation(canvasApp: CanvasAppInstance<NodeInfo>) {
  const animateCamera = (time: number) => {
    if (lastTime === undefined) {
      lastTime = time;
    }
    const elapsed = time - lastTime;
    lastTime = time;
    if (onFrame) {
      onFrame(elapsed);
    }
    //updateElapsedCounterElement(elapsed, lastTime, time);
    if (targetX !== undefined && targetY !== undefined) {
      const canvasCamera = canvasApp.getCamera();
      let x = 600 - targetX * targetScale;
      let y = 340 - targetY * targetScale;
      let factor = 0.005;
      if (isTargetinCameraSpace) {
        x = targetX;
        y = targetY;
        factor = 0.3;
      } else {
        factor = useFastTransition ? 0.1 : 0.005;
      }
      const distance = Math.sqrt(
        Math.pow(canvasCamera.x - x, 2) + Math.pow(canvasCamera.y - y, 2)
      );

      const scaleDiff = targetScale - canvasCamera.scale;
      if (distance < 0.001) {
        canvasApp.setCamera(
          canvasCamera.x,
          canvasCamera.y,
          canvasCamera.scale + scaleDiff * factor
        );
        useFastTransition = false;
      } else {
        const normalizedX = (x - canvasCamera.x) / distance;
        const normalizedY = (y - canvasCamera.y) / distance;

        canvasApp.setCamera(
          canvasCamera.x + distance * factor * normalizedX,
          canvasCamera.y + distance * factor * normalizedY,
          canvasCamera.scale + scaleDiff * factor
        );
      }
    }

    nodeAnimationMap.forEach((nodeAnimation, key) => {
      if (nodeAnimation.start && nodeAnimation.end) {
        const start = nodeAnimation.start;
        const connection = nodeAnimation.connection;
        const end = nodeAnimation.end;
        const animatedNodes = nodeAnimation.animatedNodes;

        const testCircle = nodeAnimation.testCircle;
        const message = nodeAnimation.message;
        const messageText = nodeAnimation.messageText;

        let loop = nodeAnimation.animationLoop;

        if (
          start &&
          end &&
          connection &&
          connection.controlPoints &&
          connection.controlPoints.length >= 1
        ) {
          const domCircle = nodeAnimation.domCircle;
          const domMessage = nodeAnimation.domMessage;
          const offsetX = nodeAnimation.offsetX;
          const offsetY = nodeAnimation.offsetY;
          const singleStep = nodeAnimation.singleStep;
          const input = nodeAnimation.input;

          const color = nodeAnimation.color;

          const bezierCurvePoints = getPointOnConnection<NodeInfo>(
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

          loop += getLoopIncrement() * elapsed * (0.0001 * speedMeter); //1001 - speedMeter
          nodeAnimation.animationLoop = loop;
          if (loop > getMaxLoop()) {
            loop = 0;

            nodeAnimationMap.delete(key);

            const onNextOrPromise = singleStep ??
              nodeAnimation.onNextNode?.(
                end.id,
                end,
                input ?? '',
                connection,
                nodeAnimation.scopeId
              ) ?? {
                result: true,
                output: '',
                followPathByName: undefined,
              };

            if (
              Array.isArray(onNextOrPromise) ||
              (onNextOrPromise as unknown as Promise<unknown>).then
            ) {
              testCircle && canvasApp?.elements.delete(testCircle.id);
              testCircle?.domElement?.remove();

              message && canvasApp?.elements.delete(message.id);
              message?.domElement?.remove();
              // (testCircle as unknown as undefined) = undefined;
              // (message as unknown as undefined) = undefined;
              // (messageText as unknown as undefined) = undefined;
            }

            const resolver = (result: any) => {
              console.log('animatePath onNextNode result', input, result);
              runCounter--;
              updateRunCounterElement();

              // uncomment the following line during debugging when a breakpoint is above here
              // .. this causes the message-bubble animation to continue after continuing
              //lastTime = undefined;

              if (!result.stop && result.result !== undefined) {
                animatePath(
                  canvasApp,
                  end as unknown as IRectNodeComponent<NodeInfo>,
                  color,
                  nodeAnimation.onNextNode as OnNextNodeFunction,
                  nodeAnimation.onStopped,
                  result.output,
                  result.followPathByName,
                  { node1: testCircle, node2: message, node3: messageText },
                  offsetX,
                  offsetY,
                  undefined,
                  undefined,
                  result.followThumb,
                  nodeAnimation.scopeId
                );
              } else {
                testCircle && canvasApp?.elements.delete(testCircle.id);
                testCircle?.domElement?.remove();

                message && canvasApp?.elements.delete(message.id);
                message?.domElement?.remove();
                if (nodeAnimation.onStopped) {
                  nodeAnimation.onStopped(result.output ?? input ?? '');
                }
                if (
                  runCounter <= 0 &&
                  runCounterResetHandler &&
                  nodeAnimationMap.size === 0
                ) {
                  runCounterResetHandler();
                }
              }
            };

            Promise.resolve(onNextOrPromise)
              .then(resolver)
              .catch((err) => {
                console.log('animatePath onNextNode error', err);
              });
          }
        } else {
          runCounter--;
          updateRunCounterElement();

          if (start) {
            nodeAnimation.onNextNode &&
              nodeAnimation.onNextNode(
                start.id,
                start,
                nodeAnimation.input ?? '',
                connection
              );
          }
          testCircle && canvasApp?.elements.delete(testCircle.id);
          testCircle?.domElement?.remove();

          canvasApp?.elements.delete(message.id);
          message?.domElement?.remove();

          nodeAnimationMap.delete(key);

          if (nodeAnimation.onStopped) {
            nodeAnimation.onStopped(nodeAnimation.input ?? '');
          }
        }
      }
    });
    requestAnimationFrame(animateCamera);
  };
  requestAnimationFrame(animateCamera);
}

export let runCounter = 0;
export const resetRunCounter = () => {
  runCounter = 0;
};
let runCounterResetHandler: undefined | (() => void) = undefined;
export const setRunCounterResetHandler = (handler: () => void) => {
  runCounterResetHandler = handler;
};

let runCounterUpdateElement: undefined | HTMLElement = undefined;
export const setRunCounterUpdateElement = (domElement: HTMLElement) => {
  runCounterUpdateElement = domElement;
};
const updateRunCounterElement = () => {
  if (runCounterUpdateElement) {
    runCounterUpdateElement.textContent = `${runCounter.toString()} / ${nodeAnimationMap.size.toString()}`;
  }
};

// const updateElapsedCounterElement = (
//   elapsed: number,
//   lastTime: number,
//   time: number
// ) => {
//   // if (runCounterUpdateElement) {
//   //   runCounterUpdateElement.textContent = `${Math.floor(
//   //     elapsed
//   //   ).toString()} - ${Math.floor(lastTime).toString()} - ${Math.floor(
//   //     time
//   //   ).toString()}`;
//   // }
// };

export const animatePathForNodeConnectionPairs = (
  canvasApp: CanvasAppInstance<NodeInfo>,
  nodeConnectionPairs:
    | false
    | {
        start: IRectNodeComponent<NodeInfo>;
        end: IRectNodeComponent<NodeInfo>;
        connection: IConnectionNodeComponent<NodeInfo>;
      }[],
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  _followPathByName?: string,
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  _followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string,
  fromNode?: IRectNodeComponent<NodeInfo>
) => {
  if (animatedNodes?.node1 && animatedNodes?.node2 && animatedNodes?.node3) {
    canvasApp?.elements.delete(animatedNodes?.node1.id);
    animatedNodes.node1.domElement?.remove();
    animatedNodes.node1 = undefined;
    canvasApp?.elements.delete(animatedNodes?.node2.id);
    animatedNodes.node2.domElement?.remove();
    animatedNodes.node2 = undefined;
    animatedNodes.node3.domElement?.remove();
    animatedNodes.node3 = undefined;
  }
  if (!nodeConnectionPairs || nodeConnectionPairs.length === 0) {
    // if (animatedNodes?.node1 && animatedNodes?.node2 && animatedNodes?.node3) {
    //   canvasApp?.elements.delete(animatedNodes?.node1.id);
    //   animatedNodes.node1.domElement?.remove();
    //   animatedNodes.node1 = undefined;
    //   canvasApp?.elements.delete(animatedNodes?.node2.id);
    //   animatedNodes.node2.domElement?.remove();
    //   animatedNodes.node2 = undefined;
    // }
    if (onStopped) {
      console.log('animatePath onStopped4', input);
      onStopped(input ?? '', scopeId);
    }

    console.log(
      'animatePathForNodeConnectionPairs runCounter',
      runCounter,
      scopeId,
      input,
      fromNode?.nodeInfo?.type
    );
    //}

    if (
      runCounter <= 0 &&
      runCounterResetHandler &&
      nodeAnimationMap.size === 0
    ) {
      runCounterResetHandler();
    }
    return;
  }
  // const maxSpeed = 500;
  // const currentSpeed = speedMeter;
  nodeConnectionPairs.forEach((nodeConnectionPair, index) => {
    const start = nodeConnectionPair.start;
    const connection = nodeConnectionPair.connection;
    const end = nodeConnectionPair.end;
    if (
      followNodeExecution &&
      index === 0 &&
      end &&
      end.id !== nodeId &&
      start.id !== nodeId
    ) {
      nodeId = end.id;

      if (isTargetinCameraSpace) {
        targetX = end.x;
        targetY = end.y;
      } else {
        targetX = end.x;
        targetY = end.y;
      }
      targetScale = 0.5;
      isTargetinCameraSpace = false;
    }
    // eslint-disable-next-line prefer-const
    let testCircle =
      animatedNodes?.node1 ??
      createElement(
        'div',
        {
          class: `connection-cursor__circle absolute top-0 left-0 z-[1000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded`,
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
          class: `connection-cursor__message flex text-center truncate min-w-0 overflow-hidden z-[1010] pointer-events-none origin-center px-2 bg-white text-black absolute top-[-100px] z-[1000] left-[-50px] items-center justify-center w-[80px] h-[100px] overflow-hidden`,
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
          class: `connection-cursor__text truncate min-w-0 overflow-hidden w-[80px] mt-[-30px]`,
        },
        message.domElement,
        input?.toString() ??
          (start.nodeInfo as unknown as any)?.formValues?.Expression ??
          ''
      );
    console.log('animatePathForNodeConnectionPairs', input);
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

    if (connection.layer === 2) {
      domCircle.classList.add('layer-2');
      domMessage.classList.add('layer-2');
      domCircle.classList.remove('layer-1');
      domMessage.classList.remove('layer-1');
    } else {
      domCircle.classList.add('layer-1');
      domMessage.classList.add('layer-1');
      domCircle.classList.remove('layer-2');
      domMessage.classList.remove('layer-2');
    }

    runCounter++;
    updateRunCounterElement();

    nodeAnimationMap.set(nodeAnimationId, {
      start: start as unknown as IRectNodeComponent<NodeInfo>,
      connection: connection as unknown as IConnectionNodeComponent<NodeInfo>,
      end: end as unknown as IRectNodeComponent<NodeInfo>,
      animationLoop: 0,
      animatedNodes,
      onNextNode: onNextNode as unknown as NodeAnimationNextNode,
      onStopped,
      scopeId,
      input,
      domCircle,
      domMessage,
      color,
      testCircle,
      message,
      messageText,
      singleStep,
      offsetX,
      offsetY,
    });
    nodeAnimationId++;

    //   let loop = 0;
    //   const onInterval = () => {
    //     if (
    //       start &&
    //       end &&
    //       connection &&
    //       connection.controlPoints &&
    //       connection.controlPoints.length >= 1
    //     ) {
    //       const bezierCurvePoints = getPointOnConnection<NodeInfo>(
    //         loop,
    //         connection,
    //         start,
    //         end
    //       );

    //       if (!animatedNodes?.node1) {
    //         domCircle.style.display = 'flex';
    //       }
    //       domCircle.style.transform = `translate(${
    //         bezierCurvePoints.x + (offsetX ?? 0)
    //       }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;
    //       if (!animatedNodes?.node1) {
    //         domMessage.style.display = 'flex';
    //       }
    //       domMessage.style.transform = `translate(${
    //         bezierCurvePoints.x + (offsetX ?? 0)
    //       }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;

    //       // loop += 0.015;
    //       loop += getLoopIncrement(); //0.1;
    //       if (loop > getMaxLoop()) {
    //         //  1.015
    //         loop = 0;

    //         clearInterval(cancel);
    //         timers.delete(cancel);

    //         const onNextOrPromise = singleStep ??
    //           onNextNode?.(end.id, end, input ?? '', connection, scopeId) ?? {
    //             result: true,
    //             output: '',
    //             followPathByName: undefined,
    //           };

    //         if (
    //           Array.isArray(onNextOrPromise) ||
    //           (onNextOrPromise as unknown as Promise<unknown>).then
    //         ) {
    //           testCircle && canvasApp?.elements.delete(testCircle.id);
    //           testCircle?.domElement?.remove();

    //           message && canvasApp?.elements.delete(message.id);
    //           message?.domElement?.remove();
    //           (testCircle as unknown as undefined) = undefined;
    //           (message as unknown as undefined) = undefined;
    //           (messageText as unknown as undefined) = undefined;
    //         }
    //         //
    //         const resolver = (result: any) => {
    //           console.log('animatePath onNextNode result', input, result);
    //           if (!result.stop && result.result !== undefined) {
    //             animatePath(
    //               canvasApp,
    //               end,
    //               color,
    //               onNextNode,
    //               onStopped,
    //               result.output,
    //               result.followPathByName,
    //               { node1: testCircle, node2: message, node3: messageText },
    //               offsetX,
    //               offsetY,
    //               undefined,
    //               undefined,
    //               result.followThumb,
    //               scopeId
    //             );
    //           } else {
    //             testCircle && canvasApp?.elements.delete(testCircle.id);
    //             testCircle?.domElement?.remove();

    //             message && canvasApp?.elements.delete(message.id);
    //             message?.domElement?.remove();
    //             if (onStopped) {
    //               console.log(
    //                 'animatePath onStopped1',
    //                 nodeConnectionPairs,
    //                 input,
    //                 result.output
    //               );
    //               onStopped(result.output ?? input ?? '');
    //             }
    //           }
    //         };

    //         Promise.resolve(onNextOrPromise)
    //           .then(resolver)
    //           .catch((err) => {
    //             console.log('animatePath onNextNode error', err);
    //           });
    //       } else {
    //         if (speedMeter !== currentSpeed) {
    //           clearInterval(cancel);
    //           timers.delete(cancel);
    //           cancel = setInterval(onInterval, getSpeed(maxSpeed, speedMeter));
    //           //setCanceler();
    //         }
    //       }
    //     } else {
    //       if (start) {
    //         onNextNode && onNextNode(start.id, start, input ?? '', connection);
    //       }
    //       testCircle && canvasApp?.elements.delete(testCircle.id);
    //       testCircle?.domElement?.remove();

    //       canvasApp?.elements.delete(message.id);
    //       message?.domElement?.remove();

    //       // clearInterval(cancel);
    //       // timers.delete(cancel);

    //       if (onStopped) {
    //         console.log('animatePath onStopped3', nodeConnectionPairs, input);
    //         onStopped(input ?? '');
    //       }
    //     }
    //   };
    //   let cancel: NodeJS.Timer = 0 as unknown as NodeJS.Timer;
    //   // console.log('animate speed', (maxSpeed * (1000 - speedMeter)) / 1000);
    //   // let cancel = setInterval(onInterval, getSpeed(maxSpeed, speedMeter));

    //   // const setCanceler = () => {
    //   //   timers.set(cancel, () => {
    //   //     clearInterval(cancel);
    //   //     timers.delete(cancel);
    //   //     //console.log('animate speed', (maxSpeed * (1000 - speedMeter)) / 1000);
    //   //     cancel = setInterval(onInterval, getSpeed(maxSpeed, speedMeter));
    //   //     setCanceler();
    //   //   });
    //   // };
    //   // setCanceler();
  });
};

export const animatePath: FollowPathFunction = (
  canvasApp: CanvasAppInstance<NodeInfo>,
  node: IRectNodeComponent<NodeInfo>,
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string,
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,
  followThumb?: string,
  scopeId?: string
) => {
  const nodeConnectionPairs = getNodeConnectionPairById<NodeInfo>(
    canvasApp,
    node,
    followPathByName,
    followPathToEndThumb,
    undefined,
    followThumb
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
    singleStep,
    scopeId,
    node
  );
};

export const animatePathFromThumb = (
  canvasApp: CanvasAppInstance<NodeInfo>,
  node: IThumbNodeComponent<NodeInfo>,
  color: string,
  onNextNode?: OnNextNodeFunction,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  followPathByName?: string,
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,

  scopeId?: string
) => {
  const connectionsPairs = getNodeConnectionPairsFromThumb<NodeInfo>(
    canvasApp,
    node
  );

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
    singleStep,
    scopeId,
    node?.thumbLinkedToNode
  );
};
