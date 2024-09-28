import {
  IFlowCanvasBase,
  IConnectionNodeComponent,
  IDOMElement,
  IRectNodeComponent,
  IRunCounter,
  IThumbNodeComponent,
  getNodeConnectionPairById,
  getNodeConnectionPairsFromThumb,
} from '@devhelpr/visual-programming-system';
import { OnNextNodeFunction } from './OnNextNodeFunction';
import { updateRunCounterElement } from './updateRunCounterElement';

export const runPathForNodeConnectionPairs = <T>(
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
  runCounter?: IRunCounter
) => {
  if (!nodeConnectionPairs || nodeConnectionPairs.length === 0) {
    if (onStopped) {
      console.log(
        'animatePath onStopped4',
        runCounter?.runCounter,
        runCounter?.runId,
        input
      );
      onStopped(input ?? '', scopeId);
    }

    if (
      runCounter &&
      runCounter.runCounter <= 0 &&
      runCounter &&
      runCounter.runCounterResetHandler
    ) {
      runCounter.runCounterResetHandler(input ?? '');
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
      connection
      // connection.controlPoints &&
      // connection.controlPoints.length >= 1
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
        if (runCounter) {
          updateRunCounterElement(runCounter);
        }

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
          if (!result.isDummyEndpoint) {
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
        }
      };

      Promise.resolve(onNextOrPromise)
        .then(resolver)
        .catch((err) => {
          console.log('animatePath onNextNode error', err);
        });
    } else {
      runCounter?.decrementRunCounter();
      if (runCounter) {
        updateRunCounterElement(runCounter);
      }

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
    cursorOnly?: boolean;
  },
  offsetX?: number,
  offsetY?: number,
  followPathToEndThumb?: boolean,
  singleStep?: boolean,

  scopeId?: string,
  runCounter?: IRunCounter
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
    cursorOnly?: boolean;
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
