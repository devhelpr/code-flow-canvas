import {
  connectionToThumbDistance,
  controlPointCurvingDistance,
} from '../../constants/measures';
import {
  ControlAndEndPointNodeType,
  IRectNodeComponent,
  IThumbNodeComponent,
} from '../../interfaces';
import { ThumbType } from '../../types';
import { BaseNodeInfo } from '../../types/base-node-info';
import {
  calculateConnectorX,
  calculateConnectorY,
} from './calculate-connector-thumbs';
import { calculate2DDistance } from './distance';

const interpolate = (
  lowValue: number,
  highValue: number,
  minT: number,
  maxT: number,
  t: number
) => {
  if (t > maxT) {
    return highValue;
  }

  if (t < minT) {
    return lowValue;
  }

  const result =
    lowValue + ((highValue - lowValue) * (t - minT)) / (maxT - minT);

  return result;
};

const minDistance = 75;
const xInterpolateDistance = 25;

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

  const distance = calculate2DDistance(x1, y1, x2, y2) * factor;

  return { distance, thumbFactor };
};

export const onCubicCalculateControlPoints = <T extends BaseNodeInfo>(
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
          connectedNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
          connectedNode.width ?? 0
        )
      : 0);
  const connectedNodeY =
    (connectedNode?.y ?? 0) +
    (connectedNode
      ? calculateConnectorY(
          connectedNodeThumb?.thumbType ?? ThumbType.StartConnectorCenter,
          connectedNode.width ?? 0,
          connectedNode.height ?? 0,
          nodeType === ControlAndEndPointNodeType.start
            ? rectNodeThumb?.thumbIndex
            : connectedNodeThumb?.thumbIndex,
          connectedNodeThumb
        )
      : 0);

  if (nodeType === ControlAndEndPointNodeType.start) {
    const x = rectNode.x + calculateConnectorX(thumbType, rectNode.width ?? 0);
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
          (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) +
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorTop) {
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
          (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) -
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    } else if (thumbType === ThumbType.Center) {
      return {
        // cpx: x,
        // cpy: y,
        x: x,
        y: y,
        cx: x,
        cy: y,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorRight) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      let cx =
        x +
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) +
        controlPointCurvingDistance * thumbFactor;
      const cy = y;
      if (cx > connectedNodeX) {
        cx = connectedNodeX;
      }
      return {
        x: x,
        y: y,
        cx: cx,
        cy: cy,
        nodeType,
      };
    } else if (thumbType === ThumbType.StartConnectorLeft) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      const cx =
        x -
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) -
        controlPointCurvingDistance * thumbFactor;

      let cy = y;
      if (connectedNode && connectedNodeX > x) {
        if (connectedNodeY > y) {
          cy += 250;
        } else {
          cy -= 250;
        }
      }

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

    const yDistance = Math.abs(connectedNodeY - y);
    const yHelper = interpolate(0, 1, 0, 20, yDistance) + 0.5;
    let cx =
      x +
      (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) * yHelper +
      controlPointCurvingDistance * thumbFactor * yHelper;
    let cy = y;

    if (thumbType === ThumbType.StartConnectorCenterLeft) {
      cx =
        x -
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) *
          yHelper -
        controlPointCurvingDistance * thumbFactor * yHelper;
    }

    const isConnectingToRectThumb = false;
    //connectedNodeThumb?.thumbType === ThumbType.Center;
    if (
      !isConnectingToRectThumb &&
      connectedNode &&
      connectedNode.x < rectNode.x &&
      thumbType !== ThumbType.StartConnectorCenterLeft
    ) {
      cx += 250;
      if (connectedNode.y < rectNode.y) {
        cy += 250;
      } else {
        cy -= 250;
      }
    }
    if (!isConnectingToRectThumb && connectedNode && x < connectedNodeX) {
      const centerX = x + (connectedNodeX - x) / 2;
      const xDistance = Math.abs(connectedNodeX - x);
      if (cx > centerX && xDistance > minDistance) {
        if (xDistance < minDistance + xInterpolateDistance) {
          cx = interpolate(
            cx,
            centerX,
            minDistance,
            minDistance + xInterpolateDistance,
            xDistance
          );
        } else {
          cx = centerX;
        }
      }
    }

    return {
      x: x,
      y: y,
      cx: cx,
      cy: cy,
      nodeType,
    };
  }

  if (nodeType === ControlAndEndPointNodeType.end) {
    const correctedThumbType =
      thumbType === ThumbType.Center ? ThumbType.EndConnectorCenter : thumbType;
    const x =
      rectNode.x + calculateConnectorX(correctedThumbType, rectNode.width ?? 0);

    const y =
      rectNode.y +
      calculateConnectorY(
        correctedThumbType,
        rectNode.width ?? 0,
        rectNode.height ?? 0,
        index,
        rectNodeThumb
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
          (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) -
          controlPointCurvingDistance * thumbFactor,
        nodeType,
      };
    }
    // else if (thumbType === ThumbType.Center) {
    //   const circleRadius = (rectNode?.width ?? 100) / 2 + 10;
    //   const intersections = intersectionCircleLine(
    //     {
    //       center: { x: x, y: y },
    //       radius: circleRadius,
    //     },
    //     { p1: { x: connectedNodeX, y: connectedNodeY }, p2: { x: x, y: y } }
    //   );

    //   if (x < connectedNodeX) {
    //     return {
    //       x: x - circleRadius,
    //       y: y,
    //       cx: x - circleRadius,
    //       cy: y,
    //       nodeType,
    //     };
    //   }

    //   if (connectedNodeY < y - circleRadius) {
    //     return {
    //       x: x,
    //       y: y - circleRadius,
    //       cx: x,
    //       cy: y - circleRadius - circleRadius,
    //       nodeType,
    //     };
    //   } else if (connectedNodeY > y + circleRadius) {
    //     return {
    //       x: x,
    //       y: y + circleRadius,
    //       cx: x,
    //       cy: y + circleRadius + circleRadius,
    //       nodeType,
    //     };
    //   }

    //   if (intersections.length > 0) {
    //     return {
    //       x: intersections[0].x,
    //       y: intersections[0].y,
    //       cx: intersections[0].x,
    //       cy: intersections[0].y,
    //       nodeType,
    //     };
    //   }
    //   return {
    //     x: x,
    //     y: y,
    //     cx: x,
    //     cy: y,
    //     nodeType,
    //   };
    //}
    else if (thumbType === ThumbType.EndConnectorLeft) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      const cx =
        x -
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) -
        controlPointCurvingDistance * thumbFactor;

      let cy = y;
      if (connectedNode && connectedNodeX > x) {
        if (connectedNodeY > y) {
          cy += 250;
        } else {
          cy -= 250;
        }
      }

      return {
        x: x,
        y: y,
        cx: cx,
        cy: cy,
        nodeType,
      };
    } else if (thumbType === ThumbType.EndConnectorRight) {
      const { distance, thumbFactor } = getFactor(
        x,
        y,
        connectedNodeX,
        connectedNodeY
      );
      let cx =
        x +
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) +
        controlPointCurvingDistance * thumbFactor;

      const cy = y;
      if (cx > connectedNodeX) {
        cx = connectedNodeX;
      }
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

    const yDistance = Math.abs(connectedNodeY - y);
    const yHelper = interpolate(0, 1, 0, 20, yDistance) + 0.5;

    let cx =
      x -
      (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) * yHelper -
      controlPointCurvingDistance * thumbFactor * yHelper;

    if (thumbType === ThumbType.EndConnectorCenterRight) {
      cx =
        x +
        (controlPointDistance ?? (connectedNode ? distance : 0) ?? 0) +
        controlPointCurvingDistance * thumbFactor;
    }
    let cy = y;
    if (
      connectedNode &&
      connectedNodeX > x &&
      thumbType !== ThumbType.EndConnectorCenterRight
    ) {
      if (connectedNodeY > y) {
        cy += 500;
      } else {
        cy -= 500;
      }
    }

    if (
      connectedNode &&
      x > connectedNodeX &&
      thumbType !== ThumbType.EndConnectorCenterRight
    ) {
      const centerX = x - (x - connectedNodeX) / 2;
      const xDistance = Math.abs(connectedNodeX - x);
      if (cx < centerX && xDistance > minDistance) {
        if (xDistance < minDistance + xInterpolateDistance) {
          cx = interpolate(
            cx,
            centerX,
            minDistance,
            minDistance + xInterpolateDistance,
            xDistance
          );
        } else {
          cx = centerX;
        }
      }
    }
    return {
      x: x,
      y: y,
      cx: cx,
      cy: cy,
      nodeType,
    };
  }

  throw new Error('Not supported');
};

