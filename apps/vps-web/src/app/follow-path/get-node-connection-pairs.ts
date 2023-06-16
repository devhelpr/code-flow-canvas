import {
  CanvasAppInstance,
  INodeComponent,
} from '@devhelpr/visual-programming-system';

export const getNodeConnectionPairById = <T>(
  canvasApp: CanvasAppInstance,
  node: INodeComponent<T>,
  followPathByName?: string,
  followPathToEndThumb?: boolean
) => {
  const connectionPairs: {
    start: INodeComponent<T>;
    end: INodeComponent<T>;
    connection: INodeComponent<T>;
  }[] = [];

  if (node) {
    const start = node as unknown as INodeComponent<T>;
    if (start) {
      const connectionsFromStartNode = start.connections;
      let connection: INodeComponent<T> | undefined = undefined;

      if (connectionsFromStartNode && connectionsFromStartNode.length > 0) {
        connectionsFromStartNode.forEach((connectionNode) => {
          if (connectionNode.startNode?.id !== start.id) {
            return;
          }
          let end: INodeComponent<T> | undefined = undefined;
          connection = connectionNode as unknown as INodeComponent<T>;

          if (connection && connection.endNode) {
            end = connection.endNode;
          }

          if (
            connection &&
            end &&
            canvasApp?.canvas &&
            connection.controlPoints &&
            connection.controlPoints.length === 2
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
  nodeThumb: INodeComponent<T>
) => {
  const connectionPairs: {
    start: INodeComponent<T>;
    end: INodeComponent<T>;
    connection: INodeComponent<T>;
  }[] = [];

  if (nodeThumb) {
    const start = nodeThumb.thumbLinkedToNode as unknown as INodeComponent<T>;
    if (start) {
      const connectionsFromStartNode = start.connections;
      let connection: INodeComponent<T> | undefined = undefined;

      if (connectionsFromStartNode && connectionsFromStartNode.length > 0) {
        connectionsFromStartNode.forEach((connectionNode) => {
          if (connectionNode.startNode?.id !== start.id) {
            return;
          }
          if (connectionNode.startNodeThumb?.id !== nodeThumb.id) {
            return;
          }

          let end: INodeComponent<T> | undefined = undefined;
          connection = connectionNode as unknown as INodeComponent<T>;

          if (connection && connection.endNode) {
            end = connection.endNode;
          }

          if (
            connection &&
            end &&
            canvasApp?.canvas &&
            connection.controlPoints &&
            connection.controlPoints.length === 2
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
