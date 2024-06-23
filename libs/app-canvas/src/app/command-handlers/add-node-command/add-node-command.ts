import {
  BaseNodeInfo,
  CanvasAppInstance,
  IRectNodeComponent,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
  calculateConnectorY,
  createElement,
  getThumbNodeById,
  getThumbNodeByName,
} from '@devhelpr/visual-programming-system';
import { CommandHandler } from '../command-handler/command-handler';
import {
  createTemplate,
  createElementFromTemplate,
} from '@devhelpr/dom-components';
import { navbarButtonWithoutMargin } from '../../consts/classes';
import { ICommandContext } from '../command-context';

export class AddNodeCommand<T extends BaseNodeInfo> extends CommandHandler<T> {
  constructor(commandContext: ICommandContext<T>) {
    super(commandContext);
    this.getNodeTaskFactory = commandContext.getNodeTaskFactory;
    this.getCanvasApp = commandContext.getCanvasApp;
    this.canvasUpdated = commandContext.canvasUpdated;
    this.rootElement = commandContext.rootElement;
    this.setupTasksInDropdown = commandContext.setupTasksInDropdown;
  }
  rootElement: HTMLElement;
  getCanvasApp: () => CanvasAppInstance<T> | undefined;
  canvasUpdated: () => void;
  getNodeTaskFactory: (name: string) => NodeTaskFactory<T>;
  setupTasksInDropdown: (selectNodeTypeHTMLElement: HTMLSelectElement) => void;

