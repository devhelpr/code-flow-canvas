import {
  createJSXElement,
  FlowNode,
  FormField,
  FormFieldType,
  IComputeResult,
  IConnectionNodeComponent,
  InitialValues,
  IRectNodeComponent,
  IRunCounter,
  IThumbNodeComponent,
  NodeCompute,
  NodeDefinition,
  NodeVisual,
  ThumbConnectionType,
} from '@devhelpr/visual-programming-system';
import {
  FlowEngine,
  getRunIndex,
  NodeInfo,
  runNodeFromThumb,
} from '@devhelpr/web-flow-executor';
import { BaseRectNode } from './base-rect-node-class';

export class RectNode extends BaseRectNode {
  static readonly nodeTypeName: string = 'rect-node';
  static readonly nodeTitle: string = 'Rect node';
  static readonly category: string = 'Default';

  static readonly text: string = 'rect';

  static readonly disableManualResize: boolean = false;

  constructor(
    id: string,
    updated: () => void,
    node: IRectNodeComponent<NodeInfo>
  ) {
    super(id, updated, node);
  }
  compute = (
    input: unknown,
    _loopIndex?: number,
    _payload?: any
  ): Promise<IComputeResult> => {
    return new Promise<IComputeResult>((resolve) => {
      const data = (this.node?.nodeInfo as any)?.text ?? input;
      resolve({
        result: data,
        output: data,
        followPath: undefined,
      });
    });
  };
  /*
w-min h-min
			min-w-min min-h-min
			p-0 
			flex items-center justify-center
*/

  childElementSelector = '.child-node-wrapper textarea'; // '.child-node-wrapper > *:first-child'
  render(node: FlowNode<NodeInfo>) {
    const nodeInfo = node.nodeInfo as any;
    console.log(
      'render rect-node',
      node.width,
      node.height,
      (node?.nodeInfo as any)?.text
    );
    return (
      <div class="h-full w-full">
        <div
          getElement={(element: HTMLElement) => {
            this.rectElement = element;
          }}
          class={`h-full w-full rounded overflow-clip justify-center items-center text-center whitespace-pre inline-flex grow-textarea`}
          style={`background:${nodeInfo?.fillColor ?? 'black'};border: ${
            nodeInfo?.strokeWidth ?? '2'
          }px ${nodeInfo?.strokeColor ?? 'white'} solid;color:${
            nodeInfo?.strokeColor ?? 'white'
          }`}
        >
          {super.render(node)}
        </div>
      </div>
    );
    /*
    min-width:${node.width ?? 50}px;min-height:${
            node.height ?? 50
          }px;
    */
  }
  onResize: ((width: number, height: number) => void) | undefined = undefined;
}

