import {
  CanvasAppInstance,
  IElementNode,
  IRectNodeComponent,
  IThumbNodeComponent,
  ThumbConnectionType,
  ThumbType,
  calculateConnectorY,
  createElement,
  getThumbNodeById,
  getThumbNodeByName,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import { NodeInfo } from '../../types/node-info';
import { getNodeTaskFactory } from '../../node-task-registry';
import {
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { navbarButtonWithoutMargin } from '../../consts/classes';
import { setupTasksInDropdown } from '../../node-task-registry/setup-select-node-types-dropdown';

export class AddNodeCommand extends CommandHandler {
  constructor(
    rootElement: HTMLElement,
    canvasApp: CanvasAppInstance<NodeInfo>,
    canvasUpdated: () => void,
    removeElement: (element: IElementNode<NodeInfo>) => void
  ) {
    super(rootElement, canvasApp, canvasUpdated, removeElement);
    this.canvasApp = canvasApp;
    this.canvasUpdated = canvasUpdated;
    this.rootElement = rootElement;
  }
  rootElement: HTMLElement;
  canvasApp: CanvasAppInstance<NodeInfo>;
  canvasUpdated: () => void;

  addNodeType = (
    nodeType: string,
    connectToNode?: IRectNodeComponent<NodeInfo>,
    thumbId?: string
  ) => {
    this.canvasApp?.resetNodeTransform();
    if (!nodeType) {
      console.log('addNodeType: no nodeType given');
      return false;
    }
    let halfWidth = 0;
    let halfHeight = 0;
    if (this.canvasApp?.rootElement) {
      const box = this.canvasApp?.rootElement.getBoundingClientRect();
      halfWidth = box.width / 2;
      halfHeight = box.height / 2;
    }
    const startPos = this.canvasApp?.transformCameraSpaceToWorldSpace(
      halfWidth,
      halfHeight
    );
    let startX = (startPos?.x ?? Math.floor(Math.random() * 250)) - 100;
    let startY = (startPos?.y ?? Math.floor(Math.random() * 500)) - 150;
    if (connectToNode) {
      startX = connectToNode.x + (connectToNode.width ?? 100) + 100;
      startY = connectToNode.y;
    }
    const factory = getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(this.canvasUpdated);

      const node = nodeTask.createVisualNode(this.canvasApp, startX, startY);
      if (node && node.nodeInfo) {
        node.nodeInfo.taskType = nodeType;

        if (connectToNode) {
          const connection = this.canvasApp?.createCubicBezier(
            connectToNode.x,
            connectToNode.y,
            startX,
            startY,
            connectToNode.x,
            connectToNode.y,
            startX,
            startY,
            false,
            undefined,
            undefined,
            undefined
          );
          if (connection && connection.nodeComponent) {
            connection.nodeComponent.isControlled = true;
            connection.nodeComponent.nodeInfo = {};
            connection.nodeComponent.layer = 1;

            connection.nodeComponent.startNode = connectToNode;
            connection.nodeComponent.startNodeThumb =
              getThumbNodeById<NodeInfo>(thumbId ?? '', connectToNode, {
                start: true,
                end: false,
              }) || undefined;

            connection.nodeComponent.endNode = node;
            connection.nodeComponent.endNodeThumb =
              getThumbNodeByName<NodeInfo>('', node, {
                start: false,
                end: true,
              }) || undefined;

            const connectiondStartThumbY = calculateConnectorY(
              connection.nodeComponent.startNodeThumb?.thumbType ??
                ThumbType.None,
              connection.nodeComponent.startNode?.width ?? 0,
              connection.nodeComponent.startNode?.height ?? 0,
              connection.nodeComponent.startNodeThumb?.thumbIndex,
              connection.nodeComponent.startNodeThumb
            );

            const connectiondEndThumbY = calculateConnectorY(
              connection.nodeComponent.endNodeThumb?.thumbType ??
                ThumbType.None,
              connection.nodeComponent.endNode?.width ?? 0,
              connection.nodeComponent.endNode?.height ?? 0,
              connection.nodeComponent.endNodeThumb?.thumbIndex,
              connection.nodeComponent.endNodeThumb
            );
            node.y =
              connectToNode.y + connectiondStartThumbY - connectiondEndThumbY;

            if (connectToNode) {
              connectToNode.connections?.push(connection.nodeComponent);
            }

            node.connections?.push(connection.nodeComponent);

            if (connection.nodeComponent.update) {
              connection.nodeComponent.update();
            }

            if (node.update) {
              node.update(node, node.x, node.y, node);
            }
          }
        }
        return node;
      }
    }
    return false;
  };

  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(parameter1?: any, parameter2?: any): void {
    console.log('AddNode flow-app');
    if (typeof parameter1 !== 'string') {
      return;
    }
    if (typeof parameter2 === 'string') {
      const node = this.canvasApp?.elements.get(
        parameter2
      ) as IRectNodeComponent<NodeInfo>;
      if (!node) {
        console.log('node not found in canvas');
        return;
      }
      this.showSelectNodeTypeDialog(node);

      return;
    }
    if (this.addNodeType(parameter1)) {
      this.canvasUpdated();
    }
  }

  private showSelectNodeTypeDialog(attachToNode: IRectNodeComponent<NodeInfo>) {
    const template = createTemplate(
      `
		<div class="add-node-dialog-container h-full grid">
		  <p class="row-0">Select node type</p>	
		  
		  <form cmethod="dialog" class="form row-1">
		      <div class="flex flex-col w-full add-node-select-node-type-container my-2">
			  	<select id="add-node-select-node-type" class="form-select w-full" name="nodeType">					
				</select>
			  </div>	
              <div class="flex w-full flex-row justify-end gap-2">
                <button type="submit" class="${navbarButtonWithoutMargin} m-0 form-ok">OK</button>
                <button type="button" class="${navbarButtonWithoutMargin} m-0 form-cancel mr-0">Cancel</button>
              </div>
            </form>
		</div>
	  `
    );
    const contentElement = createElementFromTemplate(template);

    const dialogElement = createElement(
      'dialog',
      {},
      this.rootElement,
      contentElement
    );

    const form = (dialogElement.domElement as HTMLElement).querySelector(
      'form'
    );
    const selectNodeTypeElement = (
      dialogElement.domElement as HTMLElement
    ).querySelector('#add-node-select-node-type') as HTMLSelectElement;
    if (!selectNodeTypeElement) {
      return;
    }
    setupTasksInDropdown(selectNodeTypeElement);

    const nodeType = selectNodeTypeElement.value;
    this.getThumbNodes(
      nodeType,
      attachToNode,
      dialogElement.domElement as HTMLElement
    );

    selectNodeTypeElement.addEventListener('change', (_event) => {
      const nodeType = selectNodeTypeElement.value;
      this.getThumbNodes(
        nodeType,
        attachToNode,
        dialogElement.domElement as HTMLElement
      );
    });
    (dialogElement.domElement as HTMLDialogElement).showModal();
    const okButton = form?.querySelector('.form-ok');
    okButton?.addEventListener('click', (event) => {
      event.preventDefault();
      const nodeType = selectNodeTypeElement.value;

      const thumbSelect = (
        dialogElement.domElement as HTMLDialogElement
      ).querySelector('.thumb-selector-container select') as HTMLSelectElement;
      const thumbId = thumbSelect?.value ?? '';
      console.log('thumbId', thumbId);
      if (this.addNodeType(nodeType, attachToNode, thumbId)) {
        this.canvasUpdated();
      }
      (dialogElement?.domElement as HTMLDialogElement).close();
    });
    const cancelButton = form?.querySelector('.form-cancel');
    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      (dialogElement?.domElement as HTMLDialogElement).close();
    });
  }
  private getThumbNodes(
    _nodeType: string,
    attachToNode: IRectNodeComponent<NodeInfo>,
    dialogElement: HTMLElement
  ) {
    const selectNodeThumbElement = dialogElement.querySelector(
      '.thumb-selector-container'
    ) as HTMLSelectElement;
    if (selectNodeThumbElement) {
      selectNodeThumbElement.remove();
    }
    const thumbs: IThumbNodeComponent<NodeInfo>[] = [];

    const template = createTemplate(
      `<div class="flex flex-col w-full thumb-selector-container my-2">
			<select id="thumb-select-node-type" class="form-select w-full" name="thumb">					
		</select>`
    );
    const thumbSelectElemetContainer = createElementFromTemplate(template);
    const thumbSelect = thumbSelectElemetContainer.querySelector(
      'select'
    ) as HTMLSelectElement;

    attachToNode.thumbConnectors?.forEach((thumb) => {
      if (thumb.thumbConnectionType === ThumbConnectionType.start) {
        thumbs.push(thumb);

        createElement(
          'option',
          {
            value: thumb.id,
          },
          thumbSelect,
          thumb.thumbName || `thumb ${thumb.thumbIndex}`
        );
      }
    });
    const selectNodeTypeElement = dialogElement.querySelector(
      '.add-node-select-node-type-container'
    ) as HTMLSelectElement;
    if (!selectNodeTypeElement) {
      return;
    }
    selectNodeTypeElement.after(thumbSelectElemetContainer);
  }
}
