import {
  ElementNodeMap,
  INodeComponent,
} from '@devhelpr/visual-programming-system';

export const run = <T>(
  nodes: ElementNodeMap<T>,
  animatePath: (
    nodeId: string,
    color: string,
    onNextNode?: (nodeId: string) => boolean
  ) => void
) => {
  /*
	TODO : simple flow engine to run the nodes

    .. get all nodes that have no input
    .. run these nodes using animatePath

    .. animatePath needs an event function which is called when a node is reached
    .. in that event run the expression for that node:
      .. it errors .. stop the flow

  */
  const nodeList = Array.from(nodes);
  nodes.forEach((node) => {
    const connectionsFromEndNode = nodeList.filter((e) => {
      const element = e[1] as INodeComponent<T>;
      return element.endNode?.id === node.id;
    });
    if (!connectionsFromEndNode || connectionsFromEndNode.length === 0) {
      animatePath(node.id, 'red', (nodeId: string) => {
        return true;
      });
    }
  });
  return true;
};
