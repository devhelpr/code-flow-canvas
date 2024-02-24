import {
  CanvasAppInstance,
  Composition,
  ElementNodeMap,
  FlowNode,
  IElementNode,
  IRectNodeComponent,
  LineType,
  NodeType,
  getThumbNodeByIdentifierWithinNode,
  getThumbNodeByName,
} from '@devhelpr/visual-programming-system';
import { BaseNodeInfo } from '../types/base-node-info';

export const importToCanvas = <T extends BaseNodeInfo>(
  nodesList: FlowNode<T>[],
  canvasApp: CanvasAppInstance<T>,
  canvasUpdated: () => void,
  containerNode?: IRectNodeComponent<T>,
  nestedLevel?: number,
  getNodeTaskFactory?: (name: string) => any
) => {
  console.log('importToCanvas', nestedLevel);
  nodesList.forEach((node) => {
    if (getNodeTaskFactory && node.nodeType === NodeType.Shape) {
      const factory = getNodeTaskFactory(node?.nodeInfo?.type ?? '');
      if (factory) {
        const nodeTask = factory(canvasUpdated, canvasApp.theme);
        if (nodeTask) {
          if (nodeTask.isContainer) {
            const canvasVisualNode = nodeTask.createVisualNode(
              canvasApp,
              node.x,
              node.y,
              node.id,
              (node.nodeInfo as BaseNodeInfo)?.formValues ?? undefined,
              containerNode,
              node.width,
              node.height,
              nestedLevel ?? 0,
              node.nodeInfo,
              getNodeTaskFactory
            );

            if (node.elements && canvasVisualNode.nodeInfo) {
              node.elements.forEach((element) => {
                if (
                  element.nodeType === NodeType.Shape &&
                  element.nodeInfo?.type &&
                  ((nodeTask.childNodeTasks ?? []).length === 0 ||
                    (nodeTask.childNodeTasks ?? []).indexOf(
                      element.nodeInfo?.type
                    ) > -1)
                ) {
                  const factory = getNodeTaskFactory(element.nodeInfo?.type);
                  if (
                    factory &&
                    canvasVisualNode?.nodeInfo?.canvasAppInstance
                  ) {
                    const childNodeTask = factory(
                      canvasUpdated,
                      canvasApp.theme
                    );

                    const child = childNodeTask.createVisualNode(
                      canvasVisualNode.nodeInfo.canvasAppInstance,
                      element.x,
                      element.y,
                      element.id,
                      element.nodeInfo?.formValues ?? undefined,
                      canvasVisualNode,
                      element.width,
                      element.height,
                      nestedLevel ? nestedLevel + 1 : 1,
                      element.nodeInfo,
                      getNodeTaskFactory
                    );

                    // TODO if childNodeTask.isContainer .. call importToCanvas again...
                    if (
                      childNodeTask.isContainer &&
                      Array.isArray(element.elements) &&
                      child.nodeInfo?.canvasAppInstance
                    ) {
                      importToCanvas(
                        element.elements as unknown as FlowNode<T>[],
                        child.nodeInfo.canvasAppInstance,
                        canvasUpdated,
                        child,
                        nestedLevel ? nestedLevel + 2 : 2,
                        getNodeTaskFactory
                      );
                    }
                  }
                }
              });

              const info = nodeTask.getConnectionInfo?.();

              const elementList = Array.from(
                (canvasVisualNode?.nodeInfo?.canvasAppInstance
                  ?.elements as ElementNodeMap<T>) ?? []
              );
              node.elements.forEach((node) => {
                if (
                  node.nodeType === NodeType.Connection &&
                  canvasVisualNode.nodeInfo
                ) {
                  let start: IRectNodeComponent<T> | undefined = undefined;
                  let end: IRectNodeComponent<T> | undefined = undefined;

                  // undefined_input undefined_output
                  if (node.startNodeId === 'undefined_input') {
                    start = info?.inputs[0];
                  } else if (node.startNodeId) {
                    const startElement = elementList.find((e) => {
                      const element = e[1] as IElementNode<T>;
                      return element.id === node.startNodeId;
                    });
                    if (startElement) {
                      start =
                        startElement[1] as unknown as IRectNodeComponent<T>;
                    }
                  }

                  if (node.endNodeId === 'undefined_output') {
                    end = info?.outputs[0];
                  } else if (node.endNodeId) {
                    const endElement = elementList.find((e) => {
                      const element = e[1] as IElementNode<T>;
                      return element.id === node.endNodeId;
                    });
                    if (endElement) {
                      end = endElement[1] as unknown as IRectNodeComponent<T>;
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
                      ? canvasVisualNode?.nodeInfo?.canvasAppInstance?.createCubicBezier(
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
                      : canvasVisualNode?.nodeInfo?.canvasAppInstance?.createQuadraticBezier(
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
                  if (!curve || !curve.nodeComponent) {
                    return;
                  }
                  curve.nodeComponent.isControlled = true;
                  curve.nodeComponent.nodeInfo = {};
                  curve.nodeComponent.layer = node.layer ?? 1;

                  if (start && curve.nodeComponent) {
                    curve.nodeComponent.startNode = start;
                    curve.nodeComponent.startNodeThumb =
                      node.startThumbIdentifierWithinNode
                        ? getThumbNodeByIdentifierWithinNode<T>(
                            node.startThumbIdentifierWithinNode,
                            start,
                            {
                              start: true,
                              end: false,
                            }
                          )
                        : getThumbNodeByName<T>(
                            node.startThumbName ?? '',
                            start,
                            {
                              start: true,
                              end: false,
                            }
                          ) || undefined;
                  }

                  if (end && curve.nodeComponent) {
                    curve.nodeComponent.endNode = end;
                    curve.nodeComponent.endNodeThumb =
                      node.endThumbIdentifierWithinNode
                        ? getThumbNodeByIdentifierWithinNode<T>(
                            node.endThumbIdentifierWithinNode,
                            end,
                            {
                              start: false,
                              end: true,
                            }
                          )
                        : getThumbNodeByName<T>(node.endThumbName ?? '', end, {
                            start: false,
                            end: true,
                          }) || undefined;
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
              node.width,
              node.height,
              nestedLevel,
              node.nodeInfo,
              getNodeTaskFactory
            );
          }
        }
      }
    }
  });

  const elementList = Array.from(canvasApp?.elements ?? []);

  nodesList.forEach((node, _index) => {
    if (node.nodeType === NodeType.Connection) {
      let start: IRectNodeComponent<T> | undefined = undefined;
      let end: IRectNodeComponent<T> | undefined = undefined;
      if (node.startNodeId) {
        const startElement = elementList.find((e) => {
          const element = e[1] as IElementNode<T>;
          return element.id === node.startNodeId;
        });
        if (startElement) {
          start = startElement[1] as unknown as IRectNodeComponent<T>;
        } else {
          console.log(
            'import-to-canvas: create connection : no node.startNodeId found',
            node.startNodeId
          );
        }
      }
      if (node.endNodeId) {
        const endElement = elementList.find((e) => {
          const element = e[1] as IElementNode<T>;
          return element.id === node.endNodeId;
        });
        if (endElement) {
          end = endElement[1] as unknown as IRectNodeComponent<T>;
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
        node.lineType === 'Straight'
          ? canvasApp.createLine(
              start?.x ?? node.x ?? 0,
              start?.y ?? node.y ?? 0,
              end?.x ?? node.endX ?? 0,
              end?.y ?? node.endY ?? 0,
              false,
              undefined,
              node.id,
              containerNode
            )
          : node.lineType === 'BezierCubic'
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
      curve.nodeComponent.nodeInfo = {} as T;
      curve.nodeComponent.layer = node.layer ?? 1;

      if (start && curve.nodeComponent) {
        curve.nodeComponent.startNode = start;
        const thumb = node.startThumbIdentifierWithinNode
          ? getThumbNodeByIdentifierWithinNode<T>(
              node.startThumbIdentifierWithinNode ?? '',
              start,
              {
                start: true,
                end: false,
              }
            )
          : getThumbNodeByName<T>(node.startThumbName ?? '', start, {
              start: true,
              end: false,
            });
        if (thumb) {
          curve.nodeComponent.startNodeThumb = thumb;
          if (curve.nodeComponent.startNodeThumb?.isDataPort) {
            curve.nodeComponent.isData = true;
          }
        }
      }

      if (end && curve.nodeComponent) {
        curve.nodeComponent.endNode = end;
        const thumb = node.endThumbIdentifierWithinNode
          ? getThumbNodeByIdentifierWithinNode<T>(
              node.endThumbIdentifierWithinNode ?? '',
              end,
              {
                start: false,
                end: true,
              }
            )
          : getThumbNodeByName<T>(node.endThumbName ?? '', end, {
              start: false,
              end: true,
            });
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

export const importCompositions = <T>(
  compositions: Record<string, Composition<T>>,
  canvasApp: CanvasAppInstance<T>
) => {
  canvasApp.compositons.clearCompositions();
  Object.entries(compositions).forEach(([_id, composition]) => {
    canvasApp.compositons.addComposition(composition);
  });
};
