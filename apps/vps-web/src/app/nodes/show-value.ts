import {
  CanvasAppInstance,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { FormFieldType } from '../components/FormField';

export const getShowValue: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<CanvasAppInstance<NodeInfo>['createRect']> | undefined =
    undefined;
  let inputValues: any;
  let decimalCount = 0;
  let append = '';
  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = '';
    if (htmlNode) {
      htmlNode.domElement.textContent = '-';
      if (rect) {
        rect.resize(120);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = input;
    if (htmlNode) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      if (typeof input === 'number') {
        htmlNode.domElement.textContent = `${(input as number).toFixed(
          decimalCount
        )} ${append}`;
      } else if (typeof input === 'string') {
        const helper = parseFloat(input);
        if (!isNaN(helper)) {
          htmlNode.domElement.textContent = `${helper.toFixed(
            decimalCount
          )} ${append}`;
        }
      } else {
        htmlNode.domElement.textContent = `${input.toString()} ${append}`;
      }
      if (rect) {
        rect.resize(120);
      }
    }
    return {
      result: input,
      output: input,
      followPath: undefined,
    };
  };

  const getNodeStatedHandler = () => {
    return {
      data: inputValues,
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    updateVisual(data);
  };

  const updateVisual = (data: any) => {
    if (htmlNode) {
      htmlNode.domElement.textContent = (data || '-').toString();
      if (rect) {
        rect.resize(120);
      }
    }
  };
  return {
    name: 'show-value',
    family: 'flow-canvas',
    category: 'debug',
    createVisualNode: (
      canvasApp: CanvasAppInstance<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues
    ) => {
      const decimalsInitialValue = initalValues?.['decimals'] ?? '0';
      const appendInitialValue = initalValues?.['append'] ?? '';
      decimalCount = parseInt(decimalsInitialValue) || 0;
      append = appendInitialValue;
      htmlNode = createElement(
        'div',
        {
          class: 'break-words whitespace-pre-line text-center',
        },
        undefined,
        '-'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-fuchsia-500 p-4 rounded max-w-[120px] text-white`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        120,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: '#',
            thumbConstraint: 'value',
            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            label: '#',
            thumbConstraint: 'value',
            name: 'input',
            color: 'white',
          },
        ],
        wrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'show-value',
          formElements: [],
        }
      );

      if (!rect.nodeComponent) {
        throw new Error('rect.nodeComponent is undefined');
      }

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.compute = compute;
        node.nodeInfo.initializeCompute = initializeCompute;

        node.nodeInfo.updateVisual = updateVisual;

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }
        node.nodeInfo.formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'decimals',
            value: decimalsInitialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                decimals: value,
              };
              decimalCount = parseInt(value) || 0;
              updated();

              if (!isNaN(inputValues)) {
                if (htmlNode) {
                  htmlNode.domElement.textContent = `${inputValues.toFixed(
                    decimalCount
                  )} ${appendInitialValue}`;
                  if (rect) {
                    rect.resize(120);
                  }
                }
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'append',
            value: appendInitialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                append: value,
              };

              updated();
              append = value;
              if (!isNaN(inputValues)) {
                if (htmlNode) {
                  htmlNode.domElement.textContent = `${inputValues.toFixed(
                    decimalCount
                  )} ${value}`;
                  if (rect) {
                    rect.resize(120);
                  }
                }
              }
            },
          },
        ];
        node.nodeInfo.isSettingsPopup = true;
      }
      return node;
    },
  };
};
