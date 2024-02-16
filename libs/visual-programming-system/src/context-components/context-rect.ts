/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ElementNodeMap,
  IRectNodeComponent,
  IThumb,
  IThumbNodeComponent,
  ThumbConnectionType,
} from '../interfaces/element';
import { createElementMap } from '../utils';
import { NodeType } from '../types/node-type';
import { ContextThumbNodeConnector } from './context-thumb-node-connector';

export class ContextRect<T> {
  public nodeComponent?: IRectNodeComponent<T>;
  public isStaticPosition?: boolean;

  protected rectInfo: ReturnType<typeof this.createRectElement>;

  protected canvasElements?: ElementNodeMap<T>;
  protected containerNode?: IRectNodeComponent<T>;

  constructor(
    elements: ElementNodeMap<T>,
    thumbs?: IThumb[],
    id?: string,
    containerNode?: IRectNodeComponent<T>
  ) {
    this.canvasElements = elements;
    this.containerNode = containerNode;

    this.rectInfo = this.createRectElement(elements, id);
    this.nodeComponent = this.rectInfo.nodeComponent;

    this.nodeComponent.containerNode = containerNode;

    const thumbConnectors: IThumbNodeComponent<T>[] = [];

    if (thumbs) {
      thumbs.forEach((thumb) => {
        if (!this.nodeComponent) {
          return;
        }

        const thumbNode = new ContextThumbNodeConnector<T>(
          thumb,
          this.nodeComponent.elements,
          thumb.name ??
            (thumb.connectionType === ThumbConnectionType.start
              ? 'output'
              : 'input'),
          thumb.thumbType,
          thumb.connectionType,
          undefined,
          NodeType.Connector,
          thumb.thumbIndex ?? 0,
          elements,
          containerNode
        );

        if (!thumbNode.nodeComponent) {
          throw new Error('ThumbNode.nodeComponent is undefined');
        }
        thumbNode.nodeComponent.pathName = thumb.pathName;
        thumbNode.nodeComponent.isControlled = true;
        thumbNode.nodeComponent.isConnectPoint = true;
        thumbNode.nodeComponent.thumbConnectionType = thumb.connectionType;
        thumbNode.nodeComponent.thumbControlPointDistance =
          thumb.controlPointDistance;
        thumbNode.nodeComponent.thumbLinkedToNode = this.nodeComponent;
        thumbNode.nodeComponent.thumbConstraint = thumb.thumbConstraint;
        thumbNode.nodeComponent.isDataPort = thumb.isDataPort;
        thumbNode.nodeComponent.maxConnections = thumb.maxConnections;
        thumbNode.nodeComponent.thumbFormId = thumb.formId;
        thumbNode.nodeComponent.thumbFormFieldName = thumb.formFieldName;

        thumbConnectors.push(thumbNode.nodeComponent);
      });
    }
    this.nodeComponent.thumbConnectors = thumbConnectors;
    this.nodeComponent.connections = [];
  }

  protected createRectElement = (elements: ElementNodeMap<T>, id?: string) => {
    const rectContainerElement = {
      id: id,
      domElement: undefined as unknown as HTMLElement,
      elements: createElementMap<T>(),
    } as unknown as IRectNodeComponent<T>;

    rectContainerElement.nodeType = NodeType.Shape;

    elements.set(rectContainerElement.id, rectContainerElement);

    return {
      nodeComponent: rectContainerElement,
    };
  };
}
