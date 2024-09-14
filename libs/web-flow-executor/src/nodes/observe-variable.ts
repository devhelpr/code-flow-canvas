import {
  FlowCanvasInstance,
  createElement,
  FormComponent,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode } from '../flow-engine/flow-engine';
import { getNodeByVariableName } from '../graph/get-node-by-variable-name';

export const observeVariable = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let variableName = '';
  let canvasAppInstance: FlowCanvasInstance<NodeInfo> | undefined = undefined;
  let timeout: any = undefined;
  let componentWrapper: INodeComponent<NodeInfo> | undefined = undefined;
  const initializeCompute = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (canvasAppInstance && variableName) {
      canvasAppInstance.removeObserveVariable(node.id, variableName);
      setupObserveVariable();
    }
    if (componentWrapper && componentWrapper?.domElement) {
      (componentWrapper.domElement as HTMLElement).classList.add(
        'border-transparent'
      );
    }
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    _scopeId?: string,
    _runCounterCompute?: RunCounter
  ) => {
    return {
      result: input,
      stop: input === undefined || input === null || input === '',
      followPath: undefined,
    };
  };

  const getDependencies = (): {
    startNodeId: string;
    endNodeId: string;
  }[] => {
    const dependencies: { startNodeId: string; endNodeId: string }[] = [];
    const variableName = node?.nodeInfo?.formValues?.['variableName'] ?? '';
    if (variableName && canvasAppInstance) {
      const variableNode = getNodeByVariableName(
        variableName,
        canvasAppInstance
      );
      if (variableNode) {
        dependencies.push({
          startNodeId: variableNode.id,
          endNodeId: node.id,
        });
      }
    }
    return dependencies;
  };

  const setupObserveVariable = () => {
    if (canvasAppInstance && node) {
      canvasAppInstance.observeVariable(
        node.id,
        variableName,
        (value, runCounter?: any) => {
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
          if (componentWrapper && componentWrapper?.domElement) {
            (componentWrapper.domElement as HTMLElement).classList.remove(
              'border-transparent'
            );
          }
          if (componentWrapper && componentWrapper?.domElement) {
            (componentWrapper.domElement as HTMLElement).classList.add(
              'border-white'
            );
          }
          timeout = setTimeout(() => {
            if (componentWrapper && componentWrapper?.domElement) {
              (componentWrapper.domElement as HTMLElement).classList.remove(
                'border-white'
              );
              (componentWrapper.domElement as HTMLElement).classList.add(
                'border-transparent'
              );
            }
          }, 250);

          console.log('observeVariable', value, runCounter);
          if (canvasAppInstance) {
            runNode(
              node,
              canvasAppInstance,
              (_input) => {
                //
              },
              value,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              runCounter
            );
          }
        }
      );
    }
  };

  return {
    name: 'observe-variable',
    family: 'flow-canvas',
    category: 'variables',
    isContainer: false,
    createVisualNode: (
      canvasApp: FlowCanvasInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      const initialValue = initalValues?.['variableName'] ?? '';
      variableName = initialValue;

      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'variableName',
          value: initialValue ?? '',
          settings: {
            showLabel: false,
          },
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              variableName: value,
            };

            canvasApp.removeObserveVariable(node.id, variableName);
            variableName = value;
            setupObserveVariable();

            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
      ];

      setupObserveVariable();

      componentWrapper = createElement(
        'div',
        {
          class: `relative observer-node border-[2px] border-solid rounded transition duration-500 ease-in-out`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      const titleWrapper = createElement(
        'div',
        {
          class: `flex items-center bg-blue-600 text-white p-1 px-3 rounded-t pointer-events-none`,
        },
        componentWrapper?.domElement
      ) as unknown as INodeComponent<NodeInfo>;

      createElement(
        'span',
        {},
        titleWrapper?.domElement,
        'Observe variable'
      ) as unknown as INodeComponent<NodeInfo>;

      createElement(
        'span',
        { class: 'icon-bolt' },
        titleWrapper?.domElement
      ) as unknown as INodeComponent<NodeInfo>;

      const formWrapper = createElement(
        'div',
        {
          class: `inner-node bg-blue-500 p-4 pt-4 rounded-b`,
        },
        componentWrapper?.domElement
      ) as unknown as INodeComponent<NodeInfo>;
      if (formWrapper?.domElement) {
        FormComponent({
          rootElement: formWrapper?.domElement as HTMLElement,
          id: id ?? '',
          formElements,
          hasSubmitButton: false,
          onSave: (formValues) => {
            console.log('onSave', formValues);
          },
        }) as unknown as HTMLElement;
      }

      const rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
            maxConnections: -1,
          },
        ],
        componentWrapper,
        {
          classNames: ``,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: 'observe-variable',
          formValues: {
            variableName: initialValue ?? '',
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.getDependencies = getDependencies;
        node.nodeInfo.delete = () => {
          canvasApp.removeObserveVariable(node.id, variableName);
        };
      }
      return node;
    },
  };
};