export const createNodeClass = (
  nodeDefinition: NodeDefinition,
  NodeVisualClass?: typeof NodeVisual<NodeInfo>,
  NodeComputeClass?: typeof NodeCompute<NodeInfo>
) => {
  return class extends RectNode {
    static readonly nodeTypeName: string = nodeDefinition.nodeTypeName;
    static readonly nodeTitle: string = nodeDefinition.nodeTypeName;
    static readonly category: string = nodeDefinition.category ?? 'Default';
    static readonly description: string = nodeDefinition.description;

    static getFormFields = (
      getNode: () => IRectNodeComponent<NodeInfo>,
      updated: () => void,
      values?: InitialValues
    ): FormField[] => {
      const supportedFieldTypes: FormFieldType[] = [
        FormFieldType.TextArea,
        FormFieldType.Text,
      ];
      return nodeDefinition.settingsFormFields
        ? nodeDefinition.settingsFormFields
            .filter((field) => supportedFieldTypes.includes(field.fieldType))
            .map((field) => {
              if (
                field.fieldType !== FormFieldType.TextArea &&
                field.fieldType !== FormFieldType.Text
              ) {
                throw new Error(
                  `Field type ${field.fieldType} is not supported for ${nodeDefinition.nodeTypeName}. Only TextArea and Text are supported.`
                );
              }
              return {
                fieldName: field.name,
                fieldType: field.fieldType,
                defaultValue: field.defaultValue,
                value: values ? values[field.name] : undefined,
                onChange: (value: string | number | boolean) => {
                  const node = getNode();
                  if (!node) {
                    return;
                  }
                  if (!node.nodeInfo) {
                    node.nodeInfo = {};
                  }

                  node.nodeInfo.formValues = {
                    ...node.nodeInfo.formValues,
                    [field.name]: value,
                  };
                  if (updated) {
                    updated();
                  }
                  node?.nodeInfo?.updateVisual?.(undefined);
                },
              };
            })
        : [];
    };
    // node.nodeInfo.updatesVisualAfterCompute
    nodeVisual?: NodeVisual<NodeInfo>;
    nodeCompute?: NodeCompute<NodeInfo>;
    initNode(node: IRectNodeComponent<NodeInfo>, flowEngine?: FlowEngine) {
      super.initNode(node);
      if (!node.nodeInfo) {
        node.nodeInfo = {};
      }
      this.nodeVisual = NodeVisualClass
        ? new NodeVisualClass(node, this.canvasAppInstance)
        : new NodeVisual(node, this.canvasAppInstance);
      this.nodeCompute = NodeComputeClass
        ? new NodeComputeClass()
        : new NodeCompute();
      // (this.nodeVisual as any).flowEngine = flowEngine;
      // (this.nodeVisual as any).baseRectNode = this;
      this.nodeVisual?.setTriggerOutputs(
        (_port: IThumbNodeComponent<NodeInfo>, data?: unknown) => {
          if (
            !this.node ||
            !this.canvasAppInstance ||
            !this.createRunCounterContext
          ) {
            console.error('FlowEngine is not initialized');
            return;
          }

          console.log('Form data submitted:', data);
          const output = this.node.thumbConnectors?.find((thumb) => {
            return (
              thumb.thumbConnectionType === ThumbConnectionType.start ||
              thumb.thumbConnectionType === ThumbConnectionType.startOrEnd
            );
          });
          if (!output) {
            return;
          }
          if (flowEngine?.runNodeFromThumb) {
            flowEngine?.runNodeFromThumb(
              undefined,
              output,
              this.canvasAppInstance,
              () => {
                //
              },
              data as any,
              node,
              getRunIndex(),
              undefined,
              this.createRunCounterContext(false, false),
              undefined,
              undefined,
              flowEngine?.sendOutputToNode
            );
          } else {
            runNodeFromThumb(
              output,
              this.canvasAppInstance,
              () => {
                //
              },
              data as any,
              node,
              getRunIndex(),
              undefined,
              this.createRunCounterContext(false, false),
              undefined,
              undefined,
              flowEngine?.sendOutputToNode
            );
          }
          return;
          // if (flowEngine?.runNode) {
          //   flowEngine?.runNode(
          //     undefined,
          //     this.node,
          //     this.canvasAppInstance,
          //     () => {
          //       //
          //     },
          //     data as any, //JSON.stringify(data),
          //     undefined,
          //     undefined,
          //     getRunIndex(),
          //     undefined,
          //     undefined,
          //     this.createRunCounterContext(false, false),
          //     false,
          //     {
          //       trigger: true,
          //     }
          //   );
          // } else {
          //   runNode(
          //     this.node,
          //     this.canvasAppInstance,
          //     () => {
          //       //
          //     },
          //     data as any,
          //     undefined,
          //     undefined,
          //     getRunIndex(),
          //     undefined,
          //     undefined,
          //     this.createRunCounterContext(false, false),
          //     false,
          //     {
          //       trigger: true,
          //     }
          //   );
          //}
        }
      );
      node.nodeInfo.updatesVisualAfterCompute = true;
    }

    destroy() {
      super.destroy();
      if (this.nodeVisual) {
        this.nodeVisual.destroy();
      }
      this.nodeVisual = undefined;
    }

    initializeCompute = () => {
      if (this.nodeCompute?.initializeCompute) {
        this.nodeCompute.initializeCompute();
      }
    };
    compute = (
      input: unknown,
      _loopIndex?: number,
      _payload?: any,
      _portName?: string,
      _scopeId?: string,
      _runCounter?: IRunCounter,
      _connection?: IConnectionNodeComponent<NodeInfo>
    ): Promise<IComputeResult> => {
      if (!this.nodeCompute) {
        throw new Error('NodeCompute is undefined.');
      }

      return this.nodeCompute.compute(
        input,
        _loopIndex,
        _payload,
        _portName,
        _scopeId,
        _runCounter,
        _connection
      );
    };
    updateVisual = (data: unknown, scopeId?: string | undefined) => {
      if (!this.rectElement || !this.node) {
        return;
      }
      this.nodeVisual?.updateVisual?.(
        data,
        this.rectElement,
        this.node.nodeInfo as NodeInfo,
        scopeId
      );
    };
    childElementSelector = '.child-node-wrapper > *:first-child';

    // TOOD: bg-white/text-black should be in the nodeVisual but if its not use defaults
    render = (_node: FlowNode<NodeInfo>) => {
      return (
        <div
          class={`h-full w-full ${
            nodeDefinition.nodeTheme?.backgroundColorClass ?? 'bg-white'
          } ${nodeDefinition.nodeTheme?.textColorClass ?? 'text-black'} ${
            this.nodeVisual?.additionalContainerCssClasses ?? ''
          }`}
          getElement={(element: HTMLDivElement) => {
            this.rectElement = element;
          }}
        >
          {this.nodeVisual?.render?.() ?? (
            <div class="grid content-center justify-items-center h-full">
              {nodeDefinition.nodeTypeName}
            </div>
          )}
        </div>
      );
    };
  };
};
