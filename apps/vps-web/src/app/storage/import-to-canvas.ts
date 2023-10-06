import {
  ElementNodeMap,
  Flow,
  FlowNode,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  LineType,
  NodeType,
  createCanvasApp,
  getThumbNodeByName,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { getNodeTaskFactory } from '../node-task-registry';

export const importToCanvas = (
  nodesList: FlowNode<NodeInfo>[],
  canvasApp: ReturnType<typeof createCanvasApp<NodeInfo>>,
  canvasUpdated: () => void,
  containerNode?: IRectNodeComponent<NodeInfo>,
  nestedLevel?: number
) => {
  console.log('importToCanvas', nestedLevel);
  //   console.log('flow', flow);
  //   const nodesList = flow.flows.flow.nodes;
  nodesList.forEach((node) => {
    if (node.nodeType === NodeType.Shape) {
      //node.nodeInfo?.type
      const factory = getNodeTaskFactory(node.nodeInfo?.type);
      if (factory) {
        const nodeTask = factory(canvasUpdated);
        if (nodeTask) {
          if (nodeTask.isContainer) {
            const canvasVisualNode = nodeTask.createVisualNode(
              canvasApp,
              node.x,
              node.y,
              node.id,
              node.nodeInfo?.formValues ?? undefined,
              containerNode,
              node.width,
              node.height,
              nestedLevel ?? 0
            );

            if (node.elements && canvasVisualNode.nodeInfo) {
              node.elements.forEach((element) => {
                if (
                  element.nodeType === NodeType.Shape &&
                  element.nodeInfo?.type &&
                  (nodeTask.childNodeTasks ?? []).indexOf(
                    element.nodeInfo?.type
                  ) > -1
                ) {
                  const factory = getNodeTaskFactory(element.nodeInfo?.type);
                  if (factory) {
                    const childNodeTask = factory(canvasUpdated);

                    const child = childNodeTask.createVisualNode(
                      canvasVisualNode.nodeInfo.canvasAppInstance,
                      element.x,
                      element.y,
                      element.id,
                      element.nodeInfo?.formValues ?? undefined,
                      canvasVisualNode,
                      element.width,
                      element.height,
                      nestedLevel ? nestedLevel + 1 : 1
                    );

                    // TODO if childNodeTask.isContainer .. call importToCanvas again...
                    if (
                      childNodeTask.isContainer &&
                      Array.isArray(element.elements)
                    ) {
                      // element.elements
                      importToCanvas(
                        element.elements as unknown as FlowNode<NodeInfo>[],
                        child.nodeInfo.canvasAppInstance,
                        canvasUpdated,
                        child,
                        nestedLevel ? nestedLevel + 2 : 2
                      );
                    }
                  }
                }
              });

              const info = nodeTask.getConnectionInfo?.();

              const elementList = Array.from(
                (canvasVisualNode.nodeInfo.canvasAppInstance
                  .elements as ElementNodeMap<NodeInfo>) ?? []
              );
              node.elements.forEach((node) => {
                if (
                  node.nodeType === NodeType.Connection &&
                  canvasVisualNode.nodeInfo
                ) {
                  let start: IRectNodeComponent<NodeInfo> | undefined =
                    undefined;
                  let end: IRectNodeComponent<NodeInfo> | undefined = undefined;

                  // undefined_input undefined_output
                  if (node.startNodeId === 'undefined_input') {
                    start = info?.inputs[0];
                  } else if (node.startNodeId) {
                    const startElement = elementList.find((e) => {
                      const element = e[1] as IElementNode<NodeInfo>;
                      return element.id === node.startNodeId;
                    });
                    if (startElement) {
                      start =
                        startElement[1] as unknown as IRectNodeComponent<NodeInfo>;
                    }
                  }

                  if (node.endNodeId === 'undefined_output') {
                    end = info?.outputs[0];
                  } else if (node.endNodeId) {
                    const endElement = elementList.find((e) => {
                      const element = e[1] as IElementNode<NodeInfo>;
                      return element.id === node.endNodeId;
                    });
                    if (endElement) {
                      end =
                        endElement[1] as unknown as IRectNodeComponent<NodeInfo>;
                    }
                  }
                  let c1x = 0;
                  let c1y = 0;
                  let c2x = 0;
                  let c2y = 0;

                  if (node.controlPoints && node.controlPoints.length > 0) {
                    c1x = node.controlPoints[0].x ?? 0;
                    c1y = node.controlPoints[0].y ?? 0;
                    c2x = node.controlPoints[1].x ?? 0;
                    c2y = node.controlPoints[1].y ?? 0;
                  }

                  const curve =
                    node.lineType === LineType.BezierCubic
                      ? canvasVisualNode.nodeInfo.canvasAppInstance.createCubicBezier(
                          start?.x ?? node.x ?? 0,
                          start?.y ?? node.y ?? 0,
                          end?.x ?? node.endX ?? 0,
                          end?.y ?? node.endY ?? 0,
                          c1x,
                          c1y,
                          c2x,
                          c2y,
                          false,
                          undefined,
                          node.id,
                          canvasVisualNode
                        )
                      : canvasVisualNode.nodeInfo.canvasAppInstance.createQuadraticBezier(
                          start?.x ?? node.x ?? 0,
                          start?.y ?? node.y ?? 0,
                          end?.x ?? node.endX ?? 0,
                          end?.y ?? node.endY ?? 0,
                          c1x,
                          c1y,
                          false,
                          undefined,
                          node.id,
                          canvasVisualNode
                        );
                  if (!curve.nodeComponent) {
                    return;
                  }
                  curve.nodeComponent.isControlled = true;
                  curve.nodeComponent.nodeInfo = {};
                  curve.nodeComponent.layer = node.layer ?? 1;

                  if (start && curve.nodeComponent) {
                    curve.nodeComponent.startNode = start;
                    curve.nodeComponent.startNodeThumb =
                      getThumbNodeByName<NodeInfo>(
                        node.startThumbName ?? '',
                        start
                      );
                  }

                  if (end && curve.nodeComponent) {
                    curve.nodeComponent.endNode = end;
                    curve.nodeComponent.endNodeThumb =
                      getThumbNodeByName<NodeInfo>(
                        node.endThumbName ?? '',
                        end
                      );
                  }
                  if (start) {
                    start.connections?.push(curve.nodeComponent);
                  }
                  if (end) {
                    end.connections?.push(curve.nodeComponent);
                  }
                  if (curve.nodeComponent.update) {
                    curve.nodeComponent.update();
                  }
                }
              });
            }
          } else {
            nodeTask.createVisualNode(
              canvasApp,
              node.x,
              node.y,
              node.id,
              node.nodeInfo?.formValues ?? undefined,
              containerNode,
              undefined,
              undefined,
              nestedLevel
            );
          }
        }
      }
    }
  });

  const elementList = Array.from(canvasApp?.elements ?? []);

  nodesList.forEach((node, index) => {
    if (node.nodeType === NodeType.Connection) {
      let start: IRectNodeComponent<NodeInfo> | undefined = undefined;
      let end: IRectNodeComponent<NodeInfo> | undefined = undefined;
      if (node.startNodeId) {
        const startElement = elementList.find((e) => {
          const element = e[1] as IElementNode<NodeInfo>;
          return element.id === node.startNodeId;
        });
        if (startElement) {
          start = startElement[1] as unknown as IRectNodeComponent<NodeInfo>;
        } else {
          console.log(
            'import-to-canvas: create connection : no node.startNodeId found',
            node.startNodeId
          );
        }
      }
      if (node.endNodeId) {
        const endElement = elementList.find((e) => {
          const element = e[1] as IElementNode<NodeInfo>;
          return element.id === node.endNodeId;
        });
        if (endElement) {
          end = endElement[1] as unknown as IRectNodeComponent<NodeInfo>;
        } else {
          console.log(
            'import-to-canvas: create connection : no node.endNodeId found',
            node.endNodeId
          );
        }
      }
      let c1x = 0;
      let c1y = 0;
      let c2x = 0;
      let c2y = 0;

      if (node.controlPoints && node.controlPoints.length > 0) {
        c1x = node.controlPoints[0].x ?? 0;
        c1y = node.controlPoints[0].y ?? 0;
        c2x = node.controlPoints[1].x ?? 0;
        c2y = node.controlPoints[1].y ?? 0;
      }

      if (!start) {
        console.log('import-to-canvas: create connection : no start');
      }

      if (!end) {
        console.log('import-to-canvas: create connection : no end');
      }
      const curve =
        node.lineType === 'BezierCubic'
          ? canvasApp.createCubicBezier(
              start?.x ?? node.x ?? 0,
              start?.y ?? node.y ?? 0,
              end?.x ?? node.endX ?? 0,
              end?.y ?? node.endY ?? 0,
              c1x,
              c1y,
              c2x,
              c2y,
              false,
              undefined,
              node.id,
              containerNode
            )
          : canvasApp.createQuadraticBezier(
              start?.x ?? node.x ?? 0,
              start?.y ?? node.y ?? 0,
              end?.x ?? node.endX ?? 0,
              end?.y ?? node.endY ?? 0,
              c1x,
              c1y,
              false,
              undefined,
              node.id,
              containerNode
            );

      if (!curve.nodeComponent) {
        console.log('import-to-canvas: no curve.nodeComponent');
        return;
      }
      curve.nodeComponent.isControlled = true;
      curve.nodeComponent.nodeInfo = {};
      curve.nodeComponent.layer = node.layer ?? 1;

      if (start && curve.nodeComponent) {
        curve.nodeComponent.startNode = start;
        const thumb = getThumbNodeByName<NodeInfo>(
          node.startThumbName ?? '',
          start
        );
        if (thumb) {
          curve.nodeComponent.startNodeThumb = thumb;
          if (curve.nodeComponent.startNodeThumb?.isDataPort) {
            curve.nodeComponent.isData = true;
          }
        }
      }

      if (end && curve.nodeComponent) {
        curve.nodeComponent.endNode = end;
        const thumb = getThumbNodeByName<NodeInfo>(
          node.endThumbName ?? '',
          end
        );
        if (thumb) {
          curve.nodeComponent.endNodeThumb = thumb;
          if (curve.nodeComponent.endNodeThumb?.isDataPort) {
            curve.nodeComponent.isData = true;
          }
        }
      }
      if (start) {
        start.connections?.push(curve.nodeComponent);
      }
      if (end) {
        end.connections?.push(curve.nodeComponent);
      }
      if (curve.nodeComponent.update) {
        curve.nodeComponent.update();
      }
    }
  });
};
