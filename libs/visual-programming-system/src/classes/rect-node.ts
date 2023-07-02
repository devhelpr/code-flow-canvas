import { DOMElementNode, IRectNodeComponent } from '../interfaces';
import { createElement } from '../utils';
import { BaseNode, NodeMap } from './base-node';
import { CoreRenderingEngine, NodeShape } from './core-rendering-engine';

export class RectNode<T> extends BaseNode<T> {
  disableInteraction?: boolean | undefined;
  parent?: BaseNode<T> | undefined;
  //canvas?: BaseNode<T> | undefined;
  update(): void {
    throw new Error('Method not implemented.');
  }
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  domElement: DOMElementNode;
  elements: NodeMap<T>;
  nodeInfo?: T | undefined;

  private getBBoxPath() {
    return {
      x: this.x - 10,
      y: this.y - 10,
      width: this.width + 20,
      height: this.height + 20,
    };
  }

  private renderingEngine: CoreRenderingEngine;
  private nodeShape: NodeShape;

  constructor(
    renderingEngine: CoreRenderingEngine,
    canvas: DOMElementNode,
    canvasElements: NodeMap<T>,
    x: number,
    y: number,
    width: number,
    height: number,
    id?: string
  ) {
    super();
    this.renderingEngine = renderingEngine;
    this.renderingEngine.canvas = canvas;
    this.id = id ?? crypto.randomUUID();
    this.domElement = {} as DOMElementNode;
    this.elements = new Map<string, BaseNode<T>>();
    this.nodeInfo = {} as T;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    //this.canvas = canvas;

    const bbox = this.getBBoxPath();
    this.nodeShape = this.renderingEngine.createRectNode(
      bbox.x,
      bbox.y,
      bbox.width,
      bbox.height
    );

    canvasElements.set(this.id, this);
  }
}
