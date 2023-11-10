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
} from '@devhelpr/visual-programming-system';

import { RunNodeResult } from './simple-flow-engine/simple-flow-engine';
import {
  animatePath as _animatePath,
  animatePathFromThumb as _animatePathFromThumb,
} from './follow-path/animate-path';
import { FlowrunnerIndexedDbStorageProvider } from './storage/indexeddb-storage-provider';

const template = document.createElement('template');
template.innerHTML = `
  <div class="h-screen w-full bg-slate-800 overflow-hidden touch-none" id="root" >
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

  pathExecutions: RunNodeResult<T>[][] = [];
  scopeNodeDomElement: HTMLElement | undefined = undefined;

  currentPathUnderInspection: RunNodeResult<T>[] | undefined = undefined;

  formElement: INodeComponent<T> | undefined = undefined;
  editPopupContainer: IElementNode<T> | undefined = undefined;
  editPopupLineContainer: IElementNode<T> | undefined = undefined;
  editPopupLinePath: IElementNode<T> | undefined = undefined;
  editPopupLineEndPath: IElementNode<T> | undefined = undefined;
  editPopupEditingNodeIndicator: IElementNode<T> | undefined = undefined;
  selectedNodeLabel: IElementNode<T> | undefined = undefined;
  rootElement: HTMLElement | undefined = undefined;

  appRootElement: Element | null;

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

  onPreRemoveElement = (element: IElementNode<T>) => {
    //
  };

  removeElement = (element: IElementNode<T>) => {
    this.onPreRemoveElement(element);
    element.domElement.remove();
    const node = element as unknown as INodeComponent<T>;
    if (node && node.delete) {
      node.delete();
    }
    element.elements.forEach((element: IElementNode<T>) => {
      this.removeElement(element as unknown as IElementNode<T>);
    });
    element.elements = createElementMap<T>();
  };
  onPreclearCanvas = () => {
    //
  };

  protected clearCanvas = () => {
    this.onPreclearCanvas();
    setSelectNode(undefined);

    this.canvasApp?.elements.forEach((element) => {
      element.domElement.remove();
      this.removeElement(element as unknown as IElementNode<T>);
    });
    this.canvasApp?.elements.clear();
    this.canvasApp?.setCamera(0, 0, 1);
  };

  onShouldPositionPopup = (node: IRectNodeComponent<T>) => {
    return true;
  };

  onCameraChanged = (camera: Camera) => {
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
        console.log('before positionPopup2', selectedNodeInfo);
        this.positionPopup(node as IRectNodeComponent<T>);
      }
    }
  };

  positionPopup = (node: IRectNodeComponent<T>) => {
    (
      this.editPopupContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');
    (
      this.editPopupLineContainer?.domElement as unknown as HTMLElement
    ).classList.remove('hidden');

    const sidebar = this.editPopupContainer
      ?.domElement as unknown as HTMLElement;
    const nodeComponent = node as INodeComponent<T>;

    let parentX = 0;
    let parentY = 0;
    if (node.containerNode) {
      if (node.containerNode && node.containerNode?.getParentedCoordinates) {
        const parentCoordinates =
          node.containerNode?.getParentedCoordinates() ?? {
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
      }
      s`
    );
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
