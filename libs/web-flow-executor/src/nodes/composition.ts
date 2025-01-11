import {
  IFlowCanvasBase,
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
  createRuntimeFlowContext,
  importToCanvas,
  visualNodeFactory,
  INodeComponent,
  NodeType,
  createCompositionRuntimeFlowContext,
  FlowCanvas,
  ThumbType,
  ThumbConnectionType,
  getThumbNodeByName,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode, runNodeFromThumb } from '../flow-engine/flow-engine';
import {
  runPath,
  runPathForNodeConnectionPairs,
  runPathFromThumb,
} from '../follow-path/run-path';

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    _thumbs: IThumb[],
    compositionId: string,
    name: string,
    getNodeFactory: (name: string) => NodeTaskFactory<NodeInfo>,
    compositionData: Composition<NodeInfo>
  ): NodeTaskFactory<NodeInfo> =>
  (_updated: () => void): NodeTask<NodeInfo> => {
    const fieldName = 'composition';
    const labelName = `${name ?? 'Composition'}`;
    const nodeName = `composition-${compositionId}`;
    let compositionNode: INodeComponent<NodeInfo> | undefined = undefined;
    let canvasApp: IFlowCanvasBase<NodeInfo> | undefined = undefined;
    let rootCanvasApp: IFlowCanvasBase<NodeInfo> | undefined = undefined;
    // let nodes: FlowNode<NodeInfo>[] = [];
    // let compositionThumbs: IThumb[] = [];
    let composition: Composition<NodeInfo> | undefined = undefined;
    let contextCanvasApp: IFlowCanvasBase<NodeInfo> =
      createRuntimeFlowContext<NodeInfo>();

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
      composition = undefined;

      // TODO : properly destroy current contextCanvasApp before creating a new one
      if (canvasApp) {
        contextCanvasApp = createCompositionRuntimeFlowContext<NodeInfo>(
          rootCanvasApp ?? canvasApp
        );

        contextCanvasApp.setAnimationFunctions({
          animatePathFunction: runFlowPath,
          animatePathFromThumbFunction: runPathFromThumbFlow,
          animatePathFromConnectionPairFunction: runPathForNodeConnectionPairs,
        });
      }
      return;
    };
    let thumbOutputNodeComponents: INodeComponent<NodeInfo>[] = [];
    const computeAsync = (
      input: string,
      loopIndex?: number,
      _payload?: any,
      thumbName?: string,
      //      _thumbIdentifierWithinNode?: string,
      scopeId?: string,
      rootRunCounter?: RunCounter
    ) => {
      const helperScopeId = scopeId;
      return new Promise<IComputeResult>((resolve) => {
        if (canvasApp) {
          if (!composition) {
            thumbOutputNodeComponents = [];
            composition = canvasApp.compositons.getComposition(compositionId);

            // TODO FIX THIS!!!!!
            try {
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

              contextCanvasApp.elements.forEach((node) => {
                const nodeComponent =
                  node as unknown as INodeComponent<NodeInfo>;
                if (nodeComponent.nodeType !== NodeType.Connection) {
                  if (nodeComponent?.nodeInfo?.initializeCompute) {
                    nodeComponent.nodeInfo.initializeCompute();
                  }
                }
                if (nodeComponent.nodeInfo?.type === 'thumb-output') {
                  thumbOutputNodeComponents.push(nodeComponent);
                }
              });
            } catch (error) {
              console.error(error);
              resolve({
                stop: true,
                result: undefined,
                output: undefined,
                followPath: undefined,
              });
              return;
            }
          }
        }
        if (composition && thumbOutputNodeComponents) {
          thumbOutputNodeComponents.forEach((thumbOutputNodeComponent) => {
            (thumbOutputNodeComponent.nodeInfo as any).onFinish = (
              input: string | any[],
              _payload: any,
              thumbOutputNode: INodeComponent<NodeInfo>,
              _thumbOutputScopeId: string
            ) => {
              const thumb = getThumbNodeByName(
                thumbOutputNode.id,
                compositionNode!,
                {
                  start: true,
                  end: false,
                }
              );

              if (!thumb || !canvasApp) {
                return;
              }

              //rootRunCounter?.decrementRunCounter();
              runNodeFromThumb(
                thumb,
                canvasApp,
                (_inputFromRun: string | any[]) => {
                  console.log(
                    'composition onFinish runNodeFromThumb',
                    _inputFromRun
                  );
                  resolve({
                    result: _inputFromRun,
                    output: _inputFromRun,
                    followPath: undefined,
                    dummyEndpoint: true,
                    stop: true,
                  });
                },
                input,
                compositionNode as IRectNodeComponent<NodeInfo>,
                loopIndex,
                helperScopeId,
                rootRunCounter
              );
              console.log('composition onFinish', input);
            };
          });
          const runCounter = new RunCounter();
          runCounter.setRunCounterResetHandler(
            (input?: string | any[], _node?: INodeComponent<NodeInfo>) => {
              if (runCounter.runCounter <= 0) {
                console.log('composition runCounter.runCounter <= 0', input);
                // THIS seems to be reliable and NEEDED together with onFinish above !?? tests also run well
                resolve({
                  result: input,
                  output: input,
                  followPath: undefined,
                  dummyEndpoint: true,
                  stop: true,
                });
                return;
              }
            }
          );

          let nodeInComposition: IRectNodeComponent<NodeInfo> | undefined;
          let useThumbName: string | undefined = '';

          contextCanvasApp.elements.forEach((node) => {
            if (
              node.nodeInfo?.type === 'thumb-input' &&
              thumbName === node.id
            ) {
              useThumbName = node.id;
              nodeInComposition =
                node as unknown as IRectNodeComponent<NodeInfo>;
            }
          });
          if (!nodeInComposition || !useThumbName) {
            resolve({
              result: undefined,
              output: undefined,
              followPath: undefined,
              stop: true,
            });
            return;
          }
          console.log('composition runNode', loopIndex);
          //rootRunCounter?.incrementRunCounter();
          runNode(
            nodeInComposition,
            contextCanvasApp,
            (_input) => {
              console.log('runNode done', _input);
            },
            input,
            undefined,
            undefined,
            loopIndex,
            undefined,
            helperScopeId,
            runCounter,
            undefined,
            undefined,
            undefined
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

    const generatedThumbs: IThumb[] = [];
    let inputThumbIndex = 0;
    let outputThumbIndex = 0;
    compositionData.nodes.forEach((node) => {
      if (node.nodeInfo?.type === 'thumb-input') {
        generatedThumbs.push({
          thumbType: ThumbType.EndConnectorLeft,
          thumbIndex: inputThumbIndex,
          connectionType: ThumbConnectionType.end,
          color: 'white',
          label: ' ',
          name: node.id,
          prefixLabel: node.nodeInfo?.formValues?.['thumbName'],
        });
        inputThumbIndex++;
      }
      if (node.nodeInfo?.type === 'thumb-output') {
        generatedThumbs.push({
          thumbType: ThumbType.StartConnectorRight,
          thumbIndex: outputThumbIndex,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
          name: node.id,
          maxConnections: 1,
          prefixLabel: node.nodeInfo?.formValues?.['thumbName'],
        });
        outputThumbIndex++;
      }
    });

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
      generatedThumbs,
      (_values?: InitialValues) => {
        return [];
      },
      (nodeInstance) => {
        canvasApp = nodeInstance.contextInstance;
        compositionNode = nodeInstance.node;
        if (
          (nodeInstance.contextInstance as FlowCanvas<NodeInfo>)
            .getRootFlowCanvas
        ) {
          rootCanvasApp = (
            nodeInstance.contextInstance as FlowCanvas<NodeInfo>
          ).getRootFlowCanvas();
        }
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
        textColorThemeProperty: 'compositionText',
      },
      undefined,
      true
    );
  };
