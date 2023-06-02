import {
  ElementNodeMap,
  INodeComponent,
} from '@devhelpr/visual-programming-system';
import {
  compileExpression,
  registerCustomFunction,
} from '@devhelpr/expression-compiler';

export const run = <T>(
  nodes: ElementNodeMap<T>,
  animatePath: (
    nodeId: string,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: INodeComponent<T>,
      input: string
    ) => { result: boolean; output: string },
    input?: string
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

  registerCustomFunction('random', [], () => {
    return Math.round(Math.random() * 100);
  });

  const nodeList = Array.from(nodes);
  nodes.forEach((node) => {
    const connectionsFromEndNode = nodeList.filter((e) => {
      const element = e[1] as INodeComponent<T>;
      return element.endNode?.id === node.id;
    });
    const nodeComponent = node as unknown as INodeComponent<T>;
    if (
      nodeComponent.nodeType !== 'connection' &&
      (!connectionsFromEndNode || connectionsFromEndNode.length === 0)
    ) {
      const formInfo = node.nodeInfo as unknown as any;
      console.log(
        'run start',
        node.id,
        node,
        formInfo?.formValues?.['Expression'] ?? ""
      );
      const runExpression = compileExpression(
        formInfo?.formValues?.['Expression'] ?? ''
      );
      let result: any = false;
      try {
        result = runExpression({ input: '' });
      } catch(error) {
        result = false;
        console.log('expression error', error);
      }
      if (result !== false) {
        animatePath(
          node.id,
          'red',
          (nodeId: string, node: INodeComponent<T>, input: string) => {
            console.log('Next nodeId', nodeId, node, input);
            let result: any = false;
            const formInfo = node.nodeInfo as unknown as any;
            const runExpression = compileExpression(
              formInfo?.formValues?.['Expression'] ?? ''
            );
            try {
              result = runExpression({ input: input });
            } catch {
              result = false;
            }
            console.log('expression result', result);
            if (result === false) {
              return {
                result: false,
                output: result,
              };
            }

            return {
              result: true,
              output: result,
            };
          },
          result
        );
      } else {
        console.log('expression result', result);
      }
    }
  });
  return true;
};
