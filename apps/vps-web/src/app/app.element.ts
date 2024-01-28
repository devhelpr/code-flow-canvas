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
  ElementNodeMap,
  NodeType,
} from '@devhelpr/visual-programming-system';

import {
  animatePath as _animatePath,
  animatePathFromThumb as _animatePathFromThumb,
} from './follow-path/animate-path';
import { FlowrunnerIndexedDbStorageProvider } from './storage/indexeddb-storage-provider';
import { executeCommand } from './command-handlers/register-commands';

const template = document.createElement('template');
template.innerHTML = `
  <div class="min-h-dvh w-full bg-slate-800 overflow-hidden touch-none" id="root" >
  </div>
`;

export class AppElement<T> {
  public static observedAttributes = [];

  onclick = (_ev: MouseEvent) => {
    alert('clicked');
  };

  isStoring = false;

  canvas?: IElementNode<T> = undefined;
  canvasApp?: CanvasAppInstance<T> = undefined;
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

  appRootElement: Element | null;
  commandRegistry = new Map<string, ICommandHandler>();

  constructor(appRootSelector: string, customTemplate?: HTMLTemplateElement) {
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
    this.appRootElement.appendChild(
      (customTemplate ?? template).content.cloneNode(true)
    );
    this.rootElement = this.appRootElement.querySelector(
      'div#root'
    ) as HTMLElement;
    if (!this.rootElement) {
      return;
    }

    const canvasApp = createCanvasApp<T>(this.rootElement);
    this.canvas = canvasApp.canvas;
    this.canvasApp = canvasApp;

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

  initializeCommandHandlers = () => {
    let tabKeyWasUsed = false;

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        tabKeyWasUsed = true;
        console.log('TAB KEY WAS USED');
      } else {
        // this is a workaround for shift-tab... the next element which is tabbed to doesn't get focus
        if (event.key !== 'Shift') {
          tabKeyWasUsed = false;

          console.log('TAB KEY WAS NOT USED', event.key);
        }
      }
    });
    window.addEventListener('keyup', (event) => {
      console.log('keyup', event.key, event.ctrlKey);
      const key = event.key.toLowerCase();
      if (key === 'backspace' || key === 'delete') {
        if (
          ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].indexOf(
            (event.target as HTMLElement)?.tagName
          ) >= 0
        ) {
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
        if (this.canvasApp) {
          event.preventDefault();
          this.canvasApp.centerCamera();
          return false;
        }
      }

      if (event.ctrlKey && key === 'i') {
        console.log('ctrl + i', this.focusedNode);
        let currentFocusedNode = this.focusedNode;
        this.popupNode = this.focusedNode;
        if (this.focusedNode && this.canvasApp) {
          this.canvasApp.selectNode(this.focusedNode);
        } else {
          const selectedNodeInfo = getSelectedNode();
          if (selectedNodeInfo) {
            const node = this.canvasApp?.elements.get(
              selectedNodeInfo.id
            ) as IRectNodeComponent<T>;
            if (node && this.canvasApp) {
              this.focusedNode = node;
              this.popupNode = this.focusedNode;
              currentFocusedNode = node;
              this.canvasApp.selectNode(this.focusedNode);
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
            const node = this.canvasApp?.elements.get(
              id
            ) as IRectNodeComponent<T>;
            if (node) {
              this.focusedNode = node;
            }
            if (node && node.x && node.y && this.canvasApp) {
              console.log('focusin node found', node);
              this.setCameraTargetOnNode(node);
              this.canvasApp.selectNode(node);
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
    this.canvasApp?.resetNodeTransform();
    this.canvasApp?.elements.forEach((element) => {
      element.domElement.remove();
      this.removeElement(element);
    });
    this.canvasApp?.elements.clear();
    this.canvasApp?.setCamera(0, 0, 1);
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
          : this.canvasApp?.elements
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
    const camera = this.canvasApp?.getCamera();

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
    incomingTabIndex: number
  ) => {
    let tabIndex = incomingTabIndex;
    if (node && node.domElement) {
      (node.domElement as HTMLElement).setAttribute(
        'tabindex',
        tabIndex.toString()
      );
      tabIndex++;

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
              tabIndex = this.setTabOrderForNode(connection.endNode, tabIndex);
            }
          });
      }
    }
    return tabIndex;
  };

  getStartNodes = (nodes: ElementNodeMap<T>, includeFunctionNodes = false) => {
    const startNodes: IRectNodeComponent<T>[] = [];
    const nodeList = Array.from(nodes);
    nodes.forEach((node) => {
      const nodeComponent = node as unknown as IRectNodeComponent<T>;
      const connectionsFromEndNode = nodeList.filter((e) => {
        const eNode = e[1] as INodeComponent<T>;
        if (eNode.nodeType === NodeType.Connection) {
          const element = e[1] as IConnectionNodeComponent<T>;
          return (
            element.endNode?.id === node.id &&
            !element.isData &&
            !element.isAnnotationConnection
          );
        }
        return false;
      });
      const nodeInfo = nodeComponent.nodeInfo as any;
      if (
        !(nodeComponent.nodeInfo as any)?.isVariable &&
        nodeComponent.nodeType !== NodeType.Connection &&
        (!connectionsFromEndNode || connectionsFromEndNode.length === 0) &&
        ((!includeFunctionNodes &&
          nodeInfo?.type !== 'node-trigger-target' &&
          nodeInfo?.type !== 'function') ||
          includeFunctionNodes)
      ) {
        startNodes.push(nodeComponent);
      }
    });

    return startNodes;
  };
  setTabOrderOfNodes = () => {
    if (!this.canvasApp) {
      return;
    }
    const nodes = (
      this.getStartNodes(this.canvasApp.elements, true) as any
    ).toSorted((a: IRectNodeComponent<T>, b: IRectNodeComponent<T>) => {
      const aHelper = `${Math.floor(a.y / 100)
        .toFixed(2)
        .padStart(8, '0')}_${a.x.toFixed(2).padStart(8, '0')}`;
      const bHelper = `${Math.floor(b.y / 100)
        .toFixed(2)
        .padStart(8, '0')}_${b.x.toFixed(2).padStart(8, '0')}`;
      if (aHelper < bHelper) {
        return -1;
      }
      if (aHelper > bHelper) {
        return 1;
      }
      return 0;
    });

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
    nodes.forEach((node: IRectNodeComponent<T>, _index: number) => {
      tabIndex = this.setTabOrderForNode(node, tabIndex);

      tabIndex++;
    });
  };
}

/*
const [getCount, setCount] = createSignal(0);
const [getValue, setValue] = createSignal('test');
createEffect(() => console.log('effect', getCount(), getValue()));
setCount(1);
setCount(2);
setValue('test2');
setCount(3);
*/
/*
setInterval(() => {
  setCount(getCount() + 1);
}, 1000);
*/
