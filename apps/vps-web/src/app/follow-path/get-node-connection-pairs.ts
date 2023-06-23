import {
  CanvasAppInstance,
  IConnectionNodeComponent,
  INodeComponent,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '@devhelpr/visual-programming-system';

export const getNodeConnectionPairById = <T>(
  canvasApp: CanvasAppInstance,
  node: IRectNodeComponent<T>,
  followPathByName?: string,
  followPathToEndThumb?: boolean
) => {
  const connectionPairs: {
    start: IRectNodeComponent<T>;
    end: IRectNodeComponent<T>;
    connection: IConnectionNodeComponent<T>;
  }[] = [];

  if (node) {
    const start = node as unknown as IRectNodeComponent<T>;
    if (start) {
      const connectionsFromStartNode = start.connections;
      let connection: IConnectionNodeComponent<T> | undefined = undefined;

      if (connectionsFromStartNode && connectionsFromStartNode.length > 0) {
        connectionsFromStartNode.forEach((connectionNode) => {
          if (connectionNode.startNode?.id !== start.id) {
            return;
          }
          let end: INodeComponent<T> | undefined = undefined;
          connection = connectionNode as unknown as IConnectionNodeComponent<T>;

          if (connection && connection.endNode) {
            end = connection.endNode;
          }

          if (
            connection &&
            end &&
            canvasApp?.canvas &&
            connection.controlPoints &&
            connection.controlPoints.length >= 1
          ) {
            if (followPathToEndThumb) {
              if (
                followPathByName &&
                connection.endNodeThumb?.pathName !== followPathByName
              ) {
                return;
              }

              if (!followPathByName && connection.endNodeThumb?.pathName) {
                return;
              }
            } else {
              if (
                followPathByName &&
                connection.startNodeThumb?.pathName !== followPathByName
              ) {
                return;
              }

              if (!followPathByName && connection.startNodeThumb?.pathName) {
                return;
              }
            }

            connectionPairs.push({
              start,
              connection,
              end,
            });
          }
        });
      }

      return connectionPairs;
    }
  }
  return false;
};

export const getNodeConnectionPairsFromThumb = <T>(
  canvasApp: CanvasAppInstance,
  nodeThumb: IThumbNodeComponent<T>
) => {
  const connectionPairs: {
    start: IRectNodeComponent<T>;
    end: IRectNodeComponent<T>;
    connection: IConnectionNodeComponent<T>;
  }[] = [];

  if (nodeThumb) {
    const start =
      nodeThumb.thumbLinkedToNode as unknown as IRectNodeComponent<T>;
    if (start) {
      const connectionsFromStartNode = start.connections;
      let connection: IConnectionNodeComponent<T> | undefined = undefined;

      if (connectionsFromStartNode && connectionsFromStartNode.length > 0) {
        connectionsFromStartNode.forEach((connectionNode) => {
          if (connectionNode.startNode?.id !== start.id) {
            return;
          }
          if (connectionNode.startNodeThumb?.id !== nodeThumb.id) {
            return;
          }

          let end: INodeComponent<T> | undefined = undefined;
          connection = connectionNode;

          if (connection && connection.endNode) {
            end = connection.endNode;
          }

          if (
            connection &&
            end &&
            canvasApp?.canvas &&
            connection.controlPoints &&
            connection.controlPoints.length >= 1
          ) {
            connectionPairs.push({
              start,
              connection,
              end,
            });
          }
        });
      }

      return connectionPairs;
    }
  }
  return false;
};
