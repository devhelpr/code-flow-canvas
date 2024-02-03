import {
  CanvasAppInstance,
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

const familyName = 'flow-canvas';

export const getCreateCompositionNode =
  (
    thumbs: IThumb[],
    compositionId: string,
    name: string,
    getGLNodeFactory: (name: string) => NodeTaskFactory<GLNodeInfo>
  ): NodeTaskFactory<GLNodeInfo> =>
  (_updated: () => void): NodeTask<GLNodeInfo> => {
    const fieldName = 'composition';
    const labelName = `Composition ${name}`;
    const nodeName = `composition-${compositionId}`;
    let canvasApp: CanvasAppInstance<GLNodeInfo> | undefined = undefined;
    let nodes: FlowNode<GLNodeInfo>[] = [];
    let compositionThumbs: IThumb[] = [];
    const getNodeOutput = (
      node: FlowNode<GLNodeInfo>,
      thumbName: string,
      thumbIdentifierWithinNode?: string,
      payload?: any
    ) => {
      const inputs: Record<string, string> = {};
      let hasInputBeenSet = false;

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

            // TODO : if node is connected to a composition input... then take input from composition....
            //   - nodes kunnen inputs hebben die van buiten de composition komen maar
            //   tegelijkertijd ook inputs hebben die van binnen de composition komen
            //   Bovenstaand wordt nog niet afgevangen

            // - een composition kan ook meerdere outputs hebben.. dit wordt deels
            //    vanuit buiten al geregeld !? CHECKEN in simpel voorbeeld!

            if (connection.startNodeId) {
              startNode = nodes.find(
                (node) => node.id === connection.startNodeId
              );
            }
            if (startNode) {
              inputs[connection.endThumbName] = getNodeOutput(
                startNode,
                connection.startThumbName ?? '',
                undefined,
                payload
              );
            }
          }
        }
      });
      const factory = getGLNodeFactory(node?.nodeInfo?.type ?? '');
      if (factory) {
        const instance = factory(() => {
          // do nothing
        });

        const helper = instance.getCompute?.();

        const result = helper?.(
          0,
          0,
          hasInputBeenSet ? inputs : payload,
          thumbName,
          thumbIdentifierWithinNode
        );
        return result?.result ?? '';
      }
      return '';
    };

    const initializeCompute = () => {
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      _thumbName?: string,
      thumbIdentifierWithinNode?: string
    ) => {
      console.log('compute', input, thumbIdentifierWithinNode, payload);
      let result: undefined | string = undefined;
      if (thumbIdentifierWithinNode && canvasApp) {
        const composition = canvasApp.compositons.getComposition(compositionId);
        if (composition) {
          nodes = composition.nodes;
          compositionThumbs = composition.thumbs;
          composition.nodes.forEach((node) => {
            if (node.nodeType === NodeType.Shape) {
              composition.nodes.forEach((connection) => {
                if (connection.nodeType === NodeType.Connection) {
                  if (connection.startNodeId === node.id) {
                    if (!node.connections) {
                      node.connections = [];
                    }
                    node.connections.push(connection);
                  } else if (connection.endNodeId === node.id) {
                    if (!node.connections) {
                      node.connections = [];
                    }
                    node.connections.push(connection);
                  }
                }
              });
            }
          });
          thumbs.forEach((thumb) => {
            if (thumb.thumbIdentifierWithinNode === thumbIdentifierWithinNode) {
              const startNode = composition.nodes.find(
                (node) => node.id === thumb.nodeId
              );
              if (startNode && !result) {
                result = getNodeOutput(
                  startNode,
                  thumb.name ?? '',
                  thumbIdentifierWithinNode,
                  payload
                );
                // return {
                //   result: result,
                //   output: input,
                //   followPath: undefined,
                // };
              }
              // return {
              //   result: ``,
              //   output: input,
              //   followPath: undefined,
              // };
            }
          });
        }
      }
      // const x = payload?.['x'];
      // const y = payload?.['y'];
      return {
        result: result ?? '',
        output: input,
        followPath: undefined,
      };
    };

    return visualNodeFactory(
      nodeName,
      labelName,
      familyName,
      fieldName,
      compute,
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
          (nodeInstance.node.nodeInfo as GLNodeInfo).isComposite = true;
        }
      },
      {
        hasTitlebar: false,
        hideTitle: true,
      }
    );
  };
