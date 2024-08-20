import { getCamera } from '../../camera';
import {
  paddingRect,
  thumbHeight,
  thumbRadius,
} from '../../constants/measures';
import { INodeComponent, IThumbNodeComponent } from '../../interfaces/element';
import { ThumbType } from '../../types/thumb-type';

export const calculateConnectorX = (thumbType: ThumbType, width: number) => {
  if (
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.StartConnectorRight
  ) {
    return width;
  }

  if (thumbType === ThumbType.StartConnectorLeft) {
    return 0;
  }

  if (thumbType === ThumbType.StartConnectorCenterLeft) {
    return 0;
  }

  if (thumbType === ThumbType.EndConnectorCenterRight) {
    return width;
  }

  if (thumbType === ThumbType.EndConnectorCenter) {
    return 0;
  }
  if (thumbType === ThumbType.EndConnectorLeft) {
    return 0;
  }
  if (thumbType === ThumbType.EndConnectorRight) {
    return width;
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

export const calculateConnectorY = <T>(
  thumbType: ThumbType,
  _width: number,
  height: number,
  index?: number,
  thumb?: IThumbNodeComponent<T>
) => {
  const { scale } = getCamera();
  if (
    thumbType === ThumbType.StartConnectorCenterLeft ||
    thumbType === ThumbType.EndConnectorCenterRight ||
    thumbType === ThumbType.StartConnectorCenter ||
    thumbType === ThumbType.EndConnectorCenter ||
    thumbType === ThumbType.Center
  ) {
    // const element = thumb?.thumbLinkedToNode?.domElement as HTMLElement;
    // if (element) {
    //   const bounds = element.getBoundingClientRect();
    //   if (bounds.height > 0) {
    //     return bounds.height / scale / 2;
    //   }
    // }

    return height / 2;
  }

  if (
    thumbType === ThumbType.StartConnectorRight ||
    thumbType === ThumbType.EndConnectorLeft
  ) {
    let formFieldOffsetY = 0;
    let offsetIndex = index;
    if (thumb) {
      const element = thumb.thumbLinkedToNode?.domElement as HTMLElement;
      if (element) {
        const formField = element.querySelector(
          `[id="${thumb.thumbFormId}_${thumb.thumbFormFieldName}"]`
        ) as HTMLElement;

        if (formField) {
          offsetIndex = 0;
          formFieldOffsetY = formField.offsetTop ?? 0;
          formFieldOffsetY -= paddingRect + 3;
        } else {
          const titleTopLabelField = element.querySelector(
            `.node-top-label`
          ) as HTMLElement;
          if (titleTopLabelField) {
            const bounds = titleTopLabelField.getBoundingClientRect();

            formFieldOffsetY = (bounds.height ?? 0) / scale;
          }
        }
      }
    }

    return (
      formFieldOffsetY + thumbHeight * (offsetIndex ?? 0) + thumbRadius * 2
    );
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
  index?: number,
  thumb?: IThumbNodeComponent<T>
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
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.EndConnectorRight) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.EndConnectorLeft) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.EndConnectorCenter) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.EndConnectorCenterRight) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  }

  if (
    thumbType === ThumbType.StartConnectorTop ||
    thumbType === ThumbType.StartConnectorBottom
  ) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index
      ),
    };
  }

  if (thumbType === ThumbType.StartConnectorLeft) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY<T>(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.StartConnectorRight) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY<T>(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.StartConnectorCenter) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  } else if (thumbType === ThumbType.StartConnectorCenterLeft) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
      y: calculateConnectorY(
        thumbType,
        rectNode?.width ?? 0,
        rectNode?.height ?? 0,
        index,
        thumb
      ),
    };
  }

  if (thumbType === ThumbType.Center) {
    return {
      x: calculateConnectorX(thumbType, rectNode?.width ?? 0),
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
