import { thumbHeight, thumbRadius } from '../../constants/measures';
import { INodeComponent } from '../../interfaces/element';
import { ThumbType } from '../../types/thumb-type';

export const calculateConnectorX = (
  thumbType: ThumbType,
  width: number,
  height: number,
  index?: number
) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.StartConnectorRight
  ) {
    return width;
  }

  if (thumbType === ThumbType.EndConnectorCenter) {
    return 0;
  }
  if (thumbType === ThumbType.EndConnectorLeft) {
    return 0;
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return width / 2;
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return width / 2;
  }
  if (thumbType === ThumbType.StartConnectorBottom) {
    return width / 2;
  }
  if (thumbType === ThumbType.Center) {
    return width / 2;
  }
  return 0;
};

export const calculateConnectorY = (
  thumbType: ThumbType,
  width: number,
  height: number,
  index?: number
) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.EndConnectorCenter ||
    thumbType === ThumbType.Center
  ) {
    return height / 2;
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
    return thumbHeight * (index ?? 0) + thumbRadius * 2;
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return 0;
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return 0;
  }

  if (thumbType === ThumbType.StartConnectorBottom) {
    return height;
  }
  return 0;
};

export const thumbPosition = <T>(
  rectNode: INodeComponent<T>,
  thumbType: ThumbType,
  index?: number
) => {
  if (thumbType === ThumbType.TopLeft) {
    return { x: 0, y: 0 };
  }
  if (thumbType === ThumbType.TopRight) {
    return { x: rectNode?.width ?? 0, y: 0 };
  }
  if (thumbType === ThumbType.BottomLeft) {
    return { x: 0, y: rectNode?.height ?? 0 };
  }
  if (thumbType === ThumbType.BottomRight) {
    return {
      x: rectNode?.width ?? 0,
      y: rectNode?.height ?? 0,
    };
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.EndConnectorLeft) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  } else if (thumbType === ThumbType.EndConnectorCenter) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (
    thumbType === ThumbType.StartConnectorTop ||
    thumbType === ThumbType.StartConnectorBottom
  ) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.StartConnectorRight) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  } else if (thumbType === ThumbType.StartConnectorCenter) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.Center) {
    return {
      x: calculateConnectorX(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  throw new Error('Thumb type not supported');
};
