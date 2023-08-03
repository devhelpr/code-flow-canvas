import { thumbRadius } from '../../constants/measures';
import { INodeComponent } from '../../interfaces/element';
import { ThumbType } from '../../types/thumb-type';

export const thumbOffsetX = 0; // -thumbWidth / 2 + thumbRadius;
export const thumbOffsetY = 0; //-thumbHeight / 2 + thumbRadius;

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

  if (
    thumbType === ThumbType.EndConnectorCenter ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
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
    thumbType === ThumbType.EndConnectorCenter
  ) {
    return height / 2;
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
    return 30 * (index ?? 0);
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

export const thumbInitialPosition = <T>(
  rectNode: INodeComponent<T>,
  thumbType: ThumbType,
  index?: number,
  offsetY?: number
) => {
  if (thumbType === ThumbType.TopLeft) {
    return { x: '0%', y: '0%' };
  }
  if (thumbType === ThumbType.TopRight) {
    return { x: '100%', y: '0%' };
  }
  if (thumbType === ThumbType.BottomLeft) {
    return { x: '0%', y: '100%' };
  }
  if (thumbType === ThumbType.BottomRight) {
    return {
      x: '100%',
      y: '100%',
    };
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return {
      x: '50%',
      y: '0%',
    };
  }

  if (thumbType === ThumbType.EndConnectorCenter) {
    return {
      x: '0%',
      y: '50%',
    };
  }

  if (thumbType === ThumbType.EndConnectorLeft) {
    return {
      x: '0%',
      y: `${
        thumbRadius +
        calculateConnectorY(
          thumbType,
          rectNode.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        (offsetY ?? 0)
      }px`,
    };
  }

  if (thumbType === ThumbType.StartConnectorTop) {
    return {
      x: '50%',
      y: '0%',
    };
  }
  if (thumbType === ThumbType.StartConnectorBottom) {
    return {
      x: '50%',
      y: '100%',
    };
  }

  if (thumbType === ThumbType.StartConnectorRight) {
    return {
      x: '100%',
      y: `${
        thumbRadius +
        calculateConnectorY(
          thumbType,
          rectNode.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        (offsetY ?? 0)
      }px`,
    };
  }

  if (thumbType === ThumbType.StartConnectorCenter) {
    return {
      x: '100%',
      y: '50%',
    };
  }

  throw new Error('Thumb type not supported');
};

export const thumbPosition = <T>(
  rectNode: INodeComponent<T>,
  thumbType: ThumbType,
  index?: number,
  offsetY?: number
) => {
  if (thumbType === ThumbType.TopLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY };
  }
  if (thumbType === ThumbType.TopRight) {
    return { x: thumbOffsetX + (rectNode?.width ?? 0), y: thumbOffsetY };
  }
  if (thumbType === ThumbType.BottomLeft) {
    return { x: thumbOffsetX, y: thumbOffsetY + (rectNode?.height ?? 0) };
  }
  if (thumbType === ThumbType.BottomRight) {
    return {
      x: thumbOffsetX + (rectNode?.width ?? 0),
      y: thumbOffsetY + (rectNode?.height ?? 0),
    };
  }

  if (thumbType === ThumbType.EndConnectorTop) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetX,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetY -
        thumbRadius +
        (offsetY ?? 0),
    };
  }

  if (
    thumbType === ThumbType.EndConnectorLeft ||
    thumbType === ThumbType.EndConnectorCenter
  ) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetX -
        thumbRadius,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetY +
        (offsetY ?? 0),
    };
  }

  if (
    thumbType === ThumbType.StartConnectorTop ||
    thumbType === ThumbType.StartConnectorBottom
  ) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetX,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetY +
        thumbRadius,
    };
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.StartConnectorCenter
  ) {
    return {
      x:
        calculateConnectorX(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) +
        thumbOffsetX +
        thumbRadius,
      y:
        calculateConnectorY(
          thumbType,
          rectNode?.width ?? 0,
          rectNode?.height ?? 0,
          index
        ) + thumbOffsetY,
    };
  }

  throw new Error('Thumb type not supported');
};
