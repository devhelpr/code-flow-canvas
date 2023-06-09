import {
  ElementNodeMap,
  INodeComponent,
} from '@devhelpr/visual-programming-system';
import { registerCustomFunction } from '@devhelpr/expression-compiler';

export const run = <T>(
  nodes: ElementNodeMap<T>,
  animatePath: (
    node: INodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: INodeComponent<T>,
      input: string
    ) =>
      | { result: boolean; output: string; followPathByName?: string }
      | Promise<{ result: boolean; output: string; followPathByName?: string }>,
    onStopped?: () => void,
    input?: string,
    followPathByName?: string
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
        formInfo?.formValues?.['Expression'] ?? ''
      );
      let result: any = false;
      let followPath: string | undefined = undefined;
      if (formInfo?.compute) {
        const computeResult = formInfo.compute('');
        result = computeResult.result;
        followPath = computeResult.followPath;
      } else {
        result = false;
        followPath = undefined;
      }
      if (result !== false) {
        animatePath(
          node as unknown as INodeComponent<T>,
          'white',
          (nodeId: string, node: INodeComponent<T>, input: string) => {
            console.log('Next nodeId', nodeId, node, input);
            let result: any = false;
            const formInfo = node.nodeInfo as unknown as any;

            if (formInfo.computeAsync) {
              return new Promise((resolve, reject) => {
                formInfo.computeAsync(input).then((computeResult: any) => {
                  result = computeResult.result;
                  followPath = computeResult.followPath;

                  resolve({
                    result: true,
                    output: result ?? input,
                    followPathByName: followPath,
                  });
                });
              });
            } else if (formInfo.compute) {
              const computeResult = formInfo.compute(input);
              result = computeResult.result;
              followPath = computeResult.followPath;
            } else {
              result = false;
              followPath = undefined;
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
              output: result ?? input,
              followPathByName: followPath,
            };
          },
          () => {
            // stopped
          },
          result,
          followPath
        );
      } else {
        console.log('expression result', result);
      }
    }
  });
  return true;
};
