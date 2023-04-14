import { DOMElementNode, INodeComponent } from '../interfaces/element';
import { createSVGNodeComponent } from '../utils/create-node-component';

export const createConnectionsSVGCanvasElement = <T>(
  canvasElement: DOMElementNode
) => {
  const nodeComponent: INodeComponent<T> = createSVGNodeComponent(
    'svg',
    {
      class:
        'absolute top-0 left-0 w-full h-full ease-in-out duration-[75ms] pointer-events-none transition-none',
      style: {},
      preserveAspectRatio: 'none',
    },
    canvasElement
  );

  nodeComponent.x = 0;
  nodeComponent.y = 0;
  return nodeComponent;
};
