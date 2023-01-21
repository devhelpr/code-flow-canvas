import {
  DOMElementNode,
  ElementNodeMap,
  IElementNode,
} from '../interfaces/element';
import { createNSElement } from '../utils/create-element';

export const createSVGElement = (
  canvasElement: DOMElementNode,
  elements: ElementNodeMap
) => {
  let svgElement: IElementNode | undefined = undefined;
  svgElement = createNSElement(
    'svg',
    {
      class: 'absolute cursor-pointer',
      style: {
        transform: `translate(${Math.floor(
          Math.random() * 1024
        )}px, ${Math.floor(Math.random() * 500)}px)`,
      },
      width: 100,
      height: 100,
    },
    canvasElement
  );
  svgElement.domElement.id = svgElement.id;
  if (svgElement) {
    let circleElement: IElementNode | undefined = undefined;
    circleElement = createNSElement(
      'circle',
      {
        cx: 50,
        cy: 50,
        r: 40,
        stroke: 'black',
        'stroke-width': 3,
        fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
      },
      svgElement.domElement
    );
    elements.set(svgElement.id, svgElement);
    svgElement.elements.push(circleElement);
  }
};
