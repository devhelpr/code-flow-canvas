import {
  CanvasAppInstance,
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { FormComponent, FormFieldType } from '../components/form-component';
import { NodeInfo } from '../types/node-info';
import { RunNodeResult } from '../simple-flow-engine/simple-flow-engine';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';

export const getVariable: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let canvasAppInstance: CanvasAppInstance<NodeInfo>;
  let node: IRectNodeComponent<NodeInfo>;
  let componentWrapper: IRectNodeComponent<NodeInfo>;
  let htmlNode: IElementNode<NodeInfo> | undefined = undefined;
  let tagNode: IElementNode<NodeInfo> | undefined = undefined;
  let variableName = '';
  let currentValue = 0;
  let timeout: any = undefined;
  const initializeCompute = () => {
    currentValue =
      parseFloat(node?.nodeInfo?.formValues?.['initialValue']) ?? 0;

    if (isNaN(currentValue)) {
      currentValue = 0;
      if (htmlNode) {
        (htmlNode.domElement as unknown as HTMLElement).textContent = '-';
      }
    } else if (htmlNode) {
      (htmlNode.domElement as unknown as HTMLElement).textContent =
        currentValue.toString();
    }
    canvasAppInstance?.setVariable(variableName, currentValue);

    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    (componentWrapper.domElement as unknown as HTMLElement).classList.remove(
      'border-green-200'
    );

    return;
  };
  const compute = (
    input: string,
    pathExecution?: RunNodeResult<NodeInfo>[],
    loopIndex?: number
  ) => {
    let result: any = false;
    try {
      currentValue = parseFloat(input) ?? 0;
      if (isNaN(currentValue)) {
        currentValue = 0;
      }
      if (htmlNode) {
        (htmlNode.domElement as unknown as HTMLElement).textContent =
          currentValue.toString();
      }
      result = currentValue;
    } catch (error) {
      result = undefined;
    }

    return {
      result,
      followPath: undefined,
    };
  };

  const getData = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    (componentWrapper.domElement as unknown as HTMLElement).classList.add(
      'border-orange-200'
    );
    timeout = setTimeout(() => {
      (componentWrapper?.domElement as unknown as HTMLElement).classList.remove(
        'border-orange-200'
      );

      (componentWrapper?.domElement as unknown as HTMLElement).classList.remove(
        'border-green-200'
      );
    }, 250);

    return currentValue;
  };
  const setData = (data: any) => {
    if (typeof data === 'string') {
      currentValue = parseFloat(data) || 0;
    } else {
      currentValue = data;
    }
    if (htmlNode) {
      (htmlNode.domElement as unknown as HTMLElement).textContent =
        currentValue.toString();

      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      (componentWrapper.domElement as unknown as HTMLElement).classList.add(
        'border-green-200'
      );
      timeout = setTimeout(() => {
        (
          componentWrapper?.domElement as unknown as HTMLElement
        ).classList.remove('border-green-200');
        (
          componentWrapper?.domElement as unknown as HTMLElement
        ).classList.remove('border-orange-200');
      }, 250);
    }
  };

  return {
    name: 'variable',
    family: 'flow-canvas',
    isContainer: false,
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>
    ) => {
      canvasAppInstance = canvasApp;
      variableName = initalValues?.['variableName'] ?? '';
      canvasApp.registerVariable(variableName, {
        id: id ?? '',
        getData,
        setData,
      });
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'variableName',
          value: initalValues?.['variableName'] ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              variableName: value,
            };
            canvasApp.unregisterVariable(variableName, id ?? '');
            variableName = value;
            (tagNode?.domElement as HTMLElement).textContent = variableName;
            canvasApp.registerVariable(variableName, {
              id: id ?? '',
              getData,
              setData,
            });
            console.log('onChange', node.nodeInfo);
            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'initialValue',
          value: initalValues?.['initialValue'] ?? '',
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              initialValue: value,
            };
            initializeCompute();
            if (updated) {
              updated();
            }
          },
        },
      ];

      htmlNode = createElement(
        'div',
        {
          class: '',
        },
        undefined,
        '-'
      ) as unknown as INodeComponent<NodeInfo>;

      componentWrapper = createElement(
        'div',
        {
          class: `border-[4px] border-solid border-transparent transition duration-500 ease-in-out inner-node bg-slate-600 text-white p-4 rounded text-center`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as IRectNodeComponent<NodeInfo>;

      const rect = canvasApp.createRect(
        x,
        y,
        100,
        100,
        undefined,
        [],
        componentWrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        undefined,
        undefined,
        id,
        {
          type: 'variable',
          formValues: {
            variableName: variableName,
            initialValue: initalValues?.['initialValue'] ?? '',
          },
        },
        containerNode
      );
      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      tagNode = createElement(
        'div',
        {
          class:
            'absolute top-0 left-0 bg-slate-700 text-white px-1 rounded -translate-y-2/4 translate-x-1',
        },
        rect.nodeComponent.domElement as unknown as HTMLElement,
        variableName
      ) as unknown as INodeComponent<NodeInfo>;

      node = rect.nodeComponent;

      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.isVariable = true;
        node.nodeInfo.compute = compute;
        node.nodeInfo.sendData = compute;
        node.nodeInfo.getData = getData;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.delete = () => {
          canvasApp.unregisterVariable(variableName, id ?? '');
          (
            componentWrapper?.domElement as unknown as HTMLElement
          ).classList.remove('border-green-200');
          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
        };
      }
      return node;
    },
  };
};
