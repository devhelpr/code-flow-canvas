import {
  calculateQuadraticBezierLineIntersections,
  ControlAndEndPointNodeType,
  getLinePoints,
  getPointOnCubicBezierCurve,
  getPointOnQuadraticBezierCurve,
  IConnectionNodeComponent,
  IRectNodeComponent,
  LineType,
  onGetConnectionToThumbOffset,
  paddingRect,
  splitQuadraticBezierCurve,
  ThumbType,
} from '@devhelpr/visual-programming-system';

export const getPointOnConnection = <T>(
  percentage: number,
  connection: IConnectionNodeComponent<T>,
  start: IRectNodeComponent<T>,
  end: IRectNodeComponent<T>
) => {
  const startNodeThumbType =
    connection.lineType === LineType.Straight
      ? ThumbType.Center
      : connection.startNodeThumb?.thumbType ?? ThumbType.None;
  const endNodeThumbType =
    connection.lineType === LineType.Straight
      ? ThumbType.Center
      : connection.endNodeThumb?.thumbType ?? ThumbType.None;

  const { offsetX: startOffsetX, offsetY: startOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.start,
      startNodeThumbType
    );
  const { offsetX: endOffsetX, offsetY: endOffsetY } =
    onGetConnectionToThumbOffset(
      ControlAndEndPointNodeType.end,
      endNodeThumbType
    );
  const startHelper = connection.onCalculateControlPoints(
    start,
    ControlAndEndPointNodeType.start,
    startNodeThumbType,
    connection.startNodeThumb,
    connection.startNodeThumb?.thumbIndex,
    end,
    connection.startNodeThumb?.thumbControlPointDistance,
    connection.endNodeThumb
  );

  const endHelper = connection.onCalculateControlPoints(
    end,
    ControlAndEndPointNodeType.end,
    endNodeThumbType,
    connection.endNodeThumb,
    connection.endNodeThumb?.thumbIndex,
    start,
    connection.endNodeThumb?.thumbControlPointDistance,
    connection.startNodeThumb
  );

  const tx = -paddingRect;
  const ty = -paddingRect;

  const ratio = Math.min(percentage, 1);

  if (connection.hasMultipleOutputs) {
    if (connection.pathElement?.domElement) {
      const path = connection.pathElement?.domElement as SVGPathElement;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(pathLength * ratio);

      const loopBackXOffset = 0;

      return {
        x: point.x + startHelper.x + startOffsetX + tx - loopBackXOffset - 10,
        y:
          point.y +
          ty +
          (startHelper.y > endHelper.y
            ? endHelper.y + endOffsetY
            : startHelper.y + startOffsetY) -
          10,
      };
    }
  } else if (connection.isLoopBack) {
    if (connection.pathElement?.domElement) {
      const path = connection.pathElement?.domElement as SVGPathElement;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(pathLength * ratio);

      const loopBackXOffset = 20;

      return {
        x: point.x + endHelper.x + endOffsetX + tx - loopBackXOffset - 10,
        y:
          point.y +
          ty +
          (startHelper.y > endHelper.y
            ? endHelper.y + endOffsetY
            : startHelper.y + startOffsetY) -
          10,
      };
    }
  }
  if (connection.lineType === LineType.Straight) {
    const { xStart, yStart, xEnd, yEnd } = getLinePoints(
      connection,
      { x: paddingRect, y: paddingRect },
      startOffsetX,
      startOffsetY,
      startHelper.x + tx + startOffsetX,
      startHelper.y + ty + startOffsetY,
      endHelper.x + tx + endOffsetX,
      endHelper.y + ty + endOffsetY
    );

    const xHelper = xEnd - xStart;
    const yHelper = yEnd - yStart;

    return {
      x: xStart + xHelper * ratio,
      y: yStart + yHelper * ratio,
    };
  }

  if (connection.lineType === LineType.BezierQuadratic) {
    const spacingAABB = 10;
    let t = 0;
    let tEnd = 1;
    if (start) {
      const xleft = start.x + startOffsetX - spacingAABB;
      const yleft = start.y + startOffsetY - spacingAABB;
      const width = (start.width ?? 0) + spacingAABB * 2;
      const height = (start.height ?? 0) + spacingAABB * 2;

      const AABBLeftIntersect = calculateQuadraticBezierLineIntersections(
        { x: startHelper.x, y: startHelper.y },
        { x: startHelper.cx, y: startHelper.cy },
        { x: endHelper.x, y: endHelper.y },
        { x: xleft, y: yleft },
        { x: xleft, y: yleft + height }
      );

      const AABBTopIntersect = calculateQuadraticBezierLineIntersections(
        { x: startHelper.x, y: startHelper.y },
        { x: startHelper.cx, y: startHelper.cy },
        { x: endHelper.x, y: endHelper.y },
        { x: xleft, y: yleft },
        { x: xleft + width, y: yleft }
      );

      const AABBRightIntersect = calculateQuadraticBezierLineIntersections(
        { x: startHelper.x, y: startHelper.y },
        { x: startHelper.cx, y: startHelper.cy },
        { x: endHelper.x, y: endHelper.y },
        { x: xleft + width, y: yleft },
        { x: xleft + width, y: yleft + height }
      );

      const AABBBottomIntersect = calculateQuadraticBezierLineIntersections(
        { x: startHelper.x, y: startHelper.y },
        { x: startHelper.cx, y: startHelper.cy },
        { x: endHelper.x, y: endHelper.y },
        { x: xleft, y: yleft + height },
        { x: xleft + width, y: yleft + height }
      );

      if (AABBLeftIntersect.length > 0) {
        t = AABBLeftIntersect[0]?.t;
      }
      if (AABBTopIntersect.length > 0) {
        t = AABBTopIntersect[0]?.t;
      }
      if (AABBRightIntersect.length > 0) {
        t = AABBRightIntersect[0]?.t;
      }
      if (AABBBottomIntersect.length > 0) {
        t = AABBBottomIntersect[0]?.t;
      }
    }
    const split1 = splitQuadraticBezierCurve(
      startHelper.x,
      startHelper.y,
      startHelper.cx,
      startHelper.cy,
      endHelper.x,
      endHelper.y,
      t ?? 0
    );

    if (end) {
      const xleft = end.x + startOffsetX - spacingAABB;
      const yleft = end.y + startOffsetY - spacingAABB;
      const width = (end.width ?? 0) + spacingAABB * 2;
      const height = (end.height ?? 0) + spacingAABB * 2;

      const AABBLeftIntersect = calculateQuadraticBezierLineIntersections(
        { x: split1.curve2.x1, y: split1.curve2.y1 },
        { x: split1.curve2.c1x, y: split1.curve2.c1y },
        { x: split1.curve2.x2, y: split1.curve2.y2 },
        { x: xleft, y: yleft },
        { x: xleft, y: yleft + height }
      );

      const AABBTopIntersect = calculateQuadraticBezierLineIntersections(
        { x: split1.curve2.x1, y: split1.curve2.y1 },
        { x: split1.curve2.c1x, y: split1.curve2.c1y },
        { x: split1.curve2.x2, y: split1.curve2.y2 },
        { x: xleft, y: yleft },
        { x: xleft + width, y: yleft }
      );

      const AABBRightIntersect = calculateQuadraticBezierLineIntersections(
        { x: split1.curve2.x1, y: split1.curve2.y1 },
        { x: split1.curve2.c1x, y: split1.curve2.c1y },
        { x: split1.curve2.x2, y: split1.curve2.y2 },
        { x: xleft + width, y: yleft },
        { x: xleft + width, y: yleft + height }
      );

      const AABBBottomIntersect = calculateQuadraticBezierLineIntersections(
        { x: split1.curve2.x1, y: split1.curve2.y1 },
        { x: split1.curve2.c1x, y: split1.curve2.c1y },
        { x: split1.curve2.x2, y: split1.curve2.y2 },
        { x: xleft, y: yleft + height },
        { x: xleft + width, y: yleft + height }
      );

      if (AABBLeftIntersect.length > 0) {
        tEnd = AABBLeftIntersect[0]?.t;
      }
      if (AABBTopIntersect.length > 0) {
        tEnd = AABBTopIntersect[0]?.t;
      }
      if (AABBRightIntersect.length > 0) {
        tEnd = AABBRightIntersect[0]?.t;
      }
      if (AABBBottomIntersect.length > 0) {
        tEnd = AABBBottomIntersect[0]?.t;
      }
    }

    const curves = splitQuadraticBezierCurve(
      split1.curve2.x1,
      split1.curve2.y1,
      split1.curve2.c1x,
      split1.curve2.c1y,
      split1.curve2.x2,
      split1.curve2.y2,
      tEnd ?? 1
    );

    return getPointOnQuadraticBezierCurve(
      ratio,
      {
        x: curves.curve1.x1 + tx + startOffsetX,
        y: curves.curve1.y1 + ty + startOffsetY,
      },
      {
        x: curves.curve1.c1x + tx,
        y: curves.curve1.c1y + ty,
      },
      {
        x: curves.curve1.x2 + tx + endOffsetX,
        y: curves.curve1.y2 + ty + endOffsetY,
      }
    );
  } else {
    return getPointOnCubicBezierCurve(
      ratio,
      {
        x: startHelper.x + tx + startOffsetX,
        y: startHelper.y + ty + startOffsetY,
      },
      {
        x: startHelper.cx + tx,
        y: startHelper.cy + ty,
      },
      {
        x: endHelper.cx + tx,
        y: endHelper.cy + ty,
      },
      { x: endHelper.x + tx + endOffsetX, y: endHelper.y + ty + endOffsetY }
    );
  }
};
