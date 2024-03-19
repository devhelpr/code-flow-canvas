import {
  CanvasAppInstance,
  Composition,
  FlowNode,
  IThumb,
  NodeType,
  ThumbConnectionType,
} from '@devhelpr/visual-programming-system';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { visualNodeFactory } from '../node-task-registry/createRectNode';
import { GLNodeInfo } from '../types/gl-node-info';
import { getSortedNodes } from '../utils/sort-nodes';

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    thumbsOnInitialisation: IThumb[],
    compositionId: string,
    name: string,
    getGLNodeFactory: (name: string) => NodeTaskFactory<GLNodeInfo>
  ): NodeTaskFactory<GLNodeInfo> =>
  (_updated: () => void): NodeTask<GLNodeInfo> => {
    const fieldName = 'composition';
    const labelName = `${name ?? 'Composition'}`;
    const nodeName = `composition-${compositionId}`;
    let canvasApp: CanvasAppInstance<GLNodeInfo> | undefined = undefined;
    let nodes: FlowNode<GLNodeInfo>[] = [];
    let compositionThumbs: IThumb[] = [];
    let composition: Composition<GLNodeInfo> | undefined = undefined;

    const getNodeOutput = (
      node: FlowNode<GLNodeInfo>,
      thumbName: string,
      thumbIdentifierWithinNode?: string,
      payload?: any
    ) => {
      const inputs: Record<string, string> = {};
      let hasInputBeenSet = false;
      let outputthumbIdentifierWithinNode = thumbIdentifierWithinNode;
      compositionThumbs.forEach((thumb) => {
        if (
          thumb.nodeId === node.id &&
          thumb.connectionType === ThumbConnectionType.end
        ) {
          if (thumb.thumbIdentifierWithinNode) {
            hasInputBeenSet = true;
            inputs[thumb.name ?? ''] =
              payload?.[thumb.thumbIdentifierWithinNode];
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
              if (
                connection.endThumbIdentifierWithinNode &&
                node.nodeInfo?.isComposition
              ) {
                console.log('composition in composition', endNode, connection);
                outputthumbIdentifierWithinNode =
                  connection.endThumbIdentifierWithinNode;
                const output = getNodeOutput(
                  startNode,
                  connection.startThumbName ?? '',
                  undefined,
                  payload
                );
                console.log('composition in composition output', output);
                inputs[connection.endThumbIdentifierWithinNode] = output;
              } else {
                inputs[connection.endThumbName] = getNodeOutput(
                  startNode,
                  connection.startThumbName ?? '',
                  undefined,
                  payload
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

        const helper = instance.getCompute?.();

        const result = (helper as any)?.(
          0,
          0,
          hasInputBeenSet
            ? { ...inputs, nodeInfo: node?.nodeInfo }
            : { ...payload, nodeInfo: node?.nodeInfo },
          thumbName,
          outputthumbIdentifierWithinNode,
          true,
          canvasApp
        ) as unknown as typeof helper;

        return (result as any)?.result ?? '';
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
      _thumbName?: string,
      thumbIdentifierWithinNode?: string,
      _unknownVariable?: boolean,
      hackCanvasApp?: CanvasAppInstance<GLNodeInfo>
    ) => {
      let shader = '';
      let result: undefined | string = undefined;
      if (!canvasApp && !hackCanvasApp) {
        return;
      }
      if (thumbIdentifierWithinNode) {
        if (!composition) {
          composition = (
            hackCanvasApp ?? canvasApp
          )?.compositons.getComposition(compositionId);
          if (composition) {
            nodes = composition.nodes;
            compositionThumbs = composition.thumbs;
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
                thumbIdentifierWithinNode,
                payload
              );
            }
          });

          composition.thumbs.forEach((thumb) => {
            if (
              composition &&
              thumb.thumbIdentifierWithinNode === thumbIdentifierWithinNode
            ) {
              const startNode = composition.nodes.find(
                (nodeEval) => nodeEval.id === thumb.nodeId
              );
              if (startNode && !result) {
                result = getNodeOutput(
                  startNode,
                  thumb.name ?? '',
                  thumbIdentifierWithinNode,
                  payload
                );
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
      thumbsOnInitialisation,
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
      }
    );
  };
