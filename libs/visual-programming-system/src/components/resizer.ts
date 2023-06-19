/*

const startPointElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.TopLeft,
    '#ff000080',
    thumbOffsetX,
    thumbOffsetY,
    'begin',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction || hasStaticWidthHeight || disableManualResize
  );

  startPointElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape');
    return true;
  };

  const rightTopPointElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.TopRight,
    '#ffff0080',
    thumbOffsetX + widthHelper, //startX + width,
    thumbOffsetY, //startY,
    'rightTop',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction || hasStaticWidthHeight || disableManualResize
  );
  rightTopPointElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }
    setPosition(component, x, y, actionComponent?.nodeType !== 'shape', false);
    return true;
  };
  const leftBottomElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.BottomLeft,
    '#00ff00',
    thumbOffsetX, //startX,
    thumbOffsetY + heightHelper, //startY + height,
    'leftBottom',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction || hasStaticWidthHeight || disableManualResize
  );
  leftBottomElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape', false);
    return true;
  };
  const rightBottomElement = createThumbSVGElement(
    rectNode.domElement,
    interactionStateMachine,
    rectNode.elements,
    ThumbType.BottomRight,
    '#0000ff',
    '100%', //thumbOffsetX + widthHelper,
    '100%', //thumbOffsetY + heightHelper,
    'rightBottom',
    'resizer',
    'top-0 left-0 origin-center',
    thumbWidth,
    thumbHeight,
    thumbRadius,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    disableInteraction || hasStaticWidthHeight || disableManualResize
  );
  rightBottomElement.update = (
    component?: INodeComponent<T>,
    x?: number,
    y?: number,
    actionComponent?: INodeComponent<T>
  ) => {
    if (!component || x === undefined || y === undefined || !actionComponent) {
      return false;
    }

    setPosition(component, x, y, actionComponent?.nodeType !== 'shape', false);
    return true;
  };


  startPointElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  rightTopPointElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });

  leftBottomElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.connection,
  });
  leftBottomElement.components.push(
    {
      component: rectNode,
      type: NodeComponentRelationType.connection,
    },
    {
      component: rectNode,
      type: NodeComponentRelationType.controllerTarget,
      update: (
        component?: INodeComponent<T>,
        x?: number,
        y?: number,
        actionComponent?: INodeComponent<T>
      ) => {
        if (
          !component ||
          x === undefined ||
          y === undefined ||
          !actionComponent
        ) {
          return false;
        }

        if (component.update) {
          return component.update(component, x, y, actionComponent);
        }
        return true;
      },
    }
  );

  rightBottomElement.components.push({
    component: rectNode,
    type: NodeComponentRelationType.controllerTarget,
    update: (
      component?: INodeComponent<T>,
      x?: number,
      y?: number,
      actionComponent?: INodeComponent<T>
    ) => {
      if (
        !component ||
        x === undefined ||
        y === undefined ||
        !actionComponent
      ) {
        return false;
      }
      if (component.update) {
        return component.update(component, x, y, actionComponent);
      }
      return true;
    },
  });


  setStartPoint: (x: number, y: number) => {
      if (startPointElement.update) {
        startPointElement.update(startPointElement, x, y, startPointElement);
      }
    },
    setRightTopPoint: (x: number, y: number) => {
      if (rightTopPointElement.update) {
        rightTopPointElement.update(
          rightTopPointElement,
          x,
          y,
          rightTopPointElement
        );
      }
    },
    setLeftBottomPoint: (x: number, y: number) => {
      if (leftBottomElement.update) {
        leftBottomElement.update(leftBottomElement, x, y, leftBottomElement);
      }
    },
    setRightBottomPoint: (x: number, y: number) => {
      if (rightBottomElement.update) {
        rightBottomElement.update(rightBottomElement, x, y, rightBottomElement);
      }
    },



	// start: startPointElement,
	// rightTop: rightTopPointElement,
	// leftBottom: leftBottomElement,
	// rightBottom: rightBottomElement,


	createEffect(() => {
    //const selectedNode = getSelectedNode();
    const visibility = getVisbility(); // && selectedNode && selectedNode === rectNode.id;

    // console.log(
    //   'VISIBILITY',
    //   getVisbility(),
    //   rectNode.id,
    //   selectedNode,
    //   visibility
    // );

    // (startPointElement.domElement as unknown as SVGElement).style.display =
    //   visibility ? 'block' : 'none';
    // (rightTopPointElement.domElement as unknown as SVGElement).style.display =
    //   visibility ? 'block' : 'none';
    // (rightBottomElement.domElement as unknown as SVGElement).style.display =
    //   visibility ? 'block' : 'none';
    // (leftBottomElement.domElement as unknown as SVGElement).style.display =
    //   visibility ? 'block' : 'none';
  });




  if (actionComponent.specifier === 'leftBottom') {
          if (x <= points.beginX + points.width - minSize) {
            points.width = points.width - (x - points.beginX);
            points.beginX = x;
          } else {
            return false;
          }

          if (y - points.beginY >= minSize) {
            points.height = y - points.beginY;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'rightBottom') {
          if (x - points.beginX >= minSize && y - points.beginY >= minSize) {
            points.width = x - points.beginX;
            points.height = y - points.beginY;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'rightTop') {
          if (x - points.beginX >= minSize) {
            points.width = x - points.beginX;
          } else {
            return false;
          }
          if (y <= points.beginY + points.height - minSize) {
            points.height = points.height - (y - points.beginY);
            points.beginY = y;
          } else {
            return false;
          }
        } else if (actionComponent.specifier === 'begin') {
          if (x <= points.beginX + points.width - minSize) {
            points.width = points.width - (x - points.beginX);
            points.beginX = x;
          } else {
            return false;
          }
          if (y <= points.beginY + points.height - minSize) {
            points.height = points.height - (y - points.beginY);
            points.beginY = y;
          } else {
            return false;
          }
        } else {
          return false;
        }


        if (specifier === 'begin') {
            const topLeft = getThumbPosition(ThumbType.TopLeft);
            return {
              x: topLeft.x,
              y: topLeft.y,
            };
          } else if (specifier === 'rightTop') {
            const topRight = getThumbPosition(ThumbType.TopRight);
            return {
              x: topRight.x,
              y: topRight.y,
            };
          } else if (specifier === 'leftBottom') {
            const bottomLeft = getThumbPosition(ThumbType.BottomLeft);
            return {
              x: bottomLeft.x,
              y: bottomLeft.y,
            };
          } else if (specifier === 'rightBottom') {
            const bottomRight = getThumbPosition(ThumbType.BottomRight);
            return {
              x: bottomRight.x,
              y: bottomRight.y,
            };
          } else 


          const topLeft = getThumbPosition(ThumbType.TopLeft);
        connectionInfo.controllers?.start.update(
          connectionInfo.controllers?.start,
          topLeft.x,
          topLeft.y,
          actionComponent
        );

        const topRight = getThumbPosition(ThumbType.TopRight);
        connectionInfo.controllers?.rightTop.update(
          connectionInfo.controllers?.rightTop,
          topRight.x,
          topRight.y,
          actionComponent
        );

        const bottomLeft = getThumbPosition(ThumbType.BottomLeft);
        connectionInfo.controllers?.leftBottom.update(
          connectionInfo.controllers?.leftBottom,
          bottomLeft.x,
          bottomLeft.y,
          actionComponent
        );

        const bottomRight = getThumbPosition(ThumbType.BottomRight);
        connectionInfo.controllers?.rightBottom.update(
          connectionInfo.controllers?.rightBottom,
          bottomRight.x,
          bottomRight.y,
          actionComponent
        );

          let point = getRectPoint(connectionInfo.controllers?.start.specifier);
        if (point) {
          connectionInfo.controllers?.start.update(
            connectionInfo.controllers?.start,
            point.x,
            point.y,
            incomingComponent
          );
        }
        point = getRectPoint(connectionInfo.controllers?.rightTop.specifier);
        if (point) {
          connectionInfo.controllers?.rightTop.update(
            connectionInfo.controllers?.rightTop,
            point.x,
            point.y,
            incomingComponent
          );
        }
        point = getRectPoint(connectionInfo.controllers?.leftBottom.specifier);
        if (point) {
          connectionInfo.controllers?.leftBottom.update(
            connectionInfo.controllers?.leftBottom,
            point.x,
            point.y,
            incomingComponent
          );
        }

        point = getRectPoint(connectionInfo.controllers?.rightBottom.specifier);
        if (point) {
          connectionInfo.controllers?.rightBottom.update(
            connectionInfo.controllers?.rightBottom,
            point.x,
            point.y,
            incomingComponent
          );
        }

*/
