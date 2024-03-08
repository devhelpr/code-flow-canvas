import './app.element.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import styles from '../styles.css?inline';
//import iconStyles from '../../public/icon-styles.css?inline';
import {
  createElement,
  IElementNode,
  INodeComponent,
  getSelectedNode,
  setSelectNode,
  createElementMap,
  createCanvasApp,
  CanvasAppInstance,
  IRectNodeComponent,
  createNSElement,
  Camera,
  ICommandHandler,
  IDOMElement,
  IConnectionNodeComponent,
  Composition,
  getThumbNodeByIdentifierWithinNode,
  ThumbConnectionType,
  getThumbNodeByName,
  NodeType,
  mapConnectionToFlowNode,
  mapShapeNodeToFlowNode,
  FlowNode,
  Theme,
  standardTheme,
  IThumb,
  ElementNodeMap,
} from '@devhelpr/visual-programming-system';

import {
  animatePath as _animatePath,
  animatePathFromThumb as _animatePathFromThumb,
  setCameraAnimation,
  setPositionTargetCameraAnimation,
} from './follow-path/animate-path';
import { FlowrunnerIndexedDbStorageProvider } from './storage/indexeddb-storage-provider';
import { executeCommand } from './command-handlers/register-commands';
import { getSortedNodes } from './utils/sort-nodes';
import { getStartNodes } from './utils/start-nodes';
import { GetNodeTaskFactory, RegisterComposition } from './node-task-registry';
import { BaseNodeInfo } from './types/base-node-info';
import { importToCanvas } from './storage/import-to-canvas';
import { hideElement, showElement } from './utils/show-hide-element';
import { createInputDialog } from './utils/create-input-dialog';

