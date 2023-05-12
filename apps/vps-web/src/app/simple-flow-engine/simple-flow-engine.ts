import { ElementNodeMap, NodeInfo } from '@devhelpr/visual-programming-system';

export const run = <T>(nodes: ElementNodeMap<T>) => {
  /*
	TODO : simple flow engine to run the nodes
		.. each node can have an expression to evaluate
		.. each nodes can have one output payload
		.. the payload is passthrough and modified by each node
		.. when running the flow, a new payload is created
  */
  nodes.forEach((node) => {
    console.log(node.id, node, node.nodeInfo);
  });
  return true;
};
