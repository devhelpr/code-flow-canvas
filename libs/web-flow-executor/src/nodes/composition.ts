import {
  CanvasAppInstance,
  Composition,
  IComputeResult,
  IDOMElement,
  IRectNodeComponent,
  IRunCounter,
  IThumb,
  IThumbNodeComponent,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  OnNextNodeFunction,
  createContextInstanceApp,
  importToCanvas,
  visualNodeFactory,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { run } from '../flow-engine/flow-engine';
import {
  runPath,
  runPathForNodeConnectionPairs,
  runPathFromThumb,
} from '../follow-path/run-path';

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    thumbs: IThumb[],
    compositionId: string,
    name: string,
    getNodeFactory: (name: string) => NodeTaskFactory<NodeInfo>
  ): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    const fieldName = 'composition';
    const labelName = `${name ?? 'Composition'}`;
    const nodeName = `composition-${compositionId}`;
    let canvasApp: CanvasAppInstance<NodeInfo> | undefined = undefined;
    // let nodes: FlowNode<NodeInfo>[] = [];
    // let compositionThumbs: IThumb[] = [];
    let composition: Composition<NodeInfo> | undefined = undefined;
    let contextCanvasApp: CanvasAppInstance<NodeInfo> =
      createContextInstanceApp<NodeInfo>();

    const runFlowPath = (
      node: IRectNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
      onStopped?: (input: string | any[]) => void,
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
      scopeId?: string,
      runCounter?: IRunCounter
    ) => {
      return runPath(
        contextCanvasApp,
        node,
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
        followThumb,
        scopeId,
        runCounter
      );
    };
    const runPathFromThumbFlow = (
      node: IThumbNodeComponent<NodeInfo>,
      color: string,
      onNextNode?: OnNextNodeFunction<NodeInfo>,
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
      return runPathFromThumb(
        contextCanvasApp,
        node,
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
        runCounter
      );
    };
    const initializeCompute = () => {
      console.log('initializeCompute composition');
      composition = undefined;

      // TODO : properly destroy current contextCanvasApp before creating a new one
      contextCanvasApp = createContextInstanceApp<NodeInfo>();

      contextCanvasApp.setAnimationFunctions({
        animatePathFunction: runFlowPath,
        animatePathFromThumbFunction: runPathFromThumbFlow,
        animatePathFromConnectionPairFunction: runPathForNodeConnectionPairs,
      });
      return;
    };
    const computeAsync = (
      input: string,
      _loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      _thumbIdentifierWithinNode?: string
    ) => {
      return new Promise<IComputeResult>((resolve) => {
        if (canvasApp) {
          if (!composition) {
            composition = canvasApp.compositons.getComposition(compositionId);

            // TODO FIX THIS!!!!!

            importToCanvas(
              composition?.nodes ?? [],
              contextCanvasApp,
              () => {
                //
              },
              undefined,
              0,
              getNodeFactory
            );
          }
        }
        if (composition) {
          const runCounter = new RunCounter();
          runCounter.setRunCounterResetHandler((input?: string | any[]) => {
            if (runCounter.runCounter <= 0) {
              resolve({
                result: input,
                output: input,
                followPath: undefined,
              });
            }
          });
          run(
            contextCanvasApp.elements,
            contextCanvasApp,
            (_input) => {
              //
            },
            input,
            undefined,
            undefined,
            runCounter
          );
          return;
        }

        resolve({
          result: input,
          output: input,
          followPath: undefined,
        });
      });
    };

    return visualNodeFactory(
      nodeName,
      labelName,
      familyName,
      fieldName,
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      thumbs,
      (_values?: InitialValues) => {
        return [];
      },
      (nodeInstance) => {
        canvasApp = nodeInstance.contextInstance;
        if (nodeInstance.node?.nodeInfo) {
          (nodeInstance.node.nodeInfo as NodeInfo).isComposition = true;
          (nodeInstance.node.nodeInfo as NodeInfo).compositionId =
            compositionId;
        }
      },
      {
        hasTitlebar: false,
        hideTitle: true,
        category: 'Compositions',
        backgroundThemeProperty: 'compositionBackground',
        textColorThenmeProperty: 'compositionText',
      },
      undefined,
      true
    );
  };
