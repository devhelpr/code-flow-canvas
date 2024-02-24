import {
  CanvasAppInstance,
  Composition,
  IDOMElement,
  IRectNodeComponent,
  IThumb,
  createContextInstanceApp,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { NodeInfo } from '../types/node-info';
import { importToCanvas } from '../storage/import-to-canvas';
import { run } from '../simple-flow-engine/simple-flow-engine';
import { runPath } from '../follow-path/run-path';
import { OnNextNodeFunction } from '../follow-path/OnNextNodeFunction';
import { RunCounter } from '../follow-path/run-counter';

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
      runCounter?: RunCounter
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
    const initializeCompute = () => {
      console.log('initializeCompute composition');
      composition = undefined;

      // TODO : properly destroy current contextCanvasApp before creating a new one
      contextCanvasApp = createContextInstanceApp<NodeInfo>();
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
            importToCanvas(
              composition.nodes,
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
            runFlowPath,
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
          (nodeInstance.node.nodeInfo as GLNodeInfo).isComposition = true;
          (nodeInstance.node.nodeInfo as GLNodeInfo).compositionId =
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
