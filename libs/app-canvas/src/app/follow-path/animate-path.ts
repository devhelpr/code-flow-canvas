import {
  IFlowCanvasBase,
  createElement,
  IConnectionNodeComponent,
  IDOMElement,
  IRectNodeComponent,
  IRunCounter,
  IThumbNodeComponent,
  NodeAnimationNextNode,
  NodeAnimatonInfo,
  BaseNodeInfo,
  OnNextNodeFunction,
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from '@devhelpr/visual-programming-system';
import { getPointOnConnection } from './point-on-connection';
import { followNodeExecution } from './followNodeExecution';
import { updateRunCounterElement } from '@devhelpr/web-flow-executor';

function getLoopIncrement() {
  return 0.25;
}
// function getMaxLoop() {
//   return 1.015;
// }

export const nodeAnimationMap: Map<
  number,
  NodeAnimatonInfo<BaseNodeInfo>
> = new Map();
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
  //console.log('setTargetCameraAnimation', x, y, id, scale);
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
  //console.log('setPositionTargetCameraAnimation', x, y, scale);
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
let isStopAnimation = false;
export const getIsStopAnimations = () => {
  return isStopAnimation;
};
export const setStopAnimations = () => {
  isStopAnimation = true;
};

let lastTime: number | undefined = undefined;
export function setCameraAnimation<T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>
) {
  let quit = false;
  const animateCamera = (time: number) => {
    if (quit) {
      return;
    }
    if (lastTime === undefined) {
      lastTime = time;
    }
    const elapsed = time - lastTime;
    lastTime = time;
    if (onFrame) {
      onFrame(elapsed);
    }
    //updateElapsedCounterElement(elapsed, lastTime, time);
    if (
      !canvasApp.getIsCameraFollowingPaused() &&
      targetX !== undefined &&
      targetY !== undefined
    ) {
      const rootRect = canvasApp.rootElement.getBoundingClientRect();
      const canvasCamera = canvasApp.getCamera();
      let x = rootRect.width / 2 - 80 - targetX * targetScale; // 600
      let y = rootRect.height / 2 - 40 - targetY * targetScale; // 340
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

        if (isStopAnimation) {
          testCircle && canvasApp?.elements.delete(testCircle.id);
          testCircle?.domElement?.remove();

          message && canvasApp?.elements.delete(message.id);
          message?.domElement?.remove();

          nodeAnimationMap.delete(key);
        } else if (
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
          const isReverse = nodeAnimation.isReverse ?? false;

          // For reverse animation, we need to:
          // 1. Start at pathLength and decrease to 0
          // 2. Swap start and end nodes when calling getPointOnConnection
          // 3. Calculate reverse position
          let bezierCurvePoints;
          if (isReverse) {
            // First get the path length by calling with start/end normally
            const tempPoints = getPointOnConnection<T>(
              0,
              connection as unknown as IConnectionNodeComponent<T>,
              start as unknown as IRectNodeComponent<T>,
              end as unknown as IRectNodeComponent<T>,
              false
            );
            const pathLength = tempPoints.pathLength;
            // For reverse: start at pathLength, decrease to 0
            // If loop starts at 0, we need to initialize it to pathLength
            // if (loop === 0 && pathLength > 0) {
            //   loop = pathLength;
            // }
            // Calculate reverse position - we want to traverse from end to start
            // So we calculate position from the end (pathLength) backwards
            const reversePosition = Math.max(0, pathLength - loop);
            // For reverse: keep start/end as-is but pass isReverse flag
            // The isReverse flag will handle swapping thumb types internally
            bezierCurvePoints = getPointOnConnection<T>(
              reversePosition,
              connection as unknown as IConnectionNodeComponent<T>,
              start as unknown as IRectNodeComponent<T>,
              end as unknown as IRectNodeComponent<T>,
              false
            );
          } else {
            bezierCurvePoints = getPointOnConnection<T>(
              loop,
              connection as unknown as IConnectionNodeComponent<T>,
              start as unknown as IRectNodeComponent<T>,
              end as unknown as IRectNodeComponent<T>,
              false
            );
          }

          if (!animatedNodes?.node1) {
            domCircle.style.display = 'flex';
          }
          domCircle.style.transform = `translate(${
            bezierCurvePoints.x + (offsetX ?? 0)
          }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;
          if (!animatedNodes?.node1 && domMessage) {
            domMessage.style.display = 'flex';
          }
          if (domMessage) {
            domMessage.style.transform = `translate(${
              bezierCurvePoints.x + (offsetX ?? 0)
            }px, ${bezierCurvePoints.y + (offsetY ?? 0)}px)`;
          }
          loop += getLoopIncrement() * elapsed * (0.01 * speedMeter);
          nodeAnimation.animationLoop = loop;

          if (loop >= bezierCurvePoints.pathLength) {
            loop = 0;

            nodeAnimationMap.delete(key);

            // For reverse animation (backpropagation), just clean up and call onStopped
            if (isReverse) {
              testCircle && canvasApp?.elements.delete(testCircle.id);
              testCircle?.domElement?.remove();

              message && canvasApp?.elements.delete(message.id);
              message?.domElement?.remove();

              nodeAnimation.runCounter?.decrementRunCounter();
              if (nodeAnimation.runCounter) {
                updateRunCounterElement(nodeAnimation.runCounter);
              }

              if (nodeAnimation.onStopped) {
                nodeAnimation.onStopped(input ?? '', nodeAnimation.scopeId);
              }
              if (
                nodeAnimation.runCounter &&
                nodeAnimation.runCounter.runCounter <= 0 &&
                nodeAnimation.runCounter.runCounterResetHandler &&
                nodeAnimationMap.size === 0
              ) {
                nodeAnimation.runCounter.runCounterResetHandler();
              }
            } else {
              // Forward animation - continue to next node
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
              }

              const resolver = (result: any) => {
                //console.log('animatePath onNextNode result', input, result);
                nodeAnimation.runCounter?.decrementRunCounter();
                if (nodeAnimation.runCounter) {
                  updateRunCounterElement(nodeAnimation.runCounter);
                }

                // uncomment the following line during debugging when a breakpoint is above here
                // .. this causes the message-bubble animation to continue after continuing
                //lastTime = undefined;

                if (!result.stop && result.result !== undefined) {
                  animatePath<T>(
                    canvasApp,
                    end as unknown as IRectNodeComponent<T>,
                    color,
                    nodeAnimation.onNextNode as OnNextNodeFunction<T>,
                    nodeAnimation.onStopped,
                    result.output,
                    result.followPathByName,
                    { node1: testCircle, node2: message, node3: messageText },
                    offsetX,
                    offsetY,
                    undefined,
                    undefined,
                    result.followThumb,
                    nodeAnimation.scopeId,
                    nodeAnimation.runCounter
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
                    nodeAnimation.runCounter &&
                    nodeAnimation.runCounter.runCounter <= 0 &&
                    nodeAnimation.runCounter.runCounterResetHandler &&
                    nodeAnimationMap.size === 0
                  ) {
                    nodeAnimation.runCounter.runCounterResetHandler();
                  }
                }
              };

              Promise.resolve(onNextOrPromise)
                .then(resolver)
                .catch((err) => {
                  console.log('animatePath onNextNode error', err);
                });
            }
          }
        } else {
          nodeAnimation.runCounter?.decrementRunCounter();
          if (nodeAnimation.runCounter) {
            updateRunCounterElement(nodeAnimation.runCounter);
          }

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
          if (message) {
            canvasApp?.elements.delete(message.id);
            message?.domElement?.remove();
          }
          nodeAnimationMap.delete(key);

          if (nodeAnimation.onStopped) {
            nodeAnimation.onStopped(nodeAnimation.input ?? '');
          }
        }
      }
    });
    if (isStopAnimation) {
      isStopAnimation = false;
    }
    requestAnimationFrame(animateCamera);
  };
  requestAnimationFrame(animateCamera);
  return () => {
    quit = true;
  };
}

export const animatePathForNodeConnectionPairs = <T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>,
  nodeConnectionPairs:
    | false
    | {
        start: IRectNodeComponent<T>;
        end: IRectNodeComponent<T>;
        connection: IConnectionNodeComponent<T>;
      }[],
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
  onStopped?: (input: string | any[], scopeId?: string) => void,
  input?: string | any[],
  _followPathByName?: string,
  animatedNodes?: {
    node1?: IDOMElement;
    node2?: IDOMElement;
    node3?: IDOMElement;
    cursorOnly?: boolean;
  },
  offsetX?: number,
  offsetY?: number,
  _followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string,
  runCounter?: IRunCounter,
  isReverse?: boolean
) => {
  if (animatedNodes?.node1) {
    canvasApp?.elements.delete(animatedNodes?.node1.id);
    animatedNodes.node1.domElement?.remove();
    animatedNodes.node1 = undefined;
  }
  if (animatedNodes?.node3) {
    animatedNodes.node3.domElement?.remove();
    animatedNodes.node3 = undefined;
  }
  if (animatedNodes?.node2) {
    canvasApp?.elements.delete(animatedNodes?.node2.id);
    animatedNodes.node2.domElement?.remove();
    animatedNodes.node2 = undefined;
  }

  if (!nodeConnectionPairs || nodeConnectionPairs.length === 0) {
    if (onStopped) {
      //console.log('animatePath onStopped4', input);
      onStopped(input ?? '', scopeId);
    }

    // console.log(
    //   'animatePathForNodeConnectionPairs runCounter',
    //   runCounter,
    //   scopeId,
    //   input
    // );

    if (
      runCounter &&
      runCounter.runCounter <= 0 &&
      runCounter.runCounterResetHandler &&
      nodeAnimationMap.size === 0
    ) {
      runCounter.runCounterResetHandler(input ?? '');
    }
    return;
  }

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
          class: `connection-cursor__circle absolute top-0 left-0 z-[2000] pointer-events-none origin-center flex text-center items-center justify-center w-[20px] h-[20px] overflow-hidden rounded`,
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
      animatedNodes?.cursorOnly === true || !input
        ? undefined
        : animatedNodes?.node2 ??
          createElement(
            'div',
            {
              class: `connection-cursor__message flex text-center truncate-message min-w-0 overflow-hidden z-[2000] pointer-events-none origin-center px-1 bg-white text-black absolute top-[-100px] z-[2000] left-[-50px] items-center justify-center w-[80px] h-[100px] overflow-hidden`,
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
      animatedNodes?.cursorOnly === true || !input
        ? undefined
        : animatedNodes?.node3 ??
          createElement(
            'div',
            {
              class: `connection-cursor__text truncate-message min-w-0 overflow-hidden w-[80px] mt-[-30px]`,
            },
            message?.domElement,
            input?.toString() ??
              (start.nodeInfo as unknown as any)?.formValues?.Expression ??
              ''
          );
    //console.log('animatePathForNodeConnectionPairs', input);
    if (messageText) {
      if (input && typeof input === 'object') {
        messageText.domElement.textContent = JSON.stringify(input, null, 1)
          .replaceAll('{\n', '')
          .replaceAll(',\n', '\n')
          .replaceAll('}', '')
          .replaceAll('"', '')
          .replace(/^ +/gm, '');
      } else {
        messageText.domElement.textContent =
          input?.toString() ??
          (start.nodeInfo as unknown as any)?.formValues?.Expression ??
          '';
      }
    }
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

    const domCircle = testCircle!.domElement as HTMLElement;

    const domMessage = message?.domElement as HTMLElement;
    if (!animatedNodes?.node1) {
      domCircle.style.display = 'none';
      if (domMessage) {
        domMessage.style.display = 'none';
        domMessage.style.pointerEvents = 'none';
      }
    }

    if (connection.layer === 2) {
      domCircle.classList.add('layer-2');
      domCircle.classList.remove('layer-1');
      if (domMessage) {
        domMessage.classList.add('layer-2');
        domMessage.classList.remove('layer-1');
      }
    } else {
      domCircle.classList.add('layer-1');
      domCircle.classList.remove('layer-2');
      if (domMessage) {
        domMessage.classList.add('layer-1');
        domMessage.classList.remove('layer-2');
      }
    }

    runCounter?.incrementRunCounter();
    if (runCounter) {
      updateRunCounterElement(runCounter);
    }

    nodeAnimationMap.set(nodeAnimationId, {
      start: start as unknown as IRectNodeComponent<BaseNodeInfo>,
      connection:
        connection as unknown as IConnectionNodeComponent<BaseNodeInfo>,
      end: end as unknown as IRectNodeComponent<BaseNodeInfo>,
      animationLoop: 0,
      animatedNodes,
      onNextNode: onNextNode as unknown as NodeAnimationNextNode,
      onStopped,
      scopeId,
      input,
      domCircle,
      domMessage,
      color,
      testCircle: testCircle!,
      message: message,
      messageText: messageText,
      singleStep,
      offsetX,
      offsetY,
      runCounter,
      isReverse: isReverse ?? false,
    });
    nodeAnimationId++;
  });
};

export const animatePath = <T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>,
  node: IRectNodeComponent<T>,
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
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
  scopeId?: string,
  runCounter?: IRunCounter
) => {
  const nodeConnectionPairs = getNodeConnectionPairById<T>(
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
    //node,
    runCounter
  );
};

export const animatePathFromThumb = <T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>,
  node: IThumbNodeComponent<T>,
  color: string,
  onNextNode?: OnNextNodeFunction<T>,
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

  scopeId?: string,
  runCounter?: IRunCounter
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
    singleStep,
    scopeId,
    //    node?.thumbLinkedToNode,
    runCounter
  );
};

/**
 * Animates backpropagation from an end node back to its start node.
 * This shows a visual "program counter" moving backwards along the connection
 * with a different color (orange) to distinguish it from forward execution.
 */
export const animateBackpropagationPath = <T extends BaseNodeInfo>(
  canvasApp: IFlowCanvasBase<T>,
  endNode: IRectNodeComponent<T>,
  connection: IConnectionNodeComponent<T>,
  backpropagationData?: any,
  scopeId?: string,
  runCounter?: IRunCounter
) => {
  const startNode = connection?.startNode;
  if (!startNode || !connection) {
    return;
  }

  // Use orange color for backpropagation to distinguish from forward execution (white)
  const backpropagationColor = '#ff8800'; // Orange

  // Create connection pair for reverse animation
  const nodeConnectionPairs: {
    start: IRectNodeComponent<T>;
    end: IRectNodeComponent<T>;
    connection: IConnectionNodeComponent<T>;
  }[] = [
    {
      start: startNode as unknown as IRectNodeComponent<T>,
      connection: connection as unknown as IConnectionNodeComponent<T>,
      end: endNode as unknown as IRectNodeComponent<T>,
    },
  ];

  // Animate backwards with isReverse flag
  animatePathForNodeConnectionPairs(
    canvasApp,
    nodeConnectionPairs,
    backpropagationColor,
    undefined, // No onNextNode for backpropagation
    undefined, // No onStopped callback needed
    backpropagationData ? JSON.stringify(backpropagationData) : undefined,
    undefined,
    undefined, // No animated nodes to reuse
    undefined,
    undefined,
    false,
    false, // singleStep
    scopeId,
    runCounter,
    true // isReverse flag
  );
};
