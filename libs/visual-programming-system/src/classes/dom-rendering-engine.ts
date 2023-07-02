import { DOMElementNode, IRectNodeComponent } from '../interfaces';
import { createElement } from '../utils';
import { CoreRenderingEngine, NodeShape } from './core-rendering-engine';

export interface DomNodeShape extends NodeShape {
  reference: number;

  divElement: IRectNodeComponent<any> | undefined;
}

export class DomRenderingEngine extends CoreRenderingEngine {
  override canvas: DOMElementNode = {} as DOMElementNode;
  createRectNode(
    x: number,
    y: number,
    width: number,
    height: number
  ): DomNodeShape {
    const node = {
      reference: 0,
      divElement: createElement(
        'div',
        {
          class: 'absolute top-0 left-0 select-none ', //will-change-transform
        },
        this.canvas,
        undefined,
        ''
      ) as unknown as IRectNodeComponent<any>,
    };

    node.divElement.nodeType = 'shape';
    const divElement = node.divElement as unknown as HTMLElement;
    divElement.style.width = `${width}px`;
    divElement.style.height = `${height}px`;
    divElement.style.transform = `translate(${x}px, ${y}px)`;
    return node;
  }
  createConnectionNode(): DomNodeShape {
    throw new Error('Method not implemented.');
  }
  createThumbNode(): DomNodeShape {
    throw new Error('Method not implemented.');
  }
}
