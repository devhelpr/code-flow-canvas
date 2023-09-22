import {
  connectionToThumbDistance,
  controlPointCurvingDistance,
  thumbRadius,
} from '../../constants/measures';
import {
  ControlAndEndPointNodeType,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../../interfaces';
import { ThumbType } from '../../types';
import {
  calculateConnectorX,
  calculateConnectorY,
} from './calculate-connector-thumbs';
import { calculate2DDistance } from './distance';

const getFactor = (x1: number, y1: number, x2: number, y2: number) => {
  const factor = 0.15;
  const thumbFactor = 1;
  // if (Math.abs((y2 ?? 0) - y1) < controlPointCurvingDistance) {
  //   factor *= Math.abs((y2 ?? 0) - y1) / controlPointCurvingDistance;
  //   thumbFactor = Math.abs((y2 ?? 0) - y1) / controlPointCurvingDistance;
  // }

  // if (Math.abs((x2 ?? 0) - x1) < 50) {
  //   console.log('straight line x', x2 ?? 0, x1);
  //   factor *= Math.abs((x2 ?? 0) - x1) / 50;
  //   thumbFactor = Math.abs((x2 ?? 0) - x1) / 50;
  // }

  let distance = calculate2DDistance(x1, y1, x2, y2) * factor;
  if (distance === 0) {
    distance = 0.01;
  }
  return { distance, thumbFactor };
};

export const onQuadraticCalculateControlPoints = <T>(
  rectNode: IRectNodeComponent<T>,
  nodeType: ControlAndEndPointNodeType,
  thumbType: ThumbType,
  rectNodeThumb?: IThumbNodeComponent<T>,
  index?: number,
  connectedNode?: IRectNodeComponent<T>,
  controlPointDistance?: number,
  connectedNodeThumb?: IThumbNodeComponent<T>
) => {
  const connectedNodeX =
    (connectedNode?.x ?? 0) +
    (connectedNode
      ? calculateConnectorX(
          connectedNodeThumb?.thumbType ?? ThumbType.None,
          connectedNode.width ?? 0,
          connectedNode.height ?? 0,
          connectedNodeThumb?.thumbIndex
        )
      : 0);
  const connectedNodeY =
    (connectedNode?.y ?? 0) +
    (connectedNode
      ? calculateConnectorY(
          connectedNodeThumb?.thumbType ?? ThumbType.None,
          connectedNode.width ?? 0,
          connectedNode.height ?? 0,
          connectedNodeThumb?.thumbIndex,
          connectedNodeThumb
        )
      : 0);

  if (nodeType === ControlAndEndPointNodeType.start) {
    const x =
      rectNode.x +
      calculateConnectorX(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      );
    const y =
      rectNode.y +
      calculateConnectorY(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index,
        rectNodeThumb
      );

    if (thumbType === ThumbType.StartConnectorBottom) {
      //y = y + connectionToThumbDistance * 3;
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
        cy:
          y +
          (controlPointDistance ?? distance ?? 0) +
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorTop) {
      //y = y - connectionToThumbDistance * 3;
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
        cy:
          y -
          (controlPointDistance ?? distance ?? 0) -
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.Center) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX ?? 0,
        connectedNodeY ?? 0
      );
      const centerX = ((connectedNodeX ?? 0) + x) / 2;
      const centerY = ((connectedNodeY ?? 0) + y) / 2;
      const factor = -Math.min(distance * Math.sqrt(2) * 0.5, 50);
      const cx = centerX + (factor * -((connectedNodeY ?? 0) - y)) / distance;
      const cy = centerY + (factor * ((connectedNodeX ?? 0) - x)) / distance;

      return {
        x: x,
        y: y,
        cx: cx,
        cy: cy,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorRight) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      const cx =
        x +
        (controlPointDistance ?? distance ?? 0) +
        controlPointCurvingDistance * thumbFactor;
      return {
        x: x,
        y: y,
        cx: cx,
        cy: y,
        nodeType,
      };
    }
    const { distance, thumbFactor } = getFactor(
      x,
      y,
      connectedNodeX,
      connectedNodeY
    );
    const cx =
      x +
      (controlPointDistance ?? distance ?? 0) +
      controlPointCurvingDistance * thumbFactor;

    return {
      x: x,
      y: y,
      cx: cx,
      cy: y,
      nodeType,
    };
  }
  if (nodeType === ControlAndEndPointNodeType.end) {
    const x =
      rectNode.x +
      calculateConnectorX(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index
      );

    const y =
      rectNode.y +
      calculateConnectorY(
        thumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index,
        connectedNodeThumb
      );

    if (thumbType === ThumbType.EndConnectorTop) {
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
        cy:
          y -
          (controlPointDistance ?? distance ?? 0) -
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.Center) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX ?? 0,
        connectedNodeY ?? 0
      );
      const centerX = ((connectedNodeX ?? 0) + x) / 2;
      const centerY = ((connectedNodeY ?? 0) + y) / 2;

      // const factor = -Math.min(distance * Math.sqrt(2) * 0.5, 50);
      // const cx = centerX + (factor * -((connectedNodeY ?? 0) - y)) / distance;
      // const cy = centerY + (factor * ((connectedNodeX ?? 0) - x)) / distance;

      const cx = centerX + (1 * -((connectedNodeY ?? 0) - y) * 1) / distance;
      const cy = centerY + (1 * ((connectedNodeX ?? 0) - x) * 1) / distance;
      return {
        x: x,
        y: y,
        cx: cx,
        cy: cy,
        nodeType,
      };
    }

    const { distance, thumbFactor } = getFactor(
      x,
      y,
      connectedNodeX,
      connectedNodeY
    );
    const cx =
      x -
      (controlPointDistance ?? distance ?? 0) -
      controlPointCurvingDistance * thumbFactor;
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
