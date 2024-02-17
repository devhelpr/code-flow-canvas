import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  IDOMElement,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import {
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from './get-node-connection-pairs';
import { OnNextNodeFunction } from './OnNextNodeFunction';
import { RunCounter } from './run-counter';

// export let runCounter = 0;
// export const incrementRunCounter = () => {
//   runCounter++;
// };
// export const decrementRunCounter = () => {
//   runCounter--;
// };
// export const resetRunCounter = () => {
//   runCounter = 0;
// };
// export let runCounterResetHandler: undefined | (() => void) = undefined;
// export const setRunCounterResetHandler = (handler: () => void) => {
//   runCounterResetHandler = handler;
// };

export const runPathForNodeConnectionPairs = <T>(
  canvasApp: CanvasAppInstance<T>,
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
  },
  offsetX?: number,
  offsetY?: number,
  _followPathToEndThumb?: boolean,
  singleStep?: boolean,
  scopeId?: string,
  runCounter?: RunCounter
) => {
  if (!nodeConnectionPairs || nodeConnectionPairs.length === 0) {
    if (onStopped) {
      console.log('animatePath onStopped4', input);
      onStopped(input ?? '', scopeId);
    }

    if (
      runCounter &&
      runCounter.runCounter <= 0 &&
      runCounter &&
      runCounter.runCounterResetHandler
    ) {
      runCounter.runCounterResetHandler();
    }
    return;
  }

  nodeConnectionPairs.forEach((nodeConnectionPair, _index) => {
    const start = nodeConnectionPair.start;
    const connection = nodeConnectionPair.connection;
    const end = nodeConnectionPair.end;

    if (animatedNodes) {
      animatedNodes.node1 = undefined;
      animatedNodes.node2 = undefined;
      animatedNodes.node3 = undefined;
    }

    runCounter?.incrementRunCounter();

    if (
      start &&
      end &&
      connection &&
      connection.controlPoints &&
      connection.controlPoints.length >= 1
    ) {
      const onNextOrPromise = singleStep ??
        onNextNode?.(end.id, end, input ?? '', connection, scopeId) ?? {
          result: true,
          output: '',
          followPathByName: undefined,
        };

      const resolver = (result: any) => {
        console.log('animatePath onNextNode result', input, result);
        runCounter?.decrementRunCounter();

        // uncomment the following line during debugging when a breakpoint is above here
        // .. this causes the message-bubble animation to continue after continuing
        //lastTime = undefined;
        if (!result.stop && result.result !== undefined) {
          runPath<T>(
            canvasApp,
            end as unknown as IRectNodeComponent<T>,
            color,
            onNextNode as OnNextNodeFunction<T>,
            onStopped,
            result.output,
            result.followPathByName,
            undefined,
            offsetX,
            offsetY,
            undefined,
            undefined,
            result.followThumb,
            scopeId,
            runCounter
          );
        } else {
          if (onStopped) {
            onStopped(result.output ?? input ?? '');
          }
          if (
            runCounter &&
            runCounter.runCounter <= 0 &&
            runCounter.runCounterResetHandler
          ) {
            runCounter?.runCounterResetHandler();
          }
        }
      };

      Promise.resolve(onNextOrPromise)
        .then(resolver)
        .catch((err) => {
          console.log('animatePath onNextNode error', err);
        });
    } else {
      runCounter?.decrementRunCounter();

      if (start) {
        onNextNode && onNextNode(start.id, start, input ?? '', connection);
      }

      if (onStopped) {
        onStopped(input ?? '');
      }
    }
  });
};

export const runPathFromThumb = <T>(
  canvasApp: CanvasAppInstance<T>,
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
  runCounter?: RunCounter
) => {
  const connectionsPairs = getNodeConnectionPairsFromThumb<T>(canvasApp, node);

  runPathForNodeConnectionPairs(
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
    // node?.thumbLinkedToNode
    runCounter
  );
};

export const runPath = <T>(
  canvasApp: CanvasAppInstance<T>,
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
  runCounter?: RunCounter
) => {
  const nodeConnectionPairs = getNodeConnectionPairById<T>(
    canvasApp,
    node,
    followPathByName,
    followPathToEndThumb,
    undefined,
    followThumb
  );

  runPathForNodeConnectionPairs(
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
    //node
    runCounter
  );
};
