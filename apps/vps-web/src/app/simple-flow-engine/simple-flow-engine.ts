import {
  ElementNodeMap,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
  NodeType,
} from '@devhelpr/visual-programming-system';
import { registerCustomFunction } from '@devhelpr/expression-compiler';

registerCustomFunction('random', [], () => {
  return Math.round(Math.random() * 100);
});

export interface RunNodeResult<T> {
  input: string | any[];
  previousOutput: string | any[];
  output: string | any[];
  result: boolean;
  nodeId: string;
  nodeType: string;
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
    followPathByName?: string,
    animatedNodes?: undefined,
    offsetX?: number,
    offsetY?: number
  ) => void,
  onStopped?: (
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
  ) => void,
  input?: string,
  pathExecution?: RunNodeResult<T>[],
  offsetX?: number,
  offsetY?: number
) => {
  const formInfo = node.nodeInfo as unknown as any;
  console.log(
    'run start',
    node.id,
    node,
    formInfo?.formValues?.['expression'] ?? ''
  );
  let result: any = false;
  let followPath: string | undefined = undefined;
  let previousOutput: any = undefined;
  if (formInfo && formInfo?.compute) {
    const computeResult = formInfo.compute(input ?? '', pathExecution);
    result = computeResult.result;
    followPath = computeResult.followPath;
    previousOutput = computeResult.previousOutput;
  } else {
    result = false;
    followPath = undefined;
  }
  if (result !== undefined) {
    if (pathExecution) {
      pathExecution.push({
        input: input ?? '',
        output: result,
        previousOutput: previousOutput,
        result: !!result,
        nodeId: node.id,
        path: followPath ?? '',
        node: node,
        nodeType: (node.nodeInfo as any)?.type ?? '',
      });
    }
    animatePath(
      node,
      'white',
      (nodeId: string, node: IRectNodeComponent<T>, input: string | any[]) => {
        console.log('Next nodeId', nodeId, node, input);
        let result: any = false;
        let previousOutput: any = undefined;
        const formInfo = node.nodeInfo as unknown as any;

        if (formInfo && formInfo.computeAsync) {
          return new Promise((resolve, reject) => {
            formInfo
              .computeAsync(input, pathExecution)
              .then((computeResult: any) => {
                result = computeResult.result;
                followPath = computeResult.followPath;

                if (pathExecution) {
                  pathExecution.push({
                    input: input ?? '',
                    previousOutput: computeResult.previousOutput,
                    output: computeResult.output ?? input,
                    result: result,
                    nodeId: node.id,
                    path: followPath ?? '',
                    node: node,
                    nodeType: (node.nodeInfo as any)?.type ?? '',
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
        } else if (formInfo && formInfo.compute) {
          const computeResult = formInfo.compute(input, pathExecution);
          result = computeResult.result;
          followPath = computeResult.followPath;
          previousOutput = computeResult.previousOutput;
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
            previousOutput: previousOutput,
            result: !!result,
            nodeId: node.id,
            path: followPath ?? '',
            node: node,
            nodeType: (node.nodeInfo as any)?.type ?? '',
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
      followPath,
      undefined,
      offsetX,
      offsetY
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
    followPathByName?: string,
    animatedNodes?: undefined,
    offsetX?: number,
    offsetY?: number
  ) => void,
  onFinishRun?: (
    input: string | any[],
    pathExecution?: RunNodeResult<T>[]
  ) => void,
  input?: string,
  offsetX?: number,
  offsetY?: number
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
      nodeComponent.nodeType !== NodeType.Connection &&
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
        input,
        [],
        offsetX,
        offsetY
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
      let previousOutput: any = undefined;
      const formInfo = node.nodeInfo as unknown as any;

      if (formInfo && formInfo.computeAsync) {
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
                  previousOutput: computeResult.previousOutput,
                  result: result,
                  nodeId: node.id,
                  path: followPath ?? '',
                  node: node as unknown as IRectNodeComponent<T>,
                  nodeType: (node.nodeInfo as any)?.type ?? '',
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
      } else if (formInfo && formInfo.compute) {
        const computeResult = formInfo.compute(input, pathExecution, loopIndex);
        result = computeResult.result;
        followPath = computeResult.followPath;
        previousOutput = computeResult.previousOutput;
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
          previousOutput: previousOutput,
          result: !!result,
          nodeId: node.id,
          scopeNode,
          path: followPath ?? '',
          node: node as unknown as IRectNodeComponent<T>,
          nodeType: (node.nodeInfo as any)?.type ?? '',
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
