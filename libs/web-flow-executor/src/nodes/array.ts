/* eslint-disable prefer-rest-params */
import {
  IFlowCanvasBase,
  createElement,
  createNodeElement,
  FormFieldType,
  IDOMElement,
  InitialValues,
  IRectNodeComponent,
  NodeTask,
  NodeTaskFactory,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';

export const getArray: NodeTaskFactory<NodeInfo> = (
  updated: () => void
): NodeTask<NodeInfo> => {
  let canvasAppInstance: IFlowCanvasBase<NodeInfo>;
  let tagNode: IDOMElement | undefined = undefined;
  let wrapper: IRectNodeComponent<NodeInfo>;
  let variableName = '';
  let inputValues: any[] = [];
  let node: IRectNodeComponent<NodeInfo>;
  let htmlNode: IDOMElement | undefined = undefined;
  let hasInitialValue = true;
  let rect: ReturnType<IFlowCanvasBase<NodeInfo>['createRect']> | undefined =
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
              arrayElement.classList.remove('duration-300');
              arrayElement.classList.add('duration-0');
              arrayElement.classList.add('outline-red-400');
              arrayElement.classList.remove('outline-transparent');
              setTimeout(() => {
                arrayElement.classList.remove('duration-0');
                arrayElement.classList.add('duration-300');
              }, 10);
              setTimeout(() => {
                arrayElement?.classList.remove('outline-red-400');
                arrayElement.classList.add('outline-transparent');
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
        const helper = parseInt(property.toString());
        if (!isNaN(helper)) {
          let index = helper as number;
          if (index < 0) {
            index = target.length + index;
          }
          const arrayElement = (
            wrapper?.domElement as HTMLElement
          ).querySelector(`.array [data-index="${index}"]`);
          if (arrayElement) {
            arrayElement.textContent = value;
            arrayElement.classList.remove('duration-300');
            arrayElement.classList.add('duration-0');
            arrayElement.classList.add('outline-yellow-300');
            arrayElement.classList.remove('outline-transparent');
            setTimeout(() => {
              arrayElement.classList.remove('duration-0');
              arrayElement.classList.add('duration-300');
            }, 10);
            setTimeout(() => {
              arrayElement?.classList.remove('outline-yellow-300');
              arrayElement.classList.add('outline-transparent');
            }, 250);
          }
        }

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
            class: `outline-[4px] outline outline-transparent transition-[outline] duration-300 ease-in-out 
              inner-node inline-block p-1 m-1 bg-slate-500 border border-slate-600 rounded text-white`,
          },
          undefined,
          value.toString()
        );

        if (htmlNode && inputElement) {
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

  const processCommand = (
    input: string,
    loopIndex: number,
    scopeId?: string
  ) => {
    return new Promise<boolean>((resolve) => {
      const match = input.match(/([\w]+)\(([^()]*)\)/);
      if (match) {
        const command = match[1];
        const args = match[2];

        if (command === 'reset') {
          inputValues = [];
          setValue(inputValues);
          canvasAppInstance?.setVariable(variableName, inputValues);
        } else if (command === 'trigger') {
          resolve(false);
          return;
        } else if (command === 'push') {
          pushValueToArray(
            runCommandParameterExpression(args, loopIndex, scopeId)
          );
        } else if (command === 'swap') {
          const [index1, index2] = args
            .split(',')
            .map((x) => runCommandParameterExpression(x, loopIndex, scopeId));
          try {
            const temp = inputValues.at(index1);
            const temp2 = inputValues.at(index2);
            setTimeout(() => {
              if (temp !== undefined && temp2 !== undefined) {
                inputValues[index1] = temp2;
                inputValues[index2] = temp;
                canvasAppInstance?.setVariable(variableName, inputValues);
              }
              setTimeout(() => {
                setValue(inputValues);
                resolve(true);
              }, 250);
            }, 300);
            return;
          } catch (e) {
            console.log('error swapping indexes', e);
          }
        } else {
          //
        }
      }

      resolve(true);
    });
  };

  const runCommandParameterExpression = (
    expression: string,
    loopIndex: number,
    scopeId?: string
  ) => {
    const compiledExpressionInfo = compileExpressionAsInfo(expression);
    const expressionFunction = (
      new Function(
        'payload',
        `${compiledExpressionInfo.script}`
      ) as unknown as (payload?: any) => any
    ).bind(compiledExpressionInfo.bindings);

    const payloadForExpression = {
      index: loopIndex ?? 0,
      runIteration: loopIndex ?? 0,
      random: Math.round(Math.random() * 100),
    };
    canvasAppInstance?.getVariableNames(scopeId).forEach((variableName) => {
      Object.defineProperties(payloadForExpression, {
        [variableName]: {
          get: () => {
            return canvasAppInstance?.getVariable(
              variableName,
              undefined,
              scopeId
            );
          },
          set: (value) => {
            canvasAppInstance?.setVariable(variableName, value);
          },
        },
      });
    });

    return runExpression(
      expressionFunction,
      payloadForExpression,
      false,
      compiledExpressionInfo.payloadProperties
    );
  };
  const isCommmand = (input: string) => {
    // detecting function call
    // [\w]+\(([^\(\)]+)\)
    return typeof input === 'string' && input.match(/[\w]+\(([^()]*)\)/);
  };

  const pushValueToArray = (input: string) => {
    if (input === undefined || input === null) {
      return;
    }
    inputValues.push(input);
    if (htmlNode) {
      if (hasInitialValue) {
        htmlNode.domElement.textContent = '';
        hasInitialValue = false;
      }
      setValue(inputValues);

      const variableName = node.nodeInfo?.formValues?.['variableName'] ?? '';
      if (variableName) {
        canvasAppInstance.setVariable(variableName, inputValues);
      }

      const arrayElement = (wrapper?.domElement as HTMLElement).querySelector(
        `.array [data-index="${inputValues.length - 1}"]`
      );
      if (arrayElement) {
        arrayElement.classList.add('outline-yellow-300');
        setTimeout(() => {
          arrayElement?.classList.remove('outline-yellow-300');
        }, 250);
      }
    }
  };
  const computeAsync = (
    input: string,
    loopIndex?: number,
    _payload?: any,
    _thumbName?: string,
    scopeId?: string
  ) => {
    const previousOutput = [...inputValues];
    if (!isCommmand(input)) {
      pushValueToArray(input);
    }
    return new Promise((resolve) => {
      if (isCommmand(input)) {
        processCommand(input, loopIndex ?? 0, scopeId).then((result) => {
          if (result) {
            resolve({
              stop: true,
            });
          } else {
            const output = [...inputValues];
            resolve({
              result: output,
              output,
              followPath: undefined,
            });
          }
        });
      } else {
        //pushValueToArray(input);
        const output = [...inputValues];
        resolve({
          result: output,
          output,
          followPath: undefined,
          previousOutput,
        });
      }
    });
  };

  const getData = () => {
    return [...inputValues];
  };
  const setData = (_data: any) => {
    //currentValue = data;
    return true;
  };
  const removeScope = (_scopeId: string) => {
    //
  };

  const resetVariable = () => {
    return true;
  };

  const getNodeStatedHandler = () => {
    //console.log('getNodeStatedHandler array', [...inputValues]);
    return {
      data: [...inputValues],
      id: node.id,
    };
  };

  const setNodeStatedHandler = (_id: string, data: any) => {
    //console.log('setNodeStatedHandler array', data);
    setValue(data);
  };

  const updateVisual = (data: any, dataContext?: any) => {
    //console.log('updateVisual array', data, dataContext, typeof dataContext);
    if (htmlNode) {
      if (!isCommmand(data)) {
        if (dataContext) {
          setValue([...dataContext, data]);
        }
      }
    }
  };

  return {
    name: 'array',
    family: 'flow-canvas',
    category: 'variables-array',
    createVisualNode: (
      canvasApp: IFlowCanvasBase<NodeInfo>,
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
        removeScope,
        resetVariable,
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
              ...node.nodeInfo?.formValues,
              variableName: value,
            };
            canvasApp.unregisterVariable(variableName, id ?? '');
            variableName = value;
            (tagNode?.domElement as HTMLElement).textContent = variableName;
            canvasApp.registerVariable(variableName, {
              id: id ?? '',
              getData,
              setData,
              removeScope,
              resetVariable,
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
      );

      wrapper = createNodeElement(
        'div',
        {
          class: `bg-slate-500 p-4 rounded max-w-[240px] min-h-[110px]`,
        },
        undefined,
        htmlNode?.domElement as unknown as HTMLElement
      ) as unknown as IRectNodeComponent<NodeInfo>;

      rect = canvasApp.createRect(
        x,
        y,
        200,
        110,
        undefined,
        [
          {
            thumbType: ThumbType.StartConnectorRight,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.start,
            label: '[]',
            thumbConstraint: 'array',
            name: 'output',
            color: 'white',
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 0,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: '#',
            thumbConstraint: 'value',
            name: 'input',
            maxConnections: -1,
          },
          {
            thumbType: ThumbType.EndConnectorLeft,
            thumbIndex: 1,
            connectionType: ThumbConnectionType.end,
            color: 'white',
            label: 'C',
            thumbConstraint: 'command',
            name: 'command',
            maxConnections: -1,
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
      );

      node = rect.nodeComponent;
      if (node.nodeInfo) {
        node.nodeInfo.formElements = formElements;
        node.nodeInfo.computeAsync = computeAsync;
        node.nodeInfo.initializeCompute = initializeCompute;
        node.nodeInfo.setValue = setValue;
        node.nodeInfo.showFormOnlyInPopup = true;

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
