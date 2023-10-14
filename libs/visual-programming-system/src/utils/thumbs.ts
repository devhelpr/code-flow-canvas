import { INodeComponent, ThumbConnectionType } from '../interfaces';
import { ThumbType } from '../types';

export const getThumbNodeByName = <T>(
  name: string,
  node: INodeComponent<T>,
  takeDefaultThumb = {
    start: false,
    end: false,
  }
) => {
  if (node.thumbConnectors) {
    const thumbNode = node.thumbConnectors.find((thumbNode) => {
      if (!name && takeDefaultThumb) {
        if (takeDefaultThumb.start) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.start;
        }
        if (takeDefaultThumb.end) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.end;
        }
      }
      return thumbNode.thumbName === name;
    });
    return thumbNode;
  }
  return false;
};

export const getThumbNode = <T>(
  thumbType: ThumbType,
  node: INodeComponent<T>
) => {
  if (node.thumbConnectors) {
    const thumbNode = node.thumbConnectors.find((thumbNode) => {
      return thumbNode.thumbType === thumbType;
    });
    return thumbNode;
  }
  return false;
};
