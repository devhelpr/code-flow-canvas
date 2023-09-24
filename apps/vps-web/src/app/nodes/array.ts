/* eslint-disable prefer-rest-params */
import {
  createElement,
  IElementNode,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { canvasAppReturnType, NodeInfo } from '../types/node-info';
import {
  InitialValues,
  NodeTask,
  NodeTaskFactory,
} from '../node-task-registry';
import { FormFieldType } from '../components/form-component';

export const getArray: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let canvasAppInstance: canvasAppReturnType;
  let tagNode: IElementNode<NodeInfo> | undefined = undefined;
  let wrapper: IRectNodeComponent<NodeInfo>;
  let variableName = '';
  let inputValues: any[] = [];
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: INodeComponent<NodeInfo> | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<canvasAppReturnType['createRect']> | undefined =
    undefined;

  // TODO : refactor this ...
  const setArrayProxy = () => {
    const arrayChangeHandler = {
      get: function (target: Array<any>, property: string | symbol) {
        if (property === 'at') {
          return function (_el: any) {
            let index = arguments[0] as number;
            if (index < 0) {
              index = target.length + index;
            }
            const arrayElement = (
              wrapper?.domElement as HTMLElement
            ).querySelector(`.array [data-index="${index}"]`);
            if (arrayElement) {
              arrayElement.classList.add('border-orange-500');
              setTimeout(() => {
                arrayElement?.classList.remove('border-orange-500');
              }, 250);
            }
            return Array.prototype[property].apply(
              target,
              arguments as unknown as [index: number]
            );
          };
        }
        return target[property as unknown as any];
      },
      set: function (
        target: Array<any>,
        property: string | symbol,
        value: any,
        _receiver: unknown
      ) {
        target[property as unknown as any] = value;
        return true;
      },
    };
    inputValues = new Proxy(inputValues, arrayChangeHandler);
  };

  const initializeCompute = () => {
    hasInitialValue = true;
    inputValues = [];
    setArrayProxy();
    if (htmlNode) {
      htmlNode.domElement.textContent = 'Array';
      if (rect) {
        rect.resize(240);
      }
    }
    return;
  };

  const setValue = (values: any[]) => {
    if (values.length > 0 && htmlNode && htmlNode.domElement) {
      (htmlNode.domElement as HTMLElement).textContent = '';

      while (htmlNode.domElement.firstChild) {
        if (htmlNode.domElement) {
          htmlNode.domElement.removeChild(
            (htmlNode.domElement as HTMLElement).lastChild as Node
          );
        }
      }

      values.forEach((value, index) => {
        const inputElement = createElement(
          'div',
          {
            'data-index': index,
            class: `border-[4px] border-solid border-transparent transition duration-500 ease-in-out 
              inner-node inline-block p-1 m-1 bg-slate-500 border border-slate-600 rounded text-white`,
          },
          undefined,
          value.toString()
        ) as unknown as INodeComponent<NodeInfo>;

        // if (htmlNode.domElement.firstChild) {
        //   htmlNode.domElement.insertBefore(
        //     inputElement.domElement as unknown as HTMLElement,
        //     htmlNode.domElement.firstChild
        //   );
        // } else {
        if (htmlNode) {
          htmlNode.domElement.appendChild(
            inputElement.domElement as unknown as HTMLElement
          );
        }
      });
      //}
    } else if (values.length === 0 && htmlNode && htmlNode.domElement) {
      while (htmlNode.domElement.firstChild) {
        if (htmlNode.domElement) {
          htmlNode.domElement.removeChild(
            (htmlNode.domElement as HTMLElement).lastChild as Node
          );
        }
      }
      (htmlNode.domElement as HTMLElement).textContent = 'Array';
    }
    if (rect) {
      rect.resize(240);
    }
  };

  const compute = (input: string) => {
    const previousOutput = [...inputValues];
    inputValues.push(input);
    if (htmlNode) {
      if (hasInitialValue) {
        htmlNode.domElement.textContent = '';
        hasInitialValue = false;
      }
      setValue(inputValues);
      const variableName = node.nodeInfo.formValues?.['variableName'] ?? '';
      if (variableName) {
        canvasAppInstance.setVariable(variableName, inputValues);
      }

      const arrayElement = (wrapper?.domElement as HTMLElement).querySelector(
        `.array [data-index="${inputValues.length - 1}"]`
      );
      if (arrayElement) {
        arrayElement.classList.add('border-yellow-300');
        setTimeout(() => {
          arrayElement?.classList.remove('border-yellow-300');
        }, 250);
      }
    }
    return {
      result: [...inputValues],
      followPath: undefined,
      previousOutput,
    };
  };

  const getData = () => {
    return inputValues;
  };
  const setData = (data: any) => {
    //currentValue = data;
  };

  return {
    name: 'array',
    family: 'flow-canvas',
    createVisualNode: (
      canvasApp: canvasAppReturnType,
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
      ];

      htmlNode = createElement(
        'div',
        {
          class: 'array',
        },
        undefined,
        'Array'
      ) as unknown as INodeComponent<NodeInfo>;

      wrapper = createElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded max-w-[240px]`,
        },
        undefined,
        htmlNode.domElement as unknown as HTMLElement
      ) as unknown as IRectNodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        200,
        100,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: '[]',
            thumbConstraint: 'array',
            name: 'output',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
            name: 'input',
          },
        ],
        wrapper,
        {
          classNames: `bg-slate-500 p-4 rounded`,
        },
        undefined,
        false,
        true,
        id,
        {
          type: 'array',
          formValues: {
            variableName: variableName,
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
      node.nodeInfo.formElements = formElements;
      node.nodeInfo.compute = compute;
      node.nodeInfo.initializeCompute = initializeCompute;
      node.nodeInfo.setValue = setValue;
      return node;
    },
  };
};
