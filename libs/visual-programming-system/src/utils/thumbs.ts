import {
  INodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces';
import { ThumbType } from '../types';
import { BaseNodeInfo } from '../types/base-node-info';

export const getThumbNodeByName = <T extends BaseNodeInfo>(
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

export const getThumbNodeById = <T extends BaseNodeInfo>(
  id: string,
  node: INodeComponent<T>,
  takeDefaultThumb = {
    start: false,
    end: false,
  }
) => {
  if (node.thumbConnectors) {
    const thumbNode = node.thumbConnectors.find((thumbNode) => {
      if (!id && takeDefaultThumb) {
        if (takeDefaultThumb.start) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.start;
        }
        if (takeDefaultThumb.end) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.end;
        }
      }
      return thumbNode.id === id;
    });
    return thumbNode;
  }
  return false;
};

export const getThumbNodeByIdentifierWithinNode = <T extends BaseNodeInfo>(
  thumbIdentifierWithinNode: string,
  node: INodeComponent<T>,
  takeDefaultThumb = {
    start: false,
    end: false,
  }
) => {
  if (node.thumbConnectors) {
    const thumbNode = node.thumbConnectors.find((thumbNode) => {
      if (!thumbIdentifierWithinNode && takeDefaultThumb) {
        if (takeDefaultThumb.start) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.start;
        }
        if (takeDefaultThumb.end) {
          return thumbNode.thumbConnectionType === ThumbConnectionType.end;
        }
      }
      return thumbNode.thumbIdentifierWithinNode === thumbIdentifierWithinNode;
    });
    return thumbNode;
  }
  return false;
};

export const getThumbNode = <T extends BaseNodeInfo>(
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

export const updateThumbPrefixLabel = <T extends BaseNodeInfo>(
  prefixLabel: string,
  thumbNode: IThumbNodeComponent<T>
) => {
  const element = (thumbNode.domElement as HTMLElement).querySelector(
    '.thumb-prefix-label'
  );
  if (element) {
    element.textContent = prefixLabel;
  }
};