export const onGetConnectionToThumbOffset = (
  nodeType: ControlAndEndPointNodeType,
  thumbType: ThumbType
) => {
  if (thumbType === ThumbType.None) {
    // no more needed due to different way of determining connection-thumb positions??
    // HACK: this seems to fix the bug when a connection without start node is clicked and the end node jumps
    if (nodeType === ControlAndEndPointNodeType.start) {
      return {
        offsetX: 0, //connectionToThumbDistance * 3,
        offsetY: 0,
      };
    }
    if (nodeType === ControlAndEndPointNodeType.end) {
      return {
        offsetX: 0, //-connectionToThumbDistance * 3,
        offsetY: 0,
      };
    }
    return {
      offsetX: 0,
      offsetY: 0,
    };
  }
  if (nodeType === ControlAndEndPointNodeType.start) {
    if (thumbType === ThumbType.StartConnectorBottom) {
      return {
        offsetX: 0,
        offsetY: connectionToThumbDistance * 3,
      };
    } else if (thumbType === ThumbType.StartConnectorTop) {
      return {
        offsetX: 0,
        offsetY: -connectionToThumbDistance * 3,
      };
    } else if (thumbType === ThumbType.Center) {
      return {
        offsetX: 0,
        offsetY: 0,
      };
    }

    return {
      offsetX: connectionToThumbDistance * 3,
      offsetY: 0,
    };
  }
  if (nodeType === ControlAndEndPointNodeType.end) {
    if (thumbType === ThumbType.EndConnectorTop) {
      return {
        offsetX: 0,
        offsetY: -connectionToThumbDistance * 3,
      };
    }
    // else if (thumbType === ThumbType.Center) {
    //   return {
    //     offsetX: 0,
    //     offsetY: 0,
    //   };
    // }

    return {
      offsetX: -connectionToThumbDistance * 3,
      offsetY: 0,
    };
  }

  return {
    offsetX: 0,
    offsetY: 0,
  };
};