export class AppElement<T> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  canvas?: IElementNode<T> = undefined;
  canvasApp?: CanvasAppInstance<T> = undefined;
  currentCanvasApp?: CanvasAppInstance<T> = undefined;
  storageProvider: FlowrunnerIndexedDbStorageProvider | undefined = undefined;

  scopeNodeDomElement: HTMLElement | undefined = undefined;

  formElement: IDOMElement | undefined = undefined;
  editPopupContainer: IDOMElement | undefined = undefined;
  editPopupLineContainer: IDOMElement | undefined = undefined;
  editPopupLinePath: IDOMElement | undefined = undefined;
  editPopupLineEndPath: IDOMElement | undefined = undefined;
  editPopupEditingNodeIndicator: IDOMElement | undefined = undefined;
  selectedNodeLabel: IDOMElement | undefined = undefined;
  rootElement: HTMLElement | undefined = undefined;

  resetStateButton: IDOMElement | undefined = undefined;
  clearCanvasButton: IDOMElement | undefined = undefined;
  compositionEditButton: IDOMElement | undefined = undefined;
  compositionEditExitButton: IDOMElement | undefined = undefined;
  compositionCreateButton: IDOMElement | undefined = undefined;
  compositionNameButton: IDOMElement | undefined = undefined;

  appRootElement: Element | null;
  commandRegistry = new Map<string, ICommandHandler>();

  constructor(
    appRootSelector: string,
    customTemplate?: HTMLTemplateElement,
    theme?: Theme
  ) {
    // NOTE : on http instead of https, crypto is not available...
    // so uuid's cannot be created and the app will not work

    if (typeof crypto === 'undefined') {
      console.error(
        'NO Crypto defined ... uuid cannot be created! Are you on a http connection!?'
      );
    }
    this.appRootElement = document.querySelector(appRootSelector);
    if (!this.appRootElement) {
      return;
    }

    const template = document.createElement('template');
    template.innerHTML = `
  <div class="min-h-dvh w-full ${
    (theme ?? standardTheme).background
  } overflow-hidden touch-none" id="root" >
  </div>
`;

    this.appRootElement.appendChild(
      (customTemplate ?? template).content.cloneNode(true)
    );
    this.rootElement = this.appRootElement.querySelector(
      'div#root'
    ) as HTMLElement;
    if (!this.rootElement) {
      return;
    }

    const canvasApp = createCanvasApp<T>(
      this.rootElement,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      theme ?? standardTheme
    );
    this.canvas = canvasApp.canvas;
    this.canvasApp = canvasApp;
    this.currentCanvasApp = canvasApp;

    this.canvasApp.setOnCameraChanged(this.onCameraChanged);

    this.editPopupContainer = createElement(
      'div',
      {
        id: 'textAreaContainer',
        class:
          'absolute w-[400px] h-[380px] z-[1020] p-2 bg-slate-600 hidden overflow-auto',
        wheel: (event) => {
          event.stopPropagation();
        },
      },
      this.rootElement
    );
    this.editPopupLineContainer = createNSElement(
      'svg',
      {
        width: 0,
        height: 0,
        class:
          'absolute top-0 left-0 pointer-events-none z-[1000] hidden opacity-75',
        style: {
          width: '200px',
          height: '200px',
          filter: 'drop-shadow(rgba(0, 0, 0, 0.4) 3px 1px 2px)',
        },
      },
      this.rootElement
    );
    this.editPopupLinePath = createNSElement(
      'path',
      {
        d: 'M0 0 L200 200',
        stroke: 'white',
        'stroke-width': '3px',
        fill: 'transparent',
      },
      this.editPopupLineContainer.domElement
    );
    this.editPopupLineEndPath = createNSElement(
      'path',
      {
        d: 'M0 0 L0 0',
        stroke: 'white',
        'stroke-width': '2px',
        fill: 'transparent',
      },
      this.editPopupLineContainer.domElement
    );

    this.editPopupEditingNodeIndicator = createElement(
      'div',
      {
        class: 'absolute z-[1010] pointer-events-none',
        style: {
          filter: 'drop-shadow(rgba(0, 0, 0, 0.4) 3px 1px 2px)',
        },
      },
      this.rootElement
    );
  }

  focusedNode: IRectNodeComponent<T> | undefined = undefined;
  removeFormElement = () => {
    if (this.formElement) {
      // this.canvasApp?.deleteElementFromNode(
      //   this.editPopupContainer as INodeComponent<T>,
      //   this.formElement,
      //   true
      // );
      this.formElement.domElement.remove();
      this.formElement = undefined;
    }
    (
      this.editPopupContainer?.domElement as unknown as HTMLElement
    ).classList.add('hidden');
    (
      this.editPopupLineContainer?.domElement as unknown as HTMLElement
    ).classList.add('hidden');

    (
      this.editPopupEditingNodeIndicator?.domElement as unknown as HTMLElement
    ).classList.add('hidden');

    (
      this.editPopupEditingNodeIndicator?.domElement as unknown as HTMLElement
    ).classList.remove('editing-node-indicator');
  };

  protected run = () => {
    //
  };

  getSelectTaskElement = (): HTMLSelectElement => {
    return undefined as unknown as HTMLSelectElement;
  };

  metaKeyDown = false;

  initializeCommandHandlers = () => {
    let tabKeyWasUsed = false;

    window.addEventListener('keydown', (event) => {
      const cmdKey = 91;
      this.metaKeyDown = false;
      if (event.keyCode === cmdKey) {
        this.metaKeyDown = true;
      } else if (event.key === 'Tab') {
        tabKeyWasUsed = true;
        console.log('TAB KEY WAS USED');
        if (
          !document.activeElement ||
          document.activeElement === document.body
        ) {
          console.log('TAB KEY WAS USED but no activeElement');
          const element = document.querySelector(
            "[tabindex='1']"
          ) as HTMLElement;
          if (element) {
            element.focus();

            const id = element.getAttribute('data-node-id');
            if (id) {
              const node = this.currentCanvasApp?.elements.get(
                id
              ) as IRectNodeComponent<T>;
              if (node) {
                this.focusedNode = node;
              }
              if (node && node.x && node.y && this.currentCanvasApp) {
                console.log('focusin node found', node);
                this.setCameraTargetOnNode(node);
                this.currentCanvasApp.selectNode(node);
                this.removeFormElement();
              }
            }
          }
        } else {
          console.log(
            'TAB KEY WAS USED and activeElement found',
            document.activeElement
          );
        }
      } else {
        // this is a workaround for shift-tab... the next element which is tabbed to doesn't get focus
        if (event.key !== 'Shift') {
          tabKeyWasUsed = false;

          console.log('TAB KEY WAS NOT USED', event.key);
        }
      }

      const key = event.key.toLowerCase();
      const inInputControle =
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0;
      if (!inInputControle) {
        if (
          (event.ctrlKey || event.metaKey || this.metaKeyDown) &&
          key === 'c'
        ) {
          event.preventDefault();
          this.removeFormElement();
          const selectedNodeInfo = getSelectedNode();
          executeCommand(
            this.commandRegistry,
            'copy-node',
            this.getSelectTaskElement().value,
            selectedNodeInfo?.id
          );
          return false;
        }
        if (
          (event.ctrlKey || event.metaKey || this.metaKeyDown) &&
          key === 'v'
        ) {
          event.preventDefault();
          this.removeFormElement();
          const selectedNodeInfo = getSelectedNode();
          executeCommand(
            this.commandRegistry,
            'paste-node',
            this.getSelectTaskElement().value,
            selectedNodeInfo?.id
          );
          return false;
        }
        if (
          (event.ctrlKey || event.metaKey || this.metaKeyDown) &&
          key === 'l'
        ) {
          event.preventDefault();
          this.removeFormElement();
          const selectedNodeInfo = getSelectedNode();
          executeCommand(
            this.commandRegistry,
            'auto-align',
            this.getSelectTaskElement().value,
            selectedNodeInfo?.id
          );
          return false;
        }
      }
      return true;
    });
    window.addEventListener('keyup', (event) => {
      console.log('keyup', event.key, event.ctrlKey);
      const key = event.key.toLowerCase();
      const inInputControle =
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
          (event.target as HTMLElement)?.tagName
        ) >= 0;
      if (key === 'backspace' || key === 'delete') {
        if (inInputControle) {
          return;
        }
        this.removeFormElement();
        const selectedNodeInfo = getSelectedNode();
        if (selectedNodeInfo) {
          executeCommand(
            this.commandRegistry,
            'delete-node',
            selectedNodeInfo.id
          );
        }
      }

      if (event.key === 'insert' || (event.ctrlKey && key === 'a')) {
        this.removeFormElement();
        const selectedNodeInfo = getSelectedNode();
        executeCommand(
          this.commandRegistry,
          'add-node',
          this.getSelectTaskElement().value,
          selectedNodeInfo?.id
        );
      }

      if (event.ctrlKey && key === 'enter') {
        this.run();
      }

      if (key === 'escape') {
        const currentFocusedNode = this.focusedNode;
        this.removeFormElement();
        this.popupNode = undefined;
        if (currentFocusedNode) {
          (currentFocusedNode.domElement as HTMLElement).focus();
        }
      }

      if (event.shiftKey && key === '!') {
        if (
          ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
            (event.target as HTMLElement)?.tagName
          ) >= 0
        ) {
          return true;
        }
        if (this.currentCanvasApp) {
          event.preventDefault();
          this.currentCanvasApp.centerCamera();
          return false;
        }
      }

      if (event.ctrlKey && key === 'i') {
        console.log('ctrl + i', this.focusedNode);
        let currentFocusedNode = this.focusedNode;
        this.popupNode = this.focusedNode;
        if (this.focusedNode && this.currentCanvasApp) {
          this.currentCanvasApp.selectNode(this.focusedNode);
        } else {
          const selectedNodeInfo = getSelectedNode();
          if (selectedNodeInfo) {
            const node = this.currentCanvasApp?.elements.get(
              selectedNodeInfo.id
            ) as IRectNodeComponent<T>;
            if (node && this.currentCanvasApp) {
              this.focusedNode = node;
              this.popupNode = this.focusedNode;
              currentFocusedNode = node;
              this.currentCanvasApp.selectNode(this.focusedNode);
            }
          }
        }

        this.positionPopup(this.focusedNode as IRectNodeComponent<T>);
        const inputInPopup = document.querySelector(
          '#textAreaContainer input, #textAreaContainer textarea, #textAreaContainer select'
        );
        if (inputInPopup) {
          (inputInPopup as HTMLInputElement).focus();
        }
        if (currentFocusedNode) {
          this.focusedNode = currentFocusedNode;
        }
      }

      return true;
    });

    window.addEventListener('pointerdown', (_event) => {
      tabKeyWasUsed = false;
    });

    document.addEventListener('focusout', (_event) => {
      console.log('focusout');
      this.focusedNode = undefined;
    });
    document.addEventListener('focusin', (_event) => {
      console.log('focusin');
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
      if (this.rootElement) {
        this.rootElement.scrollTop = 0;
        this.rootElement.scrollLeft = 0;
      }
      const activeElement = document.activeElement;
      if (activeElement && tabKeyWasUsed) {
        const closestRectNode = activeElement.closest('.rect-node');
        if (closestRectNode) {
          const id = closestRectNode.getAttribute('data-node-id');
          if (id) {
            const node = this.currentCanvasApp?.elements.get(
              id
            ) as IRectNodeComponent<T>;
            if (node) {
              this.focusedNode = node;
            }
            if (node && node.x && node.y && this.currentCanvasApp) {
              console.log('focusin node found', node);
              this.setCameraTargetOnNode(node);
              this.currentCanvasApp.selectNode(node);
              this.removeFormElement();
            }
          }
        }
      } else {
        console.log(
          'FOCUSIN activeElement not found or tabKeyWasUsed is false',
          tabKeyWasUsed
        );
      }
      tabKeyWasUsed = false;
    });
  };

  setCameraTargetOnNode = (_node: IRectNodeComponent<T>) => {
    //
  };

  onPreRemoveElement = (_element: IElementNode<T>) => {
    //
  };

  removeElement = (element: IElementNode<T>) => {
    this.onPreRemoveElement(element);
    element.domElement.remove();
    const node = element as unknown as INodeComponent<T>;
    if (node && node.delete) {
      node.delete();
    }
    if (element.elements) {
      element.elements.forEach((element: IElementNode<T>) => {
        this.removeElement(element as unknown as IElementNode<T>);
      });
      element.elements = createElementMap<T>();
    }
  };
  onPreclearCanvas = () => {
    //
  };

  protected clearCanvas = () => {
    this.onPreclearCanvas();
    setSelectNode(undefined);
    this.currentCanvasApp?.resetNodeTransform();
    this.currentCanvasApp?.elements.forEach((element) => {
      element.domElement.remove();
      this.removeElement(element);
    });
    this.currentCanvasApp?.elements.clear();
    this.currentCanvasApp?.compositons.clearCompositions();
    this.currentCanvasApp?.setCamera(0, 0, 1);
  };

  onShouldPositionPopup = (_node: IRectNodeComponent<T>) => {
    return true;
  };

  onCameraChanged = (_camera: Camera) => {
    const selectedNodeInfo = getSelectedNode();

    if (selectedNodeInfo) {
      // TODO : improve this (nodeInfo reference) .. and move it to event handled by FlowApp
      // .. or add canvasAppInstance to containerNode (INodeComponent)
      const node = (
        selectedNodeInfo?.containerNode
          ? selectedNodeInfo?.containerNode?.canvasAppInstance?.elements
          : this.currentCanvasApp?.elements
      )?.get(selectedNodeInfo.id);

      if (!node) {
        return;
      }

      if (this.onShouldPositionPopup(node as IRectNodeComponent<T>)) {
        this.positionPopup(node as IRectNodeComponent<T>);
      }
    }
  };

  popupNode: IRectNodeComponent<T> | undefined = undefined;
  positionPopup = (_node: IRectNodeComponent<T>) => {
    if (!this.popupNode) {
      return;
    }
    (
      this.editPopupContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');
    (
      this.editPopupLineContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');

    const sidebar = this.editPopupContainer
      ?.domElement as unknown as HTMLElement;
    const nodeComponent = this.popupNode as INodeComponent<T>;

    let parentX = 0;
    let parentY = 0;
    if (this.popupNode.containerNode) {
      if (
        this.popupNode.containerNode &&
        this.popupNode.containerNode?.getParentedCoordinates
      ) {
        const parentCoordinates =
          this.popupNode.containerNode?.getParentedCoordinates() ?? {
            x: 0,
            y: 0,
          };

        parentX = parentCoordinates.x;
        parentY = parentCoordinates.y;
      }
    }
    const camera = this.currentCanvasApp?.getCamera();

    const xCamera = camera?.x ?? 0;
    const yCamera = camera?.y ?? 0;
    const scaleCamera = camera?.scale ?? 1;
    const xNode = parentX + nodeComponent.x ?? 0;
    const yNode = parentY + nodeComponent.y ?? 0;
    const widthNode = nodeComponent.width ?? 0;
    const heightNode = nodeComponent.height ?? 0;

    const rootClientRect = this.rootElement?.getBoundingClientRect();
    let x = xCamera + xNode * scaleCamera + widthNode * scaleCamera + 100;
    if (x < 10) {
      x = 10;
    }
    if (x + 400 - 10 > (rootClientRect?.width ?? 0)) {
      x = (rootClientRect?.width ?? 0) - 400 - 10;
    }
    let y = yCamera + yNode * scaleCamera;
    if (y < 50) {
      y = 50;
    }
    if (y + 380 > (rootClientRect?.height ?? 0) - 80) {
      y = (rootClientRect?.height ?? 0) - 380 - 80;
    }

    sidebar.style.left = `${x}px`;
    sidebar.style.top = `${y}px`;

    const lineContainer = this.editPopupLineContainer
      ?.domElement as unknown as HTMLElement;

    const xLine = xCamera + xNode * scaleCamera + (widthNode / 2) * scaleCamera;
    lineContainer.style.left = `${xLine}px`;

    const centerNodeY =
      yCamera + yNode * scaleCamera + (heightNode / 2) * scaleCamera;
    const yLine = centerNodeY - heightNode * scaleCamera;

    lineContainer.style.top = `${y < yLine ? y : yLine}px`;
    lineContainer.style.width = `${x - xLine < 0 ? xLine - x : x - xLine}px`;
    lineContainer.style.height = `${1000}px`; // heightNode * scaleCamera

    const indicatorElement = this.editPopupEditingNodeIndicator
      ?.domElement as unknown as HTMLElement;
    indicatorElement.style.left = `${
      xCamera + xNode * scaleCamera + (widthNode / 2) * scaleCamera
    }px`;
    indicatorElement.style.top = `${centerNodeY}px`;
    indicatorElement.classList.remove('hidden');
    indicatorElement.classList.add('editing-node-indicator');

    (this.editPopupLinePath?.domElement as SVGPathElement).setAttribute(
      'd',
      `M0 ${(y < yLine ? yLine - y : 0) + heightNode * scaleCamera} 
       L${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170
      }`
    );

    (this.editPopupLineEndPath?.domElement as SVGPathElement).setAttribute(
      'd',
      `M${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170 - 5
      }
      L${(x - xLine < 0 ? xLine - x : x - xLine) - 5} ${
        (yLine < y ? y - yLine : 0) + 170 + 5
      }`
    );
  };

  setTabOrderForNode = (
    node: IRectNodeComponent<T>,
    incomingTabIndex: number,
    wasVisited: Map<string, boolean>
  ) => {
    let tabIndex = incomingTabIndex;
    if (wasVisited.has(node.id)) {
      return tabIndex;
    }
    if (node && node.domElement) {
      (node.domElement as HTMLElement).setAttribute(
        'tabindex',
        tabIndex.toString()
      );
      tabIndex++;
      wasVisited.set(node.id, true);
      const inputs = (node.domElement as HTMLElement).querySelectorAll('input');
      inputs.forEach((element, _index) => {
        (element as HTMLElement).setAttribute('tabindex', tabIndex.toString());
        tabIndex++;
      });

      if (node.connections) {
        (node.connections as any)
          .toSorted(
            (
              aConnection: IConnectionNodeComponent<T>,
              bConnection: IConnectionNodeComponent<T>
            ) => {
              // instead of tbumbs .. use the connection start and position?

              const aHelper = `${Math.floor(aConnection.y)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(aConnection.x)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(aConnection.endY)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(aConnection.endX)
                .toFixed(2)
                .padStart(8, '0')}`;
              const bHelper = `${Math.floor(bConnection.y)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(bConnection.x)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(bConnection.endY)
                .toFixed(2)
                .padStart(8, '0')}_${Math.floor(bConnection.endX)
                .toFixed(2)
                .padStart(8, '0')}`;
              if (aHelper < bHelper) {
                return -1;
              }
              if (aHelper > bHelper) {
                return 1;
              }

              return 0;
            }
          )
          .forEach((connection: IConnectionNodeComponent<T>) => {
            if (connection.startNode?.id === node.id && connection.endNode) {
              if (wasVisited.has(connection.endNode.id)) {
                return;
              }
              tabIndex = this.setTabOrderForNode(
                connection.endNode,
                tabIndex,
                wasVisited
              );
            }
          });
      }
    }
    return tabIndex;
  };

  setTabOrderOfNodes = () => {
    if (!this.currentCanvasApp) {
      return;
    }
    const nodes = getSortedNodes(
      getStartNodes(this.currentCanvasApp.elements, true)
    ) as IRectNodeComponent<T>[];

    nodes.sort((a: IRectNodeComponent<T>, b: IRectNodeComponent<T>) => {
      const aNodeInfo = a.nodeInfo as any;
      const bNodeInfo = b.nodeInfo as any;

      if (
        aNodeInfo.type !== 'node-trigger-target' &&
        aNodeInfo.type !== 'function' &&
        (bNodeInfo.type === 'node-trigger-target' ||
          bNodeInfo.type === 'function')
      ) {
        return -1;
      }
      if (
        bNodeInfo.type !== 'node-trigger-target' &&
        bNodeInfo.type !== 'function' &&
        (aNodeInfo.type === 'node-trigger-target' ||
          aNodeInfo.type === 'function')
      ) {
        return 1;
      }

      if (
        aNodeInfo.type !== 'uv-node' &&
        aNodeInfo.type !== 'time-node' &&
        (bNodeInfo.type === 'uv-node' || bNodeInfo.type === 'time-node')
      ) {
        return 1;
      }
      if (
        bNodeInfo.type !== 'uv-node' &&
        bNodeInfo.type !== 'time-node' &&
        (aNodeInfo.type === 'uv-node' || aNodeInfo.type === 'time-node')
      ) {
        return -1;
      }
      return 0;
    });
    console.log('tab nodes', nodes);
    let tabIndex = 1;
    const wasVisited = new Map<string, boolean>();
    nodes.forEach((node: IRectNodeComponent<T>, _index: number) => {
      tabIndex = this.setTabOrderForNode(node, tabIndex, wasVisited);

      tabIndex++;
    });
  };
  onAddComposition = (
    composition: Composition<T>,
    connections: {
      thumbIdentifierWithinNode: string;
      connection: IConnectionNodeComponent<T>;
    }[],
    registerComposition: RegisterComposition<T>,
    getNodeTaskFactory: GetNodeTaskFactory<T>,
    setupTasksInDropdown: (
      selectNodeTypeHTMLElement: HTMLSelectElement,
      isComposition?: boolean,
      compositionId?: string
    ) => void,
    selectNodeTypeHTMLElement: HTMLSelectElement
  ) => {
    if (!this.currentCanvasApp) {
      return;
    }
    console.log('REGISTER COMPOSITION', composition);
    registerComposition(composition);

    const nodeType = `composition-${composition.id}`;

    let minX = -1;
    let minY = -1;
    let maxX = -1;
    let maxY = -1;
    composition.nodes.forEach((node) => {
      if (node.x < minX || minX === -1) {
        minX = node.x;
      }
      if (node.y < minY || minY === -1) {
        minY = node.y;
      }
      if (node.x + (node.width ?? 0) > maxX || maxX === -1) {
        maxX = node.x;
      }
      if (node.y + (node.height ?? 0) > maxY || maxY === -1) {
        maxY = node.y;
      }
    });
    minX = minX === -1 ? minX : composition.nodes[0]?.x ?? 0;
    minY = minY === -1 ? minY : composition.nodes[0]?.y ?? 0;
    const x = (minX + maxX) / 2 - 100;
    const y = (minY + maxY) / 2 - 100;

    const factory = getNodeTaskFactory(nodeType);

    if (factory) {
      const nodeTask = factory(() => undefined);

      const node = nodeTask.createVisualNode(
        this.currentCanvasApp,
        x,
        y,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          isComposition: true,
        }
      );
      if (node && node.nodeInfo) {
        // TODO : IMPROVE THIS
        (node.nodeInfo as any).taskType = nodeType;
      }

      connections.forEach((connection) => {
        if (!connection.connection.startNode) {
          connection.connection.startNode = node;

          connection.connection.startNodeThumb =
            getThumbNodeByIdentifierWithinNode<T>(
              connection.thumbIdentifierWithinNode,
              node,
              {
                start: true,
                end: false,
              }
            ) || undefined;

          node.connections.push(connection.connection);
          connection.connection.update?.();
        }
        if (!connection.connection.endNode) {
          connection.connection.endNode = node;

          connection.connection.endNodeThumb =
            getThumbNodeByIdentifierWithinNode<T>(
              connection.thumbIdentifierWithinNode,
              node,
              {
                start: false,
                end: true,
              }
            ) || undefined;
          node.connections.push(connection.connection);
          connection.connection.update?.();
        }
      });

      node?.update?.();
      setupTasksInDropdown(selectNodeTypeHTMLElement, true, composition.id);
    }
  };

  compositionUnderEdit: Composition<T> | undefined = undefined;

  addThumbToComposition = (
    canvasApp: CanvasAppInstance<T>,
    compositionId: string,
    thumb: IThumb
  ) => {
    canvasApp.elements.forEach((element) => {
      const node = element as IRectNodeComponent<T>;
      const nodeInfo = node.nodeInfo as BaseNodeInfo;
      if (
        nodeInfo?.isComposition &&
        nodeInfo?.compositionId === compositionId
      ) {
        ///
        canvasApp?.addThumbToNode(thumb, node);
      } else if ((node.nodeInfo as any)?.canvasAppInstance) {
        this.addThumbToComposition(
          (node.nodeInfo as any)?.canvasAppInstance,
          compositionId,
          thumb
        );
      }
    });
  };

  deleteThumbFromComposition = (
    canvasApp: CanvasAppInstance<T>,
    compositionId: string,
    thumb: IThumb
  ) => {
    canvasApp.elements.forEach((element) => {
      const node = element as IRectNodeComponent<T>;
      const nodeInfo = node.nodeInfo as BaseNodeInfo;
      if (
        nodeInfo?.isComposition &&
        nodeInfo?.compositionId === compositionId
      ) {
        ///
        canvasApp?.deleteThumbNode(thumb, node);
      } else if ((node.nodeInfo as any)?.canvasAppInstance) {
        this.deleteThumbFromComposition(
          (node.nodeInfo as any)?.canvasAppInstance,
          compositionId,
          thumb
        );
      }
    });
  };

  editComposition = (
    getNodeTaskFactory: GetNodeTaskFactory<T>,
    canvasUpdated: () => void,
    setupTasksInDropdown: (
      selectNodeTypeHTMLElement: HTMLSelectElement,
      isComposition?: boolean,
      compositionId?: string
    ) => void,
    selectNodeTypeHTMLElement: HTMLSelectElement
  ) => {
    /*
       enable editing and add thumbs

       - (TODO) thumb-nodes should have a form field for editing the type
         (types depend on flow type : GL and flow differ)

          - after modifying the types... the thumbs and connections should be updated

       - after editing (exit edit-mode) :

          - update all compositions on all canvases (containers as well) :

            - check if existing thumbs still match the connected nodes (via thumbConstraint) on the canvas 
              .. and if not: disconnect the nodes



        Later : 
        - allow adding composition nodes to composition and prevent infinite loops during execution
            (in a child composition , a composition which is called , which is also a parent or ancestor of the current composition will cause an infinite loop)
        - (done) allow naming composition and show name
        - create composition from scratch
        - allow edit of composition node-color
        
    */
    const selectedNodeInfo = getSelectedNode();
    if (!selectedNodeInfo) {
      return;
    }

    hideElement(this.compositionCreateButton);

    const node = (
      selectedNodeInfo?.containerNode
        ? (selectedNodeInfo?.containerNode?.nodeInfo as any)?.canvasAppInstance
            ?.elements
        : this.currentCanvasApp?.elements
    )?.get(selectedNodeInfo.id);

    if (!node) {
      return;
    }

    if (
      node.nodeInfo?.isComposition &&
      this.rootElement &&
      node.nodeInfo.compositionId
    ) {
      hideElement(this.compositionEditButton);
      showElement(this.compositionEditExitButton);
      showElement(this.clearCanvasButton);
      showElement(this.resetStateButton);
      showElement(this.compositionNameButton);

      this.currentCanvasApp?.setDisableInteraction(true);

      hideElement(this.canvas);

      (this.canvas?.domElement as HTMLElement).classList.add(
        'pointer-events-none'
      );
      const composition = this.currentCanvasApp?.compositons?.getComposition(
        node.nodeInfo.compositionId
      );
      if (!composition) {
        return;
      }
      this.compositionUnderEdit = composition;
      this.currentCanvasApp?.setIsCameraFollowingPaused(true);

      const canvasApp = createCanvasApp<T>(
        this.rootElement,
        undefined,
        undefined,
        undefined,
        undefined,
        'composition-canvas-' + node.nodeInfo.compositionId
      );
      if (canvasApp) {
        canvasApp.isComposition = true;
      }
      canvasApp?.setCamera(0, 0, 1);
      this.currentCanvasApp = canvasApp;
      importToCanvas(
        composition.nodes as FlowNode<BaseNodeInfo>[],
        canvasApp as unknown as CanvasAppInstance<BaseNodeInfo>,
        () => {
          //
        },
        undefined,
        0,
        getNodeTaskFactory
      );

      let minX = -1;
      let minY = -1;
      let maxX = -1;
      let maxY = -1;
      composition.nodes.forEach((node) => {
        if (node.x < minX || minX === -1) {
          minX = node.x;
        }
        if (node.y < minY || minY === -1) {
          minY = node.y;
        }
        if (node.x + (node.width ?? 0) > maxX || maxX === -1) {
          maxX = node.x;
          +(node.width ?? 0);
        }
        if (node.y + (node.height ?? 0) > maxY || maxY === -1) {
          maxY = node.y + (node.height ?? 0);
        }
      });

      minX -= 300;
      maxX += 300;

      const nodesIdsToIgnore: string[] = [];

      let yIndex = 0;

      const createdThumbsIds: {
        id: string;
        thumbIdentifierWithInNode: string;
        thumb: IThumb;
      }[] = [];
      // inputs
      composition.thumbs?.forEach((thumb, _index) => {
        if (thumb.connectionType === ThumbConnectionType.end && thumb.nodeId) {
          const factory = getNodeTaskFactory('thumb-input');
          const node = canvasApp?.elements.get(
            thumb.nodeId
          ) as IRectNodeComponent<T>;
          if (factory && node && thumb.name) {
            const nodeTask = factory(() => {
              //
            }, canvasApp.theme);
            nodeTask.setTitle?.(thumb.name);
            const thumbInput = nodeTask.createVisualNode(
              canvasApp,
              minX - 100,
              minY - 100 + yIndex * 200,
              undefined,
              {
                valueType: thumb.thumbConstraint,
              }
            );
            nodesIdsToIgnore.push(thumbInput.id);
            createdThumbsIds.push({
              id: thumbInput.id,
              thumbIdentifierWithInNode: thumb.thumbIdentifierWithinNode ?? '',
              thumb,
            });
            const connection = canvasApp.createCubicBezier(
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              thumbInput.x,
              thumbInput.y,
              false,
              undefined,
              undefined,
              undefined
            );
            if (connection && connection.nodeComponent) {
              nodesIdsToIgnore.push(connection.nodeComponent.id);
              connection.nodeComponent.isControlled = true;
              connection.nodeComponent.nodeInfo = {} as T;
              connection.nodeComponent.layer = 1;

              connection.nodeComponent.startNode = thumbInput;
              connection.nodeComponent.startNodeThumb =
                getThumbNodeByName<T>('output', thumbInput, {
                  start: true,
                  end: false,
                }) || undefined;

              connection.nodeComponent.endNode = node;

              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<T>(thumb.name, node, {
                  start: false,
                  end: true,
                }) || undefined;
              console.log(
                'thumb-input endThumb',
                connection.nodeComponent.endNodeThumb
              );

              thumbInput.connections?.push(connection.nodeComponent);
              node.connections?.push(connection.nodeComponent);

              if (connection.nodeComponent.update) {
                connection.nodeComponent.update();
              }

              if (thumbInput.update) {
                thumbInput.update(
                  thumbInput,
                  thumbInput.x,
                  thumbInput.y,
                  thumbInput
                );
              }

              if (node.update) {
                node.update(node, node.x, node.y, node);
              }
            }
            yIndex++;
          }
        }
      });

      yIndex = 0;
      // outputs
      composition.thumbs?.forEach((thumb, _index) => {
        if (
          thumb.nodeId &&
          thumb.connectionType === ThumbConnectionType.start
        ) {
          const node = canvasApp?.elements.get(
            thumb.nodeId
          ) as IRectNodeComponent<T>;
          const factory = getNodeTaskFactory('thumb-output');
          if (factory && node && thumb.name) {
            const nodeTask = factory(() => {
              //
            }, canvasApp.theme);
            const thumbOutput = nodeTask.createVisualNode(
              canvasApp,
              maxX + 100,
              minY - 100 + yIndex * 200,
              undefined,
              {
                valueType: thumb.thumbConstraint,
              }
            );

            nodesIdsToIgnore.push(thumbOutput.id);
            createdThumbsIds.push({
              id: thumbOutput.id,
              thumbIdentifierWithInNode: thumb.thumbIdentifierWithinNode ?? '',
              thumb,
            });

            const connection = canvasApp.createCubicBezier(
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              thumbOutput.x,
              thumbOutput.y,
              false,
              undefined,
              undefined,
              undefined
            );
            if (connection && connection.nodeComponent) {
              nodesIdsToIgnore.push(connection.nodeComponent.id);
              connection.nodeComponent.isControlled = true;
              connection.nodeComponent.nodeInfo = {} as T;
              connection.nodeComponent.layer = 1;

              connection.nodeComponent.startNode = node;

              connection.nodeComponent.startNodeThumb =
                getThumbNodeByName<T>(thumb.name, node, {
                  start: true,
                  end: false,
                }) || undefined;

              connection.nodeComponent.endNode = thumbOutput;
              connection.nodeComponent.endNodeThumb =
                getThumbNodeByName<T>('input', thumbOutput, {
                  start: true,
                  end: false,
                }) || undefined;

              thumbOutput.connections?.push(connection.nodeComponent);
              node.connections?.push(connection.nodeComponent);

              if (connection.nodeComponent.update) {
                connection.nodeComponent.update();
              }

              if (thumbOutput.update) {
                thumbOutput.update(
                  thumbOutput,
                  thumbOutput.x,
                  thumbOutput.y,
                  thumbOutput
                );
              }

              if (node.update) {
                node.update(node, node.x, node.y, node);
              }
              yIndex++;
            }
          }
        }
      });

      setSelectNode(undefined);
      this.canvasApp?.nodeTransformer.detachNode();

      const quitCameraSubscribtion = setCameraAnimation(canvasApp);
      canvasApp.setOnWheelEvent((x: number, y: number, scale: number) => {
        setPositionTargetCameraAnimation(x, y, scale);
      });
      canvasApp.setonDragCanvasEvent((x, y) => {
        setPositionTargetCameraAnimation(x, y);
      });

      canvasApp.centerCamera();

      setupTasksInDropdown(selectNodeTypeHTMLElement, true, composition.id);

      const handler = () => {
        quitCameraSubscribtion();

        showElement(this.canvas);
        this.canvasApp?.centerCamera();

        // TODO :
        // - get new thumbs here and add to nodeIgnore list
        //

        let thumbInputIndex = -1;
        let thumbOutputIndex = -1;
        composition.thumbs.forEach((thumb) => {
          if (thumb.connectionType === ThumbConnectionType.end) {
            if (thumb.thumbIndex > thumbInputIndex || thumbInputIndex === -1) {
              thumbInputIndex = thumb.thumbIndex;
            }
          }
          if (thumb.connectionType === ThumbConnectionType.start) {
            if (
              thumb.thumbIndex > thumbOutputIndex ||
              thumbOutputIndex === -1
            ) {
              thumbOutputIndex = thumb.thumbIndex;
            }
          }
        });
        const thumbsOnCanvas: { nodeInfo: BaseNodeInfo; id: string }[] = [];
        canvasApp?.elements.forEach((element) => {
          const nodeHelper = element as unknown as IRectNodeComponent<T>;
          const baseNodeInfo = nodeHelper.nodeInfo as BaseNodeInfo;
          if (
            baseNodeInfo?.type === 'thumb-input' ||
            baseNodeInfo?.type === 'thumb-output'
          ) {
            thumbsOnCanvas.push({ id: element.id, nodeInfo: baseNodeInfo });

            if (nodesIdsToIgnore.indexOf(element.id) < 0) {
              // new thumbs
              nodesIdsToIgnore.push(element.id);

              if (baseNodeInfo?.type === 'thumb-input') {
                const connection = nodeHelper.connections?.find(
                  (connection) => connection.startNode === nodeHelper
                );

                const connectedToNode = nodeHelper.connections?.find(
                  (connection) => connection.startNode === nodeHelper
                )?.endNode;
                if (connection && connectedToNode) {
                  nodesIdsToIgnore.push(connection.id);
                  thumbInputIndex++;
                  const thumb: IThumb = {
                    thumbIndex: thumbInputIndex,
                    thumbType: 'EndConnectorLeft',
                    connectionType: ThumbConnectionType.end,
                    label: ' ',
                    name: connection?.endNodeThumb?.thumbName ?? '',
                    prefixIcon: '',
                    thumbConstraint:
                      connection?.startNodeThumb?.thumbConstraint ?? 'value',
                    color: 'white',
                    prefixLabel:
                      connection?.endNode?.label ??
                      connection?.startNodeThumb?.thumbConstraint?.toString() ??
                      '',
                    thumbIdentifierWithinNode: crypto.randomUUID(),
                    nodeId: connectedToNode?.id,
                    maxConnections: 1,
                  };
                  composition.thumbs.push(thumb);
                  if (!composition.inputNodes) {
                    composition.inputNodes = [];
                  }
                  composition.inputNodes.push(
                    mapShapeNodeToFlowNode(connectedToNode)
                  );
                  if (this.canvasApp) {
                    this.addThumbToComposition(
                      this.canvasApp,
                      composition.id,
                      thumb
                    );
                  }
                }
              } else if (baseNodeInfo?.type === 'thumb-output') {
                const connection = nodeHelper.connections?.find(
                  (connection) => connection.endNode === nodeHelper
                );

                const connectedToNode = nodeHelper.connections?.find(
                  (connection) => connection.endNode === nodeHelper
                )?.startNode;
                if (connection && connectedToNode) {
                  nodesIdsToIgnore.push(connection.id);
                  thumbOutputIndex++;
                  const thumb: IThumb = {
                    thumbIndex: thumbOutputIndex,
                    thumbType: 'StartConnectorRight',
                    connectionType: ThumbConnectionType.start,
                    label: ' ',
                    name: connection?.startNodeThumb?.thumbName ?? '',
                    prefixIcon: '',
                    thumbConstraint:
                      connection?.endNodeThumb?.thumbConstraint ?? 'value',
                    color: 'white',
                    prefixLabel:
                      connection?.startNode?.label ??
                      connection?.endNodeThumb?.thumbConstraint?.toString() ??
                      '',
                    thumbIdentifierWithinNode: crypto.randomUUID(),
                    nodeId: connectedToNode?.id,
                    maxConnections: 1,
                  };
                  composition.thumbs.push(thumb);
                  if (!composition.outputNodes) {
                    composition.outputNodes = [];
                  }
                  composition.outputNodes.push(
                    mapShapeNodeToFlowNode(connectedToNode)
                  );
                  if (this.canvasApp) {
                    this.addThumbToComposition(
                      this.canvasApp,
                      composition.id,
                      thumb
                    );
                  }
                }
              }
            }
          }
        });

        createdThumbsIds.forEach((thumbInfo) => {
          // remove thumbs that are not on the canvas
          const index = thumbsOnCanvas.findIndex(
            (thumb) => thumb.id === thumbInfo.id
          );
          if (
            index < 0 &&
            this.canvasApp &&
            composition.inputNodes &&
            composition.outputNodes
          ) {
            // thumb was removed
            this.deleteThumbFromComposition(
              this.canvasApp,
              composition.id,
              thumbInfo.thumb
            );
            if (thumbInfo.thumb.connectionType === ThumbConnectionType.end) {
              composition.inputNodes = composition.inputNodes.filter(
                (node) => node.id !== thumbInfo.thumb.nodeId
              );
            }
            if (thumbInfo.thumb.connectionType === ThumbConnectionType.start) {
              composition.outputNodes = composition.outputNodes.filter(
                (node) => node.id !== thumbInfo.thumb.nodeId
              );
            }

            composition.thumbs = composition.thumbs.filter(
              (thumb) =>
                thumb.thumbIdentifierWithinNode !==
                thumbInfo.thumbIdentifierWithInNode
            );
          }
        });

        canvasApp?.elements.forEach((element) => {
          if (nodesIdsToIgnore.indexOf(element.id) >= 0) {
            const nodeHelper = element as unknown as INodeComponent<T>;
            if (nodeHelper.nodeType === NodeType.Connection) {
              const connectionHelper =
                element as unknown as IConnectionNodeComponent<T>;
              if (connectionHelper.startNode) {
                connectionHelper.startNode.connections =
                  connectionHelper.startNode?.connections?.filter(
                    (c) => c.id !== connectionHelper.id
                  );
              }
              if (connectionHelper.endNode) {
                connectionHelper.endNode.connections =
                  connectionHelper.endNode?.connections?.filter(
                    (c) => c.id !== connectionHelper.id
                  );
              }
            }

            element.domElement.remove();
            this.removeElement(element);
          }
        });
        nodesIdsToIgnore.forEach((id) => {
          canvasApp?.elements.delete(id);
        });

        // store changes to composition
        const nodesToStore = Array.from(canvasApp?.elements).map((element) => {
          const nodeToToConvert = element[1] as unknown as INodeComponent<T>;
          if (nodeToToConvert.nodeType === NodeType.Connection) {
            return mapConnectionToFlowNode(
              nodeToToConvert as IConnectionNodeComponent<T>
            );
          } else {
            return mapShapeNodeToFlowNode(
              nodeToToConvert as IRectNodeComponent<T>
            );
          }
        });
        composition.nodes = nodesToStore;
        this.canvasApp?.compositons.setComposition(composition);

        // remove and cleanup temp canvas
        canvasApp?.elements.forEach((element) => {
          element.domElement.remove();
          this.removeElement(element);
        });
        canvasApp?.elements.clear();
        canvasApp?.setDisableInteraction(true);
        canvasApp.removeEvents();
        canvasApp.canvas?.domElement.remove();

        this.currentCanvasApp = this.canvasApp;
        const nodes = (
          this.canvasApp?.canvas?.domElement as HTMLElement
        ).querySelectorAll(
          `[data-node-type="composition-${composition.id}"] .node-top-label`
        );
        nodes.forEach((node) => {
          (node as HTMLElement).innerHTML = composition.name.replace('^2', '²');
        });

        // initialize composition nodes (recursively for container nodes as well)
        const initializeCompute = (elements: ElementNodeMap<T>) => {
          elements.forEach((element) => {
            const node = element as INodeComponent<T>;
            if ((node.nodeInfo as BaseNodeInfo)?.isComposition) {
              (node.nodeInfo as BaseNodeInfo)?.initializeCompute?.();
            } else if ((node.nodeInfo as any)?.canvasAppInstance) {
              if (this.currentCanvasApp?.compositons) {
                (
                  (node.nodeInfo as any)
                    .canvasAppInstance as unknown as CanvasAppInstance<T>
                ).compositons = this.currentCanvasApp?.compositons;
              }
              initializeCompute(
                (
                  (node.nodeInfo as any)
                    .canvasAppInstance as CanvasAppInstance<T>
                ).elements
              );
            }
          });
        };
        if (this.currentCanvasApp?.elements) {
          initializeCompute(this.currentCanvasApp?.elements);
        }

        (this.canvas?.domElement as HTMLElement).classList.remove(
          'pointer-events-none'
        );
        this.currentCanvasApp?.setIsCameraFollowingPaused(false);
        this.currentCanvasApp?.setDisableInteraction(false);
        this.currentCanvasApp?.centerCamera();

        canvasUpdated();

        (
          this.compositionEditExitButton?.domElement as HTMLElement
        ).removeEventListener('click', handler);

        showElement(this.compositionCreateButton);
        showElement(this.clearCanvasButton);
        showElement(this.resetStateButton);
        hideElement(this.compositionEditExitButton);
        hideElement(this.compositionNameButton);

        this.compositionUnderEdit = undefined;
        setupTasksInDropdown(selectNodeTypeHTMLElement, false);
      };
      (
        this.compositionEditExitButton?.domElement as HTMLElement
      ).addEventListener('click', handler);
      //
    }
  };

  createFlowComposition() {
    if (!this.rootElement) {
      return;
    }

    createInputDialog(this.rootElement, 'New composition name', '', (name) => {
      if (this.canvasApp?.compositons?.doesCompositionNameExist(name)) {
        return {
          valid: false,
          message: `Composition with name "${name}" already exists`,
        };
      }
      return {
        valid: true,
      };
    }).then((name) => {
      if (name && this.canvasApp) {
        const composition: Composition<T> = {
          id: crypto.randomUUID(),
          name: name,
          nodes: [],
          thumbs: [],
          inputNodes: [],
          outputNodes: [],
        };
        this.canvasApp.compositons.addComposition(composition);
        this.canvasApp.addComposition(composition);
      }
    });
  }

  editCompositionName() {
    if (!this.rootElement || !this.compositionUnderEdit) {
      return;
    }

    createInputDialog(
      this.rootElement,
      'Composition name',
      this.compositionUnderEdit.name,
      (name) => {
        if (this.canvasApp?.compositons?.doesCompositionNameExist(name)) {
          return {
            valid: false,
            message: `Composition with name "${name}" already exists`,
          };
        }
        return {
          valid: true,
        };
      }
    ).then((name) => {
      if (name && this.compositionUnderEdit) {
        this.compositionUnderEdit.name = name;
      }
    });
  }
}
