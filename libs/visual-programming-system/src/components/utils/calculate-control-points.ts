import {
  ControlAndEndPointNodeType,
  CurveType,
  INodeComponent,
} from '../../interfaces';
import { ThumbType } from '../../types';
import {
  calculateConnectorX,
  calculateConnectorY,
  thumbRadius,
} from './calculate-connector-thumbs';

export const onCalculateControlPoints = <T>(
  rectNode: INodeComponent<T>,
  nodeType: ControlAndEndPointNodeType,
  curveType: CurveType,
  thumbType: ThumbType,
  index?: number,
  connectedNode?: INodeComponent<T>,
  thumbOffsetY?: number,
  controlPointDistance?: number
) => {
  if (nodeType === ControlAndEndPointNodeType.start) {
    const xDistance =
      Math.abs((connectedNode?.x ?? 0) - (rectNode.x + (rectNode.width ?? 0))) *
      0.5;
    const yDistance =
      Math.abs(
        (connectedNode?.y ?? 0) - (rectNode.y + (rectNode.height ?? 0))
      ) * 0.5;

    let x =
      rectNode.x +
      calculateConnectorX(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      );
    let y =
      rectNode.y +
      calculateConnectorY(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      ) +
      (thumbOffsetY ?? 0);

    if (thumbType === ThumbType.StartConnectorBottom) {
      y = y + thumbRadius * 3;

      return {
        x: x,
        y: y,
        cx: x,
        cy: y + (controlPointDistance ?? yDistance ?? 0) + 50,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorTop) {
      const yDistance =
        Math.abs(
          rectNode.y - (rectNode.height ?? 0) - (connectedNode?.y ?? 0)
        ) * 0.5;

      y = y - thumbRadius * 3;
      return {
        x: x,
        y: y,
        cx: x,
        cy: y - (controlPointDistance ?? yDistance ?? 0) - 50,
        nodeType,
      };
    }

    x = x + thumbRadius * 3;
    const cx = x + (controlPointDistance ?? xDistance ?? 0) + 50;

    return {
      x: x,
      y: y,
      cx: cx,
      cy: y,
      nodeType,
    };
  }
  if (nodeType === ControlAndEndPointNodeType.end) {
    const xDistance =
      Math.abs(
        rectNode.x - ((connectedNode?.x ?? 0) + (connectedNode?.width ?? 0))
      ) * 0.5;
    const yDistance =
      Math.abs(
        rectNode.y - ((connectedNode?.y ?? 0) + (connectedNode?.height ?? 0))
      ) * 0.5;

    let x =
      rectNode.x +
      calculateConnectorX(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      );

    let y =
      rectNode.y +
      calculateConnectorY(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      ) +
      (thumbOffsetY ?? 0);

    if (thumbType === ThumbType.EndConnectorTop) {
      y = y - thumbRadius * 3;
      return {
        x: x,
        y: y,
        cx: x,
        cy: y - (controlPointDistance ?? yDistance ?? 0) - 50,
        nodeType,
      };
    }

    x = x - thumbRadius * 3;

    const cx = x - (controlPointDistance ?? xDistance ?? 0) - 50;
    return {
      x: x,
      y: y,
      cx: cx,
      cy: y,
      nodeType,
    };
  }

  throw new Error('Not supported');
};
