import {
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';
import { registerCustomFunction } from '@devhelpr/expression-compiler';

registerCustomFunction('random', [], () => {
  return Math.round(Math.random() * 100);
});

export interface RunNodeResult<T> {
  input: string | any[];
  output: string | any[];
  result: boolean;
  nodeId: string;
  path: string;
  scopeNode?: IRectNodeComponent<T>;
  node: IRectNodeComponent<T>;
  endNode?: IRectNodeComponent<T>;
  connection?: IConnectionNodeComponent<T>;
}

export const runNode = <T>(
  node: IRectNodeComponent<T>,
  animatePath: (
    node: IRectNodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: IRectNodeComponent<T>,
      input: string | any[]
    ) =>
      | { result: boolean; output: string | any[]; followPathByName?: string }
      | Promise<{
          result: boolean;
          output: string | any[];
          followPathByName?: string;
        }>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string
  ) => void,
  onStopped?: (
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
  ) => void,
  input?: string,
  pathExecution?: RunNodeResult<T>[]
) => {
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
    const computeResult = formInfo.compute(input ?? '', pathExecution);
    result = computeResult.result;
    followPath = computeResult.followPath;
  } else {
    result = false;
    followPath = undefined;
  }
  if (result !== undefined) {
    if (pathExecution) {
      pathExecution.push({
        input: input ?? '',
        output: result,
        result: !!result,
        nodeId: node.id,
        path: followPath ?? '',
        node: node,
      });
    }
    animatePath(
      node,
      'white',
      (nodeId: string, node: IRectNodeComponent<T>, input: string | any[]) => {
        console.log('Next nodeId', nodeId, node, input);
        let result: any = false;
        const formInfo = node.nodeInfo as unknown as any;

        if (formInfo.computeAsync) {
          return new Promise((resolve, reject) => {
            formInfo
              .computeAsync(input, pathExecution)
              .then((computeResult: any) => {
                result = computeResult.result;
                followPath = computeResult.followPath;

                if (pathExecution) {
                  pathExecution.push({
                    input: input ?? '',
                    output: computeResult.output ?? input,
                    result: result,
                    nodeId: node.id,
                    path: followPath ?? '',
                    node: node,
                  });
                }

                resolve({
                  result: true,
                  output: computeResult.output ?? input,
                  followPathByName: followPath,
                });
              })
              .catch((error: any) => {
                reject(error);
              });
          });
        } else if (formInfo.compute) {
          const computeResult = formInfo.compute(input, pathExecution);
          result = computeResult.result;
          followPath = computeResult.followPath;
        } else {
          result = false;
          followPath = undefined;
        }
        console.log('expression result', result);
        if (result === undefined) {
          return {
            result: false,
            output: result,
          };
        }

        if (pathExecution) {
          pathExecution.push({
            input: input ?? '',
            output: result,
            result: !!result,
            nodeId: node.id,
            path: followPath ?? '',
            node: node,
          });
        }

        return {
          result: true,
          output: result ?? input,
          followPathByName: followPath,
        };
      },
      (input: string | any[]) => {
        if (onStopped) {
          onStopped(input, pathExecution);
        }
      },
      result,
      followPath
    );
  } else {
    console.log('expression result', result);
  }
};
export const run = <T>(
  nodes: ElementNodeMap<T>,
  animatePath: (
    node: IRectNodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: IRectNodeComponent<T>,
      input: string | any[]
    ) =>
      | { result: boolean; output: string | any[]; followPathByName?: string }
      | Promise<{
          result: boolean;
          output: string | any[];
          followPathByName?: string;
        }>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string
  ) => void,
  onFinishRun?: (
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
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
    const nodeComponent = node as unknown as IRectNodeComponent<T>;
    const connectionsFromEndNode = nodeList.filter((e) => {
      const element = e[1] as IConnectionNodeComponent<T>;
      return element.endNode?.id === node.id;
    });
    if (
      nodeComponent.nodeType !== 'connection' &&
      (!connectionsFromEndNode || connectionsFromEndNode.length === 0)
    ) {
      runNode<T>(
        nodeComponent,
        animatePath,
        (input: string | any[], pathExecution?: RunNodeResult<T>[]) => {
          if (onFinishRun) {
            onFinishRun(input, pathExecution);
          }
        },
        undefined,
        []
      );
    }
  });
  return true;
};

export const runNodeFromThumb = <T>(
  nodeThumb: IThumbNodeComponent<T>,
  animatePathFromThumb: (
    node: IThumbNodeComponent<T>,
    color: string,
    onNextNode?: (
      nodeId: string,
      node: INodeComponent<T>,
      input: string | any[]
    ) =>
      | { result: boolean; output: string | any[]; followPathByName?: string }
      | Promise<{
          result: boolean;
          output: string | any[];
          followPathByName?: string;
        }>,
    onStopped?: (input: string | any[]) => void,
    input?: string | any[],
    followPathByName?: string
  ) => void,
  onStopped?: (input: string | any[]) => void,
  input?: string | any[],
  pathExecution?: RunNodeResult<T>[],
  scopeNode?: IRectNodeComponent<T>,
  loopIndex?: number
) => {
  //let result: any = false;
  let followPath: string | undefined = undefined;

  animatePathFromThumb(
    nodeThumb,
    'white',
    (nodeId: string, node: INodeComponent<T>, input: string | any[]) => {
      console.log('Next nodeId', nodeId, node, input);
      let result: any = false;
      const formInfo = node.nodeInfo as unknown as any;

      if (formInfo.computeAsync) {
        return new Promise((resolve, reject) => {
          formInfo
            .computeAsync(input, pathExecution, loopIndex)
            .then((computeResult: any) => {
              result = computeResult.result;
              followPath = computeResult.followPath;

              if (pathExecution) {
                pathExecution.push({
                  input: input ?? '',
                  scopeNode,
                  output: computeResult.output ?? input,
                  result: result,
                  nodeId: node.id,
                  path: followPath ?? '',
                  node: node as unknown as IRectNodeComponent<T>,
                });
              }

              resolve({
                result: true,
                output: result ?? input,
                followPathByName: followPath,
              });
            })
            .catch((e: any) => {
              console.log('runNodeFromThumb error', e);
              reject();
            });
        });
      } else if (formInfo.compute) {
        const computeResult = formInfo.compute(input, pathExecution, loopIndex);
        result = computeResult.result;
        followPath = computeResult.followPath;
      } else {
        result = false;
        followPath = undefined;
      }
      console.log('expression result', result);
      if (result === undefined) {
        return {
          result: false,
          output: result,
        };
      }

      if (pathExecution) {
        pathExecution.push({
          input: input ?? '',
          output: result,
          result: !!result,
          nodeId: node.id,
          scopeNode,
          path: followPath ?? '',
          node: node as unknown as IRectNodeComponent<T>,
        });
      }

      return {
        result: true,
        output: result ?? input,
        followPathByName: followPath,
      };
    },
    (input: string | any[]) => {
      if (onStopped) {
        onStopped(input);
      }
    },
    input,
    followPath
  );
};
