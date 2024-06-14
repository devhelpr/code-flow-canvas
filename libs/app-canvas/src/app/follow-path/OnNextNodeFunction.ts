import {
  IConnectionNodeComponent,
  IRectNodeComponent,
} from '@devhelpr/visual-programming-system';

// TODO : alt : animatePathFromThumb
// TODO : rename node1,node2,node3 and put in object
// TODO : what parameters put together in "options" parameter?
// TODO : build different variations of this function for the different use-cases

export type OnNextNodeFunction<T> = (
  nodeId: string,
  node: IRectNodeComponent<T>,
  input: string | any[],
  connection: IConnectionNodeComponent<T>,
  scopeId?: string
) =>
  | {
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
      stop?: boolean;
    }
  | Promise<{
      result: boolean;
      output: string | any[];
      followPathByName?: string;
      followPath?: string;
      followThumb?: string;
      stop?: boolean;
    }>;
