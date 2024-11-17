import {
  IFlowCanvasBase,
  createElement,
  FormComponent,
  FormFieldType,
  FormsComponent,
  InitialValues,
  INodeComponent,
  IRectNodeComponent,
  NodeTask,
  Theme,
  ThumbConnectionType,
  ThumbType,
} from '@devhelpr/visual-programming-system';
import { NodeInfo } from '../types/node-info';
import { RunCounter } from '../follow-path/run-counter';
import { runNode, getRunIndex } from '../flow-engine/flow-engine';

export const getUserTextInput =
  (
    createRunCounterContext: (
      isRunViaRunButton: boolean,
      shouldResetConnectionSlider: boolean,
      onFlowFinished?: () => void
    ) => RunCounter
  ) =>
  (updated: () => void, theme?: Theme): NodeTask<NodeInfo> => {
    let canvasAppInstance: IFlowCanvasBase<NodeInfo> | undefined = undefined;
    let node: IRectNodeComponent<NodeInfo>;
    let form: FormsComponent | undefined = undefined;
    let inputElement: HTMLInputElement | undefined = undefined;
    let labelElement: HTMLLabelElement | undefined = undefined;
    let currentValue = '';
    //let runCounter: RunCounter | undefined = undefined;
    const initializeCompute = () => {
      if (node.domElement) {
        const buttonElement = (node.domElement as HTMLElement).querySelector(
          'button'
        );
        if (buttonElement) {
          buttonElement.disabled = false;
        }
      }
      return;
    };
    const compute = (
      input: string,
      _loopIndex?: number,
      payload?: any,
      _thumbName?: string,
      _scopeId?: string,
      _runCounterCompute?: RunCounter
    ) => {
      try {
        currentValue = typeof input === 'string' ? input : '';
      } catch {
        currentValue = '';
      }
      // if (!payload?.['trigger']) {
      //   runCounter = runCounterCompute;
      // }
      if (payload?.['trigger'] === true && node.nodeInfo) {
        if (node.domElement) {
          const buttonElement = (node.domElement as HTMLElement).querySelector(
            'button'
          );
          if (buttonElement) {
            buttonElement.disabled = true;
          }
        }
        return {
          result: currentValue,
          followPath: undefined,
        };
      } else {
        if (typeof input === 'string') {
          currentValue = input;
          if (inputElement) {
            inputElement.value = currentValue;
          }

          if (node.nodeInfo?.formValues['name']) {
            canvasAppInstance?.sendMessageFromNode(
              node.nodeInfo?.formValues['name'],
              currentValue
            );
          }
        }
      }
      return {
        result: false,
        stop: true,
      };
    };
    let changeTimeout: any = null;
    return {
      name: 'user-text-input',
      family: 'flow-canvas',
      isContainer: false,
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
        const initialValue = initalValues?.['label'] ?? '';
        const externalNameInitialValue = initalValues?.['name'] ?? '';
        const groupInitialValue = initalValues?.['group'] ?? '';

        //let isResettingInput = false;
        const formElements = [
          {
            fieldType: FormFieldType.Text,
            fieldName: 'value',
            label: initialValue ?? 'value',
            value: '',
            onKeyUp: (event: KeyboardEvent) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                runNode(
                  containerNode ?? node,
                  containerNode
                    ? (containerNode.nodeInfo as any)?.canvasAppInstance
                    : canvasApp,
                  () => {
                    // TODO .. this should be done via createRunCounterContext
                  },
                  currentValue.toString(),
                  undefined,
                  undefined,
                  getRunIndex(),
                  undefined,
                  undefined,
                  createRunCounterContext(false, false, () => {
                    if (node.domElement) {
                      const buttonElement = (
                        node.domElement as HTMLElement
                      ).querySelector('button');
                      if (buttonElement) {
                        buttonElement.disabled = false;
                      }
                    }
                  }), //runCounter,
                  false,
                  {
                    trigger: true,
                  }
                );
                return false;
              }
              return true;
            },
            onChange: (value: string) => {
              // if (isResettingInput) {
              //   isResettingInput = false;
              //   console.log('isResettingInput', value);
              //   return;
              // }
              if (!node.nodeInfo) {
                return;
              }
              if (document.activeElement !== inputElement) {
                return;
              }

              currentValue = value;
            },
          },
          {
            fieldType: FormFieldType.Button,
            fieldName: 'button',
            caption: 'SEND',
            value: '',
            customLoader: true,
            onButtonClick: () => {
              runNode(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                () => {
                  //
                },
                currentValue.toString(),
                undefined,
                undefined,
                getRunIndex(),
                undefined,
                undefined,
                createRunCounterContext(false, false, () => {
                  if (node.domElement) {
                    const buttonElement = (
                      node.domElement as HTMLElement
                    ).querySelector('button');
                    if (buttonElement) {
                      buttonElement.disabled = false;
                    }
                  }
                }),
                false,
                {
                  trigger: true,
                }
              );
              return;
            },
          },
        ];

        const componentWrapper = createElement(
          'div',
          {
            class: `inner-node bg-slate-400 rounded p-1 overflow-hidden`, //p-4
          },
          undefined
        ) as unknown as INodeComponent<NodeInfo>;

        const formWrapper = createElement(
          'div',
          {
            class: `ui-form-node p-4 border-[2px] border-solid rounded bg-slate-500 h-full`,
            style: {
              'border-color': theme?.backgroundAsHexColor ?? '#000000',
            },
          },
          componentWrapper?.domElement
        ) as unknown as INodeComponent<NodeInfo>;

        form = formWrapper?.domElement
          ? FormComponent({
              rootElement: formWrapper?.domElement as HTMLElement,
              id: id ?? '',
              formElements,
              hasSubmitButton: false,
              onSave: (formValues) => {
                console.log('onSave', formValues);
              },
            })
          : undefined;

        if (form && form.element) {
          inputElement = form.element.querySelector(
            'input'
          ) as HTMLInputElement;
          labelElement = form.element.querySelector(
            'label'
          ) as HTMLLabelElement;
        }
        const rect = canvasApp.createRect(
          x,
          y,
          width ?? 200,
          height ?? 150,
          undefined,
          [
            {
              thumbType: ThumbType.StartConnectorRight,
              thumbIndex: 0,
              connectionType: ThumbConnectionType.start,
              color: 'white',
              label: ' ',
              maxConnections: -1,
              //thumbConstraint: 'value',
              prefixIcon: 'icon-bolt',
              formFieldName: 'value',
              formId: id,
              hint: 'onInput event',
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
          componentWrapper,
          {
            classNames: `bg-slate-500 p-4 rounded`,
          },
          true,
          undefined,
          undefined,
          id,
          {
            type: 'user-text-input',
            formValues: {
              label: initialValue ?? '',
              value: '',
              name: externalNameInitialValue ?? '',
              group: groupInitialValue ?? '',
            },
          },
          containerNode
        );
        if (!rect.nodeComponent) {
          throw new Error('rect.nodeComponent is undefined');
        }

        node = rect.nodeComponent;

        if (node.nodeInfo) {
          node.nodeInfo.formElements = [
            {
              fieldType: FormFieldType.Text,
              fieldName: 'label',
              value: initialValue ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }

                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  label: value,
                };

                if (labelElement) {
                  labelElement.textContent = value;
                }
                updated();
                if (rect && rect.resize) {
                  rect.resize();
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
                if (node.nodeInfo.formValues['name']) {
                  canvasApp.removeNodeKeyListener(
                    node.nodeInfo.formValues['name'],
                    listener
                  );
                }
                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  name: value,
                };
                canvasApp.registerNodeKeyListener(
                  node.nodeInfo.formValues['name'],
                  listener
                );

                updated();
              },
            },
            {
              fieldType: FormFieldType.Text,
              fieldName: 'group',
              label: 'Group',
              value: groupInitialValue ?? '',
              onChange: (value: string) => {
                if (!node.nodeInfo) {
                  return;
                }

                node.nodeInfo.formValues = {
                  ...node.nodeInfo.formValues,
                  group: value,
                };

                updated();
              },
            },
          ];
          node.nodeInfo.compute = compute;
          node.nodeInfo.initializeCompute = initializeCompute;

          node.nodeInfo.isSettingsPopup = true;
          node.nodeInfo.isUINode = true; // TODO : use isUINode for detecting loops in pushCallback / flow-engine

          const listener = (_key: string, value: any) => {
            // currentValue = parseStringToFloat(value);
            // if (!isNaN(currentValue)) {
            //   if (inputElement) {
            //     inputElement.value = currentValue.toFixed(decimalCount);
            //   }
            // }

            if (!node.nodeInfo) {
              return;
            }

            currentValue = value;
            if (changeTimeout) {
              clearTimeout(changeTimeout);
              changeTimeout = null;
            }
            changeTimeout = setTimeout(() => {
              changeTimeout = null;
              runNode(
                containerNode ?? node,
                containerNode
                  ? (containerNode.nodeInfo as any)?.canvasAppInstance
                  : canvasApp,
                () => {
                  //
                },
                currentValue.toString(),
                undefined,
                undefined,
                getRunIndex(),
                undefined,
                undefined,
                createRunCounterContext(false, false),
                false,
                {
                  trigger: true,
                }
              );
            }, 150);
          };

          if (node.nodeInfo.formValues['name']) {
            canvasApp.registerNodeKeyListener(
              node.nodeInfo.formValues['name'],
              listener
            );

            node.nodeInfo.delete = () => {
              if (node.nodeInfo?.formValues['name']) {
                canvasApp.removeNodeKeyListener(
                  node.nodeInfo.formValues['name'],
                  listener
                );
              }
            };
          }
        }
        return node;
      },
    };
  };
