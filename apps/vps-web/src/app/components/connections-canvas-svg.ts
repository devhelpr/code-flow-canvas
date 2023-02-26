import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
  INodeComponent,
} from '../interfaces/element';
import { IPointerDownResult } from '../interfaces/pointers';
import { createNSElement } from '../utils/create-element';
import {
  createNodeComponent,
  createSVGNodeComponent,
} from '../utils/create-node-component';

export const createConnectionsSVGCanvasElement = (
  canvasElement: DOMElementNode
) => {
  const nodeComponent: INodeComponent = createSVGNodeComponent(
    'svg',
    {
      class:
        'absolute top-0 left-0 w-full h-full ease-in-out duration-[75ms] pointer-events-none',
      style: {},
      preserveAspectRatio: 'none',
    },
    canvasElement
  );

  nodeComponent.x = 0;
  nodeComponent.y = 0;
  return nodeComponent;
};
