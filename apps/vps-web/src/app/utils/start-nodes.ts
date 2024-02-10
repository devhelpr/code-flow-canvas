import {
  ElementNodeMap,
  IRectNodeComponent,
  INodeComponent,
  NodeType,
  IConnectionNodeComponent,
} from '@devhelpr/visual-programming-system';

export const getStartNodes = <T>(
  nodes: ElementNodeMap<T>,
  includeFunctionNodes = true
) => {
  const startNodes: IRectNodeComponent<T>[] = [];
  const nodeList = Array.from(nodes);
  nodes.forEach((node) => {
    const nodeComponent = node as unknown as IRectNodeComponent<T>;
    const connectionsFromEndNode = nodeList.filter((e) => {
      const eNode = e[1] as INodeComponent<T>;
      if (eNode.nodeType === NodeType.Connection) {
        const element = e[1] as IConnectionNodeComponent<T>;
        return (
          element.endNode?.id === node.id &&
          !element.isData &&
          !element.isAnnotationConnection
        );
      }
      return false;
    });
    const nodeInfo = nodeComponent.nodeInfo as any;
    if (
      nodeComponent.nodeType !== NodeType.Connection &&
      (!connectionsFromEndNode || connectionsFromEndNode.length === 0) &&
      ((!includeFunctionNodes &&
        nodeInfo?.type !== 'node-trigger-target' &&
        nodeInfo?.type !== 'function') ||
        includeFunctionNodes)
    ) {
      startNodes.push(nodeComponent);
    }
  });

  return startNodes;
};
