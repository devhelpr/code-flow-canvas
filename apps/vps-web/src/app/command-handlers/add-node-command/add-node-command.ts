import {
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
  createElement,
  getSelectedNode,
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
    canvasUpdated: () => void
  ) {
    super(rootElement, canvasApp, canvasUpdated);
    this.canvasApp = canvasApp;
    this.canvasUpdated = canvasUpdated;
    this.rootElement = rootElement;
  }
  rootElement: HTMLElement;
  canvasApp: CanvasAppInstance<NodeInfo>;
  canvasUpdated: () => void;

  addNodeType = (nodeType: string) => {
    this.canvasApp?.resetNodeTransform();
    if (!nodeType) {
      console.log('addNodeType: no nodeType given');
      return;
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
    const startX = (startPos?.x ?? Math.floor(Math.random() * 250)) - 100;
    const startY = (startPos?.y ?? Math.floor(Math.random() * 500)) - 150;

    const factory = getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(this.canvasUpdated);

      const selectedNodeInfo = getSelectedNode();
      if (selectedNodeInfo) {
        let node = this.canvasApp?.elements?.get(
          selectedNodeInfo.id
        ) as INodeComponent<NodeInfo>;

        if (!node) {
          console.log('node not found in canvas'); // is the selected node in a container?
          //selectedNodeInfo.containerNode ...
          const canvasAppInstance = (
            selectedNodeInfo.containerNode?.nodeInfo as any
          )?.canvasAppInstance;
          node = canvasAppInstance?.elements?.get(
            selectedNodeInfo.id
          ) as INodeComponent<NodeInfo>;
          if (!node) {
            console.log('node not found in direct container');
            return;
          }
        }
        if (node.nodeInfo?.taskType) {
          const selectedNodeTaskFactory = getNodeTaskFactory(
            node.nodeInfo.taskType
          );
          if (node && selectedNodeTaskFactory) {
            const selectedNodeTask = selectedNodeTaskFactory(
              this.canvasUpdated
            );
            if (
              node.nodeInfo.canvasAppInstance &&
              selectedNodeTask.isContainer &&
              (selectedNodeTask.childNodeTasks ?? []).indexOf(nodeType) >= 0
            ) {
              nodeTask.createVisualNode(
                node.nodeInfo.canvasAppInstance,
                50,
                50,
                undefined,
                undefined,
                node as IRectNodeComponent<NodeInfo>,
                undefined,
                undefined,
                (node.nestedLevel ?? 0) + 1
              );

              return;
            } else if (selectedNodeTask.isContainer) {
              console.log('onClickAddNode: selectedNodeTask isContainer');
              return;
            }
          }
        }
      }
      //factory.createVisualNode(props.canvasApp, startX, startY);
      //} else if (factory) {
      //const nodeTask = factory(props.canvasUpdated);
      const node = nodeTask.createVisualNode(this.canvasApp, startX, startY);
      if (node && node.nodeInfo) {
        node.nodeInfo.taskType = nodeType;
      }
    }
  };

  // parameter1 is the nodeType
  // parameter2 is the id of a selected node
  execute(parameter1?: any, parameter2?: any): void {
    console.log('onClickAddNode flow-app');
    if (typeof parameter1 !== 'string') {
      return;
    }
    if (typeof parameter2 === 'string') {
      this.showSelectNodeTypeDialog();
      return;
    }
    this.addNodeType(parameter1);
  }

  private showSelectNodeTypeDialog() {
    const template = createTemplate(
      `
		<div class="add-node-dialog-container h-full grid">
		  <p class="row-0">Select node type</p>	
		  
		  <form cmethod="dialog" class="form row-1 grid">
		      <div class="flex flex-col w-full">
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
    ).querySelector('#add-node-select-node-type');
    if (!selectNodeTypeElement) {
      return;
    }
    setupTasksInDropdown(selectNodeTypeElement as HTMLSelectElement);
    (dialogElement.domElement as HTMLDialogElement).showModal();
    const okButton = form?.querySelector('.form-ok');
    okButton?.addEventListener('click', (event) => {
      event.preventDefault();
      const nodeType = (selectNodeTypeElement as HTMLSelectElement).value;
      this.addNodeType(nodeType);
      (dialogElement?.domElement as HTMLDialogElement).close();
    });
    const cancelButton = form?.querySelector('.form-cancel');
    cancelButton?.addEventListener('click', (event) => {
      event.preventDefault();
      (dialogElement?.domElement as HTMLDialogElement).close();
    });
  }
}
