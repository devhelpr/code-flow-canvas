import {
  IFlowCanvasBase,
  createElement,
  FormFieldType,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { getShowNodeFamilyCssClasses } from '../consts/show-node-family-css-classes';
const thumbs = [
  {
    thumbType: ThumbType.StartConnectorRight,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.start,
    label: ' ',
    //thumbConstraint: '',
    name: 'output',
    color: 'white',
  },
  {
    thumbType: ThumbType.EndConnectorLeft,
    thumbIndex: 0,
    connectionType: ThumbConnectionType.end,
    label: ' ',
    //thumbConstraint: 'array',
    name: 'input',
    color: 'white',
  },
];
const cssClasses = getShowNodeFamilyCssClasses();
export const getShowInput: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let inputValues: any;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
    undefined;

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = '';
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Input';
      if (rect && rect.resize) {
        rect.resize(240);
      }
    }
    return;
  };
  const compute = (input: string | any[]) => {
    inputValues = input;

    if (node.nodeInfo?.formValues['name']) {
      canvasAppInstance?.sendMessageFromNode(
        node.nodeInfo?.formValues['name'],
        Array.isArray(input) || typeof input === 'object'
          ? input
          : typeof input === 'number'
          ? (input as number).toFixed(2)
          : input.toString()
      );
    }

    if (htmlNode && htmlNode.domElement) {
      if (hasInitialValue) {
        hasInitialValue = false;
      }

      if (inputValues && typeof inputValues === 'object') {
        htmlNode.domElement.textContent = JSON.stringify(inputValues, null, 2);
      } else if (inputValues && Array.isArray(inputValues)) {
        let output = '';
        inputValues.forEach((item) => {
          if (typeof item === 'object') {
            output += JSON.stringify(item, null, 2) + '\n';
          } else {
            output += item + '\n';
          }
        });
        htmlNode.domElement.textContent = output;
      } else {
        if (typeof inputValues === 'number') {
          htmlNode.domElement.textContent = inputValues.toFixed(2);
        } else {
          htmlNode.domElement.textContent = (inputValues || '-').toString();
        }
      }
      if (rect && rect.resize) {
        rect.resize(240);
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
      data: structuredClone(inputValues),
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    updateVisual(data);
  };

  const updateVisual = (data: any) => {
    if (htmlNode && htmlNode.domElement) {
      if (data && typeof data === 'object') {
        htmlNode.domElement.textContent = JSON.stringify(data, null, 2);
      } else if (data && Array.isArray(data)) {
        let output = '';
        data.forEach((item) => {
          if (typeof item === 'object') {
            output += JSON.stringify(item, null, 2) + '\n';
          } else {
            output += item + '\n';
          }
        });
        htmlNode.domElement.textContent = output;
      } else {
        if (typeof data === 'number') {
          htmlNode.domElement.textContent = data.toFixed(2);
        } else {
          htmlNode.domElement.textContent = (data || '-').toString();
        }
      }
    }
  };
  return {
    name: 'show-input',
    family: 'flow-canvas',
    category: 'debug',
    thumbs,
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues
    ) => {
      canvasAppInstance = canvasApp;

      htmlNode = createElement(
        'div',
        {
          class: 'break-words text-center',
          style: {
            display: '-webkit-box',
            '-webkit-line-clamp': '10',
            '-webkit-box-orient': 'vertical',
            overflow: 'hidden',
          },
        },
        undefined,
        'Input'
      ) as unknown as INodeComponent<NodeInfo>;

      const wrapper = createElement(
        'div',
        {
          class: `${cssClasses.wrapperCssClasses} ${cssClasses.showInputAdditionalWrapperCssClasses}`,
        },
        undefined,
        htmlNode?.domElement as unknown as HTMLElement
      ) as unknown as INodeComponent<NodeInfo>;

      const externalNameInitialValue = initalValues?.['name'] ?? '';
      const dataTypeInitialValue = initalValues?.['data-type'] ?? 'default';
      rect = canvasApp.createRect(
        x,
        y,
        120,
        100,
        undefined,
        thumbs,
        wrapper,
        {
          classNames: `p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'show-input',
          formElements: [],
          formValues: {
            name: externalNameInitialValue ?? '',
            ['data-type']: dataTypeInitialValue,
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
        node.nodeInfo.initializeOnStartFlow = true;
        node.nodeInfo.isSettingsPopup = true;
        node.nodeInfo.formElements = [
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
          {
            fieldType: FormFieldType.Select,
            fieldName: 'data-type',
            label: 'Data type',
            value: dataTypeInitialValue,
            options: [
              { label: 'Default', value: 'default' },
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'Array', value: 'array' },
              { label: 'Object', value: 'object' },
            ],
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }

              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                ['data-type']: value,
              };

              updated();
            },
          },
        ];
        node.nodeInfo.meta = [
          {
            propertyName: 'input',
            displayName: 'input',
            type: 'any',
            getData: () => {
              return inputValues;
            },
          },
        ];

        node.nodeInfo.updateVisual = updateVisual;

        if (id) {
          canvasApp.registeGetNodeStateHandler(id, getNodeStatedHandler);
          canvasApp.registeSetNodeStateHandler(id, setNodeStatedHandler);
        }
      }
      return node;
    },
  };
};
