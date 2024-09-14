import {
  FlowCanvas,
  createElement,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
  createJSXElement,
  FormFieldType,
  InitialValues,
  NodeTask,
  NodeTaskFactory,
  getFormattedValue,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

export const getShowValue: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: FlowCanvas<NodeInfo> | undefined = undefined;
  let htmlElement: HTMLElement | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<FlowCanvas<NodeInfo>['createRect']> | undefined =
    undefined;
  let inputValues: any;
  let decimalCount = 0;
  let append = '';
  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = '';
    if (htmlElement) {
      htmlElement.textContent = '-';
      if (rect && rect.resize) {
        rect?.resize(120);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = input;
    if (typeof input !== 'number') {
      return {
        result: undefined,
        output: undefined,
        followPath: undefined,
        stop: true,
      };
    }
    if (node.nodeInfo?.formValues['name']) {
      canvasAppInstance?.sendMessageFromNode(
        node.nodeInfo?.formValues['name'],
        input
      );
    }

    if (htmlElement) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }
      htmlElement.textContent = getFormattedValue(input, decimalCount, append);

      if (rect && rect.resize) {
        rect?.resize(120);
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
    if (htmlElement) {
      htmlElement.textContent = getFormattedValue(data, decimalCount, append);
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
      canvasApp: FlowCanvas<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues
    ) => {
      canvasAppInstance = canvasApp;

      const decimalsInitialValue = initalValues?.['decimals'] ?? '0';
      const appendInitialValue = initalValues?.['append'] ?? '';
      const externalNameInitialValue = initalValues?.['name'] ?? '';

      decimalCount = parseInt(decimalsInitialValue) || 0;
      append = appendInitialValue;

      const HTMLNode = () => (
        <div class="break-words whitespace-pre-line text-center"></div>
      );

      const wrapper = createElement(
        'div',
        {
          class: `inner-node bg-fuchsia-500 p-4 rounded max-w-[120px] text-white`,
        },
        undefined,
        HTMLNode()
      ) as unknown as INodeComponent<NodeInfo>;

      htmlElement = (wrapper?.domElement as HTMLElement)
        ?.firstChild as HTMLElement;

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
            label: ' ',
            //thumbConstraint: 'value',
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
          formValues: {
            append: append ?? '',
            decimals: decimalsInitialValue ?? '0',
            name: externalNameInitialValue ?? '',
          },
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
                if (htmlElement) {
                  htmlElement.textContent = getFormattedValue(
                    inputValues,
                    decimalCount,
                    appendInitialValue
                  );

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
                if (htmlElement) {
                  htmlElement.textContent = getFormattedValue(
                    inputValues,
                    decimalCount,
                    value
                  );

                  if (rect) {
                    rect.resize(120);
                  }
                }
              }
            },
          },
          {
            fieldType: FormFieldType.Text,
            fieldName: 'name',
            label: 'External name',
            value: externalNameInitialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                name: value,
              };

              updated();
            },
          },
        ];
        node.nodeInfo.isSettingsPopup = true;
        node.nodeInfo.compileInfo = {
          getCode: (input: any) => {
            return `\
((input) => {console.log(input);\
return ${input ? input : '""'};})(${input ? input : '""'});\
`;
          },
        };
      }
      return node;
    },
  };
};