  addNodeType = (
    nodeType: string,
    connectToNode?: IRectNodeComponent<T>,
    thumbId?: string,
    inputThumbName?: string
  ) => {
    const canvasApp = this.getCanvasApp();
    if (!canvasApp) {
      return;
    }
    canvasApp.resetNodeTransform();
    if (!nodeType) {
      console.log('addNodeType: no nodeType given');
      return false;
    }
    let halfWidth = 0;
    let halfHeight = 0;
    if (canvasApp.rootElement) {
      const box = canvasApp.rootElement.getBoundingClientRect();
      halfWidth = box.width / 2;
      halfHeight = box.height / 2;
    }
    const startPos = canvasApp.transformCameraSpaceToWorldSpace(
      halfWidth,
      halfHeight
    );
    let startX = (startPos?.x ?? Math.floor(Math.random() * 250)) - 100;
    let startY = (startPos?.y ?? Math.floor(Math.random() * 500)) - 150;
    if (connectToNode) {
      startX = connectToNode.x + (connectToNode.width ?? 100) + 100;
      startY = connectToNode.y;
    }
    const factory = this.getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(this.canvasUpdated, canvasApp.theme);

      const node = nodeTask.createVisualNode(canvasApp, startX, startY);
      if (node && node.nodeInfo) {
        // TODO : IMPROVE THIS
        (node.nodeInfo as any).taskType = nodeType;

        if (connectToNode) {
          const connection = canvasApp.createCubicBezier(
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
            connection.nodeComponent.nodeInfo = {} as T;
            connection.nodeComponent.layer = 1;

            connection.nodeComponent.startNode = connectToNode;
            connection.nodeComponent.startNodeThumb =
              getThumbNodeById<T>(thumbId ?? '', connectToNode, {
                start: true,
                end: false,
              }) || undefined;

            connection.nodeComponent.endNode = node;

            if (inputThumbName) {
              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<T>(inputThumbName, node, {
                  start: false,
                  end: true,
                }) || undefined;
            } else {
              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<T>('', node, {
                  start: false,
                  end: true,
                }) || undefined;
            }

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
      const node = this.getCanvasApp()?.elements.get(
        parameter2
      ) as IRectNodeComponent<T>;
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

  private showSelectNodeTypeDialog(attachToNode: IRectNodeComponent<T>) {
    const template = createTemplate(
      `
		<div class="add-node-dialog-container flex flex-col">
		  <p class="row-0">Select node type</p>	
		  
		  <form cmethod="dialog" class="form row-1">
		      <div class="flex flex-col w-full add-node-select-node-type-container my-2">
          <label for="add-node-select-node-type">Node type</label>
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
    this.setupTasksInDropdown(selectNodeTypeElement);

    const nodeType = selectNodeTypeElement.value;

    selectNodeTypeElement.addEventListener('change', (_event) => {
      const nodeType = selectNodeTypeElement.value;
      if (
        this.getThumbNodes(
          nodeType,
          attachToNode,
          dialogElement.domElement as HTMLElement
        )
      ) {
        okButton?.classList.remove('disabled');
      } else {
        okButton?.setAttribute('disabled', 'disabled');
      }
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

      const inputSelectNodeTypeElement = (
        dialogElement.domElement as HTMLDialogElement
      ).querySelector(
        '.thumb-input-selector-container select'
      ) as HTMLSelectElement;
      let inputThumbName: string | undefined = undefined;
      if (inputSelectNodeTypeElement) {
        inputThumbName = inputSelectNodeTypeElement.value;
      }

      if (this.addNodeType(nodeType, attachToNode, thumbId, inputThumbName)) {
        this.canvasUpdated();
      }
      (dialogElement?.domElement as HTMLDialogElement).close();
    });
    const cancelButton = form?.querySelector('.form-cancel');
    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      (dialogElement?.domElement as HTMLDialogElement).close();
    });

    if (
      this.getThumbNodes(
        nodeType,
        attachToNode,
        dialogElement.domElement as HTMLElement
      )
    ) {
      okButton?.classList.remove('disabled');
    } else {
      okButton?.setAttribute('disabled', 'disabled');
    }
  }
  private getThumbNodes(
    nodeType: string,
    attachToNode: IRectNodeComponent<T>,
    dialogElement: HTMLElement
  ): boolean {
    const selectNodeThumbElement =
      dialogElement.querySelector<HTMLSelectElement>(
        '.thumb-selector-container'
      );
    if (selectNodeThumbElement) {
      selectNodeThumbElement.remove();
    }

    const inputSelectNodeThumbElement =
      dialogElement.querySelector<HTMLSelectElement>(
        '.thumb-input-selector-container'
      );
    if (inputSelectNodeThumbElement) {
      inputSelectNodeThumbElement.remove();
    }

    const template = createTemplate(
      `<div class="flex flex-col w-full thumb-selector-container my-2">
         <label for="thumb-select-node-type">Output</label>
		     <select id="thumb-select-node-type" class="form-select w-full" name="thumb">					
		     </select>
      </div>`
    );
    const thumbSelectElemetContainer = createElementFromTemplate(template);
    const thumbSelect =
      thumbSelectElemetContainer.querySelector<HTMLSelectElement>('select');

    attachToNode.thumbConnectors?.forEach((thumb) => {
      if (thumb.thumbConnectionType === ThumbConnectionType.start) {
        //thumbs.push(thumb);

        createElement(
          'option',
          {
            value: thumb.id,
          },
          thumbSelect as HTMLElement,
          thumb.thumbName || `thumb ${thumb.thumbIndex}`
        );
      }
    });
    const selectNodeTypeElement =
      dialogElement.querySelector<HTMLSelectElement>(
        '.add-node-select-node-type-container'
      );
    if (!selectNodeTypeElement) {
      return false;
    }
    selectNodeTypeElement.after(thumbSelectElemetContainer);

    const factory = this.getNodeTaskFactory(nodeType);

    if (factory) {
      const canvasApp = this.getCanvasApp();
      const nodeTask = factory(this.canvasUpdated, canvasApp?.theme);
      if (nodeTask.thumbs) {
        const template = createTemplate(
          `<div class="flex flex-col w-full thumb-input-selector-container my-2">
             <label for="thumb-input-select-node-type">Input</label>
					   <select id="thumb-input-select-node-type" class="form-select w-full" name="thumb-input">					
				     </select>
          </div>`
        );
        const thumbSelectElemetContainer = createElementFromTemplate(template);
        const thumbSelect = thumbSelectElemetContainer.querySelector(
          'select'
        ) as HTMLSelectElement;
        let hasInputThumbs = false;
        nodeTask.thumbs.forEach((thumb) => {
          if (thumb.connectionType === ThumbConnectionType.end) {
            createElement(
              'option',
              {
                value: thumb.name || ``,
              },
              thumbSelect,
              thumb.name || `thumb ${thumb.thumbIndex}`
            );
            hasInputThumbs = true;
          }
        });
        if (!hasInputThumbs) {
          return false;
        }
        const selectNodeTypeElement = dialogElement.querySelector(
          '.thumb-selector-container'
        ) as HTMLSelectElement;
        if (!selectNodeTypeElement) {
          return false;
        }
        selectNodeTypeElement.after(thumbSelectElemetContainer);
        return true;
      }
    }
    return false;
  }
}
