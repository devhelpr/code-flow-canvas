import { getCurrentOCIF } from '@devhelpr/app-canvas';
import {
  createJSXElement,
  FlowNode,
  IComputeResult,
  IDOMElement,
  IRectNodeComponent,
  Rect,
  IFlowCanvasBase,
  createElement,
  renderElement,
  FormField,
  InitialValues,
  IRunCounter,
  IConnectionNodeComponent,
} from '@devhelpr/visual-programming-system';
import { FlowEngine, NodeInfo, RunCounter } from '@devhelpr/web-flow-executor';
import { CorePropertiesSetupEditor } from './core-properties-settings-editor';

export type CreateRunCounterContext = (
  isRunViaRunButton: boolean,
  shouldResetConnectionSlider: boolean,
  onFlowFinished?: () => void
) => RunCounter;

export class BaseRectNode {
  nodeRenderElement: HTMLElement | undefined = undefined;
  rectElement: HTMLElement | undefined = undefined;
  canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  id: string;
  node: IRectNodeComponent<NodeInfo> | undefined = undefined;
  updated: () => void;

  rectInstance: Rect<NodeInfo> | undefined;

  createRunCounterContext: CreateRunCounterContext | undefined = undefined;

  static readonly nodeTypeName: string = 'rect-node';
  static readonly nodeTitle: string = 'Rect node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static initialWidth = 200;
  static intialHeight = 100;

  static getFormFields:
    | ((
        getNode: () => IRectNodeComponent<NodeInfo>,
        updated: () => void,
        values?: InitialValues
      ) => FormField[])
    | undefined = undefined;

  static readonly disableManualResize: boolean = true;
  flowEngine: FlowEngine | undefined = undefined;
  constructor(
    id: string,
    updated: () => void,
    node: IRectNodeComponent<NodeInfo>,
    flowEngine?: FlowEngine
  ) {
    this.id = id;
    this.updated = updated;
    this.node = node;
    this.flowEngine = flowEngine;
  }

  initNode(_node: IRectNodeComponent<NodeInfo>) {
    //
  }

  destroy() {
    //
  }

  updateVisual: ((data: any) => void) | undefined = undefined;

  getSettingsPopup:
    | ((popupContainer: HTMLElement) => IDOMElement | undefined)
    | undefined = (popupContainer: HTMLElement) => {
    const popupInstance = createElement(
      'div',
      { class: 'max-h-[380px]  h-[fit-content]  p-3 pb-6' },
      popupContainer,
      undefined
    );
    const panel = popupInstance?.domElement as HTMLDivElement;
    if (panel) {
      panel.className = 'control-panel';

      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'controls-container';
      const nodeInfo = this.node?.nodeInfo as any;
      renderElement(
        <CorePropertiesSetupEditor
          strokeColor={nodeInfo?.strokeColor ?? '#000000'}
          fillColor={nodeInfo?.fillColor ?? '#ffffff'}
          onStrokeColorChange={(color: string) => {
            console.log('onStrokeColorChange', color);
            if (this.rectElement) {
              this.rectElement.style.borderColor = color;
              this.rectElement.style.color = color;
              if (this.node?.nodeInfo) {
                (this.node.nodeInfo as any).strokeColor = color;
              }
            }
            const ocif = getCurrentOCIF();
            if (ocif) {
              const node = ocif.nodes.find((n: any) => n.id === this.id);
              if (node) {
                const extension = node.data.find(
                  (dataItem: any) =>
                    dataItem.type === '@ocwg/node/rect' ||
                    dataItem.type === '@ocwg/node/oval'
                );
                if (extension) {
                  extension.strokeColor = color;
                }
              }
            }
            this.updated();
          }}
          onFillColorChange={(color: string) => {
            console.log('onFillColorChange', color);
            if (this.rectElement) {
              this.rectElement.style.backgroundColor = color;
              if (this.node?.nodeInfo) {
                (this.node.nodeInfo as any).fillColor = color;
              }
            }

            const ocif = getCurrentOCIF();
            if (ocif) {
              const node = ocif.nodes.find((n: any) => n.id === this.id);
              if (node) {
                const extension = node.data.find(
                  (dataItem: any) =>
                    dataItem.type === '@ocwg/node/rect' ||
                    dataItem.type === '@ocwg/node/oval'
                );
                if (extension) {
                  extension.fillColor = color;
                }
              }
            }
            this.updated();
          }}
        />,
        controlsContainer
      );
      panel.appendChild(controlsContainer);
    }
    return popupInstance;
  };

  initializeCompute: (() => void) | undefined = undefined;

  compute = (
    input: unknown,
    _loopIndex?: number,
    _payload?: unknown,
    _portName?: string,
    _scopeId?: string,
    _runCounter?: IRunCounter,
    _connection?: IConnectionNodeComponent<NodeInfo>
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      resolve({
        result: input,
        output: input,
        followPath: undefined,
      });
    });
  };

  childElementSelector = '.child-node-wrapper > textarea'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render rect-node',
      node.width,
      node.height,
      (node?.nodeInfo as any)?.text
    );
    return (
      <textarea
        class="w-full h-full bg-transparent text-center appearance-none focus-visible:outline-none resize-none"
        resize="none"
        rows="1"
        renderElement={(element: HTMLTextAreaElement) => {
          element.value = nodeInfo?.text ?? '';
          setTimeout(() => {
            element.style.width = 'auto';
            element.style.height = 'auto';
            //console.log('renderElement textarea', element.scrollHeight);
            element.style.height = element.scrollHeight + 'px';
            if (this.node) {
              this.node.restrictHeight = element.scrollHeight;
              this.node.restrictWidth = element.scrollWidth;
            }
          }, 0);
        }}
        input={(event: InputEvent) => {
          if (this.canvasAppInstance?.getCanvasAttribute('create-connection')) {
            event.preventDefault();
            return false;
          }
          if (
            this.node?.nodeInfo &&
            this.rectElement &&
            (event?.target as HTMLTextAreaElement)?.value
          ) {
            console.log(
              'textarea input',
              (event?.target as HTMLTextAreaElement)?.value
            );
            const value = (event?.target as HTMLTextAreaElement)?.value;

            (this.node.nodeInfo as any).text = value;
            const ocif = getCurrentOCIF();
            if (ocif) {
              const node = ocif.nodes.find((n: any) => n.id === this.id);
              if (node && node.resource) {
                const resource = ocif.resources.find(
                  (r: any) => r.id === node.resource
                );
                if (resource) {
                  const textRepresentation = resource.representations.find(
                    (r: any) => r['mime-type'] === 'text/plain'
                  );
                  if (textRepresentation) {
                    textRepresentation.content = value;
                  }
                }
              }
            }
            const textarea = event.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
            if (this.onResize) {
              this.onResize(this.node.width ?? 10, textarea.scrollHeight);
            }
          }
          this.updated();
          return true;
        }}
      ></textarea>
    );
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
  setSize = (width: number, height: number) => {
    if (this.rectElement) {
      this.rectElement.style.width = `${width}px`;
      this.rectElement.style.height = `${height}px`;
      this.rectElement.style.minWidth = `${width}px`;
      this.rectElement.style.minHeight = `${height}px`;
    }
  };
}
