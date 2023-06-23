import {
  ControlAndEndPointNodeType,
  CurveType,
  INodeComponent,
  IRectNodeComponent,
} from '../../interfaces';
import { ThumbType } from '../../types';
import {
  calculateConnectorX,
  calculateConnectorY,
  thumbRadius,
} from './calculate-connector-thumbs';
import { calculate2DDistance } from './distance';

const getFactor = (x1: number, y1: number, x2: number, y2: number) => {
  let factor = 0.15;
  let thumbFactor = 1;
  if (Math.abs((y2 ?? 0) - y1) < 50) {
    console.log('straight line y', y2 ?? 0, y1);
    factor *= Math.abs((y2 ?? 0) - y1) / 50;
    thumbFactor = Math.abs((y2 ?? 0) - y1) / 50;
  }

  // if (Math.abs((x2 ?? 0) - x1) < 50) {
  //   console.log('straight line x', x2 ?? 0, x1);
  //   factor *= Math.abs((x2 ?? 0) - x1) / 50;
  //   thumbFactor = Math.abs((x2 ?? 0) - x1) / 50;
  // }

  const distance = calculate2DDistance(x1, y1, x2, y2) * factor;

  return { distance, thumbFactor };
};

export const onCalculateControlPoints = <T>(
  rectNode: IRectNodeComponent<T>,
  nodeType: ControlAndEndPointNodeType,
  thumbType: ThumbType,
  index?: number,
  connectedNode?: IRectNodeComponent<T>,
  thumbOffsetY?: number,
  controlPointDistance?: number,
  connectedNodeThumb?: INodeComponent<T>
) => {
  // TODO : use thumb coordinates to calculate control points

  const connectedNodeX =
    (connectedNode?.x ?? 0) +
    (connectedNode
      ? calculateConnectorX(
          connectedNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
          connectedNode.width ?? 0,
          connectedNode.height ?? 0,
          connectedNodeThumb?.thumbIndex
        )
      : 0);
  const connectedNodeY =
    (connectedNode?.y ?? 0) +
    (connectedNode
      ? calculateConnectorY(
          connectedNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
          connectedNode.width ?? 0,
          connectedNode.height ?? 0,
          connectedNodeThumb?.thumbIndex
        )
      : 0);

  if (nodeType === ControlAndEndPointNodeType.start) {
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
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX ?? 0,
        connectedNodeY ?? 0
      );
      return {
        x: x,
        y: y,
        cx: x,
        cy: y + (controlPointDistance ?? distance ?? 0) + 50 * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorTop) {
      y = y - thumbRadius * 3;
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      return {
        x: x,
        y: y,
        cx: x,
        cy: y - (controlPointDistance ?? distance ?? 0) - 50 * thumbFactor,
        nodeType,
      };
    }

    x = x + thumbRadius * 3;
    const { distance, thumbFactor } = getFactor(
      x,
      y,
      connectedNodeX,
      connectedNodeY
    );
    const cx = x + (controlPointDistance ?? distance ?? 0) + 50 * thumbFactor;

    return {
      x: x,
      y: y,
      cx: cx,
      cy: y,
      nodeType,
    };
  }
  if (nodeType === ControlAndEndPointNodeType.end) {
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
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      return {
        x: x,
        y: y,
        cx: x,
        cy: y - (controlPointDistance ?? distance ?? 0) - 50 * thumbFactor,
        nodeType,
      };
    }

    x = x - thumbRadius * 3;
    const { distance, thumbFactor } = getFactor(
      x,
      y,
      connectedNodeX,
      connectedNodeY
    );
    const cx = x - (controlPointDistance ?? distance ?? 0) - 50 * thumbFactor;
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
