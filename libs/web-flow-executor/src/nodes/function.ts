import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';

const defaultFunctionColor = 'bg-yellow-400';
const activeFunctionColor = 'bg-orange-400';

export const getFunction = (updated: () => void): NodeTask<NodeInfo> => {
  let node: IRectNodeComponent<NodeInfo>;
  let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
  let componentWrapper: INodeComponent<NodeInfo> | undefined;
  let divElement: IDOMElement | undefined;
  let parametersContainer: IDOMElement | undefined;
  const initializeCompute = () => {
    return;
  };
  const compute = (
    input: string,
    _loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    if (!node?.nodeInfo?.formValues?.['node']) {
      return {
        result: false,
        stop: true,
      };
    }
    const componentDomElement = componentWrapper?.domElement as HTMLElement;
    componentDomElement.classList.add(defaultFunctionColor);
    componentDomElement.classList.remove(activeFunctionColor);

    const parameters: string = node?.nodeInfo?.formValues?.['parameters'] ?? '';
    const parametersArray = (parameters ? parameters.split(',') : []).map(
      (parameter) => parameter.trim()
    );
    const inputObject = input as any;
    let isError = false;
    if (inputObject && inputObject.trigger === 'TRIGGER') {
      const payload: Record<string, any> = {};

      componentDomElement.classList.remove(defaultFunctionColor);
      componentDomElement.classList.add(activeFunctionColor);

      parametersArray.forEach((parameter) => {
        if (!inputObject[parameter]) {
          isError = true;
        }
        if (canvasAppInstance && scopeId) {
          canvasAppInstance.registerTempVariable(
            parameter,
            structuredClone(inputObject[parameter]),
            scopeId
          );
        }
        payload[parameter] = inputObject[parameter];
      });
      if (canvasAppInstance && scopeId) {
        canvasAppInstance.registerTempVariable('scopeId', scopeId, scopeId);
      }
      if (isError) {
        return {
          result: false,
          stop: true,
        };
      }
      console.log('function called', node?.nodeInfo?.formValues?.['node'], {
        ...payload,
      });
      return {
        result: { ...payload },
      };
    }
    return {
      result: false,
      stop: true,
    };
  };

  const showParameters = () => {
    if (!parametersContainer) {
      return;
    }
    (parametersContainer.domElement as HTMLElement).innerHTML = '';

    const parameters: string[] = (
      node?.nodeInfo?.formValues?.['parameters'] ?? ''
    ).split(',');

    parameters.forEach((parameter, index) => {
      const parameterElement = createElement(
        'span',
        {
          'data-index': index,
          class: `outline-[4px] max-w-full text-ellipsis overflow-hidden inline-block px-0.5 leading-5 bg-slate-500 border border-slate-600 rounded text-white`,
          title: parameter,
        },
        undefined,
        parameter.toString()
      ) as unknown as INodeComponent<NodeInfo>;

      if (parametersContainer) {
        parametersContainer.domElement.appendChild(
          parameterElement.domElement as unknown as HTMLElement
        );
      }
    });
  };

  return {
    name: 'function',
    family: 'flow-canvas',
    isContainer: false,
    category: 'functions',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
      x: number,
      y: number,
      id?: string,
      initalValues?: InitialValues,
      containerNode?: IRectNodeComponent<NodeInfo>,
      width?: number,
      height?: number
    ) => {
      canvasAppInstance = canvasApp;
      const initialValue = initalValues?.['node'] || '';
      const intialParameters = initalValues?.['parameters'] || '';
      const formElements = [
        {
          fieldType: FormFieldType.Text,
          fieldName: 'node',
          value: initialValue,
          onChange: (value: string) => {
            if (!node.nodeInfo || !divElement) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              node: value,
            };
            divElement.domElement.textContent =
              node.nodeInfo.formValues['node'] || '';

            if (updated) {
              updated();
            }
          },
        },
        {
          fieldType: FormFieldType.Text,
          fieldName: 'parameters',
          value: initialValue,
          onChange: (value: string) => {
            if (!node.nodeInfo) {
              return;
            }
            node.nodeInfo.formValues = {
              ...node.nodeInfo.formValues,
              parameters: value,
            };

            showParameters();

            if (updated) {
              updated();
            }
          },
        },
      ];

      componentWrapper = createNodeElement(
        'div',
        {
          class: `inner-node ${defaultFunctionColor} p-4 rounded flex flex-row justify-center items-center transition-colors duration-200`,
        },
        undefined
      ) as unknown as INodeComponent<NodeInfo>;

      divElement = createElement(
        'div',
        {
          class: `text-center block text-black font-bold`,
        },
        componentWrapper.domElement
      );
      if (divElement) {
        divElement.domElement.textContent = `${initialValue || ''} ${
          initialValue ? '(' : ''
        }function${initialValue ? ')' : ''}`;
      }
      parametersContainer = createElement(
        'div',
        {
          class: `absolute -top-3 left-0`,
        },
        componentWrapper.domElement
      );

      const rect = canvasApp.createRect(
        x,
        y,
        width || 150,
        height || 100,
        undefined,

        [
          {
            thumbType: ThumbType.StartConnectorCenter,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            color: 'white',
            label: ' ',
          },
        ],
        componentWrapper,
        {
          classNames: ` py-4 px-2 rounded`,
        },
        true,
        undefined,
        undefined,
        id,
        {
          type: 'function',
          formValues: {
            node: initialValue || '',
            parameters: intialParameters || '',
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
        (node.nodeInfo as any).onFunctionFinished = () => {
          const componentDomElement =
            componentWrapper?.domElement as HTMLElement;
          componentDomElement.classList.add(defaultFunctionColor);
          componentDomElement.classList.remove(activeFunctionColor);
        };
      }
      showParameters();

      return node;
    },
  };
};
