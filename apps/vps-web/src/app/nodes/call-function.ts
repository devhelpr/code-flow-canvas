import {
  AnimatePathFunction,
  CanvasAppInstance,
  INodeComponent,
  IRectNodeComponent,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import {
  compileExpressionAsInfo,
  runExpression,
} from '@devhelpr/expression-compiler';
import { InitialValues, NodeTask } from '../node-task-registry';
import { runNode } from '../simple-flow-engine/simple-flow-engine';
import {
  getNodeByVariableName,
  getNodeByFunctionName,
} from '../graph/get-node-by-variable-name';
import { FormFieldType } from '../components/FormField';
import {
  IComputeResult,
  visualNodeFactory,
} from '../node-task-registry/createRectNode';
import { RunCounter } from '../follow-path/run-counter';

const defaultFunctionColor = 'bg-slate-500';
const activeFunctionColor = 'bg-orange-400';
const fieldName = 'functionCall';

export const getCallFunction =
  (animatePath: AnimatePathFunction<NodeInfo>) =>
  (updated: () => void): NodeTask<NodeInfo> => {
    let node: IRectNodeComponent<NodeInfo>;
    let componentWrapper: INodeComponent<NodeInfo> | undefined;

    let canvasAppInstance: CanvasAppInstance<NodeInfo>;
    let args: string | undefined = undefined;
    let commandName: string | undefined = undefined;
    let parameterCommands: ReturnType<typeof compileExpressionAsInfo>[] = [];

    const runCommandParameterExpression = (
      compiledExpressionInfo: ReturnType<typeof compileExpressionAsInfo>,
      loopIndex: number,
      value: string,
      scopeId?: string
    ) => {
      const expressionFunction = (
        new Function(
          'payload',
          `${compiledExpressionInfo.script}`
        ) as unknown as (payload?: any) => any
      ).bind(compiledExpressionInfo.bindings);

      const payloadForExpression = {
        value: value,
        input: value,
        index: loopIndex ?? 0,
        runIteration: loopIndex ?? 0,
        random: Math.round(Math.random() * 100),
      };
      canvasAppInstance?.getVariableNames(scopeId).forEach((variableName) => {
        Object.defineProperties(payloadForExpression, {
          [variableName]: {
            get: () => {
              console.log('get', variableName);
              return canvasAppInstance?.getVariable(
                variableName,
                undefined,
                scopeId
              );
            },
            set: (value) => {
              canvasAppInstance?.setVariable(variableName, value, scopeId);
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

    const prepareFunctionCallParameters = () => {
      parameterCommands = [];
      const command = node?.nodeInfo?.formValues?.['functionCall'] ?? '';
      if (isCommmand(command)) {
        const match = command.match(/([\w]+)\(([^()]*)\)/);
        if (match) {
          commandName = match[1];
          args = match[2] as string;
          args
            .split(',')
            .forEach((parameter: string) =>
              prepareCommandParameterExpression(parameter)
            );
        }
      }
    };
    const prepareCommandParameterExpression = (parameter: string) => {
      const compiledExpressionInfo = compileExpressionAsInfo(parameter);

      parameterCommands.push(compiledExpressionInfo);
    };

    const getDependencies = (): {
      startNodeId: string;
      endNodeId: string;
    }[] => {
      const dependencies: { startNodeId: string; endNodeId: string }[] = [];
      prepareFunctionCallParameters();
      if (canvasAppInstance && commandName) {
        let variablesInExpression: string[] = [];
        parameterCommands.forEach((parameterCommand) => {
          variablesInExpression.push(...parameterCommand.payloadProperties);
        });
        variablesInExpression = [...new Set(variablesInExpression)];

        variablesInExpression.forEach((variableName) => {
          if (canvasAppInstance) {
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
        });
        const commandNode = getNodeByFunctionName(
          commandName,
          canvasAppInstance
        );

        if (commandNode) {
          dependencies.push({
            startNodeId: node.id,
            endNodeId: commandNode.id,
          });
        }
      }
      return dependencies;
    };

    const initializeCompute = () => {
      parameterCommands = [];
      commandName = undefined;
      args = undefined;
      return;
    };

    const computeAsync = (
      input: string,
      loopIndex?: number,
      _payload?: any,
      _thumbName?: string,
      scopeId?: string,
      runCounter?: RunCounter
    ) => {
      const componentDomElement = componentWrapper?.domElement as HTMLElement;
      componentDomElement.classList.remove(activeFunctionColor);
      componentDomElement.classList.add(defaultFunctionColor);
      return new Promise<IComputeResult>((resolve) => {
        if (args === undefined || !commandName) {
          prepareFunctionCallParameters();
        }

        if (args !== undefined && commandName) {
          const parsedArguments = parameterCommands.map((parameterCommand) =>
            runCommandParameterExpression(
              parameterCommand,
              loopIndex ?? 0,
              input,
              scopeId
            )
          );

          const scopeGuid = crypto.randomUUID();
          console.log('scope created', scopeGuid);

          let isFunctionFound = false;
          canvasAppInstance.elements.forEach((element) => {
            if (element.nodeInfo?.type === 'function') {
              if (
                !isFunctionFound &&
                element.nodeInfo.formValues?.['node'] === commandName
              ) {
                const payload: Record<string, any> = {};
                element.nodeInfo.formValues?.['parameters']
                  .split(',')
                  .forEach((parameter: string, index: number) => {
                    if (parsedArguments[index]) {
                      payload[parameter.trim()] = parsedArguments[index];
                    }
                  });
                isFunctionFound = true;

                componentDomElement.classList.add(activeFunctionColor);
                componentDomElement.classList.remove(defaultFunctionColor);

                console.log(
                  'callFunction START:',
                  commandName,
                  scopeId,
                  parameterCommands,
                  input
                );

                runNode(
                  element as IRectNodeComponent<NodeInfo>,
                  canvasAppInstance,
                  animatePath,
                  (inputFunction) => {
                    console.log('scope removed', scopeGuid);
                    canvasAppInstance?.removeScope(scopeGuid);

                    componentDomElement.classList.remove(activeFunctionColor);
                    componentDomElement.classList.add(defaultFunctionColor);
                    console.log(
                      'callFunction END:',
                      commandName,
                      scopeId,
                      parameterCommands,
                      inputFunction
                    );
                    if (
                      (
                        (element as IRectNodeComponent<NodeInfo>)
                          .nodeInfo as any
                      ).onFunctionFinished
                    ) {
                      (
                        (element as IRectNodeComponent<NodeInfo>)
                          .nodeInfo as any
                      ).onFunctionFinished();
                    }

                    resolve({
                      output: inputFunction,
                      result: inputFunction,
                      followPath: undefined,
                    });
                  },
                  {
                    ...payload,
                    trigger: 'TRIGGER',
                  } as unknown as string, // TODO : improve this!
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  scopeGuid,
                  runCounter
                );
              }
            }
          });
          return;
        }

        resolve({
          stop: true,
          result: undefined,
          output: undefined,
          followPath: undefined,
        });
      });
    };

    // return {
    //   name: 'call-function',
    //   family: 'flow-canvas',
    //   isContainer: false,
    //   createVisualNode: (
    //     canvasApp: CanvasAppInstance<NodeInfo>,
    //     x: number,
    //     y: number,
    //     id?: string,
    //     initalValues?: InitialValues,
    //     containerNode?: IRectNodeComponent<NodeInfo>
    //   ) => {
    //     const initialValue = initalValues?.['functionCall'] ?? '';
    //     canvasAppInstance = canvasApp;

    //     const formElements = [
    //       {
    //         fieldType: FormFieldType.Text,
    //         fieldName: 'functionCall',
    //         value: initialValue ?? '',
    //         onChange: (value: string) => {
    //           if (!node.nodeInfo) {
    //             return;
    //           }
    //           node.nodeInfo.formValues = {
    //             ...node.nodeInfo.formValues,
    //             functionCall: value,
    //           };
    //           console.log('onChange', node.nodeInfo);
    //           if (updated) {
    //             updated();
    //           }
    //         },
    //       },
    //     ];

    //     componentWrapper = createElement(
    //       'div',
    //       {
    //         class: `inner-node bg-slate-500 p-4 rounded border-2 border-slate-500 transition-colors duration-200`,
    //       },
    //       undefined
    //     ) as unknown as INodeComponent<NodeInfo>;

    //     FormComponent({
    //       rootElement: componentWrapper.domElement as HTMLElement,
    //       id: id ?? '',
    //       formElements,
    //       hasSubmitButton: false,
    //       onSave: (formValues) => {
    //         console.log('onSave', formValues);
    //       },
    //     }) as unknown as HTMLElement;

    //     const rect = canvasApp.createRect(
    //       x,
    //       y,
    //       200,
    //       100,
    //       undefined,
    //       [
    //         {
    //           thumbType: ThumbType.StartConnectorCenter,
    //           thumbIndex: 0,
    //           connectionType: ThumbConnectionType.start,
    //           color: 'white',
    //           label: ' ',
    //         },
    //         {
    //           thumbType: ThumbType.EndConnectorCenter,
    //           thumbIndex: 0,
    //           connectionType: ThumbConnectionType.end,
    //           color: 'white',
    //           label: ' ',
    //           //thumbConstraint: 'value',
    //         },
    //       ],
    //       componentWrapper,
    //       {
    //         classNames: `p-4 rounded`,
    //       },
    //       undefined,
    //       undefined,
    //       undefined,
    //       id,
    //       {
    //         type: 'call-function',
    //         formValues: {
    //           functionCall: initialValue ?? '',
    //         },
    //       },
    //       containerNode
    //     );
    //     if (!rect.nodeComponent) {
    //       throw new Error('rect.nodeComponent is undefined');
    //     }

    //     node = rect.nodeComponent;
    //     if (node.nodeInfo) {
    //       node.nodeInfo.formElements = formElements;
    //       node.nodeInfo.computeAsync = computeAsync;
    //       node.nodeInfo.initializeCompute = initializeCompute;
    //       node.nodeInfo.getDependencies = getDependencies;
    //     }
    //     return node;
    //   },
    // };

    return visualNodeFactory(
      'call-function',
      'Call function',
      'flow-canvas',
      'functionCall',
      computeAsync,
      initializeCompute,
      false,
      200,
      100,
      [
        {
          thumbType: ThumbType.StartConnectorCenter,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.start,
          color: 'white',
          label: ' ',
          maxConnections: -1,
        },
        {
          thumbType: ThumbType.EndConnectorCenter,
          thumbIndex: 0,
          connectionType: ThumbConnectionType.end,
          color: 'white',
          label: ' ',
          //thumbConstraint: 'value',
        },
      ],
      (values?: InitialValues) => {
        const initialValue = values?.[fieldName] ?? '';

        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'functionCall',
            value: initialValue ?? '',
            onChange: (value: string) => {
              if (!node.nodeInfo) {
                return;
              }
              node.nodeInfo.formValues = {
                ...node.nodeInfo.formValues,
                functionCall: value,
              };
              console.log('onChange', node.nodeInfo);
              if (updated) {
                updated();
              }
            },
          },
        ];
        return formElements;
      },
      (nodeInstance) => {
        canvasAppInstance = nodeInstance.contextInstance;
        if (nodeInstance && nodeInstance.componentWrapper) {
          componentWrapper = nodeInstance.componentWrapper;
        }
        node = nodeInstance.node as IRectNodeComponent<NodeInfo>;

        if (node.nodeInfo) {
          node.nodeInfo.computeAsync = computeAsync;
          node.nodeInfo.initializeCompute = initializeCompute;
          node.nodeInfo.getDependencies = getDependencies;
        }
      },
      {
        hasTitlebar: false,
        category: 'functions',
        childNodeWrapperClass:
          'border-2 border-slate-500 transition-colors duration-200',
      },
      undefined,
      true,
      false
    );
  };
