import {
  IFlowCanvasBase,
  Composition,
  FlowNode,
  IThumb,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  NodeType,
  ThumbConnectionType,
  visualNodeFactory,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { GLNodeInfo } from '../types/gl-node-info';
import { getSortedNodes } from '../utils/sort-nodes';

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    _thumbsOnInitialisation: IThumb[],
    compositionId: string,
    name: string,
    getGLNodeFactory: (name: string) => NodeTaskFactory<GLNodeInfo>,
    compositionData: Composition<GLNodeInfo>
  ): NodeTaskFactory<GLNodeInfo> =>
  (_updated: () => void): NodeTask<GLNodeInfo> => {
    const fieldName = 'composition';
    const labelName = `${name ?? 'Composition'}`;
    const nodeName = `composition-${compositionId}`;
    let canvasApp: IFlowCanvasBase<GLNodeInfo> | undefined = undefined;
    let nodes: FlowNode<GLNodeInfo>[] = [];
    let compositionThumbs: IThumb[] = [];
    let composition: Composition<GLNodeInfo> | undefined = undefined;

    const getNodeOutput = (
      node: FlowNode<GLNodeInfo>,
      thumbName: string,
      _thumbIdentifierWithinNode?: string,
      payload?: any,
      compositionInput?: string
    ) => {
      const inputs: Record<string, string> = {};
      let hasInputBeenSet = false;
      //let outputthumbIdentifierWithinNode = thumbIdentifierWithinNode;
      compositionThumbs.forEach((thumb) => {
        if (
          thumb.name === node.id &&
          thumb.connectionType === ThumbConnectionType.end
        ) {
          if (thumb.name) {
            hasInputBeenSet = true;
            inputs[thumb.name ?? ''] = payload?.[thumb.name];
          }
        }
      });

      (node.connections ?? []).forEach((connection) => {
        if (connection.endNodeId === node.id) {
          if (connection.endThumbName) {
            hasInputBeenSet = true;
            let startNode: FlowNode<GLNodeInfo> | undefined = undefined;
            let endNode: FlowNode<GLNodeInfo> | undefined = undefined;

            // TODO : if node is connected to a composition input... then take input from composition....
            //   - nodes kunnen inputs hebben die van buiten de composition komen maar
            //   tegelijkertijd ook inputs hebben die van binnen de composition komen
            //   Bovenstaand wordt nog niet afgevangen

            // - een composition kan ook meerdere outputs hebben.. dit wordt deels
            //    vanuit buiten al geregeld !? CHECKEN in simpel voorbeeld!

            if (connection.startNodeId) {
              startNode = nodes.find(
                (nodeEval) => nodeEval.id === connection.startNodeId
              );
            }
            if (
              node.nodeInfo?.isComposition &&
              connection.endNodeId &&
              connection.endThumbName
            ) {
              endNode = nodes.find(
                (nodeEval) => nodeEval.id === connection.endNodeId
              );
            }
            if (startNode) {
              if (startNode.nodeInfo?.type === 'thumb-input') {
                const compositionPortInput = payload?.[startNode.id];
                if (compositionPortInput) {
                  inputs[connection.endThumbName] = compositionPortInput;
                }
              } else if (
                //connection.endThumbIdentifierWithinNode &&
                node.nodeInfo?.isComposition
              ) {
                console.log('composition in composition', endNode, connection);
                //outputthumbIdentifierWithinNode = connection.endThumbName;
                const output = getNodeOutput(
                  startNode,
                  connection.startThumbName ?? '',
                  undefined,
                  payload,
                  compositionInput
                );
                console.log('composition in composition output', output);
                inputs[connection.endThumbName] = output;
              } else {
                inputs[connection.endThumbName] = getNodeOutput(
                  startNode,
                  connection.startThumbName ?? '',
                  undefined,
                  payload,
                  compositionInput
                );
              }
            }
          }
        }
      });
      const factory = getGLNodeFactory(node?.nodeInfo?.type ?? '');
      if (factory) {
        const instance = factory(() => {
          return false;
        });
        if (canvasApp && instance.setCanvasApp) {
          instance.setCanvasApp(canvasApp);
        }
        const compute = instance.getCompute?.();
        const result = compute?.(
          0,
          0,
          hasInputBeenSet
            ? { ...inputs, nodeInfo: node?.nodeInfo }
            : { ...payload, nodeInfo: node?.nodeInfo },
          thumbName,
          undefined,
          true
        );

        return result?.result ?? '';
      }

      return '';
    };

    const initializeCompute = () => {
      console.log('initializeCompute composition');
      composition = undefined;
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      thumbName?: string,
      thumbIdentifierWithinNode?: string,
      _unknownVariable?: boolean
    ) => {
      let shader = '';
      let result: undefined | string = undefined;
      if (!canvasApp) {
        return;
      }
      if (thumbName) {
        console.log('composition input', thumbName, input, payload);
        if (!composition) {
          composition = canvasApp?.compositons.getComposition(compositionId);
          if (composition) {
            nodes = composition.nodes;
            compositionThumbs = generatedThumbs;
            composition.nodes.forEach((node) => {
              node.connections = [];
              if (composition && node.nodeType === NodeType.Shape) {
                composition.nodes.forEach((connection) => {
                  if (connection.nodeType === NodeType.Connection) {
                    if (connection.startNodeId === node.id) {
                      if (!node.connections) {
                        node.connections = [];
                      }
                      if (
                        !node.connections.find((c) => c.id === connection.id)
                      ) {
                        node.connections.push(connection);
                      }
                    } else if (connection.endNodeId === node.id) {
                      if (!node.connections) {
                        node.connections = [];
                      }
                      if (
                        !node.connections.find((c) => c.id === connection.id)
                      ) {
                        node.connections.push(connection);
                      }
                    }
                  }
                });
              }
            });
          }
        }

        if (composition) {
          // const thumb = compositionThumbs.find(
          //   (thumbEval) =>
          //     thumbEval.thumbIdentifierWithinNode === thumbIdentifierWithinNode
          // );
          let compositionInput = '';
          generatedThumbs.forEach((thumb) => {
            if (
              !compositionInput &&
              thumb.name &&
              thumb.connectionType === ThumbConnectionType.end
            ) {
              if (payload?.[thumb.name]) {
                compositionInput = payload?.[thumb.name];
              }
            }
          });
          (
            getSortedNodes(
              composition.nodes
            ) as unknown as FlowNode<GLNodeInfo>[]
          ).forEach((node) => {
            if (
              node.nodeInfo?.type === 'set-vec2-variable-node' ||
              node.nodeInfo?.type === 'set-color-variable-node' ||
              node.nodeInfo?.type === 'set-and-add-color-variable-node'
            ) {
              shader += getNodeOutput(
                node,
                '',
                thumbName,
                payload,
                compositionInput
              );
            }
          });

          generatedThumbs.forEach((thumb) => {
            if (composition && thumb.name === thumbName) {
              const thumbOutputNode = composition.nodes.find(
                (nodeEval) => nodeEval.id === thumb.name
              );
              if (thumbOutputNode && !result) {
                // TODO here: get all the input from the input ports of this composition
                // and pass it to the composition node .. OR : payload that is passed
                // to getNodeOutput should be used there
                const connection = composition.nodes.find(
                  (nodeEval) => nodeEval.endNodeId === thumbOutputNode.id
                );
                if (connection) {
                  const startNode = composition.nodes.find(
                    (nodeEval) => nodeEval.id === connection.startNodeId
                  );
                  if (startNode) {
                    result = getNodeOutput(
                      startNode,
                      connection.startThumbName ?? '',
                      undefined,
                      payload,
                      compositionInput
                    );
                  }
                }
              }
            }
          });
        }
      }
      return {
        result: thumbIdentifierWithinNode === 'test' ? shader : result ?? '',
        output: input,
        preoutput: shader,
        followPath: undefined,
      };
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
          maxConnections: -1,
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
      compute as any,
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
        textColorThemeProperty: 'compositionText',
      },
      undefined,
      undefined,
      undefined,
      undefined,
      (canvasAppInstance: IFlowCanvasBase<GLNodeInfo>) => {
        canvasApp = canvasAppInstance;
      }
    );
  };
